"""tools/extract-journal-art.py — each Hunter's Journal entry's whole drawing, as the game's Journal
pane shows it beside the list (design/03-redesign.md, step 7, third round), into
assets/journal/art/, and the Hunter's symbol that heads the notes, into assets/journal/.
Needs the game installed and UnityPy, as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-journal-art.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Where they are (read on 28-Sep-2026): each EnemyJournalRecord in
dataassets_assets_assets/dataassets/enemyjournal/journalrecords.bundle carries an iconSprite (the
round portrait, which the site takes from the wiki) and an enemySprite, the whole drawing, in
atlases_assets_assets/sprites/_atlases/journal_enemy_images.spriteatlas.bundle: 237, one per
entry, transparent, all at 64 px to the unit, drawn as they are (no scaling) on a soft light.
Each is written by its record's NAME_ key, lower-case (name_mossbone_crawler.webp), the key
js/journal.js carries. hunter_symbol (Hornet's mask between two filigree strokes) is in
inventory.spriteatlas.bundle. Team Cherry's art, published as the map is (the colophon says so).
Takes a few minutes (UnityPy draws each sprite from its tight mesh). Re-run after a patch. """
import json, os, subprocess, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'   # Unity 6 strips its version from the bundles
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    atl = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    out = os.path.join(ROOT, 'assets', 'journal', 'art')
    os.makedirs(out, exist_ok=True)
    env = UnityPy.load(os.path.join(aa, 'dataassets_assets_assets', 'dataassets', 'enemyjournal', 'journalrecords.bundle'),
                       os.path.join(atl, 'journal_enemy_images.spriteatlas.bundle'))
    done = set()
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            d = o.read_typetree()
        except Exception:
            continue
        if 'enemySprite' not in d:
            continue
        key = d['displayName']['Key']
        o.read().enemySprite.read().image.convert('RGBA').save(os.path.join(out, key.lower() + '.webp'), 'WEBP', quality=86, method=4)
        done.add(key)
    # Every entry the site has needs its drawing.
    keys = json.loads(subprocess.run(['node', '-e', "require('./js/journal.js'); console.log(JSON.stringify(SS.journal.BOOK.map((e) => e.key)))"],
                                     cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    missing = [k for k in keys if k not in done]
    if missing:
        sys.exit(f'extract-journal-art: no drawing for {missing}: the records changed')
    for o in UnityPy.load(os.path.join(atl, 'inventory.spriteatlas.bundle')).objects:
        if o.type.name == 'Sprite' and o.read().m_Name == 'hunter_symbol':
            o.read().image.convert('RGBA').save(os.path.join(ROOT, 'assets', 'journal', 'hunter-symbol.webp'), 'WEBP', quality=90, method=6)
            break
    else:
        sys.exit('extract-journal-art: hunter_symbol is no longer in inventory.spriteatlas.bundle')
    print(f'{len(done)} drawings → assets/journal/art/, hunter_symbol → assets/journal/')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
