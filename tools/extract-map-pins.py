"""tools/extract-map-pins.py — the game's own map pins (the benches, the Bellway and Ventrica
stations, the fleas, the shops, the quest icons…) from its map atlas, into assets/map/pins/, as
the Map draws them (design/03-redesign.md, step 6: the game's round badge).
Needs the game installed and UnityPy, as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-map-pins.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Where they are (read on 28-Sep-2026): Sprites named pin_*, quest_map_icon_*, Map_Q_icon_*,
Shade_Pin and the H_symbols markers, in atlases_assets_assets/sprites/_atlases/
hornet_map.spriteatlas.bundle (with maps_assets_all.bundle, which references them). The Bellway
stations are pin_stag_station (Hollow Knight's name kept), the Ventrica ones pin_tube_station.
Team Cherry's art, published as the map is (the colophon says so). Re-run after a patch. """
import os, re, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
WANT = re.compile(r'^(pin_[a-z_]+|quest_map_icon_[a-z0-9_]+|Map_Q_icon_[a-z_]+|Shade_Pin)$')

def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    atl = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    env = UnityPy.load(os.path.join(aa, 'maps_assets_all.bundle'), os.path.join(atl, 'hornet_map.spriteatlas.bundle'),
                       os.path.join(atl, 'hornet_map_patch.spriteatlas.bundle'))
    out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'map', 'pins')
    os.makedirs(out, exist_ok=True)
    done = set()
    for o in env.objects:
        if o.type.name != 'Sprite':
            continue
        s = o.read()
        if not WANT.match(s.m_Name) or s.m_Name in done:
            continue
        done.add(s.m_Name)
        s.image.convert('RGBA').save(os.path.join(out, s.m_Name.lower() + '.webp'), 'WEBP', quality=90, method=6)
    print(f'{len(done)} pins → assets/map/pins/')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
