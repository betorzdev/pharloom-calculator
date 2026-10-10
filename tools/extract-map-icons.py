"""tools/extract-map-icons.py: the game's own pictures for the Map's layers that have no item, pin or
Journal portrait of their own (design/03-redesign.md, step 6, the selector under the map), into
assets/map/icons/, beside the pins (tools/extract-map-pins.py). One command, the game installed,
UnityPy as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-map-icons.py "<Steam>/steamapps/common/Hollow Knight Silksong"
What each is (read on 11-Oct-2026, in atlases_assets_assets/sprites/_atlases/):
    i_slab_key                           Locked doors: a key of the inventory (inventory)
    hornet_inv_pane_icons_0002_wish      Wishwalls: the pause menu's Wishes tab (inventory)
    hornet_inv_pane_icons_0003_journal   the Journal's layer: its tab (inventory)
    quest_icon_large__0008_gather        who asks for a wish: a wish's emblem (wish)
    quest_icon_large_0006_herald         who gives a thing of the 100%: the herald's emblem (wish)
The breakable walls keep the site's glyph: the game's walls (break_wall) are tall dark rock that
doesn't read at a mark's size. Each picture is cut to what it draws and kept at most 128 px.
Team Cherry's art, published as the map is (the colophon says so). Re-run after a patch. """
import os, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
WANT = {
    'inventory': ['I_slab_key', 'Hornet_Inv_pane_icons_0002_wish', 'Hornet_Inv_pane_icons_0003_journal'],
    'wish': ['quest_icon_large__0008_gather', 'quest_icon_large_0006_herald'],
}
MAX = 128

def main(game):
    atl = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64',
                       'atlases_assets_assets', 'sprites', '_atlases')
    out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'map', 'icons')
    os.makedirs(out, exist_ok=True)
    done = []
    for atlas, names in WANT.items():
        env = UnityPy.load(os.path.join(atl, atlas + '.spriteatlas.bundle'))
        for o in env.objects:
            if o.type.name != 'Sprite':
                continue
            s = o.read()
            if s.m_Name not in names or s.m_Name in done:
                continue
            im = s.image.convert('RGBA')
            im = im.crop(im.getbbox())
            im.thumbnail((MAX, MAX))
            im.save(os.path.join(out, s.m_Name.lower() + '.webp'), 'WEBP', quality=90, method=6)
            done.append(s.m_Name)
    missing = [n for names in WANT.values() for n in names if n not in done]
    print(f'{len(done)} icons → assets/map/icons/' + (f'; not found: {", ".join(missing)}' if missing else ''))
    if missing:
        sys.exit(1)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
