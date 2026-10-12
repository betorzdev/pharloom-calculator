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
    I_map                                Maps: an area's map, rolled, as the inventory shows it (inventory)
    I_token_of_faith, I_slab_key, I_slab_key_gold, I_slab_key_brass, I_key_whiteward, I_chute_key_whiteward
                                         Keys: the Simple Key, the Slab's three, the Whiteward's two, each
                                         its item's own icon (inventory; the last in the items' bundle)
    dock_key, belltown_house_key         Keys an NPC gives: the Diving Bell Key (Ballow), the Bellhome
                                         Key (Pavo) (inventory)
    cog_heart_pieces, _0000_T_web_shot_broken, farsight, materium, crawbell
                                         Key items: the Cogheart Pieces, the broken Silkshot, Farsight,
                                         the Materium, the Crawbell (inventory, inventory_furniture_items)
    Silk_Grub_small_cocoon               the small silk cocoons by the Silkeaters (core)
    _0005_core_lever_02                  Levers: the Citadel's brass lever (core)
    dock_door_bottom_pressure_plate      a pressure plate, among the levers: the Docks' (dock)
The breakable walls keep the site's glyph: the game's walls (break_wall) are tall dark rock that
doesn't read at a mark's size; so do the gates, shortcuts and silk walls (design/03-redesign.md,
step 6, Passages: the game's gates are dark ironwork and its silk vines a few hairlines at that
size). Each picture is cut to what it draws and kept at most 128 px.
Team Cherry's art, published as the map is (the colophon says so). Re-run after a patch. """
import os, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
WANT = {
    'inventory': ['I_slab_key', 'Hornet_Inv_pane_icons_0002_wish', 'Hornet_Inv_pane_icons_0003_journal', 'I_map',
                  'I_token_of_faith', 'I_slab_key_gold', 'I_slab_key_brass', 'I_key_whiteward', 'cog_heart_pieces', '_0000_T_web_shot_broken',
                  'dock_key', 'belltown_house_key'],
    'inventory_furniture_items': ['farsight', 'materium', 'crawbell'],
    'wish': ['quest_icon_large__0008_gather', 'quest_icon_large_0006_herald'],
    'core': ['_0005_core_lever_02', 'Silk_Grub_small_cocoon'],
    'dock': ['dock_door_bottom_pressure_plate'],
}
# Sprites kept in a data bundle rather than an atlas: the Ward Boss Key's.
WANT_DATA = {'collectables/collectableitems.bundle': ['I_chute_key_whiteward']}
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
    data = os.path.join(atl, '..', '..', '..', 'dataassets_assets_assets', 'dataassets')
    for rel, names in WANT_DATA.items():
        for o in UnityPy.load(os.path.join(data, rel)).objects:
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
    missing = [n for names in [*WANT.values(), *WANT_DATA.values()] for n in names if n not in done]
    print(f'{len(done)} icons → assets/map/icons/' + (f'; not found: {", ".join(missing)}' if missing else ''))
    if missing:
        sys.exit(1)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
