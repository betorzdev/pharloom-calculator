"""tools/extract-wish-icons.py: the game's own pictures for the wishes and the main objectives, for
Progress. One command, the game installed, UnityPy as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-wish-icons.py "<Steam>/steamapps/common/Hollow Knight Silksong"
What it writes (read on 11-Oct-2026 and 14-Oct-2026, patch 1.0.30000):
  assets/icons/wishes/<type>.webp  each type of wish's large emblem, the one the Wishwalls show (Caza,
      Reunir, Donar…; design/03-redesign.md, step 5, the restructure): each QuestType of
      dataassets_assets_assets/dataassets/questsystem/types.bundle names its title (displayName, the
      TYPE_<X>_TITLE key js/collectibles.js WISH_TYPES carries) and its largeIcon, a Sprite of
      atlases_assets_assets/sprites/_atlases/wish.spriteatlas.bundle, found by its path id.
      Beside them, board.webp: the pause menu's Wishes tab (Hornet_Inv_pane_icons_0002_wish, in
      _atlases/inventory.spriteatlas.bundle), the emblem of the wishes as a whole.
  assets/icons/tasks/<type>.webp  the picture the pane «Tareas» draws by each wish (design/75, 4 A): its
      QuestType's icon (QI_Hunt, QI_gather…, in inventory.spriteatlas; the Witness's QI_herald lives
      in types.bundle itself).
  assets/icons/tasks/main-<quest>.webp  the one it draws by each main objective: the MainQuest's own
      typeIcon in questsystem/mainquests.bundle (QI_Main_*: the Citadel's, the Bellshrines', the
      Snare's, the Black Thread's…; in inventory.spriteatlas or in mainquests.bundle itself), named by
      its m_Name, the name the save uses, in lower case with dashes («Citadel Seeker» →
      main-citadel-seeker.webp). js/app-progress.js TASK_ICON picks them.
  assets/icons/tasks/spacer.webp  the pane's own filigree between the main objectives and the wishes
      (its Quest List / Quests / Current Heading / Spacer, completed_quests_spacer in
      inventory.spriteatlas; design/80, E): the pane gives the main objectives no heading and no
      emblem, only this line under them. Kept whole and lossless.
Each picture is cut to what it draws; the emblems are kept at most 128 px, the pane's pictures at
most 64 px and lossless. Team Cherry's art, published as the map is (the colophon says so). Re-run
after a patch. """
import os, re, sys
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
SPACER = 'completed_quests_spacer'
MAX, PANE_MAX = 128, 64

def save(image, path, size=MAX, lossless=False):
    im = image.convert('RGBA')
    im = im.crop(im.getbbox())
    im.thumbnail((size, size))
    if lossless:
        im.save(path, 'WEBP', lossless=True, quality=100, method=6)
    else:
        im.save(path, 'WEBP', quality=90, method=6)

def sprites_of(*envs):
    return {o.path_id: o for env in envs for o in env.objects if o.type.name == 'Sprite'}

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    qs = os.path.join(aa, 'dataassets_assets_assets', 'dataassets', 'questsystem')
    atlases = os.path.join(aa, 'atlases_assets_assets', 'sprites', '_atlases')
    types = UnityPy.load(os.path.join(qs, 'types.bundle'))
    mains = UnityPy.load(os.path.join(qs, 'mainquests.bundle'))
    wish = UnityPy.load(os.path.join(atlases, 'wish.spriteatlas.bundle'))
    inv = UnityPy.load(os.path.join(atlases, 'inventory.spriteatlas.bundle'))
    large = sprites_of(wish)
    small = sprites_of(inv, types, mains)
    here = os.path.dirname(__file__)
    out = os.path.join(here, '..', 'assets', 'icons', 'wishes')
    pane = os.path.join(here, '..', 'assets', 'icons', 'tasks')
    os.makedirs(out, exist_ok=True)
    os.makedirs(pane, exist_ok=True)
    done, panes, missing = [], [], []
    for o in types.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        t = o.read_typetree()
        key = (t.get('displayName') or {}).get('Key')
        if key not in TYPES:
            continue
        s = large.get((t.get('largeIcon') or {}).get('m_PathID'))
        if s:
            save(s.read().image, os.path.join(out, TYPES[key] + '.webp'))
            done.append(TYPES[key])
        s = small.get((t.get('icon') or {}).get('m_PathID'))
        if s:
            save(s.read().image, os.path.join(pane, TYPES[key] + '.webp'), PANE_MAX, True)
            panes.append(TYPES[key])
        else:
            missing.append('tasks/' + TYPES[key])
    for o in mains.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        t = o.read_typetree()
        if 'typeIcon' not in t or not t.get('m_Name'):
            continue
        s = small.get((t.get('typeIcon') or {}).get('m_PathID'))
        if s:
            save(s.read().image, os.path.join(pane, 'main-' + slug(t['m_Name']) + '.webp'), PANE_MAX, True)
            panes.append('main-' + slug(t['m_Name']))
        else:
            missing.append('tasks/main-' + slug(t['m_Name']))
    for s in small.values():
        name = s.read().m_Name
        if 'board' not in done and name == BOARD:
            save(s.read().image, os.path.join(out, 'board.webp'))
            done.append('board')
        if 'spacer' not in panes and name == SPACER:
            save(s.read().image, os.path.join(pane, 'spacer.webp'), 1024, True)
            panes.append('spacer')
    missing += [v for v in [*TYPES.values(), 'board'] if v not in done]
    missing += ['tasks/spacer'] if 'spacer' not in panes else []
    print(f'{len(done)} pictures → assets/icons/wishes/, {len(panes)} → assets/icons/tasks/'
          + (f'; not found: {", ".join(missing)}' if missing else ''))
    if missing:
        sys.exit(1)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
