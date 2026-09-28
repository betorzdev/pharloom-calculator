"""tools/extract-damage.py: what each Hunter's Journal entry's enemies do to Hornet, from the game's
own files: the masks its body takes on contact and each of its attacks' hitboxes, into
js/enemy-damage.js. Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-damage.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>] [--dump=<file>]
Re-run it after a patch that adds or changes enemies. --cache keeps the scan (pickled) for the
runs that follow; --dump writes every enemy's hitboxes, as read, for checking by hand.

Where it is (read on 28-Sep-2026, patch 1.0.30000, with the game's code decompiled): anything that
hurts Hornet carries a DamageHero component, whose damageDealt is the masks it takes (1 by
default), unless it points at a DamageReference asset (damageAsset), whose value wins; its
hazardType (1 ENEMY; the rest are spikes, lava…) and its damagePropertyFlags (4 Flame, 8 Void).
An enemy placed in a scene is found as tools/extract-journal-rooms.py finds it, by the
EnemyJournalRecord its EnemyDeathEffects points at; its DamageHero components are the ones on it
(its body: contact damage) and on the objects under it, its hitboxes ("SlashHit", "Dash Stab
Hit"), up to another enemy with a record of its own. The scenes are read in parallel.

What the game does with it (HeroController.TakeDamage): Flame or Void sets the hit to 2 masks,
whatever damageDealt says; lava and steam are 2, spikes, acid, coal and zap 1. Black-threading
(BlackThreadState.SetVisiblyThreaded) adds the Void flag to every DamageHero under the enemy, so a
black-threaded enemy's every hit is 2 masks: the game doesn't double, it sets. Not read: a
projectile the enemy spawns at run time (it isn't under the enemy in the scene), and an FSM that
changes damageDealt during the fight (SetDamageHeroAmount): a body of 0 that its FSM switches on
takes the FSM's value; the rest aren't followed. The Barbed Bracelet's multiplier on the masks
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
    G.update(aa=aa, bundles=bundles, cls=cls, record=record,
             death={k for k, v in cls.items() if v.startswith('EnemyDeathEffects') and v != 'EnemyDeathEffectsProfile'},
             hero={k for k, v in cls.items() if v == 'DamageHero'},
             fsm={k for k, v in cls.items() if v == 'PlayMakerFSM'})


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
    rec, heroes, fsms = {}, defaultdict(list), defaultdict(list)
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
                if p.get('m_PathID'):
                    key = G['record'].get(pointer(o, p))
                    if key:
                        rec[gid] = key
            elif s in G['hero']:
                d = o.read_typetree()
                a = d.get('damageAsset') or {}
                heroes[gid].append((d['damageDealt'], pointer(o, a) if a.get('m_PathID') else None,
                                    d['hazardType'], d['damagePropertyFlags']))
            elif s in G['fsm'] and b'SetDamageHeroAmount' in raw:
                fsms[gid].append(o)
    if not rec:
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

    found = {g: {'key': k, 'name': gname(g), 'hits': [], 'sets': []} for g, k in rec.items()}
    for gid, hs in heroes.items():
        root = owner(gid)
        if root:
            for dmg, asset, hazard, flags in hs:
                found[root]['hits'].append((rel(gid, root), dmg, asset, hazard, flags, active(gid)))
    for gid, os_ in fsms.items():
        root = owner(gid)
        if not root:
            continue
        for o in os_:
            for v in set_amounts(o.read_typetree()['fsm']):
                found[root]['sets'].append(v)
    return [(name, f['key'], f['name'], f['hits'], f['sets']) for f in found.values()]


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


def scan(game):
    setup(game)
    names = sorted(f[:-7] for f in os.listdir(os.path.join(G['aa'], 'scenes_scenes_scenes')) if f.endswith('.bundle'))
    rows = []
    with Pool(min(12, os.cpu_count() or 4), initializer=setup, initargs=(game,)) as pool:
        for i, r in enumerate(pool.imap_unordered(scene, names, chunksize=2)):
            rows += r
            if i % 50 == 0:
                print(f'{i}/{len(names)}', file=sys.stderr, flush=True)
    # The DamageReference assets any hitbox points at: their value.
    assets = {h[2] for r in rows for h in r[3] if h[2]}
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
        json.dump([{'scene': s, 'key': k, 'name': n, 'hits': [list(h[:2]) + [values.get(h[2]) if h[2] else None] + list(h[3:]) for h in hs], 'sets': st}
                   for s, k, n, hs, st in rows], open(dump, 'w'), indent=1)
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
    body, attacks, types = defaultdict(set), defaultdict(lambda: defaultdict(set)), defaultdict(dict)
    for sc, key, name, hits, sets in rows:
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
        out[key] = e
    return out


def write(rows, values, barbed):
    out = entries(rows, values)
    data = json.dumps(out, separators=(',', ':'), ensure_ascii=False)
    open(OUT, 'w').write(
        "/* js/enemy-damage.js: what each Hunter's Journal entry's enemies do to Hornet, in masks.\n"
        "   BY_KEY: its NAME_ key (js/journal.js) → body (on contact: each value its placed enemies\n"
        "   have, lowest first), attacks (its hitboxes, by the game's own object names without their\n"
        "   numbers → the values found) and types (a hitbox that is 'fire' or 'void': 2 masks whatever\n"
        "   it says).\n"
        "   BARBED: what the Barbed Bracelet multiplies the masks taken by (floored), the game's Gameplay\n"
        "   settings' barbedWireDamageTakenMultiplier.\n"
        "   GENERATED by tools/extract-damage.py from the game's own files (each enemy's DamageHero\n"
        "   components): not edited by hand. Black-threaded, every hit is 2 masks (the game sets the Void\n"
        "   flag on all of them). Not here: what an enemy spawns at run time (projectiles, summons), and\n"
        "   a hitbox whose damage its FSM sets during the fight. */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.enemyDamage = {{ BY_KEY: {data}, BARBED: {json.dumps(barbed)} }};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.enemyDamage;\n})();\n")
    two = sum(1 for e in out.values() if max(e.get('body', [0])) >= 2)
    print(f'{len(out)} of {len({r[1] for r in rows})} entries placed have damage, {sum(1 for e in out.values() if "body" in e)} with a body, '
          f'{two} of them 2 masks → js/enemy-damage.js ({os.path.getsize(OUT) // 1024} KB)')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-damage.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>] [--dump=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'), opt('--dump'))
