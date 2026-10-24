"""tools/extract-item-icons.py: the game's own inventory pictures of the items js/data.js reads from a
save (ITEMS with had / of: the keys, the Plasmium Gland, the Materium, the Crawbell), into
assets/icons/items/<id>.webp, for the Inventory's Items shelf. The other items' pictures are the
wiki's (tools/fetch-icons.js, npm run icons); these the wiki refused to scripts (403, 24-Oct-2026,
as it did the Silkshot variants'), so they come from the game, which is where the wiki's come from.
One command, the game installed, UnityPy as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-item-icons.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Each item is found by its name's key (js/data.js ITEMS key) in the game's collectables
(dataassets/collectables/collectableitems.bundle): a CollectableItem's displayName, or one of a
CollectableItemStates' states (the Slab's keys are one item, shown as the keyring once all three are
held: INV_NAME_SLAB_KEYRING), and its icon is the sprite the pane draws (inventory.spriteatlas,
inventory_furniture_items.spriteatlas, or the bundle itself). Saved at its own size, lossless.
Team Cherry's art, published as the map is (the colophon says so). Re-run after a patch. """
import json, os, subprocess, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'icons', 'items')


def main(game):
    items = json.loads(subprocess.run(['node', '-e', "require('./js/data.js'); console.log(JSON.stringify("
                                       "SS.data.ITEMS.filter((x) => x.had || x.of).map((x) => [x.id, x.key])))"],
                                      cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    want = {key: id for id, key in items}
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    atl = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    env = UnityPy.load(os.path.join(aa, 'dataassets_assets_assets', 'dataassets', 'collectables', 'collectableitems.bundle'),
                       os.path.join(atl, 'inventory.spriteatlas.bundle'), os.path.join(atl, 'inventory_furniture_items.spriteatlas.bundle'))
    os.makedirs(OUT, exist_ok=True)
    done = {}
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            d = o.read_typetree()
        except Exception:
            continue
        m = None
        key = (d.get('displayName') or {}).get('Key')
        if key in want and 'icon' in d:
            m = o.read().icon
        for i, st in enumerate(d.get('states') or []):
            k = (st.get('DisplayName') or {}).get('Key')
            if k in want and k not in done:
                key, m = k, o.read().states[i].Icon
        if m is None or key not in want or key in done:
            continue
        sp = m.read()
        img = sp.image.convert('RGBA')
        img = img.crop(img.getbbox())   # what it draws
        img.save(os.path.join(OUT, want[key] + '.webp'), 'WEBP', lossless=True, method=6)
        done[key] = (want[key], sp.m_Name, img.size)
    missing = [id for key, id in want.items() if key not in done]
    if missing:
        sys.exit(f'extract-item-icons: no icon found for {", ".join(missing)}: the collectables changed')
    for key, (id, name, size) in sorted(done.items(), key=lambda x: x[1][0]):
        print(f'{id:16} {name:32} {size[0]}x{size[1]}')
    print(f'{len(done)} items → {os.path.relpath(OUT)}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
