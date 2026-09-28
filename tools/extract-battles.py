"""tools/extract-battles.py — the game's enemy arenas, from its own files: every BattleScene
component in the scenes' bundles, with its waves and what it saves once won. It prints them; it
writes nothing. It's where tools/gen-gauntlets.js's DONE came from (paired by hand to the wiki's
49 by area and waves), and what to re-run after a patch that adds or moves arenas.
Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-battles.py "<Steam>/steamapps/common/Hollow Knight Silksong" [scene …]

What it reads (found on 28-Sep-2026, patch 1.0.30000): one bundle per scene in
StreamingAssets/aa/StandaloneLinux64/scenes_scenes_scenes/, the scene's name lowercased. A
BattleScene has `waves` (each a GameObject whose children are the enemies, "Bone Goomba (1)"),
`setPDBoolOnEnd` (a playerData flag it sets when won) and, on the same GameObject, a
PersistentBoolItem that saves it in sceneData under the scene and the object's name unless
its itemData says otherwise (dontSave, or another ID). The scripts are told apart by their
MonoScript's path id in the shared monoscripts bundle, the same in every scene: reading every
MonoBehaviour's type tree would take an hour, reading these two takes a minute or two. 59 in
1.0.30000; some save nothing (the memories, the lava challenge), and some of the wiki's
gauntlets aren't one (the Roachkeeper's in Dust_06, the bosses'). """
import os, re, struct, sys, warnings
import UnityPy

warnings.filterwarnings('ignore')   # UnityPy warns about the stripped version on every bundle
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
BATTLE_SCENE = -6457283344185968424
PERSISTENT_BOOL = -3770317173157570780
copy = lambda n: re.sub(r'\s*\(\d+\)$', '', n).strip()   # "Bone Goomba (1)" is a Bone Goomba


def scene(path):
    env = UnityPy.load(path)
    objs, T, tr_of, mbs = {}, {}, {}, []
    for o in env.objects:
        objs[o.path_id] = o
        if o.type.name in ('Transform', 'RectTransform'):
            t = o.read()
            T[o.path_id] = t
            tr_of[t.m_GameObject.m_PathID] = o.path_id
        elif o.type.name == 'MonoBehaviour':
            raw = o.get_raw_data()
            # m_GameObject (4 + 8), m_Enabled (1, aligned to 4), then m_Script: its path id at 20.
            if len(raw) >= 28 and struct.unpack_from('<q', raw, 20)[0] in (BATTLE_SCENE, PERSISTENT_BOOL):
                mbs.append((struct.unpack_from('<q', raw, 20)[0], o))
    kids = {}
    for pid, t in T.items():
        kids.setdefault(t.m_Father.m_PathID, []).append(pid)
    go_name = lambda gid: objs[gid].read().m_Name
    tr_name = lambda tid: go_name(T[tid].m_GameObject.m_PathID)
    saved = {}
    for sid, o in mbs:
        if sid == PERSISTENT_BOOL:
            d = o.read_typetree()
            saved[d['m_GameObject']['m_PathID']] = d
    out = []
    for sid, o in mbs:
        if sid != BATTLE_SCENE:
            continue
        d = o.read_typetree()
        gid = d['m_GameObject']['m_PathID']
        waves = []
        for w in d['waves']:
            wo = objs.get(w['m_PathID'])
            if not wo:
                continue
            wg = w['m_PathID'] if wo.type.name == 'GameObject' else wo.read_typetree()['m_GameObject']['m_PathID']
            waves.append(sorted(copy(tr_name(k)) for k in kids.get(tr_of[wg], [])))
        parent = T[tr_of[gid]].m_Father.m_PathID
        pb = saved.get(gid)
        out.append({
            'name': (tr_name(parent) + '/' if parent in T else '') + go_name(gid),
            'pd': [x for x in (d['setPDBoolOnEnd'], d['setExtraPDBoolOnEnd']) if x],
            'bool': None if not pb or pb['dontSave'] else (pb['itemData']['ID'] or go_name(gid)),
            'waves': waves,
        })
    return out


def main(game, only):
    folder = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64', 'scenes_scenes_scenes')
    names = only or sorted(f[:-7] for f in os.listdir(folder) if f.endswith('.bundle'))
    n = 0
    for name in names:
        for b in scene(os.path.join(folder, name + '.bundle')):
            n += 1
            saves = ', '.join([f'playerData {x}' for x in b['pd']] + ([f'sceneData "{b["bool"]}"'] if b['bool'] else [])) or 'nothing'
            print(f'{name}  {b["name"]}  (saves {saves})')
            for i, w in enumerate(b['waves'], 1):
                print(f'    {i}. {", ".join(w)}')
    print(f'\n{n} arenas in {len(names)} scenes')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1], [s.lower() for s in sys.argv[2:]])
