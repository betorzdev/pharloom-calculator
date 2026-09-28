"""tools/extract-graph.py — how Pharloom's rooms connect, from the game's own files, into js/graph.js:
for each scene, the scenes its doors lead to. Needs the game installed and UnityPy, as
tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-graph.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Re-run it after a patch that adds or moves rooms.

Where it is (found on 28-Sep-2026): each scene is a bundle of its own in
StreamingAssets/aa/StandaloneLinux64/scenes_scenes_scenes/, named after the scene in lower case,
and every way out of a room is a TransitionPoint (the game's class: a door, an edge, a drop),
whose targetScene is where it leads. Only those components are read: they're told apart by their
MonoScript's path id in the shared monoscripts bundle, without reading every MonoBehaviour's type
tree. A way out can be one-way (a drop, a door that only opens from one side), so the graph is
directed: A → B when A has a way to B. The scenes' own names, with their capitals, come from the
doors that lead to them and from js/map.js; a bundle nobody leads to keeps its lower-case name.
Some doors say "[dynamic]": where they lead is decided at run time, and the game's data says how
(read on 28-Sep-2026, each by its class): a DoorTargetCondition on the same object (targetIfTrue,
targetIfFalse: Verdania's webbed door), a PlayerDataTestResponse (the scene its IsFullfilled and
IsNotFulfilled events pass on: the Mist's ways in, the maze or its finished room); in the Mist
itself a MazeController (its rooms, taken at random, the rest room, the last hall and its exit), so
the entrance leads to every maze room, each to the others and the rest room, that to the last hall,
and that out. A door with none of these goes back where it was entered from (the caravan's Spa,
wherever the caravan stands). Two more ways that aren't doors: a scene loaded on top of another
(SceneAdditiveLoadConditional's sceneNameToLoad: the caravan at Greymoor and at Fleatopia), both
ways, and a memory's way in (a "Memory Scene" object's FSM names the scene: Verdania), one way.
Not in it: the Bellways and the Ventrica, which aren't doors (js/rooms.js adds the stations a
save has opened). """
import json, os, re, struct, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'graph.js')


def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    scenes = os.path.join(aa, 'scenes_scenes_scenes')
    mono = next(os.path.join(aa, f) for f in os.listdir(aa) if f.endswith('_monoscripts.bundle'))
    classes = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    ids = {c: {k for k, v in classes.items() if v == c} for c in
           ('TransitionPoint', 'DoorTargetCondition', 'PlayerDataTestResponse', 'SceneAdditiveLoadConditional',
            'MazeController', 'PlayMakerFSM')}
    out, extra, back, mazes = {}, {}, set(), {}
    names = sorted(f[:-7] for f in os.listdir(scenes) if f.endswith('.bundle'))
    names_set = set(names)
    for i, name in enumerate(names):
        env = UnityPy.load(os.path.join(scenes, name + '.bundle'))
        to, dyn, cond, memory = set(), [], {}, set()
        # The objects named "Memory Scene" (their raw data holds the name), for their FSMs.
        for o in env.objects:
            if o.type.name == 'GameObject' and b'Memory Scene' in o.get_raw_data():
                memory.add(o.path_id)
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            raw = o.get_raw_data()
            if len(raw) < 28:
                continue
            sid = struct.unpack_from('<q', raw, 20)[0]
            kind = next((c for c, pids in ids.items() if sid in pids), None)
            if not kind or (kind == 'PlayMakerFSM' and struct.unpack_from('<q', raw, 4)[0] not in memory):
                continue
            tt = o.read_typetree()
            go = tt['m_GameObject']['m_PathID']
            if kind == 'TransitionPoint':
                t = tt.get('targetScene') or ''
                if t == '[dynamic]':
                    dyn.append(go)
                elif t and t.lower() != name:
                    to.add(t)
            elif kind == 'DoorTargetCondition':
                cond.setdefault(go, set()).update(x for x in (tt.get('targetIfTrue'), tt.get('targetIfFalse')) if x)
            elif kind == 'PlayerDataTestResponse':
                for ev in ('IsFullfilled', 'IsNotFulfilled'):
                    for c in tt.get(ev, {}).get('m_PersistentCalls', {}).get('m_Calls', []):
                        a = c.get('m_Arguments', {}).get('m_StringArgument')
                        if a and a.lower() in names_set:   # not an entry point's name
                            cond.setdefault(go, set()).add(a)
            elif kind == 'SceneAdditiveLoadConditional':
                t = tt.get('sceneNameToLoad')
                if t:
                    extra.setdefault(t.lower(), set()).add(name)
            elif kind == 'MazeController':
                mazes[name] = tt
            else:
                for v in tt.get('fsm', {}).get('variables', {}).get('stringVariables', []):
                    if v.get('value', '').lower() in names_set:
                        to.add(v['value'])
        for go in dyn:
            if go in cond:
                to.update(cond[go])
            elif name not in mazes:
                back.add(name)
        if dyn and name in mazes and not any(go in cond for go in dyn):
            back.discard(name)
            mazes[name]['dynamic'] = True
        out[name] = {t for t in to if t.lower() != name}
        if i % 50 == 0:
            print(f'{i}/{len(names)} {name}', file=sys.stderr, flush=True)
    # The Mist: the scenes with a MazeController whose doors are left to it. The last hall is the
    # scene the others name as their exit; its own exit is outside the maze.
    halls = {m.get('exitSceneName', '').lower() for m in mazes.values()}
    for name, m in mazes.items():
        if not m.get('dynamic'):
            continue
        rooms, rest, exit_ = m.get('sceneNames', []), m.get('restSceneName', ''), m.get('exitSceneName', '')
        if name in [r.lower() for r in rooms]:
            out[name].update([r for r in rooms if r.lower() != name] + [rest])
        elif name == rest.lower():
            out[name].update(rooms + [exit_])
        elif name in halls:
            out[name].add(exit_)
        else:   # the entrance: into the maze, and back where Hornet came from
            out[name].update(rooms)
            back.add(name)
    # A scene loaded on top of another is the same place, both ways, when it has doors of its own
    # (the caravan's); boss arenas, cutscenes and the Bellway's ride don't.
    for k, hosts in extra.items():
        if out.get(k):
            out[k].update(hosts)
            for h in hosts:
                out[h].add(k)
    # A door with nothing else to say leads back to every scene that leads to it.
    for name in back:
        out[name].update(k for k, v in out.items() for t in v if t.lower() == name)
    out = {k: sorted(v, key=str.lower) for k, v in out.items()}
    # The scenes' names with their capitals: from the doors, then from the map. Every name met
    # above in lower case (a bundle's) takes them.
    proper = {}
    for to in out.values():
        for t in to:
            if t != t.lower():
                proper.setdefault(t.lower(), t)
    for to in out.values():
        for t in to:
            proper.setdefault(t.lower(), t)
    src = open(os.path.join(ROOT, 'js', 'map.js')).read()
    for k in json.loads(re.search(r'SS\.map = (\{.*\});', src).group(1))['ROOMS']:
        proper.setdefault(k.lower(), k)
    GRAPH = {proper.get(k, k): sorted({proper.get(t.lower(), t) for t in v}, key=str.lower) for k, v in sorted(out.items()) if v}
    edges = sum(len(v) for v in GRAPH.values())
    data = json.dumps(GRAPH, separators=(',', ':'))
    open(OUT, 'w').write(
        "/* js/graph.js — how the rooms connect: scene → the scenes its ways out lead to.\n"
        "   GENERATED by tools/extract-graph.py from the game's own files (each scene's\n"
        "   TransitionPoints): not edited by hand. Directed: a drop leads one way. The Bellways and\n"
        "   the Ventrica aren't in it (js/rooms.js adds a save's). */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.graph = {data};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.graph;\n})();\n")
    print(f'{len(GRAPH)} scenes with ways out, {edges} ways → js/graph.js ({os.path.getsize(OUT) // 1024} KB)')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-graph.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
