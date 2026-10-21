"""tools/extract-wishes.py: where the wishes and the main objectives are done, from the game's own
files, into kb/data/game/wishes.json (tools/gen-spots.js reads it, offline), and the pictures the
Map marks them with, into assets/map/icons/. Needs the game installed and UnityPy, as
tools/extract-pickups.py, and dnfile and dncil (the PlayerData getters, below):
    uv pip install --python /tmp/unitypy/bin/python UnityPy dnfile dncil
    /tmp/unitypy/bin/python tools/extract-wishes.py "<Steam>/steamapps/common/Hollow Knight Silksong"
About a minute (every scene, in parallel). Re-run it after a patch.

What it reads (read on 11-Oct-2026, patch 1.0.30000):
  questsystem/quests.bundle, mainquests.bundle  each quest (Quest, MainQuest): its type
      (questsystem/types.bundle: the wish's emblem, typeIcon) and what it asks for (targets, and
      how many of each, counts: a
      Collectable by reference, or an EnemyJournalRecord, KILL: kills of that Journal entry, Dark
      Hearts' 12 Black Thread Cores, enemyjournal/journalrecords.bundle; or a counter of
      questsystem/proxies.bundle: The Lost Fleas' FleasCollected Target, the Steel Sentinel's
      spots, the rosaries and shards a donation asks, by name only; or a Tool of
      tools/toolitems.bundle, by name only: Silk and Soul's Snare Setter). A wish's target with no
      Counter of its own is met by its AltTest alone (one playerData bool): with the picture the
      pane «Tareas» draws for it (AltSprite) and its name (ItemName), it's an alt (read on
      21-Oct-2026: the Flea Games' three, each a game's champion); its test is the bool's, or, when
      PlayerData has no such field but a getter (FleaGamesIsJugglingChampion), what the getter
      compares (Assembly-CSharp: highscore > 30 → ['min', field, 31]); where it's done, ALT_AT.
  scenes_scenes_scenes/*.bundle  in every scene:
      - each CollectableItemPickup of a wish's target (the thing lying there), each PlayMakerFSM
        that collects one (CollectableItemCollect, the Pollip Hearts' flowers) or gives one
        (SavedItemGet: the Maiden's and the Hermit's Souls; CollectableItemCollect: the Druid's
        Mossberry Stew; ObjectCompare of a STANDALONE delivery: the Couriers' Rasher), and each PersistentEnemyItemDrop (the
        Flintbeetles: it names the quest, and drops its target): [scene, component, object, bool, x, y],
        bool the sceneData flag the object keeps (its PersistentBoolItem's ID, else the object's
        name; a PersistentEnemyItemDrop's is "<object>_item_<quest>"), null when it has none; a
        PersistentEnemyItemDrop's ends in { dead, needs }: the playerData bool its enemy's death
        sets (EnemyDeathEffectsRegular: one Flintbeetle has two places, Bone_04 and Bone_06, and
        either death sets rockRollerDefeated_bone06), and the playerData bools it or a parent needs
        to be there (DeactivateIfPlayerdataTrue / False: Bone_04's only while
        bone03_openedTrapdoorForRockRoller is false, Bone_06's once it's true), field → value;
      - each of BUDS' components, a thing that gives a wish's target with no reference to it (the
        Plasmium buds, LifebloodPustule, read on 21-Oct-2026): [scene, component, object, bool, x, y],
        bool its persistentBroken's (set once the Needle Phial's charged stab extracts it), the
        object the bud itself; only the ones there before GROWN is set, the ones the wish is done
        with (three, one each in crawl_03, crawl_07 and crawl_09, as many as it asks for);
      - each of DROPPERS' FSMs, a spot where a wish's target drops by chance while the wish is
        active (its CheckQuestStateV2 names the wish): the Silver Bells' seven spots above
        Bellhart and seven below (component QuestDropper, no flag);
      - each enemy whose FSM records a kill of a KILL target (RecordJournalKill: the 47 Black
        Thread Cores of Act 3, the Void Masses) and keeps a saved bool of its own (a
        PersistentBoolItem on its object, not semi-persistent; set once it's destroyed, as many in
        every save as the entry's Journal kills): kills { record: { name, at: [[scene, object,
        bool, x, y]] } }, name its Journal key. The Map marks them on a layer of their own
        (tools/gen-spots.js EXTRAS, the Void Masses): the wish's pin opens those (ASKS);
      - the object ALT_AT names for each alt (the Flea Games' hosts): alts [field, scene, object,
        x, y];
      - where the game ends each quest: a PlayMakerFSM action EndQuest, EndQuestV2, TryEndQuest
        or TryEndQuestV2 whose quest parameter is that quest (as tools/extract-quests.py maps an
        offer): [scene, object, x, y]; or the corpse an enemy of the scene leaves
        (EnemyDeathEffectsRegular's corpsePrefab or altCorpses) when a prefab's FSM ends a quest
        (below): [scene, enemy, x, y, 'corpse'], the wish done by that fight;
      - what offers each wish: a PlayMakerFSM action QuestYesNo(V2), BeginQuest(V2) or
        CanBeginQuest whose quest parameter is that wish (offers: [scene, object, x, y]), so a wish
        nobody offers in person (Fleatopia's Mr Mushroom Tablet) is marked where it's taken;
      - the FSMs that name a playerData field MushroomQuestFound<n> (the Herald's seven spots).
  every other bundle (the prefabs)  each PlayMakerFSM that ends a quest, as a scene's: the
      bosses' corpses that end their wish once the fight is won and they've spoken (Corpse
      Tormented Trobbio for Pain, Anguish and Misery, Corpse Song Knight for Final Audience,
      Corpse Garmond BlackThreaded for Hero's Call), by the prefab they're the root of.
  maps_assets_all.bundle  the map's own quest pins (Game_Map_Hornet / Main Quest Pins: each a
      QuestMapMarker with its quest, or the delivery item it stands for, and the scene it's for
      when the save chooses among several: the Steel Sentinel's), in world units, and what
      switches it off (its DeactivatePlayerDataTest: a list of test groups, each a list of
      [field, Type, NumType, IntValue]; the Bellbeast's pins, off while FastTravelNPCLocation
      isn't their station's), with the bench pins' world places (tools/gen-spots.js puts the
      quest pins on the map by them).
  collectables/collectableitems.bundle  each target's name in the game's text (displayName).
  atlases: each target's inventory sprite (a Journal record's list icon, iconSprite, the one the
      pane «Tareas» counts it with), each alt's AltSprite and the emblems of EMBLEMS' wish types,
      saved to assets/map/icons/<sprite, lower case, \\W as _>.webp, at most 128 px.
  Assembly-CSharp.dll  PlayerData's fields and its getters, for the alts' tests.
Every [scene, …] ends with the object's place in the world, its Transforms composed
(their turns counted: tools/scene_place.py). Scene names
are the bundles', lower case. """
import bisect, json, os, re, struct, sys
from concurrent.futures import ProcessPoolExecutor
import UnityPy
from scene_place import world_of

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'wishes.json')
ICONS = os.path.join(HERE, '..', 'assets', 'map', 'icons')
DATA = ['questsystem/quests.bundle', 'questsystem/mainquests.bundle', 'questsystem/types.bundle', 'collectables/collectableitems.bundle',
        'enemyjournal/journalrecords.bundle', 'questsystem/proxies.bundle', 'tools/toolitems.bundle']
ATLASES = ['inventory', 'inventory_furniture_items']
# A target that is kills of a Journal entry (Dark Hearts: 12 Black Thread Cores), and the FSM action
# that records one (each core's «FSM», Death Stagger).
KILL = 'EnemyJournalRecord'
KILLED = {'RecordJournalKill'}
# Where each alt is done (a target met by its AltTest alone, by the playerData bool it tests): the
# object that stands for it, its parent's name and its own. The Flea Games' three games, each its
# host («Flea Games Host NPC», whose Control FSM takes its Champ PD Bool by its Game Text Key:
# FG_JUGGLE, FG_DODGE, FG_BOUNCE; read on 21-Oct-2026). It stops on an alt with none.
ALT_AT = {'FleaGamesIsJugglingChampion': 'Flea Game - Juggling/Flea Games Host NPC',
          'FleaGamesIsDodgingChampion': 'Flea Game - Dodging/Flea Games Host NPC',
          'FleaGamesIsBouncingChampion': 'Flea Game - Bouncing/Flea Games Host NPC'}
DLL = os.path.join('Hollow Knight Silksong_Data', 'Managed', 'Assembly-CSharp.dll')
END = {'EndQuest', 'EndQuestV2', 'TryEndQuest', 'TryEndQuestV2'}
# The actions that offer a quest (as tools/extract-quests.py maps an offer to its scene).
OFFER = {'QuestYesNo', 'QuestYesNoV2', 'BeginQuest', 'BeginQuestV2', 'CanBeginQuest'}
GIVE = {'CollectableItemCollect', 'SavedItemGet', 'SavedItemGetV2'}
# A delivery a wish asks for outside a courier wish (STANDALONE: the Courier's Rasher, the Great
# Gourmand's) is handed over where an FSM compares it (ObjectCompare): the Couriers' «Couriers Quest
# Giver» in Bellhart, whose Begin Quest? checks what was bought from their shop (read on 21-Oct-2026).
STANDALONE = 'DeliveryQuestItemStandalone'
TARGET_CLASSES = ('CollectableItemBasic', 'CollectableItemStates', 'CollectableItemStack', STANDALONE)
# What says where an enemy that drops a target is (the Flintbeetles): the bool its death sets, and
# the bools that take it (or a parent) away.
SPAWN = {'EnemyDeathEffectsRegular', 'DeactivateIfPlayerdataTrue', 'DeactivateIfPlayerdataFalse'}
FSM_OBJECT = 24   # PlayMaker's ParamDataType.FsmObject
FIELD = re.compile(rb'MushroomQuestFound\d')
MAX = 128
# What a wish wants that no target names: the Twisted Bud the Wood Witch takes for Rite of Rebirth
# (tools/gen-spots.js WISH_OF).
EXTRA = ['Wood Witch Item']
# Targets the Map already shows another way, left out: the Mossberries (their own layer) and Pale
# Oil (a piece of the 100%). The Mossberry Stew is kept: the Druid hands it over on asking
# (mosstown_02c's «Moss Creep NPC», Give Ingredient?, CollectableItemCollect), no berries taken.
ELSEWHERE = {'Mossberry', 'Pale_Oil'}
# The wish types whose emblem marks a place on the Map (tools/gen-spots.js TASKS: the deliveries,
# the Steel Sentinel's spots, the Herald's, the rescues and fights). It stops on a missing one.
EMBLEMS = {'Courier', 'Steel Sentinel', 'Herald', 'Wayfarer'}
# The objects whose FSM drops a wish's target at random while the wish is on, by name: the Silver
# Bells' (Quest Bell Dropper, Quest Bell Dropper (1)…, in belltown_04 and belltown_basement_03).
DROPPERS = ('Quest Bell Dropper',)
CHECK = 'CheckQuestStateV2'
# What gives a wish's target from the game's code, by component → the target: Hornet's Needle Phial
# takes Plasmium from a bud (LifebloodPustule). The buds the wish is done with stand under a
# TestGameObjectActivator that takes them away once GROWN is set (Alchemist's Assistant granted);
# the ones it brings (crawl_07's "After State", Act 3's large ones, each with a
# DeactivateIfPlayerdataFalse of it) are only for the Plasmium masks: left out.
BUDS = {'LifebloodPustule': 'Plasmium'}
GROWN = 'BlueScientistSceneryPustulesGrown'
CLS = None


def fail(msg):
    sys.exit('extract-wishes: ' + msg)


def aa(game):
    return os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')


def script_of(o):
    raw = o.get_raw_data()
    return CLS.get(struct.unpack_from('<q', raw, 20)[0]) if len(raw) >= 28 else None


def init(cls):
    global CLS
    CLS = cls


def safe(name):
    """A sprite's name as a file's: lower case, anything but a letter, a digit or _ as _ (the Black
    Thread Core's list icon is named with spaces)."""
    return re.sub(r'\W+', '_', name.lower())


def getters(game, fields):
    """Each playerData bool an alt tests → its test: ['flag', field] when PlayerData keeps that field,
    or, when it has a getter instead, what the getter compares: `ldarg.0; ldfld f; ldc.i4 n; cgt;
    ret` (FleaGamesIsJugglingChampion: fleaGames_juggling_highscore > 30) → ['min', f, n + 1]. It
    stops on any other getter."""
    import dnfile
    from dncil.cil.body import CilMethodBody
    from dncil.cil.body.reader import CilMethodBodyReaderBase
    pe = dnfile.dnPE(os.path.join(game, DLL))

    class Reader(CilMethodBodyReaderBase):
        def __init__(self, row):
            self.offset = pe.get_offset_from_rva(row.Rva)

        def read(self, n):
            data = pe.get_data(pe.get_rva_from_offset(self.offset), n)
            self.offset += n
            return data

        def tell(self):
            return self.offset

        def seek(self, off):
            self.offset = off
            return off
    td = next((t for t in pe.net.mdtables.TypeDef.rows if str(t.TypeName) == 'PlayerData'), None) or fail('no PlayerData in Assembly-CSharp')
    own = {str(f.row.Name) for f in td.FieldList}
    methods = {str(m.row.Name): m.row for m in td.MethodList}
    out = {}
    for f in fields:
        if f in own:
            out[f] = ['flag', f]
            continue
        m = methods.get('get_' + f) or fail(f'PlayerData has neither a field nor a getter {f}')
        ins = [(i.mnemonic, i.operand) for i in CilMethodBody(Reader(m)).instructions]
        names = [x[0] for x in ins]
        if names != ['ldarg.0', 'ldfld', names[2], 'cgt', 'ret'] or not names[2].startswith('ldc.i4'):
            fail(f'PlayerData.{f}: a getter that isn\'t "a field > n" ({names})')
        field = str(pe.net.mdtables.Field.rows[ins[1][1].rid - 1].Name)
        n = ins[2][1] if ins[2][1] is not None else int(names[2].split('.')[-1])
        out[f] = ['min', field, int(n) + 1]
    return out


def scene(args):
    """One scene: its pickups, givers and enemy drops of the targets, where it ends a quest, the
    Herald's fields."""
    import warnings
    warnings.filterwarnings('ignore')
    path, targets, corpses, alt_at = args
    name = os.path.basename(path)[:-len('.bundle')]
    env = UnityPy.load(path)
    T = {o.path_id: o.read() for o in env.objects if o.type.name == 'Transform'}
    of_go = {t.m_GameObject.m_PathID: t for t in T.values()}

    world = world_of(T, of_go, 2)   # its place, its parents' turns counted (tools/scene_place.py)

    def at(af, r):
        """A reference in assets file af → (name, class) of a quest or a target, or None."""
        if not isinstance(r, dict) or not r.get('m_PathID'):
            return None
        cab = af.name if r['m_FileID'] == 0 else af.externals[r['m_FileID'] - 1].path.split('/')[-1]
        return targets.get(cab.lower(), {}).get(r['m_PathID'])

    bools, found = {}, []   # GameObject → its PersistentBoolItem's ID; (kind, gid, …)
    semi = set()   # the GameObjects whose PersistentBoolItem is semi-persistent (never in the save)
    spawn = {}   # GameObject → its SPAWN components, read only for an enemy that drops a target
    bool_go = {}   # a PersistentBoolItem → its GameObject
    switch = []   # the TestGameObjectActivators, read only for a bud
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        cls = script_of(o)
        if cls in SPAWN:
            spawn.setdefault(struct.unpack_from('<q', o.get_raw_data(), 4)[0], []).append((cls, o))
            continue
        if cls == 'TestGameObjectActivator':
            switch.append(o)
            continue
        if cls not in ('CollectableItemPickup', 'PersistentEnemyItemDrop', 'PersistentBoolItem', 'PlayMakerFSM', *BUDS):
            continue
        raw = o.get_raw_data()
        gid = struct.unpack_from('<q', raw, 4)[0]
        if cls in BUDS:
            found.append((cls, gid, o.read_typetree()['persistentBroken']['m_PathID']))
            continue
        if cls == 'PlayMakerFSM':
            hit = FIELD.findall(raw)
            ext = {e.path.split('/')[-1].lower() for e in o.assets_file.externals}
            if not hit and not ext & targets.keys():
                continue
            tt = o.read_typetree()
            var = {v['name']: v.get('value') for v in (tt['fsm'].get('variables') or {}).get('objectVariables') or []}
            ends, gives, checks, offers, kills = set(), set(), set(), set(), set()
            for st in tt['fsm'].get('states') or []:
                ad = st['actionData']
                starts = ad['actionStartIndex']
                for j, (ty, pos) in enumerate(zip(ad['paramDataType'], ad['paramDataPos'])):
                    if ty != FSM_OBJECT:
                        continue
                    action = ad['actionNames'][bisect.bisect_right(starts, j) - 1].split(',')[0].split('.')[-1]
                    p = ad['fsmObjectParams'][pos]
                    # A quest through an object variable: its default value (the couriers' FSMs).
                    ref = at(o.assets_file, var.get(p.get('name')) if p.get('useVariable') else p.get('value'))
                    if not ref:
                        continue
                    if action in END and ref[1] in ('Quest', 'MainQuest'):
                        ends.add(ref[0])
                    elif (action in GIVE and ref[1] not in ('Quest', 'MainQuest', 'SubQuest')) or (action == 'ObjectCompare' and ref[1] == STANDALONE):
                        gives.add(ref[0])
                    elif action == CHECK and ref[1] == 'Quest':
                        checks.add(ref[0])
                    elif action in OFFER and ref[1] == 'Quest':
                        offers.add(ref[0])
                    elif action in KILLED and ref[1] == KILL:
                        kills.add(ref[0])
            if ends or gives or hit or checks or offers or kills:
                found.append(('fsm', gid, sorted(ends), sorted(gives), sorted({h.decode() for h in hit}), sorted(checks), sorted(offers), sorted(kills)))
        elif cls == 'PersistentBoolItem':
            tt = o.read_typetree()
            bools[gid] = (tt.get('itemData') or {}).get('ID') or ''
            if (tt.get('itemData') or {}).get('IsSemiPersistent'):
                semi.add(gid)
            bool_go[o.path_id] = gid
        else:
            tt = o.read_typetree()
            ref = at(o.assets_file, tt.get('item'))
            if ref:
                found.append((cls, gid, ref))
    def spawned(gid):
        """An enemy that drops a target: the playerData bool its death sets (dead), and the bools its
        object and its parents need to be there (needs: field → value; a DeactivateIfPlayerdata<True|False>
        with no object of its own takes its own object away)."""
        dead, needs, g = None, {}, gid
        while g:
            for cls, o in spawn.get(g, []):
                tt = o.read_typetree()
                if cls == 'EnemyDeathEffectsRegular':
                    if g == gid:
                        dead = tt.get('setPlayerDataBool') or None
                elif tt.get('boolName') and not (tt.get('objectToDeactivate') or {}).get('m_PathID'):
                    needs[tt['boolName']] = cls == 'DeactivateIfPlayerdataFalse'
            t = of_go.get(g)
            f = t.m_Father.m_PathID if t is not None else 0
            g = T[f].m_GameObject.m_PathID if f in T else 0
        return {'dead': dead, 'needs': dict(sorted(needs.items()))}

    def grown(gid):
        """A bud: what GROWN must be for it to be there (True, False, or None when it doesn't
        matter), from the DeactivateIfPlayerdata<True|False>s of GROWN (on their objectToDeactivate,
        else their own object) and the TestGameObjectActivators of one test of GROWN (the object it
        activates is there when the test holds, the one it deactivates when it doesn't), on the bud
        or a parent."""
        tests = {}   # an object → the GROWN it's there with
        for host, cs in spawn.items():
            for cls, o in cs:
                tt = o.read_typetree()
                if cls != 'EnemyDeathEffectsRegular' and tt.get('boolName') == GROWN:
                    tests[(tt.get('objectToDeactivate') or {}).get('m_PathID') or host] = cls == 'DeactivateIfPlayerdataFalse'
        for o in switch:
            tt = o.read_typetree()
            groups = (tt.get('playerDataTest') or {}).get('TestGroups') or []
            if len(groups) == 1 and len(groups[0]['Tests']) == 1 and groups[0]['Tests'][0]['FieldName'] == GROWN:
                v = bool(groups[0]['Tests'][0]['BoolValue'])
                tests[tt['activateGameObject']['m_PathID']] = v
                tests[tt['deactivateGameObject']['m_PathID']] = not v
        need, g = set(), gid
        while g:
            if g in tests:
                need.add(tests[g])
            t = of_go.get(g)
            f = t.m_Father.m_PathID if t is not None else 0
            g = T[f].m_GameObject.m_PathID if f in T else 0
        if len(need) > 1:
            fail(f'{name}: a bud there both before and after {GROWN}')
        return need.pop() if need else None

    out = {'items': [], 'ends': [], 'fields': [], 'offers': [], 'alts': [], 'kills': []}
    # The objects that stand for an alt (ALT_AT), by their parent's name and their own.
    if alt_at:
        names = {g: t.m_GameObject.read().m_Name for g, t in of_go.items()}
        for gid, t in of_go.items():
            f = t.m_Father.m_PathID
            up = names.get(T[f].m_GameObject.m_PathID) if f in T else None
            for fld, at in alt_at.items():
                if up is not None and f'{up}/{names[gid]}' == at:
                    out['alts'].append([fld, name, names[gid], *world(gid)])
    # An enemy whose corpse ends a quest (corpses: a prefab's root, by its CAB and path id): the
    # wish is done where that enemy falls.
    pids = [struct.pack('<q', k) for c in corpses.values() for k in c]
    for gid, comps in spawn.items():
        for cls, o in comps:
            if cls != 'EnemyDeathEffectsRegular' or not any(p in o.get_raw_data() for p in pids):
                continue
            tt = o.read_typetree()
            refs = [tt.get('corpsePrefab')] + [r for a in tt.get('altCorpses') or [] for r in (a.values() if isinstance(a, dict) and 'm_PathID' not in a else [a])]
            for r in refs:
                if not isinstance(r, dict) or not r.get('m_PathID'):
                    continue
                af = o.assets_file
                cab = af.name if r['m_FileID'] == 0 else af.externals[r['m_FileID'] - 1].path.split('/')[-1]
                for q in corpses.get(cab.lower(), {}).get(r['m_PathID'], []):
                    out['ends'].append([q, name, of_go[gid].m_GameObject.read().m_Name, *world(gid), 'corpse'])
    for f in found:
        gid = f[1]
        try:
            go = of_go[gid].m_GameObject.read().m_Name
        except Exception:
            go = ''
        xy = world(gid)
        own = bools.get(gid)
        flag = (own or go) if own is not None else None
        if f[0] in BUDS:
            b = bool_go.get(f[2])
            if b is None:
                fail(f'{name}: a {f[0]} with no persistentBroken of its own')
            if grown(gid) is not True:
                out['items'].append([BUDS[f[0]], name, f[0], go, bools[b] or of_go[b].m_GameObject.read().m_Name, *xy])
        elif f[0] == 'CollectableItemPickup':
            if f[2][1] not in ('Quest', 'MainQuest'):   # one that only waits on a quest isn't the thing
                out['items'].append([f[2][0], name, f[0], go, flag, *xy])
        elif f[0] == 'PersistentEnemyItemDrop':
            # It names the quest, and drops its target (main() files it under the target).
            out['items'].append([f[2][0], name, f[0], go, f'{go}_item_{f[2][0]}', *xy, spawned(gid)])
        else:
            for q in f[2]:
                out['ends'].append([q, name, go, *xy])
            # One that offers a wish too is a person's (the Druid's «Moss Creep NPC»): its object's
            # bool is theirs, not the thing's (false in every save, the stew given or not).
            for it in f[3]:
                out['items'].append([it, name, 'PlayMakerFSM', go, None if f[6] else flag, *xy])
            for fld in f[4]:
                out['fields'].append([fld, name, go, *xy])
            for q in f[6]:
                out['offers'].append([q, name, go, *xy])
            # An enemy whose kill a wish counts (a Black Thread Core), by the saved bool of its own
            # object: one with none, or a semi-persistent one, the save can't follow.
            if own is not None and gid not in semi:
                for rec in f[7]:
                    out['kills'].append([rec, name, go, flag, *xy])
            # A dropper: the wish it checks (main() files it under the wish's target).
            if go.startswith(DROPPERS):
                for q in f[5]:
                    out['items'].append([q, name, 'QuestDropper', go, None, *xy])
    return out


def prefab(args):
    """One bundle that isn't a scene: the PlayMakerFSMs that end a quest (as scene() reads them),
    by the prefab they're in: {CAB lower: {its root GameObject's path id: [quest]}}."""
    import warnings
    warnings.filterwarnings('ignore')
    path, targets = args
    out = {}
    try:
        env = UnityPy.load(path)
    except Exception:
        return out
    T = None
    for o in env.objects:
        if o.type.name != 'MonoBehaviour' or not {e.path.split('/')[-1].lower() for e in o.assets_file.externals} & targets.keys():
            continue
        if script_of(o) != 'PlayMakerFSM':
            continue
        tt = o.read_typetree()
        var = {v['name']: v.get('value') for v in (tt['fsm'].get('variables') or {}).get('objectVariables') or []}
        ends = set()
        for st in tt['fsm'].get('states') or []:
            ad = st['actionData']
            starts = ad['actionStartIndex']
            for j, (ty, pos) in enumerate(zip(ad['paramDataType'], ad['paramDataPos'])):
                if ty != FSM_OBJECT:
                    continue
                action = ad['actionNames'][bisect.bisect_right(starts, j) - 1].split(',')[0].split('.')[-1]
                p = ad['fsmObjectParams'][pos]
                r = var.get(p.get('name')) if p.get('useVariable') else p.get('value')
                if action not in END or not isinstance(r, dict) or not r.get('m_PathID'):
                    continue
                af = o.assets_file
                cab = af.name if r['m_FileID'] == 0 else af.externals[r['m_FileID'] - 1].path.split('/')[-1]
                ref = targets.get(cab.lower(), {}).get(r['m_PathID'])
                if ref and ref[1] in ('Quest', 'MainQuest'):
                    ends.add(ref[0])
        if not ends:
            continue
        if T is None:
            T = {t.path_id: t.read() for t in env.objects if t.type.name == 'Transform'}
            of_go = {t.m_GameObject.m_PathID: t for t in T.values()}
        g = struct.unpack_from('<q', o.get_raw_data(), 4)[0]
        while of_go.get(g) is not None and of_go[g].m_Father.m_PathID in T:   # up to the prefab's root
            g = T[of_go[g].m_Father.m_PathID].m_GameObject.m_PathID
        out.setdefault(o.assets_file.name.lower(), {}).setdefault(g, set()).update(ends)
    return {c: {g: sorted(q) for g, q in d.items()} for c, d in out.items()}


def pins(game):
    """The map's quest pins (Main Quest Pins) and its bench pins, in world units."""
    base = aa(game)
    mono = next(os.path.join(base, f) for f in os.listdir(base) if f.endswith('_monoscripts.bundle'))
    atl = os.path.join(base, 'atlases_assets_assets', 'sprites', '_atlases')
    env = UnityPy.load(os.path.join(base, 'maps_assets_all.bundle'), mono, *[os.path.join(atl, f'{a}.spriteatlas.bundle') for a in ('hornet_map', 'hornet_map_patch')])
    cls, T = {}, {}
    for o in env.objects:
        if o.type.name == 'MonoScript':
            cls[o.path_id] = o.read().m_ClassName
        elif o.type.name in ('Transform', 'RectTransform'):
            T[o.path_id] = o.read()
    of_go = {t.m_GameObject.m_PathID: t for t in T.values()}

    def chain(gid):
        t, out = of_go.get(gid), []
        while t is not None:
            out.append(t)
            f = t.m_Father.m_PathID
            t = T.get(f) if f else None
        return list(reversed(out))

    def world(ts):
        x = y = 0.0
        sx = sy = 1.0
        for t in ts:
            lp, ls = t.m_LocalPosition, t.m_LocalScale
            x, y = x + lp.x * sx, y + lp.y * sy
            sx, sy = sx * ls.x, sy * ls.y
        return [round(x, 3), round(y, 3)]

    quest_pins, benches = [], {}
    for o in env.objects:
        if o.type.name != 'GameObject':
            continue
        go = o.read()
        ts = chain(o.path_id)
        names = [t.m_GameObject.read().m_Name for t in ts]
        if not names or names[0] != 'Game_Map_Hornet':
            continue
        comps = [(getattr(c, 'component', c)).deref() for c in go.m_Components]
        if go.m_Name == 'Bench Pin' and len(names) >= 3:
            benches.setdefault(names[2].lower(), world(ts))
            continue
        if 'Main Quest Pins' not in names:
            continue
        sprite, marker, off = None, None, []
        for c in comps:
            if c.type.name == 'SpriteRenderer':
                try:
                    sprite = c.read().m_Sprite.read().m_Name
                except Exception:
                    sprite = None
            elif c.type.name == 'MonoBehaviour':
                tt = c.read_typetree()
                if cls.get(tt['m_Script']['m_PathID']) == 'QuestMapMarker':
                    marker = (c, tt)
                elif cls.get(tt['m_Script']['m_PathID']) == 'DeactivatePlayerDataTest':
                    off += [[[x['FieldName'], x['Type'], x['NumType'], x['IntValue']] for x in g['Tests']] for g in tt['test']['TestGroups']]
        if not marker or not sprite:
            continue
        c, tt = marker
        quest = ref_name(c, tt.get('quest'))
        item = ref_name(c, tt.get('collectableItem'))
        quest_pins.append([go.m_Name, sprite, quest, item, tt.get('targetSceneName') or '', *world(ts), off])
    return sorted(quest_pins), dict(sorted(benches.items()))


NAMES = {}   # (CAB lower, path id) → m_Name, of the data bundles


def ref_name(o, r):
    if not isinstance(r, dict) or not r.get('m_PathID'):
        return None
    af = o.assets_file
    cab = af.name if r['m_FileID'] == 0 else af.externals[r['m_FileID'] - 1].path.split('/')[-1]
    return NAMES.get((cab.lower(), r['m_PathID']))


def main(game):
    import warnings
    warnings.filterwarnings('ignore')
    base = aa(game)
    data = os.path.join(base, 'dataassets_assets_assets', 'dataassets')
    atl = os.path.join(base, 'atlases_assets_assets', 'sprites', '_atlases')
    mono = next(os.path.join(base, f) for f in os.listdir(base) if f.endswith('_monoscripts.bundle'))
    cls = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    init(cls)
    env = UnityPy.load(*[os.path.join(data, b) for b in DATA], *[os.path.join(atl, a + '.spriteatlas.bundle') for a in ATLASES])
    objs = {}
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        try:
            tt = o.read_typetree()
        except Exception:
            continue
        if tt.get('m_Name'):
            objs[(o.assets_file.name.lower(), o.path_id)] = (script_of(o), tt, o)
            NAMES[(o.assets_file.name.lower(), o.path_id)] = tt['m_Name']

    def ref(o, r):
        if not isinstance(r, dict) or not r.get('m_PathID'):
            return None
        af = o.assets_file
        cab = af.name if r['m_FileID'] == 0 else af.externals[r['m_FileID'] - 1].path.split('/')[-1]
        return objs.get((cab.lower(), r['m_PathID']))

    icons = {}   # sprite name (safe) → the sprite

    def sprite(p):
        try:
            s = p.read()
        except Exception:
            return None
        icons[safe(s.m_Name)] = s
        return safe(s.m_Name)

    def icon(o, field):
        return sprite(getattr(o.read(), field, None))

    quests, targets, alts = {}, {}, {}
    for (cab, pid), (c, tt, o) in objs.items():
        if c not in ('Quest', 'MainQuest'):
            continue
        typ = ref(o, tt.get('questType'))
        want, counts = [], []
        for i, t in enumerate(tt.get('targets') or []):
            hit = ref(o, t.get('Counter'))
            if hit:
                want.append(hit[1]['m_Name'])
                counts.append(t.get('Count'))
            if hit and hit[0] in TARGET_CLASSES + (KILL,):
                targets.setdefault(hit[2].assets_file.name.lower(), {})[hit[2].path_id] = (hit[1]['m_Name'], hit[0])
            # An alt: no Counter, an AltTest of one bool and a picture of its own (a wish's, not an
            # objective's: the Bellshrines are a layer of their own).
            groups = (t.get('AltTest') or {}).get('TestGroups') or []
            if not hit and c == 'Quest' and (t.get('AltSprite') or {}).get('m_PathID') and len(groups) == 1 and len(groups[0]['Tests']) == 1 \
                    and groups[0]['Tests'][0]['Type'] == 0 and groups[0]['Tests'][0]['BoolValue']:
                read = o.read().targets[i]
                alts.setdefault(tt['m_Name'], []).append({'field': groups[0]['Tests'][0]['FieldName'],
                                                          'icon': sprite(read.AltSprite if hasattr(read, 'AltSprite') else read['AltSprite']),
                                                          'name': (t.get('ItemName') or {}).get('Key')})
        q = {'main': c == 'MainQuest', 'targets': want, 'counts': counts}
        if typ:
            q['type'] = typ[1]['m_Name']
            q['emblem'] = icon(typ[2], 'icon')
        quests[tt['m_Name']] = q
        targets.setdefault(cab, {})[pid] = (tt['m_Name'], c)
    # The targets' own sprites, by name (icon() above kept them by sprite), and a Journal record's
    # name, its entry's key.
    item_icon, item_name, kill_name = {}, {}, {}
    for (cab, pid), (c, tt, o) in objs.items():
        if c == KILL and any(tt['m_Name'] in q['targets'] for q in quests.values()):
            kill_name[tt['m_Name']] = (tt.get('displayName') or {}).get('Key')
        if c in TARGET_CLASSES and (tt['m_Name'] in EXTRA or any(tt['m_Name'] in q['targets'] for q in quests.values())):
            targets.setdefault(cab, {})[pid] = (tt['m_Name'], c)
            s = icon(o, 'icon')
            if s:
                item_icon[tt['m_Name']] = s
            item_name[tt['m_Name']] = (tt.get('displayName') or {}).get('Key')
    for q, xs in alts.items():
        for a in xs:
            if a['field'] not in ALT_AT:
                fail(f'{q} asks for {a["field"]}, which ALT_AT doesn\'t place')
            if not a['icon'] or not a['name']:
                fail(f'{q}: {a["field"]} with no picture or no name')
    tests = getters(game, [a['field'] for xs in alts.values() for a in xs])
    alt_at = {a['field']: ALT_AT[a['field']] for xs in alts.values() for a in xs}
    if len(quests) < 70:
        fail(f'only {len(quests)} quests: the bundles changed')
    sdir = os.path.join(base, 'scenes_scenes_scenes')
    paths = sorted(os.path.join(sdir, f) for f in os.listdir(sdir) if f.endswith('.bundle') and f != 'menu_title.bundle')
    # The prefabs (every bundle but the scenes) whose FSM ends a quest: the bosses' corpses.
    others = sorted(os.path.join(r, f) for r, _, fs in os.walk(base) if os.path.abspath(r) != os.path.abspath(sdir) for f in fs if f.endswith('.bundle'))
    items, ends, fields, offers, corpses, alt_spots, kills = {}, {}, {}, {}, {}, {}, {}
    with ProcessPoolExecutor(min(12, os.cpu_count() or 1), initializer=init, initargs=(cls,)) as ex:
        for r in ex.map(prefab, [(p, targets) for p in others], chunksize=2):
            for c, d in r.items():
                corpses.setdefault(c, {}).update(d)
        if not corpses:
            fail('no prefab ends a quest: the bosses\' corpses changed')
        for r in ex.map(scene, [(p, targets, corpses, alt_at) for p in paths], chunksize=2):
            for x in r['alts']:
                alt_spots.setdefault(x[0], []).append(x[1:])
            for x in r['kills']:
                kills.setdefault(x[0], []).append(x[1:])
            for x in r['items']:
                q = quests.get(x[0])
                if (q['targets'][0] if q else x[0]) in ELSEWHERE:
                    continue
                items.setdefault(q['targets'][0] if q else x[0], []).append(x[1:])
            for x in r['ends']:
                ends.setdefault(x[0], []).append(x[1:])
            for x in r['fields']:
                fields.setdefault(x[0], []).append(x[1:])
            for x in r['offers']:
                offers.setdefault(x[0], []).append(x[1:])
    if not items.get('Plasmium'):
        fail('no Plasmium bud found in the scenes: LifebloodPustule changed')
    if len(kills.get('Black Thread Core') or []) < 40:
        fail(f'{len(kills.get("Black Thread Core") or [])} Black Thread Cores with a bool of their own: RecordJournalKill changed')
    kills = {k: {'name': kill_name.get(k) or fail(f'no Journal name for {k}'), 'at': sorted(v, key=lambda x: [str(y) for y in x])} for k, v in sorted(kills.items())}
    # Each alt with its test and the one place that stands for it.
    for q, xs in alts.items():
        for a in xs:
            at = alt_spots.get(a['field']) or []
            if len(at) != 1:
                fail(f'{q}: {a["field"]} stands at {len(at)} places ({ALT_AT[a["field"]]})')
            a['test'], a['at'] = tests[a['field']], at[0]
    qpins, benches = pins(game)
    if len(qpins) < 50 or len(benches) < 40:
        fail(f'{len(qpins)} quest pins, {len(benches)} bench pins on the map: Game_Map_Hornet changed')
    # The pictures the Map uses: each wish type's emblem, the targets found in a scene and the alts'.
    item_icon = {k: v for k, v in item_icon.items() if k in items}
    used = {q['emblem'] for q in quests.values() if q.get('type') in EMBLEMS} | set(item_icon.values()) | {a['icon'] for xs in alts.values() for a in xs}
    os.makedirs(ICONS, exist_ok=True)
    for n, s in sorted(icons.items()):
        if n not in used:
            continue
        im = s.image.convert('RGBA')
        im = im.crop(im.getbbox())
        im.thumbnail((MAX, MAX))
        im.save(os.path.join(ICONS, n + '.webp'), 'WEBP', quality=90, method=6)
    srt = lambda d: {k: sorted(v, key=lambda x: [str(y) for y in x]) for k, v in sorted(d.items())}
    out = {'quests': dict(sorted(quests.items())), 'icons': dict(sorted(item_icon.items())), 'names': {k: v for k, v in sorted(item_name.items()) if k in items}, 'items': srt(items), 'ends': srt(ends),
           'fields': srt(fields), 'offers': srt(offers), 'alts': dict(sorted(alts.items())), 'kills': kills, 'pins': qpins, 'benches': benches}
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f'{len(quests)} quests, {len(items)} targets found in the scenes, {sum(len(x) for x in alts.values())} alts, '
          f'{", ".join(f"{len(v["at"])} {k}" for k, v in kills.items())} to kill, {len(ends)} quests ended in one, {len(fields)} fields, '
          f'{len(qpins)} quest pins, {len(icons)} icons → {os.path.relpath(OUT)} ({os.path.getsize(OUT) // 1024} KB)')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
