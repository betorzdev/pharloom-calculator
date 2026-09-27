"""tools/measure-palette.py — measures Silksong's colours on the wiki's sprites, for
design/02-silksong.md (npm run palette). Downloads each file once into kb/data/art/ (not
committed: Team Cherry's art) and prints, per sprite, its opaque pixels quantised to a few
colours with their share, hue, saturation and value. Needs Pillow.

    python3 tools/measure-palette.py            every sprite below
    python3 tools/measure-palette.py "SS Mask.png"   one file, by its wiki name
    python3 tools/measure-palette.py --areas         the areas' own maps only
"""
import colorsys, os, sys, time, urllib.parse, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, "..", "kb", "data", "art")
UA = {"User-Agent": "pharloom-calculator/1.0 (personal project; tools/measure-palette.py)"}

# What each sprite answers (design/00-study.md §6).
SPRITES = [
    # The HUD
    ("SS Mask.png", "a mask, the health"),
    ("SS Mask Lifeblood.png", "the Plasmium mask"),
    ("Silk.png", "silk, the resource"),
    ("Silk Spool HUD Complete Filled.png", "the spool, full"),
    ("Silk Spool HUD Complete.png", "the spool, empty"),
    ("Hunter Crest HUD Filled.png", "the Crest wheel on the HUD"),
    ("Rosaries.png", "rosaries, the money"),
    ("Shell Shards.png", "shell shards"),
    # The Crest screen's pieces
    ("Red Tools Icon.png", "a red Tool slot"),
    ("Red Tools Icon Locked.png", "a red slot, locked"),
    ("Blue Tools Icon.png", "a blue Tool slot"),
    ("Yellow Tools Icon.png", "a yellow Tool slot"),
    ("Silk Skills Icon.png", "a Skill slot"),
    ("Hunter Crest Inventory.png", "a Crest in the inventory"),
    ("Vesticrest.png", "the Vesticrest"),
    ("SS Crests Menu.png", "the Crest screen (screenshot): the selection, the frame"),
    # The map
    ("Silksong Small Map Clean.png", "the world map, clean: the tints"),
    ("Silksong Small Map Ruin Clean.png", "the world map in Act 3"),
]

def fetch(name):
    os.makedirs(ART, exist_ok=True)
    path = os.path.join(ART, name.replace(" ", "_"))
    if not os.path.exists(path):
        url = "https://hollowknight.wiki/w/Special:FilePath/" + urllib.parse.quote(name.replace(" ", "_"))
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
            open(path, "wb").write(r.read())
        time.sleep(0.3)
    return path

def hexc(c):
    return "#%02X%02X%02X" % tuple(c[:3])

def measure(path, colours=8, min_alpha=200, skip_dark=0.0):
    im = Image.open(path).convert("RGBA")
    if max(im.size) > 1600:
        im.thumbnail((1600, 1600))
    px = [p for p in (im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata()) if p[3] >= min_alpha]
    if skip_dark:
        px = [p for p in px if max(p[:3]) / 255 > skip_dark]
    if not px:
        return []
    flat = Image.new("RGB", (len(px), 1))
    flat.putdata([p[:3] for p in px])
    q = flat.quantize(colors=colours, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    counts = sorted(q.getcolors(), reverse=True)
    out = []
    for n, i in counts:
        rgb = pal[i * 3:i * 3 + 3]
        h, s, v = colorsys.rgb_to_hsv(*(x / 255 for x in rgb))
        out.append((n / len(px), rgb, round(h * 360), round(s * 100), round(v * 100)))
    return out

# The areas' own maps (<Area> Map Clean.png), for the per-area tints: the page titles of
# Category:Areas (Silksong) (kb/data/raw/), without the "(Silksong)" and the Citadel's hub.
AREAS = ["Bellhart", "Bilewater", "Blasted Steps", "Bone Bottom", "Choral Chambers", "Cogwork Core",
         "Deep Docks", "Far Fields", "Grand Gate", "Greymoor", "High Halls", "Hunter's March",
         "Memorium", "Moss Grotto", "Mosslands", "Mount Fay", "Putrified Ducts", "Red Memory",
         "Sands of Karak", "Shellwood", "Sinner's Road", "The Abyss", "The Cradle", "The Marrow",
         "The Mist", "The Slab", "Underworks", "Verdania", "Weavenest Atla", "Whispering Vaults",
         "Whiteward", "Wisp Thicket", "Wormways"]

def area(name):
    """An area's map: the fill (the commonest drawn colour) and the line (the brightest
    colour with at least 3% of the drawn pixels), as the map screen traces it on black. The
    area's title is written on its map in white: near-white goes, or it'd win as the line."""
    try:
        path = fetch(name + " Map Clean.png")
    except Exception as e:
        print(f"  {name:20s} no map ({e})")
        return
    rows = [r for r in measure(path, colours=10, skip_dark=0.12) if not (r[3] < 6 and r[4] > 88)]
    if not rows:
        print(f"  {name:20s} empty"); return
    fill = rows[0]
    line = max((r for r in rows if r[0] >= 0.03), key=lambda r: r[4])
    f = lambda r: f"{hexc(r[1])} H{r[2]:3d} S{r[3]:3d} V{r[4]:3d}"
    print(f"  {name:20s} fill {f(fill)}   line {f(line)}")

def report(name, what):
    path = fetch(name)
    w, h = Image.open(path).size
    print(f"\n## {name}  ({w}×{h}) — {what}")
    # The maps are mostly black: what matters is the lines and the tints, so black goes.
    big = name.startswith("Silksong") or name.startswith("SS Crests")
    rows = measure(path, colours=14 if big else 6, skip_dark=0.12 if big else 0.0)
    for share, rgb, hh, ss, vv in rows:
        print(f"  {share*100:5.1f}%  {hexc(rgb)}  H{hh:3d} S{ss:3d} V{vv:3d}")

if __name__ == "__main__":
    wanted = sys.argv[1:]
    for name, what in SPRITES:
        if not wanted or name in wanted:
            report(name, what)
    if not wanted or "--areas" in wanted:
        print("\n## The areas' maps")
        for a in AREAS:
            area(a)
