"""tools/extract-pickups.py — where things are picked up and who stands where, from the game's own
files, into kb/data/game/pickups.json, which tools/gen-spots.js reads (offline) to place them on
the Map. Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-pickups.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]
Re-run it after a patch that moves things. The scan reads every scene (about ten minutes);
--cache=<file> keeps what it read (pickled) for the runs that follow.

What it writes (read on 28-Sep-2026, patch 1.0.30000):
  items   each item asset of the bundles below (a Tool, a Crest, a Collectable, a Relic, a Memento)
          by its m_Name, the save's name for it → [scene, component, object]: every component in a
          scene that points at it (a reference is its file's index and the object's path id, 12
          bytes, found in the raw data as tools/extract-journal-rooms.py does). A
          CollectableItemPickup is the thing lying in the room; a PlayMakerFSM is whoever gives it
          (an NPC, a shrine, a boss's corpse), and gen-spots picks among those by hand (its HAND).
          What only drops or pays it (HealthManager, GeoControl, Breakable…) and the title menu's
          HUD aren't kept.
  fields  a playerData field the site reads (the abilities', the Bellshrines') → [scene, object]:
          every PlayMakerFSM whose raw data names it (a set or a test: gen-spots picks).
  npcs    an object name the NPCS pattern list matches → [scene, object]: where each of them is.
Scene names are the bundles', lower case; js/rooms.js finds them on the map either way. """
import json, os, pickle, re, struct, sys
from collections import defaultdict
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'pickups.json')
BUNDLES = ['tools/toolitems.bundle', 'tools/crestitems.bundle', 'collectables/collectableitems.bundle',
           'collectables/relics.bundle', 'collectables/materium.bundle']
# The components that only drop, pay or show an item: not where it's had.
NOISE = {'HealthManager', 'GeoControl', 'Breakable', 'DamageEnemies', 'CurrencyCounterAppearRegion',
         'InventoryItemToolManager', 'ToolItemManager', 'InventoryPaneFollowAudio'}
NOT_SCENES = {'menu_title'}
# The playerData fields looked for in the scenes' FSMs: the abilities (js/savefile.js ART_PD), then
# the five Bellshrines (js/quests.js BELLSHRINES), whose flags only two scenes name (the rest are set
# by the shrine's shared FSM from a variable).
FIELDS = ['hasChargeSlash', 'hasDash', 'hasWalljump', 'hasHarpoonDash', 'hasSuperJump', 'HasBoundCrestUpgrader',
          'hasNeedolin', 'hasBrolly', 'hasDoubleJump', 'UnlockedFastTravelTeleport', 'hasNeedolinMemoryPowerup',
          'bellShrineBoneForest', 'bellShrineWilds', 'bellShrineGreymoor', 'bellShrineBellhart', 'bellShrineShellwood']
# The people the Map shows, by their objects' names in the scenes (without the copy's " (1)").
NPCS = r'Pinsmith.*|Seamstress.*|Pinstress.*|Crest Upgrade Shrine|Ladybug.*|Dice Pilgrim.*|Flea ?Master.*|Caravan Troupe Leader.*|' \
       r'Mapper.*|Shakra.*|Quest Board.*|Questboard.*|Relic ?Dealer.*|Belltown Shop NPC|Grindle.*|Mort.*|Frey.*|Pebb.*|Jubilana.*|' \
       r'Architect NPC|Forge Daughter.*|Mottled.*|City Merchant.*|Bone ?town Merchant.*|Nuu|Couriers Quest Giver'


def main(game, cache):
    if cache and os.path.exists(cache):
        items, fields, npcs = pickle.load(open(cache, 'rb'))
    else:
        items, fields, npcs = scan(game)
        if cache:
            pickle.dump((items, fields, npcs), open(cache, 'wb'))
    srt = lambda v: sorted(set(v))
    out = {'items': {k: {'class': c, 'at': srt(v)} for (k, c), v in sorted(items.items())},
           'fields': {k: srt(v) for k, v in sorted(fields.items())},
           'npcs': {k: srt(v) for k, v in sorted(npcs.items())}}
    for f in FIELDS[:11]:   # the abilities; a Bellshrine's flag is named where only some of them are
        if f not in out['fields']:
            sys.exit(f'extract-pickups: no scene names {f} any more: FIELDS needs reading again')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f"{len(out['items'])} items, {len(out['fields'])} fields, {len(out['npcs'])} people → {os.path.relpath(OUT)} "
          f"({os.path.getsize(OUT) // 1024} KB)")


def scan(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    CLS = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}

    def script(o):
        raw = o.get_raw_data()
        return struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None

    data = os.path.join(aa, 'dataassets_assets_assets', 'dataassets')
    targets = {}
    for rel in BUNDLES:
        for o in UnityPy.load(os.path.join(data, rel)).objects:
            if o.type.name != 'MonoBehaviour':
                continue
            try:
                name = o.read_typetree().get('m_Name')
            except Exception:
                continue
            if name:
                targets.setdefault(o.assets_file.name.lower(), {})[o.path_id] = (name, CLS.get(script(o)))
    if sum(len(v) for v in targets.values()) < 200:
        sys.exit('extract-pickups: too few item assets: the bundles changed')

    def refs(o):
        raw = o.get_raw_data()
        out = []
        for i, e in enumerate(o.assets_file.externals):
            t = targets.get(e.path.split('/')[-1].lower())
            if not t:
                continue
            pat = struct.pack('<i', i + 1)
            p = raw.find(pat)
            while p >= 0:
                if p + 12 <= len(raw):
                    hit = t.get(struct.unpack_from('<q', raw, p + 4)[0])
                    if hit:
                        out.append(hit)
                p = raw.find(pat, p + 1)
        return out

    field_re = re.compile(('|'.join(sorted(FIELDS, key=len, reverse=True))).encode())
    npc_re = re.compile(NPCS)
    copy = lambda n: re.sub(r'\s*\(\d+\)$', '', n or '').strip()
    items, fields, npcs = defaultdict(list), defaultdict(list), defaultdict(list)
    sdir = os.path.join(aa, 'scenes_scenes_scenes')
    names = sorted(f[:-7] for f in os.listdir(sdir) if f.endswith('.bundle'))
    for i, scene in enumerate(names):
        if scene in NOT_SCENES:
            continue
        for o in UnityPy.load(os.path.join(sdir, scene + '.bundle')).objects:
            if o.type.name != 'MonoBehaviour':
                continue
            comp = CLS.get(script(o))
            got = set(refs(o)) if comp not in NOISE else set()
            hit = comp == 'PlayMakerFSM' and field_re.findall(o.get_raw_data())
            if not got and not hit and comp not in ('PlayMakerFSM', 'BasicNPC'):
                continue
            try:
                go = o.read().m_GameObject.read().m_Name
            except Exception:
                go = None
            for name, cls in got:
                items[(name, cls)].append((scene, comp, go))
            for f in set(hit or ()):
                fields[f.decode()].append((scene, go))
            if npc_re.fullmatch(copy(go)):
                npcs[copy(go)].append((scene, go))
        if i % 50 == 0:
            print(f'{i}/{len(names)} {scene}', file=sys.stderr, flush=True)
    return dict(items), dict(fields), dict(npcs)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-pickups.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'))
