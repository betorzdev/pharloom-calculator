"""tools/extract-hunts.py: which enemies give what a wish asks for while it's on, from the game's own
files, into kb/data/game/hunts.json (tools/gen-spots.js reads it, offline: js/spots.js HUNTS, the
Map's «Where to hunt»). Needs the game installed and UnityPy, as tools/extract-wishes.py:
    /tmp/unitypy/bin/python tools/extract-hunts.py "<Steam>/steamapps/common/Hollow Knight Silksong"
About two minutes (every scene and prefab bundle, in parallel). Re-run it after a patch.

What gives a wish's thing, read on 21-Oct-2026 (patch 1.0.30000): a quest is a thing the game can
drop (a SavedItem): dropping it drops its target while the quest is on. An enemy placed in a scene
(an EnemyDeathEffects with its EnemyJournalRecord, whose displayName is the Journal entry's key)
gives one when
  'drop'       its HealthManager's itemDropGroups drop the quest (the Craws: Crawbug Clearing);
  'corpse'     its corpse (EnemyDeathEffects corpsePrefab, a prefab in the bundles outside the
               scenes) names the quest: an ActiveCorpse's itemPickupGroups (the pilgrims' Pilgrim
               Shawl, the Choir's cloaks, the Muckroach's guts) or a SpecialQuestItemVariant under
               it (the Choristors' and Reeds' Fine Pins);
  'spawn'      another of its components points at a prefab that names the quest (the Hoker's
               spines, which its FSM throws from a PersonalObjectPool);
  'lifeblood'  it carries a LifebloodState: the Needle Phial's charged stab draws LIFEBLOOD from it
               (the hero's tool_attacks FSM gives the item; nothing on the enemy names the quest),
               the target of Advanced Alchemy. Plasmified Zango has one too, but no record.
A reference to another file is found as tools/extract-journal-rooms.py finds one: the file's index
(an int32, 1 up) and the object's path id (an int64) in the component's raw data. Prefabs that
name a quest: every object of a bundle outside the scenes whose component names it, by its topmost
parent (the prefab).

Out: { quest: { entry key: { scene (bundle's, lower case): [how many, [hows]] } } }. A quest the
Map already marks another way (a Flintbeetle's drop, tools/extract-wishes.py) may be here too:
tools/gen-spots.js leaves those out. Broodfeast's organs come from the kind of Tool damage on any
enemy (CollectableItemToolDamage), not from an enemy: it isn't here. """
import json, os, re, struct, sys
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'hunts.json')
# The thing the Needle Phial draws from an enemy with a LifebloodState (its collectable's name).
LIFEBLOOD = 'Plasmium Blood'
# The bundles outside the scenes worth reading for prefabs: not the art, the sound or the text.
SKIP = re.compile(r'^(sfx|herosfx|textures|utilitytextures|materials|animations|audiocues|tk2d|fonts|shaders|vibration|'
                  r'herocollections|journalrecords|atlases)|monoscripts|unitybuiltin|spriteatlas')
CTX = None


def fail(msg):
    sys.exit('extract-hunts: ' + msg)


def init(ctx):
    global CTX
    CTX = ctx


def script(o):
    raw = o.get_raw_data()
    return CTX['cls'].get(struct.unpack_from('<q', raw, 20)[0]) if len(raw) >= 28 else None


def refs(o, targets):
    """What a component refers to among targets {file: {path id: what}}: each index of a file with
    targets looked for in the raw data, and the 8 bytes after it read."""
    raw = o.get_raw_data()
    out = []
    for i, e in enumerate(o.assets_file.externals):
        t = targets.get(e.path.split('/')[-1].lower())
        if not t:
            continue
        pat = struct.pack('<i', i + 1)
        p = raw.find(pat)
        while p >= 0:
            if p + 12 <= len(raw):
                hit = t.get(struct.unpack_from('<q', raw, p + 4)[0])
                if hit:
                    out.append(hit)
            p = raw.find(pat, p + 1)
    return out


def prefab(path):
    """One bundle outside the scenes: (file, its prefab's path id, quest) for each prefab one of whose
    components names a quest."""
    import warnings
    warnings.filterwarnings('ignore')
    try:
        env = UnityPy.load(path)
    except Exception:
        return []
    father, of_go, hits = {}, {}, []
    for o in env.objects:
        if o.type.name in ('Transform', 'RectTransform'):
            t = o.read()
            of_go[(o.assets_file.name.lower(), t.m_GameObject.m_PathID)] = (t.m_Father.m_PathID, o.path_id)
            father[(o.assets_file.name.lower(), o.path_id)] = t.m_GameObject.m_PathID
        elif o.type.name == 'MonoBehaviour':
            go = struct.unpack_from('<q', o.get_raw_data(), 4)[0]
            if go:   # an asset of its own (a list, the quest's item) is no prefab
                for q in refs(o, CTX['quests']):
                    hits.append((o.assets_file.name.lower(), go, q))
    out = set()
    for cab, go, q in hits:
        for _ in range(64):   # up to the topmost parent
            f = of_go.get((cab, go))
            if not f or not f[0]:
                break
            go = father.get((cab, f[0]), 0)
        out.add((cab, go, q))
    return sorted(out)


def scene(path):
    """One scene: [entry key, how, quest] for each enemy placed in it that gives a wish's thing."""
    import warnings
    warnings.filterwarnings('ignore')
    env = UnityPy.load(path)
    rec, gives, blood = {}, defaultdict(set), set()
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        c = script(o)
        if not c:
            continue
        go = struct.unpack_from('<q', o.get_raw_data(), 4)[0]
        death = c.startswith('EnemyDeathEffects') and c != 'EnemyDeathEffectsProfile'
        if death:
            for kind, key in refs(o, CTX['records']):
                rec[go] = key
        if c == 'LifebloodState':
            blood.add(go)
        for q in refs(o, CTX['quests']):
            gives[go].add(('drop' if c == 'HealthManager' else 'names', q))
        for q in refs(o, CTX['prefabs']):
            gives[go].add(('corpse' if death else 'spawn', q))
    out = []
    for go, key in rec.items():
        for how, q in gives.get(go, ()):
            out.append([key, how, q])
        if go in blood:
            for q in CTX['blood']:
                out.append([key, 'lifeblood', q])
    return os.path.basename(path)[:-len('.bundle')], out


def main(game):
    import warnings
    warnings.filterwarnings('ignore')
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    scenes = os.path.join(aa, 'scenes_scenes_scenes')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    cls = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    init({'cls': cls})
    # The quests, by their file and path id, and the collectables they ask for.
    env = UnityPy.load(bundles['quests.bundle'], bundles['collectableitems.bundle'])
    named = {}
    for o in env.objects:
        if o.type.name == 'MonoBehaviour' and script(o) in ('Quest', 'CollectableItemBasic', 'CollectableItemStates', 'CollectableItemStack'):
            named[(o.assets_file.name.lower(), o.path_id)] = (script(o), o)
    quests, wants = defaultdict(dict), {}
    for (cab, pid), (c, o) in named.items():
        if c != 'Quest':
            continue
        tt = o.read_typetree()
        got = []
        for t in tt.get('targets') or []:
            r = t.get('Counter') or {}
            if r.get('m_PathID'):
                f = o.assets_file.name if r['m_FileID'] == 0 else o.assets_file.externals[r['m_FileID'] - 1].path.split('/')[-1]
                hit = named.get((f.lower(), r['m_PathID']))
                if hit and hit[0] != 'Quest':
                    got.append(hit[1].read_typetree()['m_Name'])
        quests[cab][pid] = tt['m_Name']
        wants[tt['m_Name']] = got
    blood = sorted(q for q, t in wants.items() if LIFEBLOOD in t)
    if len(wants) < 50 or not blood:
        fail(f'{len(wants)} quests, {len(blood)} asking for {LIFEBLOOD}: the bundles changed')
    records = {}
    for o in UnityPy.load(bundles['journalrecords.bundle']).objects:
        if o.type.name == 'MonoBehaviour' and script(o) == 'EnemyJournalRecord':
            records.setdefault(o.assets_file.name.lower(), {})[o.path_id] = ('record', o.read_typetree()['displayName']['Key'])
    if sum(len(v) for v in records.values()) < 200:
        fail('fewer than 200 Journal records: the bundles changed')
    ctx = {'cls': cls, 'quests': dict(quests)}
    outside = sorted(p for f, p in bundles.items() if not p.startswith(scenes) and not SKIP.search(f))
    prefabs = defaultdict(dict)
    with ProcessPoolExecutor(min(12, os.cpu_count() or 1), initializer=init, initargs=(ctx,)) as ex:
        for r in ex.map(prefab, outside, chunksize=4):
            for cab, go, q in r:
                prefabs[cab][go] = q
    ctx.update(records=records, prefabs=dict(prefabs), blood=blood)
    hunts = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: [0, set()])))
    paths = sorted(os.path.join(scenes, f) for f in os.listdir(scenes) if f.endswith('.bundle') and f != 'menu_title.bundle')
    with ProcessPoolExecutor(min(12, os.cpu_count() or 1), initializer=init, initargs=(ctx,)) as ex:
        for name, r in ex.map(scene, paths, chunksize=2):
            for key, how, q in r:
                if how == 'names':   # a component of its own naming the quest that isn't a drop: not this file's
                    continue
                e = hunts[q][key][name]
                e[0] += 1
                e[1].add(how)
    out = {q: {k: {s: [n, sorted(h)] for s, (n, h) in sorted(v.items())} for k, v in sorted(es.items())} for q, es in sorted(hunts.items())}
    if len(out) < 5:
        fail(f'only {len(out)} wishes with enemies that give their thing: the bundles changed')
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f'{sum(len(v) for v in prefabs.values())} prefabs name a quest; {len(out)} wishes given by enemies: '
          + ', '.join(f'{q} ({len(es)} entries, {len({s for v in es.values() for s in v})} scenes)' for q, es in out.items())
          + f' → {os.path.relpath(OUT)}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
