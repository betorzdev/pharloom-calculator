"""tools/extract-pickups.py — where things are picked up and who stands where, from the game's own
files, into kb/data/game/pickups.json, which tools/gen-spots.js reads (offline) to place them on
the Map. Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-pickups.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]
Re-run it after a patch, and tools/extract-gating.py with it (npm run data stops until both are of
the same patch: tools/gating.js). The scan reads every scene (about ten minutes);
--cache=<file> keeps what it read (pickled) for the runs that follow.

What it writes (read on 28-Sep-2026, patch 1.0.30000):
  items   each item asset of the bundles below (a Tool, a Crest, a Collectable, a Relic, a Memento,
          a map found, a key of the Slab)
          by its m_Name, the save's name for it → [scene, component, object]: every component in a
          scene that points at it (a reference is its file's index and the object's path id, 12
          bytes, found in the raw data as tools/extract-journal-rooms.py does). A
          CollectableItemPickup is the thing lying in the room; a PlayMakerFSM is whoever gives it
          (an NPC, a shrine, a boss's corpse), and gen-spots picks among those by hand (its HAND).
          What only drops or pays it (HealthManager, GeoControl, Breakable…) and the title menu's
          HUD aren't kept.
  fields  a playerData field the site reads (the abilities', the Bellshrines', the area maps',
          Shakra's SeenMapper<Area>, and the flags of the pieces and extras that have no room of
          their own: gen-spots HAND_PIECE, HAND_EXTRA) → [scene, object]:
          every PlayMakerFSM whose raw data names it (a set or a test: gen-spots picks).
  npcs    an object name the NPCS pattern list matches → [scene, object]: where each of them is.
  objects the objects kb/data/game/wanted.json asks for (tools/spots-wanted.js: the ones a save's
          sceneData check names) → { scene: { name: [x, y] } }, the first of each name: an
          object of that name, else a saved item whose own ID it is.
  benches each scene's RestBench → [x, y], which tools/gen-spots.js sets against the map's own
          bench pins to check how a point is placed on the map.
  respawns where the game wakes Hornet: each scene's RespawnMarkers (a bench's RestBench, a room's
          "Death Respawn Marker"), by their object's name, which is how the save names one
          (respawnScene, respawnMarkerName) → { scene: { name: [x, y, ground] } }, ground the y her
          feet go on (read on 14-Oct-2026): a bench's own foot, the bottom of its RestBench's trigger
          box (within a third of a unit of the scene's terrain under every bench, a unit above it on
          the Choral Chambers' fountains, which it stands on); under a marker, the ground she drops
          onto, the top of the scene's Terrain layer straight under it (a Death Respawn Marker
          sits 0.4 to 4 units up; an additive scene, the Flea Caravan's, on its host's), null with
          none. An active marker wins over one of the same name switched off in the scene file.
          tools/gen-spots.js puts them on the map (SEATS), where the Map has Hornet sit or stand.
  sizes   each scene's size in world units, its tk2dTileMap's width and height: the game places a
          point on its room's drawing by it (x / width across, y / height up). The tilemap is the
          one the game reads (GameManager.RefreshTilemapInfo): on a root object tagged TileMap,
          else any object so tagged, else the scene's first (read on 13-Oct-2026).
  battles each scene's BattleScene objects (an enemy arena: a gauntlet's) → [[object, x, y, the
          playerData flag it sets once won, or '']]: x, y the middle of its waves' enemies (the
          object's own place is often a prefab's corner, or parked off the scene).
  locks   each scene's ItemReceptacle (a door a key opens) → [[object, x, y]].
  records each Journal record (its NAME_ key) → [[scene, component, object, x, y]]: what points at it
          in a scene, one per scene and kind (the first enemy carrying it, EnemyDeathEffects, and
          the first other component naming it: a boss scene's FSM): where that foe, a boss, is.
  fleas   each scene's lost flea (an object named Flea Rescue…) → [[object, x, y]].
  doors   what opens a way and stays open, by kind → [[Scene, id, x, y]]: each object with a
          PersistentBoolItem of its own (not semi-persistent, saved, its scene's), whose bool the
          save keeps in sceneData.persistentBools under [Scene, id] once it's opened. Scene is the
          scene's own name, as the save writes it (aa/catalog.bin's <Scene>.unity), not the
          bundle's lower case. The kinds (read on 11-Oct-2026; design/03-redesign.md, step 6, Passages):
            lever     a Lever or Lever_tk2d component, and the levers an FSM works (LEVERS: the
                      Cogwork Core's cog_lever, Greymoor's lever on the platform it drops)
            plate     a pressure plate Hornet steps on, and Clawline's pull switch (PLATE)
            gate      a Gate, TempGate, Trapdoor or TrapBridgeExtend, the ring
                      gates Clawline pulls open and the gates an FSM works (GATES)
            lock      a door a key opens: the Simple Key's, the Architect's, the Ward Boss Key's,
                      the Slab's locks and cells (LOCK)
            shortcut  a way opened from one side: one-way walls, planks, ladders, floors, the
                      Citadel's plug gates (SHORTCUT)
            silkwall  the thick silk vines Silkspear cuts (SILK)
          The doors the Needolin opens (Song_Gate_set) keep nothing in the save, and the levers of
          trapdoors and flip bridges that close again neither: not here. Nor a DialDoorBridge (the
          Citadel's Song_20b): its levers turn it either way and its bool is where it stands, not
          a way opened (true, then false again, in the author's saves; 14-Oct-2026). A demo's (Demo States/Demo)
          and an unused one ("… old") aren't either, nor the two the scene leaves off (OFF).
  pd      each playerData flag of PD_WAYS (what opens a way that the save keeps there) → [scene,
          component, object, x, y]: every component whose raw data names it.
  kept    the rest the save keeps per room that the Map shows, by kind (KEPT: loose rosaries, the
          small silk cocoons, lifts, the masks that hide a room) → [[Scene, id, bool or int, x, y]]:
          each saved bool or int of its own on an object with that component, kept as the doors are.
  caches  each rosary or shell shard cache whose save is an int (a PersistentIntItem beside a
          RosaryCache, RosaryCacheHanging, RosaryCacheString or BreakableHolder, kept as the doors are)
          → [[Scene, id, component, emptied, last]]: the int from which it's emptied, up to the last
          it can hold (read in Assembly-CSharp 1.0.30000 and against the author's saves, 12-Oct-2026).
          A BreakableHolder keeps its hits left: 0 once broken (emptied and last 0). A RosaryCache
          keeps its state: -1 untouched, a step up each hit, held at its hitStates' last, which is
          when it's emptied (emptied and last its hitStates' count - 1). A RosaryCacheString adds a
          state a hit up to maxHits (maxHits + 1 states once awake), and its last rosaries fly a
          step before that, at maxHits - 1 (emptied maxHits - 1, last maxHits).
  maps    each area map found rather than bought (a FakeCollectable with isMap, in the bundles
          above, its pickup under items) → [the Has<Area>Map flag it sets, its words' key].
  lying   each item lying in a room whose pickup keeps a bool of its own (a CollectableItemPickup
          with a PersistentBoolItem on its object, kept as the doors are) → [[Scene, id, x, y]]:
          the save keeps it in sceneData.persistentBools once it's picked up (read on 11-Oct-2026;
          gen-spots takes the rosaries and shell shards among them).
  patch   the game's version the scan read ("1.0.30000"), as tools/extract-gating.py writes it too:
          npm run data stops if the two differ (tools/gating.js)
Every [scene, …] above ends with the object's place in the world, [x, y] (its Transforms composed
from the scene's root, their turns counted: tools/scene_place.py), where there's one. Scene names are the bundles', lower case; js/rooms.js
finds them on the map either way. """
import json, math, os, pickle, re, struct, sys
from collections import defaultdict
import UnityPy
from scene_place import placer, world_of

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'pickups.json')
WANTED = os.path.join(HERE, '..', 'kb', 'data', 'game', 'wanted.json')
BUNDLES = ['tools/toolitems.bundle', 'tools/crestitems.bundle', 'collectables/collectableitems.bundle',
           'collectables/relics.bundle', 'collectables/materium.bundle', 'collectables/fakecollectables.bundle']
# Of the fake collectables (what a pickup gives that isn't an item: a map, a Mask Shard…), only the
# maps are kept: each found map is one (isMap), with the flag it sets and the words it shows.
FAKE = 'collectables/fakecollectables.bundle'
# …and the Slab's three keys, fake collectables too (HasSlabKeyA…C), kept under maps the same way.
KEY_FAKE = re.compile(r'Slab Key [A-C]')
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
# Then the area maps: the 28 Has<Area>Map flags (js/savefile.js MAP_FLAGS), set where a map is found
# or given, and the SeenMapper<Area> flags Shakra's spot in each area sets (her stock opens with them).
MAPS = ['MossGrotto', 'Wilds', 'Boneforest', 'Docks', 'Greymoor', 'Bellhart', 'Shellwood', 'Crawl', 'HuntersNest', 'JudgeSteps',
        'Dustpens', 'Slab', 'Peak', 'CitadelUnderstore', 'Coral', 'Swamp', 'Clover', 'Abyss', 'Hang', 'SongGate', 'Halls', 'Ward',
        'Cog', 'Library', 'Cradle', 'Arborium', 'Aqueduct', 'Weavehome']
SEEN_MAPPER = ['Bonetown', 'BoneForest', 'Docks', 'Wilds', 'Crawl', 'Greymoor', 'Bellhart', 'Shellwood', 'HuntersNest', 'JudgeSteps',
               'Dustpens', 'Peak', 'Shadow', 'CoralCaverns']
FIELDS += [f'Has{m}Map' for m in MAPS] + [f'SeenMapper{m}' for m in SEEN_MAPPER]
# Then the pieces of the 100% given by a script rather than lying (tools/gen-spots.js HAND_PIECE): the
# Huge Flea tamed, Kratt back at the caravan, the wild troupe hunter met, two of the melodies.
FIELDS += ['tamedGiantFlea', 'CaravanLechReturnedToCaravan', 'MetTroupeHunterWild', 'HasMelodyArchitect', 'HasMelodyConductor']
# …and the extras whose check is a flag with no room of its own (tools/gen-spots.js HAND_EXTRA): three
# Mossberries, the church's Rhinogrund, the Abyss's silk farm.
FIELDS += ['bonetownAspidBerryCollected', 'mosstownAspidBerryCollected', 'bonegraveAspidBerryCollected', 'churchRhinoKilled',
           'silkFarmAbyssCoresCleared']
# The lost fleas: each is an object of its own in its room (its SavedFlea_<scene> flag is made from
# the scene's name at run time, so nothing names it).
FLEA = re.compile(r'Flea Rescue.*')
# The Hunter's Journal's records (EnemyJournalRecord, by their displayName's key, NAME_<X>): what in a
# scene points at one (an enemy's EnemyDeathEffects, a boss scene's FSM) is where that foe is.
RECORDS = 'enemyjournal/journalrecords.bundle'
RECORD = 'EnemyJournalRecord'
DEATH = re.compile(r'EnemyDeathEffects.*')
TILEMAP_TAG = 20000   # the "TileMap" tag (globalgamemanagers' TagManager: the first custom tag)
TERRAIN = 8           # the "Terrain" layer (the same TagManager's layers): the ground Hornet stands on
REACH = 0.5           # how far above a respawn marker the ground under it may reach
COLLIDERS = ('BoxCollider2D', 'EdgeCollider2D', 'PolygonCollider2D')
# What opens a way that the save keeps in playerData rather than in sceneData (read in the author's
# 100% save against the site, 11-Oct-2026): levers, a pressure plate, gates and doors, walls and
# one-way ways, and where they're named (every component, not only the FSMs: a Lever_tk2d, a
# PersistentPressurePlate, an ItemReceptacle carry the flag themselves). gen-spots places each by hand
# among these (its PD_WAYS).
PD_WAYS = ['openedCitadelSpaLeft', 'openedCitadelSpaRight', 'greatBoneGateOpened', 'bone01shortcutPlat', 'mosstown01_shortcut',
           'bone03_openedTrapdoor', 'openedGeyserShaft', 'docks_02_shortcut_right', 'rhinoChurchUnlocked', 'droppedFloorBreakerPlat',
           'libraryRoofShortcut', 'song_27_opened', 'bankOpened', 'openedDust05Gate', 'BonePlazaOpened', 'boneEast07_openedMidRoof',
           'openedTallGeyser', 'openedDocksBackEntrance', 'bonegraveOpen', 'slab_05_gateOpen', 'slab_17_openedGateLeft',
           'laceTowerDoorOpened', 'wardBossHatchOpened', 'opened_cog_06_door', 'cog7_gateOpened', 'BelltownHouseUnlocked',
           'explodeWallMosstown3', 'Bone_East_04b_ExplodeWall', 'explodeWallBoneEast18c', 'crawl03_oneWayWall', 'shellwoodTwigShortcut',
           'shellwood13_BellWall', 'shellwoodBellshrineTwigWall', 'sethShortcut', 'antMerchantShortcut', 'openedCauldronShortcut',
           'song_11_oneway', 'arborium_09_oneWay', 'arborium_08_oneWay', 'CollectedDustCageKey']
# The rest the save keeps per room (sceneData) and the Map shows, by a component on the object with
# the saved bool or int (kept, below).
KEPT = [('bead', {'GeoControl'}), ('cocoon', {'SilkGrubCocoon'}), ('lift', {'LiftControl', 'LiftPlatform', 'ManualLift'}),
        ('hidden', {'Remasker', 'Unmasker'})]
# The caches whose int the save keeps (caches, above).
CACHES = {'RosaryCache', 'RosaryCacheHanging', 'RosaryCacheString', 'BreakableHolder'}
# The people the Map shows, by their objects' names in the scenes (without the copy's " (1)").
NPCS = r'Pinsmith.*|Seamstress.*|Pinstress.*|Crest Upgrade Shrine|Ladybug.*|Dice Pilgrim.*|Flea ?Master.*|Caravan Troupe Leader.*|' \
       r'Mapper.*|Shakra.*|Quest Board.*|Questboard.*|Relic ?Dealer.*|Belltown Shop NPC|Grindle.*|Mort.*|Frey.*|Pebb.*|Jubilana.*|' \
       r'Architect NPC|Forge Daughter.*|Mottled.*|City Merchant.*|Bone ?town Merchant.*|Nuu|Couriers Quest Giver'
# The doors' kinds (doors above): by a component on the object, else by its name (without the copy's " (1)").
LEVER = {'Lever', 'Lever_tk2d'}
GATE = {'Gate', 'TempGate', 'Trapdoor', 'TrapBridgeExtend'}
SILK = re.compile(r'Thick Silk Vines')
PLATE = re.compile(r'Hornet_pressure_plate.*|Plate|Plaque Pressure Plate|Shrine Pressure Plate.*|Harpoon Ring Pull Switch|dock_pressure_plate_lock')
LOCK = re.compile(r'Slab Lock( [LR])?|aspid_sealed_gate_stone|Prince Cell Door|bank_door|dock_sealed_gate|Diving Bell Door|Architect Shrine Door|'
                  r'lock_machine|jail_door|Jail Gate Door - Persistent|door_slabCaged')
# What an FSM works rather than a component, by name: the levers (the Cogwork Core's; Greymoor_06's,
# whose bool is on the platform its Lever drops) and the gates (Clawline's rings, Bone_04's).
LEVERS = re.compile(r'cog_lever|belltown_lever_drop_plat')
GATES = re.compile(r'slide_gate_ring|slab_break_weaver_gate_ring|Bone Gate')
# Two the scene leaves off, which none of the author's saves has opened (read on 12-Oct-2026):
# Cog_Bench's spare cog_lever (its object switched off: the pressure plate beside it opens that
# way) and Library_11b's plug gate (its Lever switched off). Switched off alone says nothing:
# the game switches on many a door it starts with off.
OFF = {('cog_bench', 'cog_lever (2)'), ('library_11b', 'Plug_Gate')}
SHORTCUT = re.compile(r'One Way (Wall|VineWall|Wall Crystal)|drop_planks|drop_planks_horizontal|attic_ladder|greystore_floor_shortcut|cog_05_shortcut|'
                      r'BreakableWallSwampBenchShortcut|Breakable Wall Swamp Shortcut|Breakable Floor_basic.*|Junk Hatch|Pipe_Vent_Hatch Broken|'
                      r'Plug_Gate')


def door_kind(comps, name):
    n = re.sub(r'\s*\(\d+\)$', '', name or '').strip()
    if comps & LEVER or LEVERS.fullmatch(n): return 'lever'
    if SILK.fullmatch(n): return 'silkwall'
    if PLATE.fullmatch(n): return 'plate'
    if LOCK.fullmatch(n): return 'lock'
    if GATES.fullmatch(n): return 'gate'
    if SHORTCUT.fullmatch(n): return 'shortcut'
    if comps & GATE: return 'gate'
    return None


def one_each(v):
    """A record's hits, one per scene and kind: the first enemy that carries it (EnemyDeathEffects…),
    the first other component that names it."""
    seen, out = set(), []
    for x in v:
        k = (x[0], bool(DEATH.fullmatch(x[1] or '')))
        if k not in seen:
            seen.add(k)
            out.append(x)
    return out


def switched_on(T, of_go, gos):
    """Whether a GameObject and every one above it are on in the scene file."""
    def on(gid):
        t = of_go.get(gid)
        while t is not None:
            g = gos.get(t.m_GameObject.m_PathID)
            if g is not None and not g.m_IsActive:
                return False
            f = t.m_Father.m_PathID
            t = T.get(f) if f else None
        return True
    return on


def ground(env, T, of_go, gos):
    """A scene's ground: every edge of a solid collider on the Terrain layer switched on in the scene
    file, in the world ([((x0, y0), (x1, y1))])."""
    of, on, edges = placer(T, of_go), switched_on(T, of_go, gos), []
    for o in env.objects:
        if o.type.name not in COLLIDERS:
            continue
        gid = struct.unpack_from('<q', o.get_raw_data(), 4)[0]   # a component starts with its GameObject
        g = gos.get(gid)
        if g is None or g.m_Layer != TERRAIN or not on(gid):
            continue
        d = o.read_typetree()
        if d.get('m_IsTrigger') or not d.get('m_Enabled', 1):
            continue
        ox, oy = d['m_Offset']['x'], d['m_Offset']['y']
        if o.type.name == 'EdgeCollider2D':
            paths = [([(p['x'] + ox, p['y'] + oy) for p in d['m_Points']], False)]
        elif o.type.name == 'PolygonCollider2D':
            paths = [([(p['x'] + ox, p['y'] + oy) for p in path], True) for path in d['m_Points']['m_Paths']]
        else:
            w, h = d['m_Size']['x'] / 2, d['m_Size']['y'] / 2
            paths = [([(ox - w, oy - h), (ox + w, oy - h), (ox + w, oy + h), (ox - w, oy + h)], True)]
        at = of(gid)
        for pts, closed in paths:
            pts = [at(*p) for p in pts]
            edges += [(pts[k], pts[(k + 1) % len(pts)]) for k in range(len(pts) if closed else len(pts) - 1)]
    return edges


def ground_under(edges, x, y):
    """The top of the ground straight under (x, y): the highest edge crossing x no more than REACH
    above y, or None."""
    best = None
    for (x0, y0), (x1, y1) in edges:
        if x0 == x1 or (x0 - x) * (x1 - x) > 0:
            continue
        top = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
        if top <= y + REACH and (best is None or top > best):
            best = top
    return best


def game_patch(game):
    """The game's own version (PlayerSettings' bundleVersion in globalgamemanagers, read raw: its type
    tree doesn't read with the stripped Unity version), "1.0.30000"; written into the output so that
    tools/gating.js can tell whether pickups.json and gating.json were read from the same patch."""
    env = UnityPy.load(os.path.join(game, 'Hollow Knight Silksong_Data', 'globalgamemanagers'))
    for o in env.objects:
        if o.type.name == 'PlayerSettings':
            found = re.findall(rb'(?<![\d.])\d+\.\d+\.\d+(?![\d.])', o.get_raw_data())
            if len(found) == 1:
                return found[0].decode()
    sys.exit('the game\'s version isn\'t where it was (globalgamemanagers PlayerSettings): game_patch needs reading again')


def main(game, cache):
    got = pickle.load(open(cache, 'rb')) if cache and os.path.exists(cache) else None
    if not got or len(got) != 17:   # none, or one kept before the doors, … the records, the fleas, the locks or the respawns
        got = scan(game)
        if cache:
            pickle.dump(got, open(cache, 'wb'))
    items, fields, npcs, objects, benches, sizes, doors, lying, maps, pd, kept, caches, battles, records, fleas, locks, respawns = got
    r2 = lambda v: [round(x, 2) if isinstance(x, float) else x for x in v]
    srt = lambda v: sorted({tuple(r2(x)) for x in v}, key=lambda x: tuple(str(y) for y in x))
    out = {'items': {k: {'class': c, 'at': srt(v)} for (k, c), v in sorted(items.items())},
           'fields': {k: srt(v) for k, v in sorted(fields.items())},
           'npcs': {k: srt(v) for k, v in sorted(npcs.items())},
           'objects': {s: {n: r2(p) for n, p in sorted(v.items())} for s, v in sorted(objects.items())},
           'benches': {s: r2(p) for s, p in sorted(benches.items())},
           'sizes': {s: list(v) for s, v in sorted(sizes.items())},
           'doors': {k: srt(v) for k, v in sorted(doors.items())},
           'lying': {k: srt(v) for k, v in sorted(lying.items())},
           'maps': dict(sorted(maps.items())),
           'pd': {k: srt(v) for k, v in sorted(pd.items())},
           'kept': {k: srt(v) for k, v in sorted(kept.items())},
           'caches': srt(caches),
           'battles': {s: srt(v) for s, v in sorted(battles.items())},
           'records': {k: srt(one_each(v)) for k, v in sorted(records.items())},
           'fleas': {s: srt(v) for s, v in sorted(fleas.items())},
           'locks': {s: srt(v) for s, v in sorted(locks.items())},
           'respawns': {s: {n: r2(p[:3]) for n, p in sorted(v.items())} for s, v in sorted(respawns.items())},
           'patch': game_patch(game)}
    if len(out['pd']) < len(PD_WAYS):
        sys.exit(f"extract-pickups: no scene names {', '.join(sorted(set(PD_WAYS) - set(out['pd'])))} any more: PD_WAYS needs reading again")
    if len(out['maps']) < 10:
        sys.exit('extract-pickups: too few maps found lying: the fake collectables need reading again')
    if len(out['caches']) < 300:
        sys.exit('extract-pickups: too few caches: CACHES needs reading again')
    if len(out['battles']) < 40 or len(out['records']) < 200 or len(out['fleas']) < 20:
        sys.exit('extract-pickups: too few arenas, Journal records or fleas: BattleScene, RECORDS or FLEA need reading again')
    if len(out['respawns']) < 120 or sum(p[2] is None for v in out['respawns'].values() for p in v.values()) > 5:
        sys.exit('extract-pickups: too few respawn markers, or too many with no ground under them: RespawnMarker or TERRAIN need reading again')
    if len(out['doors'].get('lever', [])) < 50:
        sys.exit('extract-pickups: too few levers: the doors need reading again')
    for f in FIELDS[:11]:   # the abilities; a Bellshrine's flag is named where only some of them are
        if f not in out['fields']:
            sys.exit(f'extract-pickups: no scene names {f} any more: FIELDS needs reading again')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f"{len(out['items'])} items, {len(out['fields'])} fields, {len(out['npcs'])} people, "
          f"{sum(len(v) for v in out['objects'].values())} objects, {len(out['benches'])} benches, {len(out['sizes'])} scene sizes, "
          f"{', '.join(f'{len(v)} {k}' for k, v in out['doors'].items())}, {sum(len(v) for v in out['lying'].values())} pickups' bools, "
          f"{sum(len(v) for v in out['battles'].values())} arenas, {len(out['records'])} Journal records, {len(out['fleas'])} fleas → {os.path.relpath(OUT)} "
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
    targets, maps = {}, {}
    for rel in BUNDLES + [RECORDS]:
        for o in UnityPy.load(os.path.join(data, rel)).objects:
            if o.type.name != 'MonoBehaviour':
                continue
            try:
                d = o.read_typetree()
                name = d.get('m_Name')
            except Exception:
                continue
            if rel == FAKE:
                if not d.get('isMap') and not KEY_FAKE.fullmatch(name or ''):
                    continue
                maps[name] = [d.get('linkedPDBool'), (d.get('uiMsgName') or {}).get('Key')]
            if rel == RECORDS:
                name = (d.get('displayName') or {}).get('Key')
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
    objects, benches, sizes, doors, lying = defaultdict(dict), {}, {}, defaultdict(list), defaultdict(list)
    pd, kept, caches = defaultdict(list), defaultdict(list), []
    battles, records, fleas, locks = defaultdict(list), defaultdict(list), defaultdict(list), defaultdict(list)
    respawns = defaultdict(dict)
    pd_re = re.compile(rb'(?<![A-Za-z0-9_])(' + b'|'.join(re.escape(f.encode()) for f in sorted(PD_WAYS, key=len, reverse=True)) + rb')(?![A-Za-z0-9_])')
    # Each scene's own name, as the game (and its save) writes it: the bundles' are lower case.
    with open(os.path.join(aa, '..', 'catalog.bin'), 'rb') as fh:
        NAMES = {n.decode().lower(): n.decode() for n in re.findall(rb'([A-Za-z0-9_ ()-]+)\.unity', fh.read())}
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
        def arena(d, at):
            """A BattleScene's arena: the middle (median) of its waves' enemies, the children of each
            wave's object (its own transform is often a prefab's corner or parked), and its flag."""
            byid = {o.path_id: o for o in env.objects}
            kids = defaultdict(list)
            for t in T.values():
                kids[t.m_Father.m_PathID].append(t)
            xs, ys = [], []
            for w in d.get('waves') or []:
                wo = byid.get(w['m_PathID'])
                if wo is None:
                    continue
                wg = w['m_PathID'] if wo.type.name == 'GameObject' else wo.read_typetree()['m_GameObject']['m_PathID']
                wt = of_go.get(wg)
                for k in kids.get(next((p for p, t in T.items() if t is wt), None), []):
                    p = world(k.m_GameObject.m_PathID)
                    if p:
                        xs.append(p[0])
                        ys.append(p[1])
            mid = lambda v: sorted(v)[len(v) // 2]
            return [*([mid(xs), mid(ys)] if xs else at), d.get('setPDBoolOnEnd') or '']
        world = world_of(T, of_go)   # its place, its parents' turns counted (tools/scene_place.py)
        want = wanted.get(scene, set())
        tag_of = {}   # GameObject's path id → its tag
        for o in env.objects:
            if o.type.name == 'GameObject':
                g = o.read()
                n = g.m_Name
                tag_of[o.path_id] = g.m_Tag
                if n in want and n not in objects[scene]:
                    objects[scene][n] = world(o.path_id)
                if FLEA.fullmatch(n):
                    fleas[scene].append((n, *world(o.path_id)))
        tilemaps = []   # (how sure, order, size): the one the game reads first
        door_comps, bools, pickup_of, ints, comps_of, pd_hits, cache_of = defaultdict(set), [], {}, [], defaultdict(set), [], {}
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            comp = CLS.get(script(o))
            raw = o.get_raw_data()   # a MonoBehaviour starts with its GameObject (file id, path id)
            gid0 = struct.unpack_from('<q', raw, 4)[0] if len(raw) >= 12 else None
            comps_of[gid0].add(comp)
            if comp in CACHES:
                cache_of[gid0] = (comp, o)
            for f in set(pd_re.findall(raw)):
                pd_hits.append((f.decode(), comp, gid0))
            if comp == 'PersistentIntItem':
                ints.append((gid0, o))
            if comp in LEVER or comp in GATE or comp == 'PersistentBoolItem':
                gid = gid0
                if comp == 'PersistentBoolItem':
                    bools.append((gid, o))
                else:
                    door_comps[gid].add(comp)
            if comp == 'tk2dTileMap':
                d = o.read_typetree()
                if d.get('width') and d.get('height'):
                    t = of_go.get(gid0)
                    tagged = tag_of.get(gid0) == TILEMAP_TAG
                    root = t is not None and not t.m_Father.m_PathID
                    tilemaps.append((0 if tagged and root else 1 if tagged else 2, len(tilemaps), (d['width'], d['height'])))
                continue
            got = set(refs(o)) if comp not in NOISE else set()
            recs = {n for n, c in got if c == RECORD}
            got = {x for x in got if x[1] != RECORD}
            hit = comp == 'PlayMakerFSM' and field_re.findall(o.get_raw_data())
            if not got and not recs and not hit and comp not in ('PlayMakerFSM', 'BasicNPC', 'RestBench', 'BattleScene', 'ItemReceptacle'):
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
            if comp == 'BattleScene':
                battles[scene].append((go, *arena(o.read_typetree(), at)))
            if comp == 'ItemReceptacle':
                locks[scene].append((go, *at))
            for k in recs:
                records[k].append((scene, comp, go, *at))
            for name, cls in got:
                items[(name, cls)].append((scene, comp, go, *at))
            if comp == 'CollectableItemPickup' and got and gid:
                pickup_of[gid] = sorted({name for name, _ in got})
            for f in set(hit or ()):
                fields[f.decode()].append((scene, go, *at))
            if npc_re.fullmatch(copy(go)):
                npcs[copy(go)].append((scene, go, *at))
        # Where the game wakes Hornet (respawns): each RespawnMarker by its object's name, and the
        # ground her feet go on, a bench's own foot or the terrain under the marker.
        marks = [g for g, cs in comps_of.items() if 'RespawnMarker' in cs]
        if marks:
            gobs = {o.path_id: o.read() for o in env.objects if o.type.name == 'GameObject'}
            of, on, edges = placer(T, of_go), switched_on(T, of_go, gobs), None
            box_of = {}
            for o in env.objects:
                if o.type.name == 'BoxCollider2D':
                    gid = struct.unpack_from('<q', o.get_raw_data(), 4)[0]
                    if gid in marks and 'RestBench' in comps_of[gid]:
                        box_of.setdefault(gid, o.read_typetree())
            for gid in marks:
                name, (x, y), up = gobs[gid].m_Name, of(gid)(0, 0), on(gid)
                if 'RestBench' in comps_of[gid]:
                    b = box_of.get(gid)
                    feet = of(gid)(b['m_Offset']['x'], b['m_Offset']['y'] - b['m_Size']['y'] / 2)[1] if b else None
                else:
                    edges = ground(env, T, of_go, gobs) if edges is None else edges
                    feet = ground_under(edges, x, y)
                had = respawns[scene].get(name)
                if not had or (up and not had[3]):
                    respawns[scene][name] = (x, y, feet, up)
        # The doors: each saved bool of its own on an object of a kind (door_kind).
        if bools or ints or pd_hits:
            gos = {o.path_id: o for o in env.objects if o.type.name == 'GameObject'}
            name_of = lambda g: gos[g].read().m_Name if g in gos else ''
            def path(gid):
                t, out = of_go.get(gid), []
                while t is not None:
                    out.append(name_of(t.m_GameObject.m_PathID))
                    f = t.m_Father.m_PathID
                    t = T.get(f) if f else None
                return '/'.join(reversed(out))
            own = NAMES.get(scene)
            # A wanted id that's a saved item's own ID rather than its object's name (a wall saved
            # as "Act3_Bellway_01_Breakable_wall"): its place is that object's.
            for gid, o in (bools + ints if want else []):
                bid = (o.read_typetree().get('itemData') or {}).get('ID')
                if bid in want and bid not in objects[scene]:
                    objects[scene][bid] = world(gid)
            for gid, o in bools:
                name = name_of(gid)
                kind = door_kind(door_comps.get(gid, set()), name) if (scene, name) not in OFF else None
                if not kind and gid not in pickup_of:
                    continue
                d = o.read_typetree()
                it = d.get('itemData') or {}
                if it.get('IsSemiPersistent') or d.get('dontSave') or (it.get('SceneName') and it['SceneName'].lower() != scene):
                    continue
                bid = it.get('ID') or name
                if 'Demo States/Demo' in path(gid) or bid.endswith(' old'):
                    continue
                if not own:
                    sys.exit(f'extract-pickups: {scene} has no name in catalog.bin')
                if kind:
                    doors[kind].append((own, bid, *world(gid)))
                for item in pickup_of.get(gid, ()):
                    lying[item].append((own, bid, *world(gid)))
            # The rest kept per room (KEPT): each saved bool or int of its own, by a component beside it.
            for typ, lst in (('bool', bools), ('int', ints)):
                for gid, o in lst:
                    kind = next((k for k, cs in KEPT if comps_of.get(gid, set()) & cs), None)
                    if not kind:
                        continue
                    d = o.read_typetree()
                    it = d.get('itemData') or {}
                    if it.get('IsSemiPersistent') or d.get('dontSave') or (it.get('SceneName') and it['SceneName'].lower() != scene):
                        continue
                    if not own:
                        sys.exit(f'extract-pickups: {scene} has no name in catalog.bin')
                    kept[kind].append((own, it.get('ID') or name_of(gid), typ, *world(gid)))
            # The caches whose int the save keeps (caches): from which int each is emptied.
            for gid, o in ints:
                if gid not in cache_of:
                    continue
                d = o.read_typetree()
                it = d.get('itemData') or {}
                if it.get('IsSemiPersistent') or d.get('dontSave') or (it.get('SceneName') and it['SceneName'].lower() != scene):
                    continue
                comp, c = cache_of[gid]
                t = c.read_typetree()
                if comp == 'BreakableHolder':
                    emptied = last = 0
                elif comp == 'RosaryCacheString':
                    emptied, last = t['maxHits'] - 1, t['maxHits']
                else:
                    emptied = last = len(t['hitStates']) - 1
                caches.append((own, it.get('ID') or name_of(gid), comp, emptied, last))
            for f, comp, gid in pd_hits:
                pd[f].append((scene, comp, name_of(gid) if gid else '', *(world(gid) if gid else [])))
        if tilemaps:
            sizes[scene] = min(tilemaps)[2]
            if len(tilemaps) > 1 and min(tilemaps)[2] != tilemaps[0][2]:
                print(f'{scene}: the tilemap the game reads is not the first ({min(tilemaps)[2]} for {tilemaps[0][2]})', file=sys.stderr)
        if i % 50 == 0:
            print(f'{i}/{len(names)} {scene}', file=sys.stderr, flush=True)
    # A marker with no ground under it in its own scene: an additive scene's (the Flea Caravan's,
    # loaded into Greymoor_08 or Aqueduct_05) stands on its host's, the scene without its last part.
    for scene, marks in respawns.items():
        host = scene
        while '_' in host and any(m[2] is None for m in marks.values()):
            host = host.rsplit('_', 1)[0]
            if host not in names:
                continue
            env = UnityPy.load(os.path.join(sdir, host + '.bundle'))
            T = {o.path_id: o.read() for o in env.objects if o.type.name == 'Transform'}
            of_go = {t.m_GameObject.m_PathID: t for t in T.values()}
            gobs = {o.path_id: o.read() for o in env.objects if o.type.name == 'GameObject'}
            edges = ground(env, T, of_go, gobs)
            for name, (x, y, feet, up) in list(marks.items()):
                if feet is None:
                    marks[name] = (x, y, ground_under(edges, x, y), up)
    return (dict(items), dict(fields), dict(npcs), dict(objects), benches, sizes, dict(doors), dict(lying), maps, dict(pd), dict(kept), caches,
            dict(battles), dict(records), dict(fleas), dict(locks), dict(respawns))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-pickups.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'))
