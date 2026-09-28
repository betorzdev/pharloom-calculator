"""tools/extract-journal-rooms.py — where each Hunter's Journal entry's enemies are, from the game's
own files, into js/journal-rooms.js: for each entry (its NAME_ key, as js/journal.js), the scenes
it's placed in and how many. Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-journal-rooms.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Re-run it after a patch that adds or moves enemies.

Where it is (found on 28-Sep-2026): an enemy's EnemyDeathEffects (the game's class, abstract: the
components are EnemyDeathEffectsRegular, …NoEffect) points at its
EnemyJournalRecord, one of the 237 assets in journalrecords.bundle, whose displayName is the
entry's key (Journal sheet, NAME_<X>). Each scene is a bundle of its own; the enemies placed in
it (a gauntlet's waves too, waiting disabled) carry their EnemyDeathEffects, so counting them per
record gives where to find each entry. An enemy the game spawns at run time (a boss's summons, a
hive's) isn't placed, and isn't counted: its entry may have no room, or only its spawner's.

It also prints, not writes, the health each record's enemies have in the game (HealthManager.hp,
on the same object) against js/enemies.js's, the wiki's: a check, since the site's numbers are the
wiki's (CLAUDE.md). """
import json, os, re, struct, sys
from collections import defaultdict, Counter
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'journal-rooms.js')


def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    scenes = os.path.join(aa, 'scenes_scenes_scenes')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    CLS = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    sid = {v: k for k, v in CLS.items() if v in ('EnemyJournalRecord', 'HealthManager')}
    # EnemyDeathEffects is abstract: the components placed are its subclasses (Regular, NoEffect…).
    DEATH = {k for k, v in CLS.items() if v.startswith('EnemyDeathEffects') and v != 'EnemyDeathEffectsProfile'}

    def script(o):
        raw = o.get_raw_data()
        return struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None

    # The records: (their file, path id) → the entry's key.
    RECORD = {}
    for o in UnityPy.load(bundles['journalrecords.bundle']).objects:
        if o.type.name == 'MonoBehaviour' and script(o) == sid['EnemyJournalRecord']:
            d = o.read_typetree()
            RECORD[(o.assets_file.name.lower(), o.path_id)] = d['displayName']['Key']
    if len(RECORD) < 200:
        sys.exit(f'extract-journal-rooms: {len(RECORD)} records in journalrecords.bundle: the bundles changed')

    # The scenes' names with their capitals, from js/graph.js and js/map.js.
    proper = {}
    for f in ('graph.js', 'map.js'):
        src = open(os.path.join(ROOT, 'js', f)).read()
        obj = json.loads(re.search(r'SS\.\w+ = (\{.*\});', src, re.S).group(1))
        for k in (obj['ROOMS'] if f == 'map.js' else list(obj) + [t for v in obj.values() for t in v]):
            proper.setdefault(k.lower(), k)

    where = defaultdict(Counter)   # key → scene → how many
    hp = defaultdict(Counter)      # key → health → how many
    names = sorted(f[:-7] for f in os.listdir(scenes) if f.endswith('.bundle'))
    for i, name in enumerate(names):
        env = UnityPy.load(os.path.join(scenes, name + '.bundle'))
        rec, health = {}, {}
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            s = script(o)
            if s in DEATH:
                d = o.read_typetree()
                p = d.get('journalRecord') or {}
                if not p.get('m_PathID'):
                    continue
                f = o.assets_file.name if p['m_FileID'] == 0 else o.assets_file.externals[p['m_FileID'] - 1].path.split('/')[-1]
                key = RECORD.get((f.lower(), p['m_PathID']))
                if key:
                    rec[d['m_GameObject']['m_PathID']] = key
            elif s == sid['HealthManager']:
                d = o.read_typetree()
                health[d['m_GameObject']['m_PathID']] = d.get('hp')
        scene = proper.get(name, name)
        for go, key in rec.items():
            where[key][scene] += 1
            if health.get(go):
                hp[key][health[go]] += 1
        if i % 50 == 0:
            print(f'{i}/{len(names)} {name}', file=sys.stderr, flush=True)

    ROOMS = {k: sorted(([s, n] for s, n in v.items()), key=lambda x: (-x[1], x[0])) for k, v in sorted(where.items())}
    data = json.dumps(ROOMS, separators=(',', ':'))
    open(OUT, 'w').write(
        "/* js/journal-rooms.js — where each Hunter's Journal entry's enemies are placed: its NAME_ key\n"
        "   (js/journal.js) → [scene, how many] in the scene, the most first.\n"
        "   GENERATED by tools/extract-journal-rooms.py from the game's own files (each enemy's\n"
        "   EnemyDeathEffects and its EnemyJournalRecord): not edited by hand. An enemy the game spawns\n"
        "   at run time isn't placed, and isn't here. */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.journalRooms = {data};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.journalRooms;\n})();\n")
    placed = sum(sum(v.values()) for v in where.values())
    print(f'{len(ROOMS)} of {len(set(RECORD.values()))} entries placed, {placed} enemies in {len({s for v in where.values() for s in v})} scenes → js/journal-rooms.js ({os.path.getsize(OUT) // 1024} KB)')
    # The game's health per entry, to set against the wiki's (js/enemies.js) by hand or by test.
    with open(os.path.join(os.environ.get('TMPDIR', '/tmp'), 'journal-hp.json'), 'w') as f:
        json.dump({k: dict(v) for k, v in hp.items()}, f)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-journal-rooms.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
