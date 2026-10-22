"""tools/site-icons.py, the site's icons: Hornet's head (assets/hornet/resting.png, the game's own
sprite, cut above the cloak with a sliver of its red collar) on the main menu's ground, the
page's background (--bg in css/tokens.css) with its red light rising from the bottom
(--ember-glow, the same gradient). It writes icon-hornet-48 and icon-hornet-192 (the
<link rel="icon">s; named after the head so a search engine that cached the old mask fetches
them anew), apple-touch-icon (180) and favicon.ico at the root (16, 32 and 48, for whatever asks
for /favicon.ico without reading the page). The head fills four fifths of the square's height: a
phone's home screen and a search result's circle show it small, so it can't be a dot in the
middle. Chosen over the HUD's mask, the Hunter's Crest and the Straight Pin (design/03-redesign.md,
the site icon). Needs Pillow.

    python3 tools/site-icons.py         (npm run site-icons)
"""
import os, re
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FILL = 4 / 5     # the head's height over the square's
COLLAR = 121     # resting.png's rows kept: the head and the top of the cloak
WHITE = 200      # a channel above this is the head's white


def rgb(hexa):
    return tuple(int(hexa[i:i + 2], 16) for i in (0, 2, 4))


def tokens():
    text = open(os.path.join(ROOT, "css", "tokens.css"), encoding="utf-8").read()
    bg = rgb(re.search(r"--bg:\s*#([0-9a-fA-F]{6})", text).group(1))
    glow = re.search(r"--ember-glow:\s*radial-gradient\(ellipse (\d+)% (\d+)% at (\d+)% (\d+)%,(.*?)\);",
                     text)
    rx, ry, cx, cy = (int(glow.group(i)) / 100 for i in range(1, 5))
    stops = [(rgb(m.group(1)), int(m.group(2)) / 100)
             for m in re.finditer(r"#([0-9a-fA-F]{6}) (\d+)%", glow.group(5))]
    return bg, (rx, ry, cx, cy, stops)


def ground(size, bg, glow):
    """--bg with --ember-glow over it, as the browser draws the gradient: an ellipse at (cx, cy)
    whose radii are rx, ry of the box, its colour stops along it, fading to transparent at 1."""
    rx, ry, cx, cy, stops = glow
    stops = stops + [(stops[-1][0], 1.0)]
    out = Image.new("RGB", (size, size))
    px = out.load()
    for y in range(size):
        for x in range(size):
            d = (((x + .5) / size - cx) / rx) ** 2 + (((y + .5) / size - cy) / ry) ** 2
            d = min(1.0, d ** .5)
            for (c0, p0), (c1, p1) in zip(stops, stops[1:]):
                if d <= p1:
                    t = 0 if p1 == p0 else (d - p0) / (p1 - p0)
                    c = [a + (b - a) * t for a, b in zip(c0, c1)]
                    alpha = 1 - t if p1 == 1.0 else 1  # the last stop fades to transparent
                    break
            px[x, y] = tuple(round(g * alpha + b * (1 - alpha)) for g, b in zip(c, bg))
    return out.convert("RGBA")


def hornet():
    im = Image.open(os.path.join(ROOT, "assets", "hornet", "resting.png")).convert("RGBA")
    art = im.crop((0, 0, im.width, COLLAR))
    px = art.load()
    # The head's columns: those with its white. The pin she leans on crosses outside them.
    cols = [x for x in range(art.width)
            if sum(1 for y in range(art.height) if px[x, y][3] > 128 and min(px[x, y][:3]) > WHITE) > 6]
    art = art.crop((min(cols) - 4, 0, max(cols) + 4, art.height))
    return art.crop(art.getbbox())


def icon(art, size, bg, glow):
    h = max(1, round(size * FILL))
    w = max(1, round(art.width * h / art.height))
    out = ground(size, bg, glow)
    out.alpha_composite(art.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    return out.convert("RGB")


def main():
    art = hornet()
    bg, glow = tokens()
    site = os.path.join(ROOT, "assets", "site")
    for name, size in (("icon-hornet-48", 48), ("icon-hornet-192", 192), ("apple-touch-icon", 180)):
        icon(art, size, bg, glow).save(os.path.join(site, name + ".png"), optimize=True)
    # Each size drawn on its own, not the 48 shrunk: the ICO keeps every frame it's given.
    sizes = (16, 32, 48)
    icon(art, 48, bg, glow).save(os.path.join(ROOT, "favicon.ico"), sizes=[(s, s) for s in sizes],
                                 append_images=[icon(art, s, bg, glow) for s in sizes[:-1]])
    print("icon-hornet-48, icon-hornet-192, apple-touch-icon and favicon.ico written")


if __name__ == "__main__":
    main()
