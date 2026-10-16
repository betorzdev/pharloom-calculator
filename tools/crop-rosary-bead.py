"""tools/crop-rosary-bead.py: one rosary bead, for the Map's «Rosarios sueltos» switch and marks.
The wiki's Rosaries picture (assets/icons/items/rosaries.webp, three beads) is also the one the
rosary caches draw, so the two switches looked the same. This cuts the front bead out of it, the
game's own art, lossless:
    python3 tools/crop-rosary-bead.py          (needs Pillow)
then npm run mark-fit, for its line in js/mark-fit.js. """
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'icons', 'items', 'rosaries.webp')
OUT = os.path.join(ROOT, 'assets', 'icons', 'extras', 'rosary-bead.webp')
BOX = (30, 34, 104, 112)   # the front bead's box in the 111 x 114 picture

im = Image.open(SRC).convert('RGBA').crop(BOX)
im.save(OUT, 'WEBP', lossless=True)
print(OUT, im.size)
