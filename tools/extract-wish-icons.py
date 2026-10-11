"""tools/extract-wish-icons.py: the game's own emblem for each type of wish (the large one its
Tasks pane and the Wishwalls show: Caza, Reunir, Donar…), into assets/icons/wishes/<type>.webp,
for Progress (the wishes the next Act requires, design/03-redesign.md, step 5, the restructure).
One command, the game installed, UnityPy as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-wish-icons.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Where they are (read on 11-Oct-2026, patch 1.0.30000): each QuestType of
dataassets_assets_assets/dataassets/questsystem/types.bundle names its title (displayName, the
TYPE_<X>_TITLE key js/collectibles.js WISH_TYPES carries) and its largeIcon, a Sprite of
atlases_assets_assets/sprites/_atlases/wish.spriteatlas.bundle, found by its path id. The main
objectives and the Collect wish have no type of their own: the site keeps a plain medallion.
Each picture is cut to what it draws and kept at most 128 px. Team Cherry's art, published as
the map is (the colophon says so). Re-run after a patch.
Beside them, board.webp: the pause menu's Wishes tab (Hornet_Inv_pane_icons_0002_wish, in
_atlases/inventory.spriteatlas.bundle), the emblem of the wishes as a whole. """
import os, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
# The type's title key → the site's type id (js/collectibles.js WISH_TYPES).
TYPES = {
    'TYPE_WAYFARER_1_TITLE': 'wayfarer', 'TYPE_GATHER_1_TITLE': 'gather', 'TYPE_DONATE_1_TITLE': 'donate',
    'TYPE_HUNT_1_TITLE': 'hunt', 'TYPE_HUNT_2_TITLE': 'grand-hunt', 'TYPE_COURIER_TITLE': 'delivery',
    'TYPE_JOURNAL_TITLE': 'learn', 'TYPE_SPRINT_TITLE': 'sprint', 'TYPE_HERALD_TITLE': 'witness',
    'TYPE_STEELSENTINEL_TITLE': 'steel',
}
BOARD = 'Hornet_Inv_pane_icons_0002_wish'
MAX = 128

def save(image, path):
    im = image.convert('RGBA')
    im = im.crop(im.getbbox())
    im.thumbnail((MAX, MAX))
    im.save(path, 'WEBP', quality=90, method=6)

def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    types = UnityPy.load(os.path.join(aa, 'dataassets_assets_assets', 'dataassets', 'questsystem', 'types.bundle'))
    atlas = UnityPy.load(os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases', 'wish.spriteatlas.bundle'))
    sprites = {o.path_id: o for o in atlas.objects if o.type.name == 'Sprite'}
    out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons', 'wishes')
    os.makedirs(out, exist_ok=True)
    done = []
    for o in types.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        t = o.read_typetree()
        key = (t.get('displayName') or {}).get('Key')
        if key not in TYPES:
            continue
        s = sprites.get((t.get('largeIcon') or {}).get('m_PathID'))
        if not s:
            continue
        save(s.read().image, os.path.join(out, TYPES[key] + '.webp'))
        done.append(TYPES[key])
    inv = UnityPy.load(os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases', 'inventory.spriteatlas.bundle'))
    for o in inv.objects:
        if o.type.name == 'Sprite' and 'board' not in done:
            s = o.read()
            if s.m_Name == BOARD:
                save(s.image, os.path.join(out, 'board.webp'))
                done.append('board')
    missing = [v for v in [*TYPES.values(), 'board'] if v not in done]
    print(f'{len(done)} pictures → assets/icons/wishes/' + (f'; not found: {", ".join(missing)}' if missing else ''))
    if missing:
        sys.exit(1)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
