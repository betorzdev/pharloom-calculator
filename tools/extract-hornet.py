"""tools/extract-hornet.py: the strips of the Hornet who walks the page (js/app-hornet.js, css .hn),
from the game's own sprites, into assets/hornet/. Needs the game installed and UnityPy (as
tools/extract-map.py, its header says how):
    /tmp/unitypy/bin/python tools/extract-hornet.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Team Cherry's art, shown as the rest of the site's sprites are (a fan project; the colophon says so).
Re-run it after a patch that touches Hornet's animations.

Where they are (found on 28-Sep-2026, patch 1.0.30000):
  · Hornet is a tk2d sprite. Her frames are the "Knight" sprite collection (the name is Hollow
    Knight's) in herocollections_assets_shared.bundle: 1,828 definitions over four 4096² atlases,
    each with its quad in world units (64 texels a unit), its UVs and whether the atlas holds it
    turned (flipped: the region is the frame transposed, rotated a quarter and mirrored).
  · Her animations are a tk2dSpriteAnimation in herodynamic_assets_all.bundle (535 clips): each
    clip its fps, its wrap mode (0 loops the whole clip, 1 loops from its loopStart on) and its
    frames as ids into that collection. The wiki has no strip
    of her running (its Hornet_walk_animation.gif is a capture on an opaque grey, and turns).
The strips, in cells of CELL (half the game's size), feet on the cell's FLOOR, facing left as the
game draws her, one frame per cell from left to right, registered as the game registers them
(each quad's own offset from her origin):
    run.png    the Run clip's loop: ten frames, two strides, at 15 a second (--dur-step).
    sit.png    one cell: the Sit clip's last frame, sitting on a bench, as she rests.
    stand.png  one cell: the Idle clip's first frame.
The wiki's stills (tools/fetch-art.js: idle.png, resting.png, corpse.png) stay for the pictures
that aren't her mark. Saved with a 256-colour palette and its alpha, as fetch-knight.js did on the
Hollow Knight site. """
import os, sys, warnings
import UnityPy
from PIL import Image

warnings.filterwarnings('ignore', module='UnityPy')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
PPU = 64                 # texels per world unit in the collection
SCALE = 0.5              # the strips at half the game's size: ~108 px tall standing, sharp at 2× on the bar
CELL = (120, 120)        # a cell, in the strip's pixels
FLOOR = 116              # her feet, in the cell (y); she stands on it, and sits on it
CX = 62                  # her origin, in the cell (x): the game's pivot, the middle of her body
CLIPS = {'run.png': ('Run', 'loop'), 'sit.png': ('Sit', 'last'), 'stand.png': ('Idle', 'first')}

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'hornet')


def frame(defn, textures):
    """A definition → (its image, upright, at the game's size; its quad's left and top, in world
    units from her origin)."""
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
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    env = UnityPy.load(os.path.join(aa, 'herocollections_assets_shared.bundle'))
    by_id = {o.path_id: o for o in env.objects}
    coll = None
    for o in env.objects:
        if o.type.name == 'MonoBehaviour':
            t = o.read_typetree()
            if t.get('spriteCollectionName') == 'Knight':
                coll, coll_id = t, o.path_id
    if not coll:
        raise SystemExit('No "Knight" sprite collection in herocollections_assets_shared.bundle')
    textures = [by_id[x['m_PathID']].read().image for x in coll['textures']]
    defs = coll['spriteDefinitions']

    # Her animation library: the one whose Run clip draws from that collection.
    lib = None
    for o in UnityPy.load(os.path.join(aa, 'herodynamic_assets_all.bundle')).objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            t = o.read_typetree()
        except Exception:
            continue
        clips = {c.get('name'): c for c in t.get('clips') or [] if isinstance(c, dict)}
        run = clips.get('Run')
        if run and all(f['spriteCollection']['m_PathID'] == coll_id for f in run['frames']):
            lib = clips
    if not lib:
        raise SystemExit("No animation library draws Hornet's Run from that collection")

    os.makedirs(OUT, exist_ok=True)
    for out, (name, which) in CLIPS.items():
        clip = lib[name]
        ids = [f['spriteId'] for f in clip['frames']]
        if which == 'loop':
            ids = ids[clip['loopStart']:] if clip['wrapMode'] == 1 else ids   # a LoopSection loops its tail
        else:
            ids = ids[-1:] if which == 'last' else ids[:1]
        frames = [frame(defs[i], textures) for i in ids]
        # The floor: the lowest edge of the clip's frames, so that she stands (or sits) on it.
        bottom = min(top - im.height / PPU for im, _, top in frames)
        strip = Image.new('RGBA', (CELL[0] * len(frames), CELL[1]), (0, 0, 0, 0))
        for i, (im, left, top) in enumerate(frames):
            small = im.resize((max(1, round(im.width * SCALE)), max(1, round(im.height * SCALE))), Image.Resampling.LANCZOS)
            x = CX + round(left * PPU * SCALE)
            y = FLOOR - round((top - bottom) * PPU * SCALE)
            if x < 0 or y < 0 or x + small.width > CELL[0] or y + small.height > CELL[1]:
                raise ValueError(f'{out}: frame {i} ({small.size} at {x}, {y}) out of its {CELL} cell')
            strip.alpha_composite(small, (i * CELL[0] + x, y))
        strip.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(os.path.join(OUT, out), optimize=True)
        print(f'  assets/hornet/{out}  {len(frames)} cell(s)  ← {name} ({clip["fps"]:g} fps)')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
