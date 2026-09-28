"""tools/extract-damage.py: what each Hunter's Journal entry's enemies do to Hornet, from the game's
own files: the masks its body takes on contact and each of its attacks' hitboxes, into
js/enemy-damage.js. Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-damage.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>] [--dump=<file>]
Re-run it after a patch that adds or changes enemies (about a minute and a half: the scenes, then
the other bundles, in parallel). --cache keeps the scan (pickled) for the runs that follow;
--dump writes every enemy's hitboxes and what it spawns, as read, for checking by hand.

Where it is (read on 28-Sep-2026, patch 1.0.30000, with the game's code decompiled): anything that
hurts Hornet carries a DamageHero component, whose damageDealt is the masks it takes (1 by
default), unless it points at a DamageReference asset (damageAsset), whose value wins; its
hazardType (1 ENEMY; the rest are spikes, lava…) and its damagePropertyFlags (4 Flame, 8 Void).
An enemy placed in a scene is found as tools/extract-journal-rooms.py finds it, by the
EnemyJournalRecord its EnemyDeathEffects points at; its DamageHero components are the ones on it
(its body: contact damage) and on the objects under it, its hitboxes ("SlashHit", "Dash Stab
Hit"), up to another enemy with a record of its own. The scenes are read in parallel.

What it spawns at run time: its FSMs' actions that make an object (found by scanning every FSM in
the scenes for actions with a prefab among their parameters: SpawnObjectFromGlobalPool and its
variants, FlingObjectsFromGlobalPool, CreateObject, AddPersonalObjectPool, SpawnRandomObjects,
SpawnProjectile…, and SetGameObject, BoolTestToGameObject and SelectRandomGameObject, which pick
the prefab one of them makes), a variable read for its value as placed, and its corpse
(EnemyDeathEffects' corpsePrefab: a Swamp Squit's burst is its corpse's). Each prefab is read from
the bundles outside the scenes: the DamageHero components on it and under it, and what its own
FSMs spawn in turn (a bomb's explosion), down to an enemy with a record of its own (a summoned
enemy is its own entry). Each is an attack named by its prefab ("Tar Shot", "Swamp Bounce Pod
Explosion"). A prefab a BoolTestToGameObject picks when «Is Black Threaded», or named as a
black-thread variant ("… BT", "… BlackThread Variant", "… Void"), is only a black-threaded
enemy's ('threaded').

The enemies the game makes at run time, when none of their entry is placed: a prefab that carries
the record (the Gloomfly), the object in a scene that names it and that Hornet can hit (a
HealthManager on it or under it: the boss's own object or its fight's Boss Scene), or the enemy
whose corpse names it (the Last Judge, Tormented Trobbio), in that order.

What the game does with it (HeroController.TakeDamage): Flame or Void sets the hit to 2 masks,
whatever damageDealt says; lava and steam are 2, spikes, acid, coal and zap 1. Black-threading
(BlackThreadState.SetVisiblyThreaded) adds the Void flag to every DamageHero under the enemy, so a
black-threaded enemy's every hit is 2 masks: the game doesn't double, it sets. Not read: what a
component other than an FSM spawns, and an FSM that changes damageDealt during the fight
(SetDamageHeroAmount): a body of 0 that its FSM switches on takes the FSM's value; the rest (a
spawned prefab's included) aren't followed. The Barbed Bracelet's multiplier on the masks
taken is read from the game's Gameplay settings (floored by TakeDamage). """
import json, os, pickle, re, struct, sys, warnings
from collections import Counter, defaultdict
from multiprocessing import Pool
import UnityPy

warnings.filterwarnings('ignore')   # UnityPy warns about the stripped version on every bundle
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'enemy-damage.js')
ENEMY, FLAME, VOID = 1, 4, 8
G = {}   # per worker: the classes and the records, read once


def setup(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    cls = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    record = {}
    for o in UnityPy.load(bundles['journalrecords.bundle']).objects:
        if o.type.name == 'MonoBehaviour' and cls.get(script(o.get_raw_data())) == 'EnemyJournalRecord':
            record[(o.assets_file.name.lower(), o.path_id)] = o.read_typetree()['displayName']['Key']
    if len(record) < 200:
        sys.exit(f'extract-damage: {len(record)} records in journalrecords.bundle: the bundles changed')
    G.update(aa=aa, bundles=bundles, cls=cls, record=record, rcab=next(iter(record))[0],
             death={k for k, v in cls.items() if v.startswith('EnemyDeathEffects') and v != 'EnemyDeathEffectsProfile'},
             hero={k for k, v in cls.items() if v == 'DamageHero'},
             fsm={k for k, v in cls.items() if v == 'PlayMakerFSM'},
             health={k for k, v in cls.items() if v == 'HealthManager'})


def script(raw):
    # m_GameObject (4 + 8), m_Enabled (1, aligned to 4), then m_Script: its path id at 20.
    return struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None


def pointer(o, p):
    """A PPtr's (file, path id), the file by name, lowercased."""
    ext = o.assets_file.externals
    f = o.assets_file.name if p['m_FileID'] == 0 else ext[p['m_FileID'] - 1].path.split('/')[-1] if p['m_FileID'] <= len(ext) else '?'
    return f.lower(), p['m_PathID']


def scene(name):
    """Every enemy with a journal record placed in the scene: (key, its name, its hitboxes), each
    hitbox (path under the enemy, '' for its body; damageDealt; its asset or None; hazardType;
    flags; active), and the damage values its FSMs set with SetDamageHeroAmount."""
    env = UnityPy.load(os.path.join(G['aa'], 'scenes_scenes_scenes', name + '.bundle'))
    father, go_of, objs = {}, {}, {}
    rec, heroes, fsms, corpses, named = {}, defaultdict(list), defaultdict(list), defaultdict(set), defaultdict(set)
    health, unrecorded = set(), {}
    for o in env.objects:
        objs[o.path_id] = o
        if o.type.name in ('Transform', 'RectTransform'):
            t = o.read()
            go_of[o.path_id] = t.m_GameObject.m_PathID
            father[t.m_GameObject.m_PathID] = t.m_Father.m_PathID
        elif o.type.name == 'MonoBehaviour':
            raw = o.get_raw_data()
            s = script(raw)
            gid = struct.unpack_from('<q', raw, 4)[0]
            if s in G['death']:
                d = o.read_typetree()
                p = d.get('journalRecord') or {}
                key = p.get('m_PathID') and G['record'].get(pointer(o, p))
                if key:
                    rec[gid] = key
                    corpses[gid] = corpse_refs(o, d)
                else:   # its corpse may name the record (the Last Judge's, Tormented Trobbio's)
                    unrecorded[gid] = corpse_refs(o, d)
            elif s in G['hero']:
                d = o.read_typetree()
                a = d.get('damageAsset') or {}
                heroes[gid].append((d['damageDealt'], pointer(o, a) if a.get('m_PathID') else None,
                                    d['hazardType'], d['damagePropertyFlags']))
            elif s in G['fsm'] and (b'SetDamageHeroAmount' in raw or SPAWNS_RAW.search(raw)):
                fsms[gid].append(o)
            if s in G['health']:
                health.add(gid)
            if s not in G['death']:
                keys = names_record(o, raw)
                if len(keys) == 1:   # more is a list (Nuu's dialogue), not an enemy
                    named[gid] |= keys
    if not rec and not named and not unrecorded:
        return []
    parent = lambda gid: go_of.get(father.get(gid))
    gname = lambda gid: objs[gid].read().m_Name
    active = lambda gid: bool(objs[gid].read().m_IsActive)

    def owner(gid):   # the nearest enemy with a record at or above an object
        while gid:
            if gid in rec:
                return gid
            gid = parent(gid)
        return None

    def rel(gid, root):
        out = []
        while gid != root:
            out.append(gname(gid))
            gid = parent(gid)
        return '/'.join(reversed(out))

    # A boss the game makes its enemy at run time (its record set by its own FSM or its fight's Boss
    # Scene): the object that names the record, when it isn't under a placed enemy, stands for it.
    # It has to be something Hornet can hit: a HealthManager on it or under it (not Nuu, who names
    # a record in her dialogue, nor a water that names the Muckmaggots').
    how = {g: 'placed' for g in rec}
    hit = set()
    for g in health:
        while g and g not in hit:
            hit.add(g)
            g = parent(g)
    for g, keys in named.items():
        if g in objs and g in hit and not owner(g):
            how[g] = 'named'
    # An enemy with no record of its own whose corpse names one (its key is known once the prefabs
    # are read: '?' until then).
    for g, cs in unrecorded.items():
        if cs and g in objs and g not in how and not owner(g):
            how[g] = 'corpse'
            corpses[g] = cs
    for g in how:
        if how[g] == 'named':
            rec[g] = next(iter(named[g]))
        elif how[g] == 'corpse':
            rec[g] = '?'

    children = defaultdict(list)
    for g in father:
        if parent(g):
            children[parent(g)].append(g)

    def under(gid):   # an object and everything under it
        out, todo = [], [gid]
        while todo:
            g = todo.pop()
            out.append(g)
            todo += children.get(g, [])
        return out

    found = {g: {'key': k, 'name': gname(g), 'hits': [], 'sets': [], 'spawned': [], 'refs': {r: False for r in corpses[g]}}
             for g, k in rec.items()}
    for gid, hs in heroes.items():
        root = owner(gid)
        if root:
            for dmg, asset, hazard, flags in hs:
                found[root]['hits'].append((rel(gid, root), dmg, asset, hazard, flags, active(gid)))
    me = next(iter(objs.values())).assets_file.name.lower() if objs else ''
    for gid, os_ in fsms.items():
        root = owner(gid)
        if not root:
            continue
        for o in os_:
            d = o.read_typetree()['fsm']
            for v in set_amounts(d):
                found[root]['sets'].append(v)
            for ref, bt in spawn_refs(o, d).items():
                if ref[0] != me:   # a prefab: read once the scenes are
                    found[root]['refs'][ref] = found[root]['refs'].get(ref, True) and bt
                elif ref[1] in objs and owner(ref[1]) != root and ref[1] not in rec:
                    # An object elsewhere in the scene it makes copies of: its hitboxes, as a prefab's.
                    for g in under(ref[1]):
                        if g in rec:
                            continue
                        for dmg, asset, hazard, flags in heroes.get(g, ()):
                            found[root]['spawned'].append((gname(ref[1]), dmg, asset, hazard, flags, rel(g, ref[1]), bt))
    return [(name, f['key'], f['name'], f['hits'], f['sets'], f['spawned'], sorted(f['refs'].items()), how[g]) for g, f in found.items()]


def names_record(o, raw):
    """The journal records a component points at, found in its raw data as
    tools/extract-journal-rooms.py finds them: the records' file's index among its externals (an
    int32) and the record's path id (an int64)."""
    out = set()
    for i, e in enumerate(o.assets_file.externals):
        if e.path.split('/')[-1].lower() != G['rcab']:
            continue
        pat = struct.pack('<i', i + 1)
        p = raw.find(pat)
        while p >= 0:
            if p + 12 <= len(raw):
                k = G['record'].get((G['rcab'], struct.unpack_from('<q', raw, p + 4)[0]))
                if k:
                    out.add(k)
            p = raw.find(pat, p + 1)
    return out


# The PlayMaker actions that make an object at run time, from a pool or not (found by scanning
# every FSM in the scenes for actions with a prefab among their parameters), and the ones that
# pick the prefab another of them makes (SetGameObject, BoolTestToGameObject…).
SPAWNS = re.compile(r'^(Spawn(?!SkillGetMsg|PowerUpGetMsg)|Fling|CreateObject|CreateChild|AddPersonalObjectPool|SetGameObject$|'
                    r'BoolTestToGameObject|SelectRandomGameObject)')
SPAWNS_RAW = re.compile(rb'\.(Spawn|Fling|CreateObject|CreateChild|AddPersonalObjectPool|SetGameObject|BoolTestToGameObject|SelectRandomGameObject)')
NOT_PREFAB = re.compile(r'spawnPoint|store|variable|target|parent', re.I)
THREADED = re.compile(r'black.?thread', re.I)
# A hitbox or prefab only a black-threaded enemy has, by its name ("Pt Spit Void", "Grass Ball
# BlackThread Variant", "Conch Projectile Heavy BT").
THREADED_NAME = re.compile(r'black.?thread|\bBT\b|\bvoid\b', re.I)
FSM_GAMEOBJECT = 19   # ParamDataType.FsmGameObject: an index into fsmGameObjectParams


def corpse_refs(o, d):
    """What an enemy leaves when it dies (EnemyDeathEffects' corpsePrefab and altCorpses): a
    Swamp Squit's burst is its corpse's."""
    out, todo = set(), [d.get('corpsePrefab'), d.get('altCorpses')]
    while todo:
        x = todo.pop()
        if isinstance(x, dict) and 'm_PathID' in x:
            if x['m_PathID']:
                out.add(pointer(o, x))
        elif isinstance(x, dict):
            todo += x.values()
        elif isinstance(x, list):
            todo += x
    return out


def fsm_bool(ad, j):
    """An FsmBool parameter, kept in byteData: its value, whether it's a variable, its name."""
    b = bytes(ad['byteData'][ad['paramDataPos'][j]:ad['paramDataPos'][j] + ad['paramByteDataSize'][j]])
    return bool(b[0]) if b else False, len(b) > 1 and bool(b[1]), b[2:].decode('utf-8', 'replace')


def spawn_refs(o, f):
    """The objects an FSM's spawn actions make: (file, path id) → whether only a black-threaded
    enemy makes it (its BoolTestToGameObject tests «Is Black Threaded», as the Coral Conch
    Shooter Heavy's does), a variable read for its value as placed."""
    var = {v['name']: v['value'] for v in f['variables'].get('gameObjectVariables', [])}
    out = {}
    for s in f['states']:
        ad = s['actionData']
        n = min(len(ad['paramDataType']), len(ad['paramDataPos']), len(ad['paramName']))
        start = [min(x, n) for x in ad['actionStartIndex']] + [n]
        for i, full in enumerate(ad['actionNames']):
            action = full.split(',')[0].split('.')[-1]
            if not SPAWNS.search(action):
                continue
            threaded = None   # the branch a black-threaded enemy takes, if the action tests for it
            if action == 'BoolTestToGameObject':
                for j in range(start[i], start[i + 1]):
                    if ad['paramName'][j] == 'Test':
                        _, isvar, var_name = fsm_bool(ad, j)
                        if isvar and THREADED.search(var_name):
                            threaded = 'TrueGameObject'
                for j in range(start[i], start[i + 1]):
                    if threaded and ad['paramName'][j] == 'ExpectedValue' and not fsm_bool(ad, j)[0]:
                        threaded = 'FalseGameObject'
            for j in range(start[i], start[i + 1]):
                pos = ad['paramDataPos'][j]
                if ad['paramDataType'][j] != FSM_GAMEOBJECT or pos >= len(ad['fsmGameObjectParams']) or NOT_PREFAB.search(ad['paramName'][j]):
                    continue
                p = ad['fsmGameObjectParams'][pos]
                v = var.get(p['name']) if p.get('useVariable') else p.get('value')
                if v and v.get('m_PathID'):
                    r = pointer(o, v)
                    out[r] = out.get(r, True) and ad['paramName'][j] == threaded
    return out


def set_amounts(f):
    """The damageDealt each SetDamageHeroAmount of an FSM sets: a number, or a variable's name."""
    out = []
    for s in f['states']:
        ad = s['actionData']
        start = list(ad['actionStartIndex']) + [len(ad['paramName'])]
        for i, full in enumerate(ad['actionNames']):
            if not full.split(',')[0].endswith('.SetDamageHeroAmount'):
                continue
            for j in range(start[i], start[i + 1]):
                pos = ad['paramDataPos'][j]
                if ad['paramName'][j] == 'damageDealt' and ad['paramDataType'][j] == 16 and pos < len(ad['fsmIntParams']):   # an FsmInt
                    p = ad['fsmIntParams'][pos]
                    out.append(p['name'] if p.get('useVariable') else p['value'])
    return out


# The bundles outside the scenes with no prefabs in them (as tools/extract-journal-rooms.py skips).
SKIP = re.compile(r'^(sfx|herosfx|textures|utilitytextures|materials|animations|audiocues|tk2d|fonts|shaders|vibration|'
                  r'herocollections|journalrecords)|monoscripts|unitybuiltin')


def bundle(f):
    """A bundle outside the scenes, for its prefabs: per file, each object's name, whether it's on
    and its parent, the DamageHero components on it, what its FSMs spawn and the damage they set,
    and the enemies with a record (their key and their corpses)."""
    env = UnityPy.load(G['bundles'][f])
    out = {}
    for o in env.objects:
        t = o.type.name
        if t not in ('GameObject', 'Transform', 'RectTransform', 'MonoBehaviour'):
            continue
        x = out.setdefault(o.assets_file.name.lower(), {'name': {}, 'on': {}, 'tr': {}, 'father': {}, 'hero': {}, 'spawn': {},
                                                         'sets': {}, 'rec': {}, 'corpse': {}, 'named': {}, 'hp': set()})
        if t == 'GameObject':
            g = o.read()
            x['name'][o.path_id] = g.m_Name
            x['on'][o.path_id] = bool(g.m_IsActive)
        elif t != 'MonoBehaviour':
            tr = o.read()
            x['tr'][o.path_id] = tr.m_GameObject.m_PathID
            x['father'][tr.m_GameObject.m_PathID] = tr.m_Father.m_PathID
        else:
            raw = o.get_raw_data()
            s = script(raw)
            gid = struct.unpack_from('<q', raw, 4)[0] if len(raw) >= 12 else 0
            if s in G['hero']:
                d = o.read_typetree()
                a = d.get('damageAsset') or {}
                x['hero'].setdefault(gid, []).append((d['damageDealt'], pointer(o, a) if a.get('m_PathID') else None,
                                                     d['hazardType'], d['damagePropertyFlags']))
            elif s in G['death']:
                d = o.read_typetree()
                p = d.get('journalRecord') or {}
                key = p.get('m_PathID') and G['record'].get(pointer(o, p))
                if key:
                    x['rec'][gid] = key
                    x['corpse'][gid] = corpse_refs(o, d)
            elif s in G['fsm'] and (b'SetDamageHeroAmount' in raw or SPAWNS_RAW.search(raw)):
                d = o.read_typetree()['fsm']
                mine = x['spawn'].setdefault(gid, {})
                for r, bt in spawn_refs(o, d).items():
                    mine[r] = mine.get(r, True) and bt
                x['sets'].setdefault(gid, []).extend(set_amounts(d))
            if s in G['health']:
                x['hp'].add(gid)
            if s not in G['death']:
                keys = names_record(o, raw)
                if len(keys) == 1:
                    x['named'][gid] = next(iter(keys))
    for x in out.values():   # a Transform's father → its object
        x['father'] = {g: x['tr'].get(p) for g, p in x['father'].items()}
        del x['tr']
    return out


def index(pool):
    """Every bundle outside the scenes read (in parallel), by file, with each object's children."""
    scenes = os.path.join(G['aa'], 'scenes_scenes_scenes')
    names = sorted(f for f, p in G['bundles'].items() if not p.startswith(scenes) and not SKIP.search(f))
    idx = {}
    for i, r in enumerate(pool.imap_unordered(bundle, names, chunksize=1)):
        idx.update(r)
        if i % 50 == 0:
            print(f'prefabs {i}/{len(names)}', file=sys.stderr, flush=True)
    for x in idx.values():
        x['children'] = defaultdict(list)
        for g, p in x['father'].items():
            if p:
                x['children'][p].append(g)
    return idx


def rel_in(x, g, top):
    out = []
    while g and g != top:
        out.append(x['name'].get(g, '?'))
        g = x['father'].get(g)
    return '/'.join(reversed(out))


def below(x, gid):
    """An object in a prefab and everything under it, down to another enemy with a record."""
    out, todo = [], [gid]
    while todo:
        g = todo.pop()
        if g != gid and g in x['rec']:
            continue
        out.append(g)
        todo += x['children'].get(g, [])
    return out


def prefabs(idx, refs):
    """What each prefab an enemy's FSMs spawn (or its corpse is) deals: {(file, path id): [(its
    name, damageDealt, asset, hazardType, flags, the hitbox's path under it, black-threaded
    only)]}, from the DamageHero components on it and under it and from what its own FSMs spawn in
    turn (a bomb's explosion, a corpse's burst), down to an enemy with a record of its own (a
    summoned enemy is its own entry)."""
    def hits(ref, bt, seen):
        # seen: each prefab with whether it was reached only through a black-threaded branch; one
        # reached so is walked again when a plain branch reaches it, so its hits aren't left as
        # a black-threaded enemy's only.
        cab, gid = ref
        x = idx.get(cab)
        if not x or gid not in x['name'] or gid in x['rec'] or (ref in seen and (bt or not seen[ref])):
            return []
        seen[ref] = bt
        out = []
        for g in below(x, gid):
            out += [(x['name'][gid],) + h + (rel_in(x, g, gid), bt) for h in x['hero'].get(g, ())]
            for r, t in sorted(x['spawn'].get(g, {}).items()):
                out += hits(r, bt or t, seen)
        return out
    return {r: hits(r[0], r[1], {}) for r in refs}


def prefab_rows(idx, keys):
    """The enemies the game only makes from a prefab (Tormented Trobbio, the Last Judge…), as the
    scenes' rows: only for the keys given, the ones with no enemy placed in a scene."""
    rows = []
    for cab, x in sorted(idx.items()):
        # An enemy with its record on its EnemyDeathEffects, or named by another of its components
        # (Tormented Trobbio's) when Hornet can hit it and it isn't inside another.
        roots = dict(x['rec'])
        for gid, key in x['named'].items():
            up, g = False, x['father'].get(gid)
            while g:
                up = up or g in x['rec'] or g in x['named']
                g = x['father'].get(g)
            if not up and gid not in roots and any(g in x['hp'] for g in below(x, gid)):
                roots[gid] = key
        for gid, key in sorted(roots.items()):
            if key not in keys:
                continue
            hits, sets, refs = [], [], {r: False for r in x['corpse'].get(gid, ())}
            for g in below(x, gid):
                hits += [(rel_in(x, g, gid),) + h + (x['on'].get(g, True),) for h in x['hero'].get(g, ())]
                sets += x['sets'].get(g, [])
                for r, bt in x['spawn'].get(g, {}).items():
                    refs[r] = refs.get(r, True) and bt
            rows.append(('prefab:' + cab, key, x['name'].get(gid, '?'), hits, sets, [], sorted(refs.items()), 'prefab'))
    return rows


def scan(game):
    setup(game)
    names = sorted(f[:-7] for f in os.listdir(os.path.join(G['aa'], 'scenes_scenes_scenes')) if f.endswith('.bundle'))
    rows = []
    with Pool(min(12, os.cpu_count() or 4), initializer=setup, initargs=(game,)) as pool:
        for i, r in enumerate(pool.imap_unordered(scene, names, chunksize=2)):
            rows += r
            if i % 50 == 0:
                print(f'{i}/{len(names)}', file=sys.stderr, flush=True)
        idx = index(pool)
    # A key placed in some scene is read there; one the game makes from a prefab, from its prefab;
    # a boss only named by its fight, from the object that names it.
    placed = {r[1] for r in rows if r[7] == 'placed'}
    rows += prefab_rows(idx, {k for k in G['record'].values() if k not in placed})
    # A corpse's record: the one its prefab carries or names.
    def corpse_key(refs):
        ks = {k for (cab, gid), _ in refs for k in [idx.get(cab, {}).get('rec', {}).get(gid) or idx.get(cab, {}).get('named', {}).get(gid)] if k}
        return next(iter(ks)) if len(ks) == 1 else None
    rows = [r[:1] + (corpse_key(r[6]),) + r[2:] if r[7] == 'corpse' else r for r in rows]
    rows = [r for r in rows if r[1]]
    better = {'placed': (), 'prefab': ('placed',), 'named': ('placed', 'prefab'), 'corpse': ('placed', 'prefab', 'named')}
    has = {h: {r[1] for r in rows if r[7] == h} for h in better}
    rows = [r for r in rows if not any(r[1] in has[h] for h in better[r[7]])]
    made = prefabs(idx, {ref for r in rows for ref in r[6]})
    # Each enemy's spawned hitboxes: the ones in its scene and its prefabs'.
    rows = [(sc, k, n, hs, st, sp + [h for ref in refs for h in made[ref]], how)
            for sc, k, n, hs, st, sp, refs, how in rows]
    print(f'{sum(1 for r in rows if r[5])} enemies spawn something that hurts', file=sys.stderr)
    # The DamageReference assets any hitbox points at: their value.
    assets = {h[2] for r in rows for h in r[3] if h[2]} | {h[2] for r in rows for h in r[5] if h[2]}
    values = {}
    if assets:
        files = {a[0] for a in assets}
        for b, path in G['bundles'].items():
            env = UnityPy.load(path)
            for o in env.objects:
                if o.type.name == 'MonoBehaviour' and (o.assets_file.name.lower(), o.path_id) in assets:
                    values[(o.assets_file.name.lower(), o.path_id)] = o.read_typetree().get('value')
            if len(values) == len(assets):
                break
        missing = assets - set(values)
        if missing:
            print(f'extract-damage: {len(missing)} damage assets not found ({sorted(files)[:3]}…)', file=sys.stderr)
    return rows, values


def gameplay():
    """The game's Gameplay settings (GlobalSettings.Gameplay, one asset in
    globalsettings_assets_all.bundle): barbedWireDamageTakenMultiplier is 2.0 in 1.0.30000, and
    the damage dealt 1.25, the wiki's +25%."""
    sid = {k for k, v in G['cls'].items() if v == 'Gameplay'}
    for o in UnityPy.load(G['bundles']['globalsettings_assets_all.bundle']).objects:
        if o.type.name == 'MonoBehaviour' and script(o.get_raw_data()) in sid:
            return o.read_typetree()
    sys.exit('extract-damage: no Gameplay settings in globalsettings_assets_all.bundle: the bundles changed')


def main(game, cache, dump):
    if cache and os.path.exists(cache):
        rows, values, barbed = pickle.load(open(cache, 'rb'))
    else:
        rows, values = scan(game)
        barbed = gameplay()['barbedWireDamageTakenMultiplier']
        if cache:
            pickle.dump((rows, values, barbed), open(cache, 'wb'))
    if dump:
        json.dump([{'scene': s, 'key': k, 'name': n, 'how': how, 'hits': [list(h[:2]) + [values.get(h[2]) if h[2] else None] + list(h[3:]) for h in hs], 'sets': st,
                    'spawned': [list(h[:2]) + [values.get(h[2]) if h[2] else None] + list(h[3:]) for h in sp]}
                   for s, k, n, hs, st, sp, how in rows], open(dump, 'w'), indent=1)
        print(f'{len(rows)} enemies → {dump}')
    write(rows, values, barbed)


# Hitboxes that are an attack even when they're on from the start (a particle system waits active
# until it emits; a slash's collider can sit active under an animation that's off).
ATTACK = re.compile(r'slash|stab|stomp|slam|blast|attack|spit|particle|projectile|whip|shot', re.I)
# A body's hitbox by its name, even when it waits off (an enemy that starts hidden).
BODY = re.compile(r'body', re.I)
# "Slash Hit 3", "Whip Hit (2)", "Slash2 1" are one attack's hitboxes: named without the numbers.
group = lambda path: re.sub(r'(?:\s*\(\d+\)|\s*\d+)+$', '', path).strip()


def masks(dmg, hazard, flags):
    """What a hit takes, as HeroController.TakeDamage decides it: Flame or Void, 2 whatever the
    component says; the hazards their own. None when the component deals nothing as placed (its
    FSM switches it on, or it's a multi-hitter that sets its damage per hit)."""
    if dmg <= 0:
        return None
    if hazard in (2, 3, 6, 7, 12):   # spikes, acid, coal, zap, coal spikes
        return 1
    if hazard in (4, 10) or flags & (FLAME | VOID):   # lava, steam
        return 2
    return dmg


def entries(rows, values):
    """Per journal key: body (the masks its body takes on contact, each value found, lowest first),
    attacks ({hitbox: masks found}) and types ({hitbox: 'fire' | 'void'}). The body is the
    DamageHero on the enemy itself or, when it has none there, the ones under it that are on from
    the start and aren't an attack's; an FSM that switches a body of 0 on (SetDamageHeroAmount)
    gives its value."""
    body, attacks, types, spawns = defaultdict(set), defaultdict(lambda: defaultdict(set)), defaultdict(dict), defaultdict(set)
    threaded = defaultdict(dict)
    for sc, key, name, hits, sets, spawned, how in rows:
        # What it spawns: an attack each, by the prefab's name.
        for prefab, dmg, asset, hazard, flags, path, bt in spawned:
            d = masks(values.get(asset, dmg) if asset else dmg, hazard, flags)
            if d is None:
                continue
            g = group(prefab)
            attacks[key][g].add(d)
            spawns[key].add(g)
            threaded[key][g] = threaded[key].get(g, True) and (bt or bool(THREADED_NAME.search(prefab + '/' + path)))
            if flags & VOID:
                types[key][g] = 'void'
            elif flags & FLAME:
                types[key][g] = 'fire'
        root = [h for h in hits if h[0] == '']
        for path, dmg, asset, hazard, flags, on in hits:
            d = masks(values.get(asset, dmg) if asset else dmg, hazard, flags)
            is_body = path == '' or (not root and (on or BODY.search(path)) and not ATTACK.search(path))
            if d is None:
                if path == '' and any(isinstance(v, int) and v > 0 for v in sets):
                    body[key] |= {v for v in sets if isinstance(v, int) and v > 0}
                continue
            if is_body:
                body[key].add(d)
            else:
                g = group(path)
                attacks[key][g].add(d)
                threaded[key][g] = threaded[key].get(g, True) and bool(THREADED_NAME.search(path))
                if flags & VOID:
                    types[key][g] = 'void'
                elif flags & FLAME:
                    types[key][g] = 'fire'
    out = {}
    for key in sorted(set(body) | set(attacks)):
        e = {}
        if body.get(key):
            e['body'] = sorted(body[key])
        if attacks.get(key):
            e['attacks'] = {g: sorted(v) for g, v in sorted(attacks[key].items())}
        if types.get(key):
            e['types'] = dict(sorted(types[key].items()))
        if spawns.get(key):
            e['spawned'] = sorted(spawns[key])
        if any(threaded[key].values()):
            e['threaded'] = sorted(g for g, t in threaded[key].items() if t)
        out[key] = e
    return out


def write(rows, values, barbed):
    out = entries(rows, values)
    data = json.dumps(out, separators=(',', ':'), ensure_ascii=False)
    open(OUT, 'w').write(
        "/* js/enemy-damage.js: what each Hunter's Journal entry's enemies do to Hornet, in masks.\n"
        "   BY_KEY: its NAME_ key (js/journal.js) → body (on contact: each value its placed enemies\n"
        "   have, lowest first), attacks (its hitboxes, by the game's own object names without their\n"
        "   numbers, or what it spawns by the prefab's → the values found), types (a hitbox that is\n"
        "   'fire' or 'void': 2 masks whatever it says), spawned (the attacks it makes at run time:\n"
        "   projectiles, bombs, its corpse's burst) and threaded (the attacks only a black-threaded one\n"
        "   has).\n"
        "   BARBED: what the Barbed Bracelet multiplies the masks taken by (floored), the game's Gameplay\n"
        "   settings' barbedWireDamageTakenMultiplier.\n"
        "   GENERATED by tools/extract-damage.py from the game's own files (each enemy's DamageHero\n"
        "   components, and those of the prefabs its FSMs spawn): not edited by hand. Black-threaded,\n"
        "   every hit is 2 masks (the game sets the Void flag on all of them). Not here: a summoned enemy\n"
        "   with an entry of its own, and a hitbox whose damage its FSM sets during the fight. */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.enemyDamage = {{ BY_KEY: {data}, BARBED: {json.dumps(barbed)} }};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.enemyDamage;\n})();\n")
    two = sum(1 for e in out.values() if max(e.get('body', [0])) >= 2)
    print(f'{len(out)} of {len({r[1] for r in rows})} entries read have damage, {sum(1 for e in out.values() if "body" in e)} with a body, '
          f'{two} of them 2 masks → js/enemy-damage.js ({os.path.getsize(OUT) // 1024} KB)')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-damage.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>] [--dump=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'), opt('--dump'))
