"""tools/extract-benches.py — which bench each bench room has, from the game's own files, into
js/benches.js: Your game's card sits Hornet on the bench the save rests at (js/app-home.js).
Needs the game installed and UnityPy, as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-benches.py "<Steam>/steamapps/common/Hollow Knight Silksong"
after `npm run art` (it measures the seat on the pictures in assets/benches/). Re-run after a
patch that adds or moves benches; it takes a while (it opens every scene and every bundle once).

Where it is (read on 28-Sep-2026, patch 1.0.30000): each scene is a bundle of its own in
scenes_scenes_scenes/ (tools/extract-graph.py), and a bench is a GameObject named RestBench (or
«RestBench (1)», «RestBench Festival»…) whose SpriteRenderer draws it: `bone_bench_basic` in
Bone_04, `weaver_bench` in the Abyss. The sprite sits in another bundle (an atlas), named by its
CAB id, so every non-scene bundle is indexed first. In some rooms the RestBench draws nothing and
the bench is loose sprites around it (the Flea Caravan's two, the Cogwork retractor's five, the
Songclave's back and front): those rooms are named by hand in SCENE, from the sprites they hold.

The pictures are the wiki's (Bench_SS_<Style>.png on «Bench (Silksong)», tools/fetch-art.js):
the game's own art, with the benches of several pieces put together. STYLE says which one each
game sprite is, matched by eye on both (28-Sep-2026). A room whose sprite isn't in STYLE, or
that's in neither table, is left out, and the card draws Bone Bottom's, the first bench. Not told
apart: a bench's states (Songclave's and the Huntress's broken in Act 3, Choral Chambers' and
High Halls' cloth, the Slab's snow), each room keeps the one it's drawn with. """
import json, os, sys, warnings
import UnityPy
from PIL import Image

warnings.filterwarnings('ignore')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'js', 'benches.js')
ART = os.path.join(ROOT, 'assets', 'benches')

# The game's sprite → the wiki's picture (assets/benches/<id>.png).
STYLE = {
    'bone_bench_basic': 'bone-bottom', 'bone_bench_basic_repaired': 'bone-bottom-repaired',
    'bonebench_hornet': 'ruined-chapel', 'ant_bench_basic': 'ant', 'bed_depress0000': 'bellhome',
    'belltown_bench': 'bellhart', 'bell_bench_appear0008': 'toll', 'bell_bench_swamp_collapse': 'toll',
    'Coral_structure_0008_8_bench': 'coral-tower', 'coral_crust_bench': 'coral', 'cradle_rock_bench': 'cradle',
    'diving_bell_interior__0004_1': 'diving-bell', 'diving_bell_interior__0004_1_broken': 'diving-bell-broken',
    'greymoor_standard_bench': 'wisp-thicket', 'hang_bench_0000_1': 'high-halls', 'hang_bench_0000_1_arborium': 'memorium',
    'jail_extra_0004_cage_bench': 'jail', 'library_rest_bench_0000_1': 'whispering-vaults',
    'moss_table_break_0002_table_02_bench': 'mosshome', 'phantom_organ_0008_1': 'organ',
    'pilgrims_rest__0007_8': 'pilgrims-rest', 'pneumatic_tube_extra_thin_pipe_0001_1_angle_bench': 'terminus',
    'Room_Umbrella_0008_16': 'umbrella', 'sc_bench_front': 'songclave', 'sc_fountain_bench': 'choral-chambers',
    'swamp_bench_single': 'bilewater', 'understore_bench': 'toll-underworks', 'understore_bench_peak': 'mount-fay',
    'understore_bench_simple': 'deep-docks', 'ward_long_bench_0000_1': 'whiteward',
    'weaver_bench': 'weavenest', 'weaver_bench_front': 'weavenest', 'weaver_bench_moss': 'weavenest-moss',
}
# Rooms whose RestBench draws nothing: the bench their loose sprites make.
SCENE = {
    'aqueduct_05_caravan': 'caravan', 'aqueduct_05_festival': 'caravan', 'greymoor_08_caravan': 'caravan',
    'coral_judge_arena': 'caravan', 'crawl_08': 'caravan', 'cog_bench': 'cog-retractor', 'halfway_01': 'halfway-home',
    'room_huntress': 'huntress', 'room_pinstress': 'pinstress', 'shadow_18': 'bilehaven', 'song_enclave': 'songclave',
    'sprintmaster_cave': 'sprintmaster',
}
# Where the seat is, in the picture's rows, when the rule below finds the back's top instead.
SEAT = {'mount-fay': 53, 'toll-underworks': 50}


def seat_of(img):
    """The seat: the first row at least 80% as wide as the widest (the plank Hornet sits on)."""
    a = img.getchannel('A')
    w, h = img.size
    rows = [sum(1 for x in range(w) if a.getpixel((x, y)) > 128) for y in range(h)]
    top = max(rows)
    return next(y for y in range(h) if rows[y] >= 0.8 * top)


def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    scenes_dir = os.path.join(aa, 'scenes_scenes_scenes')
    cab = {}   # CAB id → the bundle that holds it
    for dirpath, _, files in os.walk(aa):
        if dirpath.startswith(scenes_dir):
            continue
        for f in files:
            if not f.endswith('.bundle'):
                continue
            try:
                env = UnityPy.load(os.path.join(dirpath, f))
            except Exception:
                continue
            for bf in env.files.values():
                for k in getattr(bf, 'files', {}):
                    if not k.endswith(('.resS', '.resource')):
                        cab[k] = os.path.join(dirpath, f)
    loaded = {}

    def sprite(ptr):
        try:
            return ptr.read().m_Name
        except Exception:
            pass
        try:
            where = cab.get(ptr.assetsfile.externals[ptr.m_FileID - 1].path.split('/')[-1])
        except Exception:
            return None
        if not where:
            return None
        if where not in loaded:
            loaded[where] = UnityPy.load(where)
        for bf in loaded[where].files.values():
            for sf in getattr(bf, 'files', {}).values():
                objs = getattr(sf, 'objects', None)
                if objs and ptr.m_PathID in objs:
                    return objs[ptr.m_PathID].read().m_Name
        return None

    scenes, unknown = {}, {}
    for f in sorted(os.listdir(scenes_dir)):
        if not f.endswith('.bundle'):
            continue
        name = f[:-len('.bundle')]
        try:
            env = UnityPy.load(os.path.join(scenes_dir, f))
        except Exception:
            continue
        found = []
        for o in env.objects:
            if o.type.name != 'GameObject':
                continue
            try:
                go = o.read()
            except Exception:
                continue
            if not go.m_Name.startswith('RestBench'):
                continue
            for c in go.m_Components:
                try:
                    comp = c.read()
                except Exception:
                    continue
                if comp.object_reader.type.name == 'SpriteRenderer':
                    found.append(sprite(comp.m_Sprite))
        if not found and name not in SCENE:
            continue
        style = next((STYLE[s] for s in found if s in STYLE), None) or SCENE.get(name)
        if style:
            scenes[name] = style
        else:
            unknown[name] = [s for s in found if s]

    art = {}
    for style in sorted(set(scenes.values())):
        p = os.path.join(ART, style + '.png')
        if not os.path.exists(p):
            sys.exit(f'assets/benches/{style}.png is missing: npm run art first')
        img = Image.open(p).convert('RGBA')
        art[style] = [img.width, img.height, SEAT.get(style, seat_of(img))]
    data = json.dumps({'scenes': scenes, 'art': art}, separators=(',', ':'))
    open(OUT, 'w').write(
        "/* js/benches.js — the bench in each bench room, for Your game's card (js/app-home.js).\n"
        "   GENERATED by tools/extract-benches.py from the game's own files (each scene's RestBench\n"
        "   sprite): not edited by hand. scenes: the room (lower case, as the scene bundles are named)\n"
        "   → its picture in assets/benches/; art: each picture's [width, height, the seat's row]. */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.benches = {data};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.benches;\n})();\n")
    print(f'{len(scenes)} bench rooms, {len(art)} pictures → js/benches.js')
    for name, sprites in sorted(unknown.items()):
        print(f'  not drawn: {name} {sprites or "(its RestBench draws nothing)"}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-benches.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
