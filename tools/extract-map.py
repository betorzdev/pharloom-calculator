"""tools/extract-map.py — Pharloom's map from the game's own files (phase 6's spike, 27-Sep-2026).
Needs the game installed and UnityPy (no pip on the author's machine: uv, in an env of its own):
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-map.py "<Silksong>/Hollow Knight Silksong_Data/StreamingAssets/aa/StandaloneLinux64" out.png

What the spike found (design/00-study.md §4.7):
  · maps_assets_all.bundle holds the map as Hollow Knight's Game_Map did: a tree under
    Game_Map_Hornet, one child per area (Bone, Crawl, Dock, Greymoor…) and one GameObject per
    room named after its scene (Abyss_01…), with its Transform and a SpriteRenderer whose colour
    is the area's tint; beside it, "Wide Map", the world map's per-area pieces.
  · the rooms' sprites are in atlases_assets_assets/sprites/_atlases/hornet_map.spriteatlas.bundle
    (a 4096² BC7 texture, 1,199 sprites named by room) and hornet_map_patch (5 patches).
  · Unity 6 strips its version from the bundles: UnityPy needs it set by hand (6000.0.50f1,
    read from globalgamemanagers).
This spike draws every enabled room of Game_Map_Hornet at its place, tinted: it is the game's
map. Left for phase 6: the icons (drawn here all at once and too large), rooms with two states
(Abyss_03_bell and _repaired) and which one a game shows, the scale and the rooms' scene names
joined to js/collectibles.js's pieces, and what the site publishes (© Team Cherry, as the
sprites). The output is Team Cherry's art: it isn't committed until that's decided. """
import sys, UnityPy
from PIL import Image
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
B = sys.argv[1]; OUT = sys.argv[2]
env = UnityPy.load(B + '/maps_assets_all.bundle', B + '/atlases_assets_assets/sprites/_atlases/hornet_map.spriteatlas.bundle',
                   B + '/atlases_assets_assets/sprites/_atlases/hornet_map_patch.spriteatlas.bundle')
T = {}
for o in env.objects:
    if o.type.name == 'Transform':
        t = o.read(); T[o.path_id] = t
def world(t):
    x, y, sx, sy = 0.0, 0.0, 1.0, 1.0
    chain = []
    while t is not None:
        chain.append(t)
        p = t.m_Father.m_PathID
        t = T.get(p) if p else None
    for t in reversed(chain):   # root first
        lp, ls = t.m_LocalPosition, t.m_LocalScale
        x, y = x + lp.x * sx, y + lp.y * sy
        sx, sy = sx * ls.x, sy * ls.y
    return x, y, sx, sy, chain[-1].m_GameObject.read().m_Name
items = []
for o in env.objects:
    if o.type.name != 'SpriteRenderer': continue
    sr = o.read()
    if not sr.m_Enabled: continue
    try:
        sp = sr.m_Sprite.read()
    except Exception:
        continue
    go = sr.m_GameObject.read()
    tr = [c for c in go.m_Components if (getattr(c, 'component', c)).deref().type.name == 'Transform']
    t = (getattr(tr[0], 'component', tr[0])).deref().read()
    x, y, sx, sy, root = world(t)
    if root != 'Game_Map_Hornet' or not go.m_IsActive: continue
    c = sr.m_Color
    items.append((x, y, sx, sy, sp, (c.r, c.g, c.b, c.a), go.m_Name))
print(len(items), 'sprites placed')
ppu = items[0][4].m_PixelsToUnits
xs = sorted(i[0] for i in items); ys = sorted(i[1] for i in items)
items = [i for i in items if xs[5] - 30 <= i[0] <= xs[-6] + 30]
xs = [i[0] for i in items]; ys = [i[1] for i in items]
print('outliers dropped, now', len(items))
S = 48  # pixels per unit on the test image
minx, maxx, miny, maxy = min(xs) - 12, max(xs) + 12, min(ys) - 8, max(ys) + 8
W, H = int((maxx - minx) * S), int((maxy - miny) * S)
print('units', round(maxx - minx), 'x', round(maxy - miny), '→', W, 'x', H)
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 255))
for x, y, sx, sy, sp, col, name in items:
    try:
        im = sp.image.convert('RGBA')
    except Exception:
        continue
    w, h = im.size
    k = S / sp.m_PixelsToUnits
    im = im.resize((max(1, int(w * k * abs(sx))), max(1, int(h * k * abs(sy)))))
    if sx < 0: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    r, g, b, a = im.split()
    tint = Image.merge('RGBA', (r.point(lambda v: int(v * col[0])), g.point(lambda v: int(v * col[1])), b.point(lambda v: int(v * col[2])), a.point(lambda v: int(v * col[3]))))
    pv = sp.m_Pivot
    px = int((x - minx) * S - tint.width * pv.x); py = int((maxy - y) * S - tint.height * (1 - pv.y))
    canvas.alpha_composite(tint, (max(0, px), max(0, py)))
canvas.convert('RGB').save(OUT.replace('.png', '-full.png'))
canvas.thumbnail((2400, 2400))
canvas.convert('RGB').save(OUT)
