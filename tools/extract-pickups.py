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
  objects the objects kb/data/game/wanted.json asks for (tools/spots-wanted.js: the ones a save's
          sceneData check names) → { scene: { name: [x, y] } }, the first of each name.
  benches each scene's RestBench → [x, y], which tools/gen-spots.js sets against the map's own
          bench pins to check how a point is placed on the map.
  sizes   each scene's size in world units, its tk2dTileMap's width and height: the game places a
          point on its room's drawing by it (x / width across, y / height up).
Every [scene, …] above ends with the object's place in the world, [x, y] (its Transforms composed
from the scene's root), where there's one. Scene names are the bundles', lower case; js/rooms.js
finds them on the map either way. """
import json, os, pickle, re, struct, sys
from collections import defaultdict
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'pickups.json')
WANTED = os.path.join(HERE, '..', 'kb', 'data', 'game', 'wanted.json')
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
        items, fields, npcs, objects, benches, sizes = pickle.load(open(cache, 'rb'))
    else:
        items, fields, npcs, objects, benches, sizes = scan(game)
        if cache:
            pickle.dump((items, fields, npcs, objects, benches, sizes), open(cache, 'wb'))
    r2 = lambda v: [round(x, 2) if isinstance(x, float) else x for x in v]
    srt = lambda v: sorted({tuple(r2(x)) for x in v}, key=lambda x: tuple(str(y) for y in x))
    out = {'items': {k: {'class': c, 'at': srt(v)} for (k, c), v in sorted(items.items())},
           'fields': {k: srt(v) for k, v in sorted(fields.items())},
           'npcs': {k: srt(v) for k, v in sorted(npcs.items())},
           'objects': {s: {n: r2(p) for n, p in sorted(v.items())} for s, v in sorted(objects.items())},
           'benches': {s: r2(p) for s, p in sorted(benches.items())},
           'sizes': {s: list(v) for s, v in sorted(sizes.items())}}
    for f in FIELDS[:11]:   # the abilities; a Bellshrine's flag is named where only some of them are
        if f not in out['fields']:
            sys.exit(f'extract-pickups: no scene names {f} any more: FIELDS needs reading again')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f"{len(out['items'])} items, {len(out['fields'])} fields, {len(out['npcs'])} people, "
          f"{sum(len(v) for v in out['objects'].values())} objects, {len(out['benches'])} benches, {len(out['sizes'])} scene sizes → {os.path.relpath(OUT)} "
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
    objects, benches, sizes = defaultdict(dict), {}, {}
    wanted = {s: set(v) for s, v in json.load(open(WANTED)).items()} if os.path.exists(WANTED) else {}
    sdir = os.path.join(aa, 'scenes_scenes_scenes')
    names = sorted(f[:-7] for f in os.listdir(sdir) if f.endswith('.bundle'))
    for i, scene in enumerate(names):
        if scene in NOT_SCENES:
            continue
        env = UnityPy.load(os.path.join(sdir, scene + '.bundle'))
        # Each object's place in the world: its Transforms composed from the root.
        T = {o.path_id: o.read() for o in env.objects if o.type.name == 'Transform'}
        of_go = {t.m_GameObject.m_PathID: t for t in T.values()}
        def world(gid):
            t, chain = of_go.get(gid), []
            while t is not None:
                chain.append(t)
                f = t.m_Father.m_PathID
                t = T.get(f) if f else None
            x = y = 0.0
            sx = sy = 1.0
            for t in reversed(chain):
                lp, ls = t.m_LocalPosition, t.m_LocalScale
                x, y = x + lp.x * sx, y + lp.y * sy
                sx, sy = sx * ls.x, sy * ls.y
            return [x, y] if chain else []
        want = wanted.get(scene, set())
        if want:
            for o in env.objects:
                if o.type.name == 'GameObject':
                    n = o.read().m_Name
                    if n in want and n not in objects[scene]:
                        objects[scene][n] = world(o.path_id)
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            comp = CLS.get(script(o))
            if comp == 'tk2dTileMap' and scene not in sizes:
                d = o.read_typetree()
                if d.get('width') and d.get('height'):
                    sizes[scene] = (d['width'], d['height'])
                continue
            got = set(refs(o)) if comp not in NOISE else set()
            hit = comp == 'PlayMakerFSM' and field_re.findall(o.get_raw_data())
            if not got and not hit and comp not in ('PlayMakerFSM', 'BasicNPC', 'RestBench'):
                continue
            try:
                ref = o.read().m_GameObject
                gid, go = ref.m_PathID, ref.read().m_Name
            except Exception:
                gid, go = None, None
            at = world(gid) if gid else []
            if comp == 'RestBench':
                benches.setdefault(scene, at)
                continue
            for name, cls in got:
                items[(name, cls)].append((scene, comp, go, *at))
            for f in set(hit or ()):
                fields[f.decode()].append((scene, go, *at))
            if npc_re.fullmatch(copy(go)):
                npcs[copy(go)].append((scene, go, *at))
        if i % 50 == 0:
            print(f'{i}/{len(names)} {scene}', file=sys.stderr, flush=True)
    return dict(items), dict(fields), dict(npcs), dict(objects), benches, sizes


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-pickups.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'))
