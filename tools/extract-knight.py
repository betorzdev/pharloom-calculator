"""tools/extract-knight.py: the Knight's moves, from Hollow Knight's own sprites, for the Knight who
stands on the sister site's link (js/app-sister.js; ../hollownest-calculator): writes assets/knight/
and js/knight-moves.js. The sibling's tools/extract-hornet.py, the other way round: there Hornet
points to this site, here the Knight points to that one. Needs Hollow Knight installed and UnityPy
with TypeTreeGeneratorAPI (its MonoBehaviours carry no type trees, so they're read from the game's
own Managed/*.dll), in the venv tools/extract-map.py's header makes:
    uv pip install --python /tmp/unitypy/bin/python TypeTreeGeneratorAPI
    /tmp/unitypy/bin/python tools/extract-knight.py "<Steam>/steamapps/common/Hollow Knight"
Team Cherry's art, shown as the rest of the site's sprites are (a fan project; the colophon says so).
Re-run it after a patch that touches the Knight's animations.

Where they are (found on 13-Oct-2026, the Steam build with hollow_knight_Data/):
  · The Knight is a tk2d sprite. His frames are the "Knight" sprite collection in resources.assets
    (891 definitions), each with its quad in world units (64 texels a unit), its UVs and whether
    the atlas holds it turned (flipped: the region is the frame transposed).
  · His animations are the tk2dSpriteAnimation next to it (214 clips): each clip its fps, its wrap
    mode (1 loops from its loopStart on) and its frames as ids into that collection.

Each strip is one row of equal cells, one frame per cell, facing left as the game draws him, at
SCALE of the game's size (shown at half that on the page: sharp at 2×). Every frame keeps the
game's registration, so all the strips share one anchor: his pivot, at (px, py) in each cell.
js/knight-moves.js says, per move: its frames, fps, cell size, pivot and loopStart; and FLOOR, how
far below the pivot his feet are when he stands (the Idle clip's lowest edge).
"""
import json, os, sys, warnings
import UnityPy
from UnityPy.helpers.TypeTreeGenerator import TypeTreeGenerator
from PIL import Image

warnings.filterwarnings('ignore', module='UnityPy')
PPU = 64          # texels per world unit in the collection
SCALE = 0.6       # the strips' size against the game's: ~76 px standing, shown at ~38 (Hornet's, there)
PAD = 2           # transparent margin round each cell, so that resampling doesn't bleed

# The page's name for each move → the game's clip.
MOVES = {
    'idle': 'Idle',                     # standing, breathing
    'wind': 'Idle Wind',                # his cloak in the wind
    'look-up': 'LookUp',
    'look-up-end': 'LookUpToIdle',
    'map-open': 'Map Open',             # the map out of his cloak, Cornifer's quill
    'map': 'Map Idle',
    'map-away': 'Map Away',
    'focus': 'Focus',                   # gathering soul
    'focus-get': 'Focus Get',
    'focus-end': 'Focus End',
}

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'assets', 'knight')


def frame(defn, textures):
    """A definition → its image, upright at the game's size, and its quad's left and top, in world
    units from his pivot."""
    tex = textures[defn['materialId']]
    W, H = tex.size
    us = [p['x'] for p in defn['uvs']]; vs = [p['y'] for p in defn['uvs']]
    im = tex.crop((round(min(us) * W), round((1 - max(vs)) * H), round(max(us) * W), round((1 - min(vs)) * H)))
    if defn['flipped']:
        im = im.transpose(Image.Transpose.TRANSVERSE)
    xs = [p['x'] for p in defn['positions']]; ys = [p['y'] for p in defn['positions']]
    size = (round((max(xs) - min(xs)) * PPU), round((max(ys) - min(ys)) * PPU))
    if im.size != size:
        raise ValueError(f"{defn['name']}: {im.size} in the atlas, {size} on screen")
    return im, min(xs), max(ys)


def main(game):
    env = UnityPy.load(os.path.join(game, 'hollow_knight_Data', 'resources.assets'))
    gen = TypeTreeGenerator(env.objects[0].assets_file.unity_version)
    gen.load_local_game(game)
    env.typetree_generator = gen
    by_id = {o.path_id: o for o in env.objects}
    coll = coll_id = lib = None
    monos = []
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            t = o.read_typetree()
        except Exception:
            continue
        monos.append(t)
        if t.get('spriteCollectionName') == 'Knight':
            coll, coll_id = t, o.path_id
    if not coll:
        raise SystemExit('No "Knight" sprite collection in resources.assets')
    # His animation library: the one whose Run clip draws from that collection.
    for t in monos:
        clips = {c.get('name'): c for c in t.get('clips') or [] if isinstance(c, dict)}
        run = clips.get('Run')
        if run and run['frames'] and all(f['spriteCollection']['m_PathID'] == coll_id for f in run['frames']):
            lib = clips
    if not lib:
        raise SystemExit("No animation library draws the Knight's Run from that collection")
    textures = [by_id[x['m_PathID']].read().image for x in coll['textures']]
    defs = coll['spriteDefinitions']

    os.makedirs(OUT, exist_ok=True)
    moves, floor = {}, None
    for name, clip_name in MOVES.items():
        clip = lib[clip_name]
        frames = [frame(defs[f['spriteId']], textures) for f in clip['frames'] if f['spriteCollection']['m_PathID'] == coll_id]
        # The cell: every frame's quad, in world units from the pivot.
        L = min(left for _, left, _ in frames); R = max(left + im.width / PPU for im, left, _ in frames)
        T = max(top for _, _, top in frames); B = min(top - im.height / PPU for im, _, top in frames)
        px = round(-L * PPU * SCALE) + PAD; py = round(T * PPU * SCALE) + PAD
        cw = round((R - L) * PPU * SCALE) + 2 * PAD; ch = round((T - B) * PPU * SCALE) + 2 * PAD
        strip = Image.new('RGBA', (cw * len(frames), ch), (0, 0, 0, 0))
        for i, (im, left, top) in enumerate(frames):
            small = im.resize((max(1, round(im.width * SCALE)), max(1, round(im.height * SCALE))), Image.Resampling.LANCZOS)
            strip.alpha_composite(small, (i * cw + px + round(left * PPU * SCALE), py - round(top * PPU * SCALE)))
        strip.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(os.path.join(OUT, name + '.png'), optimize=True)
        loop = clip['loopStart'] if clip['wrapMode'] == 1 else 0
        moves[name] = {'n': len(frames), 'fps': round(clip['fps'], 2), 'w': cw, 'h': ch, 'px': px, 'py': py, 'loop': loop}
        if name == 'idle':
            floor = round(-B * PPU * SCALE)
        print(f'  assets/knight/{name}.png  {len(frames)} × {cw}×{ch}  ← {clip_name} ({clip["fps"]:g} fps)')

    body = json.dumps(moves, indent=None, separators=(', ', ': '))
    body = body.replace('}, "', '},\n    "').replace('{"idle"', '{\n    "idle"')
    with open(os.path.join(ROOT, 'js', 'knight-moves.js'), 'w') as f:
        f.write('/* Generated by tools/extract-knight.py from Hollow Knight\'s own sprites: do not edit by hand.\n'
                '   Each move: assets/knight/<name>.png, n cells of w × h px (at 0.6 of the game\'s size, shown at\n'
                '   half), fps, his pivot at (px, py) in each cell, and loopStart; FLOOR: his feet below the pivot\n'
                '   when standing. */\n'
                f'globalThis.SS = globalThis.SS || {{}};\nSS.KNIGHT = {{\n  FLOOR: {floor},\n  MOVES: {body[:-1]}\n  }}\n}};\n')
    print(f'  js/knight-moves.js  {len(moves)} moves, FLOOR {floor}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
