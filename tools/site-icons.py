"""tools/site-icons.py — the site's icons, from the HUD's mask (assets/hud/mask.png, the game's
own sprite) on the page's background (--bg in css/tokens.css): icon-48 and icon-192 (the <link
rel="icon">s), apple-touch-icon (180) and favicon.ico at the root (16, 32 and 48, for whatever
asks for /favicon.ico without reading the page). The mask fills two thirds of the square's
height: a phone's home screen and a search result's circle show it small, so it can't be a dot
in the middle. Needs Pillow.

    python3 tools/site-icons.py         (npm run site-icons)
"""
import os, re
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FILL = 2 / 3  # the mask's height over the square's


def background():
    tokens = open(os.path.join(ROOT, "css", "tokens.css"), encoding="utf-8").read()
    hexa = re.search(r"--bg:\s*#([0-9a-fA-F]{6})", tokens).group(1)
    return tuple(int(hexa[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def icon(mask, size, bg):
    art = mask.crop(mask.getbbox())
    h = max(1, round(size * FILL))
    w = max(1, round(art.width * h / art.height))
    art = art.resize((w, h), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), bg)
    out.alpha_composite(art, ((size - w) // 2, (size - h) // 2))
    return out.convert("RGB")


def main():
    mask = Image.open(os.path.join(ROOT, "assets", "hud", "mask.png")).convert("RGBA")
    bg = background()
    site = os.path.join(ROOT, "assets", "site")
    for name, size in (("icon-48", 48), ("icon-192", 192), ("apple-touch-icon", 180)):
        icon(mask, size, bg).save(os.path.join(site, name + ".png"), optimize=True)
    # Each size drawn on its own, not the 48 shrunk: the ICO keeps every frame it's given.
    sizes = (16, 32, 48)
    icon(mask, 48, bg).save(os.path.join(ROOT, "favicon.ico"), sizes=[(s, s) for s in sizes],
                            append_images=[icon(mask, s, bg) for s in sizes[:-1]])
    print("icon-48, icon-192, apple-touch-icon and favicon.ico written")


if __name__ == "__main__":
    main()
