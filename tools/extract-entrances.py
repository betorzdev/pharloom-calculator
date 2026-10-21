"""tools/extract-entrances.py: where each room's doors are, from the game's own files, into
kb/data/game/entrances.json, which tools/map-point.js reads (offline) to put what's inside a room the
map doesn't draw (an interior: Plinney's house, the Skull Cave, the Bellhome) at the door it's entered
by. Needs the game installed and UnityPy, as tools/extract-pickups.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-entrances.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Re-run it after a patch, with tools/extract-pickups.py (npm run data stops unless both are of the
same patch: tools/map-point.js).

What it writes (read on 21-Oct-2026, patch 1.0.30000): every TransitionPoint (a door, an edge, a
drop: the game's class, as tools/extract-graph.py reads them) whose targetScene is a scene's, by that
scene's name in lower case → [[the scene it's in, lower case, the door's object, x, y]], its place in
the world (its Transforms composed, their turns counted: tools/scene_place.py). A door that says
"[dynamic]" (decided at run time) and one leading back into its own scene are left out. """
import json, os, re, struct, sys
import UnityPy
from scene_place import world_of

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'entrances.json')


def game_patch(game):
    """The game's version, as tools/extract-pickups.py reads it (PlayerSettings in globalgamemanagers)."""
    env = UnityPy.load(os.path.join(game, 'Hollow Knight Silksong_Data', 'globalgamemanagers'))
    for o in env.objects:
        if o.type.name == 'PlayerSettings':
            found = re.findall(rb'(?<![\d.])\d+\.\d+\.\d+(?![\d.])', o.get_raw_data())
            if len(found) == 1:
                return found[0].decode()
    sys.exit('extract-entrances: the game\'s version isn\'t where it was (globalgamemanagers PlayerSettings)')


def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    scenes = os.path.join(aa, 'scenes_scenes_scenes')
    mono = next(os.path.join(aa, f) for f in os.listdir(aa) if f.endswith('_monoscripts.bundle'))
    tp = {o.path_id for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript' and o.read().m_ClassName == 'TransitionPoint'}
    if not tp:
        sys.exit('extract-entrances: no TransitionPoint class in the monoscripts')
    names = sorted(f[:-7] for f in os.listdir(scenes) if f.endswith('.bundle'))
    known = set(names)
    out = {}
    for i, name in enumerate(names):
        env = UnityPy.load(os.path.join(scenes, name + '.bundle'))
        objs = list(env.objects)
        T = {o.path_id: o.read() for o in objs if o.type.name in ('Transform', 'RectTransform')}
        of_go = {t.m_GameObject.m_PathID: t for t in T.values()}
        world = world_of(T, of_go, 2)
        for o in objs:
            if o.type.name != 'MonoBehaviour':
                continue
            raw = o.get_raw_data()
            if len(raw) < 28 or struct.unpack_from('<q', raw, 20)[0] not in tp:
                continue
            tt = o.read_typetree()
            target = (tt.get('targetScene') or '').lower()
            if not target or target == name or target not in known:
                continue
            go = tt['m_GameObject']['m_PathID']
            at = world(go)
            if not at:
                continue
            obj = next((x.read().m_Name for x in objs if x.path_id == go and x.type.name == 'GameObject'), '')
            out.setdefault(target, []).append([name, obj, at[0], at[1]])
        if i % 100 == 0:
            print(f'{i}/{len(names)} {name}', file=sys.stderr, flush=True)
    doors = {k: sorted(v) for k, v in sorted(out.items())}
    with open(OUT, 'w') as f:
        json.dump({'patch': game_patch(game), 'doors': doors}, f, indent=0, sort_keys=True)
        f.write('\n')
    print(f'{sum(len(v) for v in doors.values())} doors into {len(doors)} scenes → {os.path.relpath(OUT)}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
