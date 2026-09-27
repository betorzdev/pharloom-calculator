"""tools/extract-map.py — Pharloom's map from the game's own files: the rooms drawn as the game's
map screen draws them, into assets/map/rooms.webp, and where each room is on it, into js/map.js.
Needs the game installed and UnityPy (no pip on the author's machine: uv, in an env of its own):
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-map.py "<Steam>/steamapps/common/Hollow Knight Silksong"
The image is Team Cherry's art, published as the Hollow Knight site publishes its map (a fan
project; the colophon says so). Re-run it after a patch that touches the map.

Where it is (found on 27-Sep-2026, design/00-study.md §4.7):
  · maps_assets_all.bundle (Addressables, StreamingAssets/aa/StandaloneLinux64/): a tree under
    Game_Map_Hornet, one child per area (Bone, Crawl, Dock…), and under each area one GameObject
    per room named after its scene, with its Transform, a SpriteRenderer tinted with the area's
    colour and a component whose fullSprite is the room as drawn once the area's map is bought
    (the renderer holds the rough sketch until then); the icons (pins, arrows, markers) are
    deeper in the tree or in groups of their own, and aren't drawn: the site draws its own.
  · the sprites are in atlases_assets_assets/sprites/_atlases/hornet_map.spriteatlas.bundle (a
    4096² BC7 texture, 1,199 sprites) and hornet_map_patch.spriteatlas.bundle.
  · Unity 6 strips its version from the bundles: UnityPy needs it set (6000.0.50f1, the one
    globalgamemanagers carries). """
import json, os, sys
import UnityPy
from PIL import Image

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
PPU_OUT = 48            # pixels per world unit on the site's image (the whole map is ~73 × 54 units)
NOT_AREAS = {'Pan Audio Loop', 'Main Quest Pins', 'Compass Icon', 'Shade Pos', 'Map Markers', 'Flea Tracker Markers'}
ICONS = ('pin_', 'quest_map_icon', 'Map_Arrow')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')


def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    atl = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    env = UnityPy.load(os.path.join(aa, 'maps_assets_all.bundle'), os.path.join(atl, 'hornet_map.spriteatlas.bundle'),
                       os.path.join(atl, 'hornet_map_patch.spriteatlas.bundle'))
    T = {o.path_id: o.read() for o in env.objects if o.type.name == 'Transform'}

    def chain(t):
        out = []
        while t is not None:
            out.append(t)
            f = t.m_Father.m_PathID
            t = T.get(f) if f else None
        return list(reversed(out))   # root first

    def world(ts):
        x = y = 0.0
        sx = sy = 1.0
        for t in ts:
            lp, ls = t.m_LocalPosition, t.m_LocalScale
            x, y = x + lp.x * sx, y + lp.y * sy
            sx, sy = sx * ls.x, sy * ls.y
        return x, y, sx, sy

    rooms = []
    for o in env.objects:
        if o.type.name != 'GameObject':
            continue
        go = o.read()
        comps = [(getattr(c, 'component', c)).deref() for c in go.m_Components]
        tr = next((c.read() for c in comps if c.type.name == 'Transform'), None)
        sr = next((c.read() for c in comps if c.type.name == 'SpriteRenderer'), None)
        if tr is None or sr is None:
            continue
        ts = chain(tr)
        names = [t.m_GameObject.read().m_Name for t in ts]
        # A room: Game_Map_Hornet / <area> / <room>.
        if len(names) != 3 or names[0] != 'Game_Map_Hornet' or names[1] in NOT_AREAS:
            continue
        sprite = None
        for c in comps:   # the map component's fullSprite, when it has one
            if c.type.name == 'MonoBehaviour':
                try:
                    tree = c.read_typetree()
                except Exception:
                    continue
                full = tree.get('fullSprite')
                if full and full.get('m_PathID'):
                    try:
                        sprite = sr.m_Sprite.assets_file.objects[full['m_PathID']].read() if full['m_FileID'] == 0 else None
                    except Exception:
                        sprite = None
                    if sprite is None:
                        for so in env.objects:
                            if so.type.name == 'Sprite' and so.path_id == full['m_PathID']:
                                sprite = so.read()
                                break
        if sprite is None:
            try:
                sprite = sr.m_Sprite.read()
            except Exception:
                sprite = None   # a room with no drawing of its own (Halfway_01): kept as a point
        if sprite is not None and sprite.m_Name.startswith(ICONS):
            continue
        x, y, sx, sy = world(ts)
        c = sr.m_Color
        rooms.append({'scene': names[2], 'area': names[1], 'x': x, 'y': y, 'sx': sx, 'sy': sy, 'sprite': sprite,
                      'color': (c.r, c.g, c.b, c.a), 'on': bool(sr.m_Enabled and go.m_IsActive)})

    # The extent, without the few objects parked far from the map (an editor's leftovers).
    xs = sorted(r['x'] for r in rooms)
    rooms = [r for r in rooms if xs[5] - 30 <= r['x'] <= xs[-6] + 30]
    placed, boxes, points = [], {}, []
    for r in rooms:
        if r['sprite'] is None:
            points.append(r)
            continue
        try:
            im = r['sprite'].image.convert('RGBA')
        except Exception:
            continue
        k = PPU_OUT / r['sprite'].m_PixelsToUnits
        w, h = max(1, round(im.width * k * abs(r['sx']))), max(1, round(im.height * k * abs(r['sy'])))
        im = im.resize((w, h), Image.LANCZOS)
        if r['sx'] < 0:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        cr, cg, cb, ca = r['color']
        ch = im.split()
        im = Image.merge('RGBA', tuple(band.point(lambda v, m=m: int(v * m)) for band, m in zip(ch, (cr, cg, cb, ca))))
        pv = r['sprite'].m_Pivot
        placed.append((r, im, pv))
    minx = min(r['x'] for r, im, pv in placed) - 4
    maxx = max(r['x'] for r, im, pv in placed) + 4
    miny = min(r['y'] for r, im, pv in placed) - 4
    maxy = max(r['y'] for r, im, pv in placed) + 4
    W, H = round((maxx - minx) * PPU_OUT), round((maxy - miny) * PPU_OUT)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for r, im, pv in placed:
        px = round((r['x'] - minx) * PPU_OUT - im.width * pv.x)
        py = round((maxy - r['y']) * PPU_OUT - im.height * (1 - pv.y))
        if r['on']:
            canvas.alpha_composite(im, (max(0, px), max(0, py)))
        boxes.setdefault(r['scene'], [px, py, im.width, im.height, r['area']])
    for r in points:
        boxes.setdefault(r['scene'], [round((r['x'] - minx) * PPU_OUT), round((maxy - r['y']) * PPU_OUT), 0, 0, r['area']])

    out = os.path.join(ROOT, 'assets', 'map')
    os.makedirs(out, exist_ok=True)
    canvas.save(os.path.join(out, 'rooms.webp'), 'WEBP', quality=85, method=6)
    data = {'W': W, 'H': H, 'PPU': PPU_OUT, 'ROOMS': dict(sorted(boxes.items()))}
    src = ("/* js/map.js — where each room is on assets/map/rooms.webp, by its scene name.\n"
           "   GENERATED by tools/extract-map.py from the game's own files (the map screen's tree):\n"
           "   not edited by hand. W, H: the image's size; PPU: its pixels per world unit;\n"
           "   ROOMS: scene → [x, y, w, h, area] in the image's pixels (the area as the game names its\n"
           "   branch of the map: Bone, Crawl, Dock…); w = h = 0 for a room with no drawing of its own,\n"
           "   a point where the game places it. */\n"
           "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
           f"  SS.map = {json.dumps(data, separators=(',', ':'))};\n"
           "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.map;\n})();\n")
    open(os.path.join(ROOT, 'js', 'map.js'), 'w').write(src)
    print(f'{len(boxes)} rooms, {W} × {H} px → assets/map/rooms.webp '
          f'({os.path.getsize(os.path.join(out, "rooms.webp")) // 1024} KB), js/map.js')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-map.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
