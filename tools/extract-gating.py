"""tools/extract-gating.py: what decides whether each thing the save keeps per room can be had, from
the game's own scenes, into kb/data/game/gating.json, which tools/gen-spots.js and
tools/gen-gauntlets.js read (offline) to give the Map's marks the checks the save really follows
(design/03-redesign.md, step 6, the save checks). Needs the game installed and UnityPy, as
tools/extract-pickups.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-gating.py "<Steam>/steamapps/common/Hollow Knight Silksong" [scene …] [--cache=<file>]
(with scenes, it prints what it reads of them and writes nothing; --cache=<file> keeps what the
whole scan read, pickled, for the runs that follow). Re-run it after a patch. It reads every scene (about ten minutes); kb/data/game/pickups.json is
tools/extract-pickups.py's, which this leaves alone.

What it writes (read on 16-Oct-2026, patch 1.0.30000, against the 77 files of the author's saves):
  items   each saved bool or int of the scenes (a PersistentBoolItem or PersistentIntItem, not
          semi-persistent, saved, its scene's), by "Scene|ID" as the save writes it, with what
          the scene says of it (only those with something to say):
            flags    playerData bools its own object's components set when it's worked, which the
                     save keeps instead of, or as well as, the object's bool: a Lever's or a
                     PersistentPressurePlate's playerDataBool, a Lever_tk2d's setPlayerDataBool, a
                     Slab lock's FSM "PD Bool", an ItemReceptacle's playerDataBool (given to the
                     item its `persistent` names, else to the nearest saved one above it). A Lever
                     with a playerDataBool never writes its own bool (Ant_17, Dust_05,
                     Room_CrowCourt: unset in every save, their flags set in 45 to 67). And the
                     bools a gate's own FSM sets as it opens (a Gate, TempGate, Trapdoor or
                     TrapBridgeExtend whose FSM has SetPlayerDataBool true with the name written
                     in: Slab_16's jail gate, struck open from above, sets slab_cloak_gate_reopened)
            removedBy playerData bools that switch the object, or one above it, off once set
                     (DeactivateIfPlayerdataTrue, but blackThreadWorld, below): the silk vines of
                     Mosshome go with defeatedBellBeast, Bone_East_04's wall with the one in
                     Bone_East_04b, a Secret Mask with the gate it hid
            withPerson the person its removedBy takes away with it: a DeactivateIfPlayerdataTrue above
                     it switches off a part of the scene that holds someone to talk to (a
                     PlayMakerNPC; their NpcDialogueTitle). Bone_12's second cell door goes with
                     Grindle's cell once Shellwood or Far Fields is reached or Widow beaten: he
                     gets out by himself, the door never broken, so it's gone, not opened
            breaks   the saved item its own FSM passes its break on to (its "Event Receiver"):
                     Coral_41's crust wall Tall (6) breaks Mid (20), which breaks Mid (21); each
                     break sets that wall's own Activated, so its own bool (read on 16-Oct-2026)
            partner  another saved item that is the other side of the same door: a Slab lock's FSM
                     "Partner Lock" (one lock each side of a cell's door; only the side used saves)
            world    'normal': gone once Act 3 begins (under a TestGameObjectActivator's
                     deactivated object testing blackThreadWorld, the scenes' «Normal World», or a
                     DeactivateIfPlayerdataTrue blackThreadWorld); 'act3': there only in Act 3
            mode     'steel': only in Steel Soul, 'normal': never in Steel Soul (a
                     TestGameObjectActivator testing permadeathMode: its activated object is Steel
                     Soul's, as the author's saves show, Coral_37's silkeater in the normal games
                     only, Dust_11's wall in the Steel Soul one only)
            demo     only in the demo (under a DeactivateIfPlayerdataFalse IsDemoMode, or the
                     scenes' "Demo States/Demo")
            never    switched off in the scene file (it or one above it) with nothing in the scene
                     that switches it on: no component points at that object and no FSM names it,
                     or only things never switched on themselves (Clover_04b's gates, worked by a
                     pressure plate nothing switches on). None of the author's saves has such a
                     bool, though their rooms were entered 8 to 73 times
            battle   a gate a battle shuts and opens again (a BattleScene's gates, a "BG Control"
                     FSM's), not a way that stays open
            inside   the nearest saved item above it (a mask inside a breakable wall: broken from
                     outside, the wall takes the mask with it, which then never saves)
  receptacles  each ItemReceptacle (a door a key opens) → [Scene, object, the saved item its
          `persistent` names or null, its playerDataBool or null, demo (true/false)]
  doors   each door a wish's test shuts (read on 30-Oct-2026): a TestGameObjectActivator testing
          one quest and no playerData, whose object it switches off once the test holds (the wall,
          not one that saves its own state: that one Hornet opens herself) lies within 3 units of
          a TransitionPoint, by "scene|door" in lower case → [quest, test]: 'accepted' (the wish
          taken, IsAccepted, which stays true once it's done), 'completable' or 'completed'.
          Hang_08's Song_Knight_Wall shuts the only way into Hang_17b, the Second Sentinel's arena
          where it gives the Reserve Bind, until Final Audience is taken; Ward_03's door into
          Ward_09, where Sherma gives a Spool Fragment, until Balm for the Wounded is; Bonegrave's
          Steel_Servant_Tunnel opens once Steel Sentinel can be handed in. tools/gen-spots.js
          gives what lies in a room every door into which a wish shuts that wish's opening (OPENS)
  patch   the game's version the scan read, as tools/extract-pickups.py writes it: npm run data stops
          if the two differ (tools/gating.js), so a patch re-extracts both
Scene names are the scene's own, as the save writes them (aa/catalog.bin), as extract-pickups.py. """
import json, os, pickle, re, struct, sys, warnings
import UnityPy
from scene_place import world_of

warnings.filterwarnings('ignore')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'gating.json')
SAVED = {'PersistentBoolItem', 'PersistentIntItem'}
FLAG_FIELDS = {('Lever', 'playerDataBool'), ('Lever_tk2d', 'setPlayerDataBool'), ('PersistentPressurePlate', 'playerDataBool')}
WORLD, MODE, DEMO = 'blackThreadWorld', 'permadeathMode', 'IsDemoMode'
GATES = {'Gate', 'TempGate', 'Trapdoor', 'TrapBridgeExtend'}
NEAR_DOOR = 3.0   # how far from its door a wish's wall stands (2.4 at Hang_08, 2.5 at Bonegrave)
# A quest test's fields → the door's test (the first one set: Song_Knight_Wall tests IsAccepted alone).
QUEST_TEST = [('CheckAccepted', 'IsAccepted', 'accepted'), ('CheckCompletable', 'IsCompletable', 'completable'), ('CheckCompleted', 'IsCompleted', 'completed')]


def set_bools(d):
    """The playerData bools an FSM sets true by a name written in (SetPlayerDataBool with literal
    boolName and value), from its actions' serialized parameters."""
    out = []
    for st in (d.get('fsm') or {}).get('states') or []:
        ad = st.get('actionData') or {}
        names, starts = ad.get('actionNames') or [], ad.get('actionStartIndex') or []
        pn, pt, pp = ad.get('paramName') or [], ad.get('paramDataType') or [], ad.get('paramDataPos') or []
        for i, a in enumerate(names):
            if a.split('.')[-1] != 'SetPlayerDataBool':
                continue
            got = {}
            for j in range(starts[i], starts[i + 1] if i + 1 < len(starts) else len(pn)):
                if pt[j] == 18:   # an FsmString
                    v = ad['fsmStringParams'][pp[j]]
                elif pt[j] == 17:   # an FsmBool
                    v = ad['fsmBoolParams'][pp[j]]
                else:
                    continue
                got[pn[j]] = None if v.get('useVariable') else v.get('value')
            if got.get('boolName') and got.get('value'):
                out.append(got['boolName'])
    return out


def fail(msg):
    sys.exit('extract-gating: ' + msg)


def pptr(v):
    return v.get('m_PathID') if isinstance(v, dict) and v.get('m_FileID') == 0 and v.get('m_PathID') else None


def tests_of(d):
    """A TestGameObjectActivator's or PlayerDataTest's fields, flattened: [FieldName…]."""
    out = []
    for g in ((d.get('playerDataTest') or {}).get('TestGroups') or []):
        for t in g.get('Tests') or []:
            if t.get('FieldName'):
                out.append(t)
    return out


def special(t):
    """Whether a test on blackThreadWorld or permadeathMode holds only in Act 3 / Steel Soul (True),
    only outside it (False), or can't say (None). A bool test holds when the field equals its
    BoolValue; permadeathMode is an enum (Type 3: 0 normal, 1 Steel Soul), compared with IntValue
    by NumType (0 equal, 3 not equal: Coral_37's "!= 0" shows its Steel object in the Steel Soul
    game only, Dust_11's "== 0" its normal one in the normal games only)."""
    if t.get('Type', 0) == 0:
        holds = lambda v: bool(v) == bool(t.get('BoolValue', 0))
    else:
        ops = {0: lambda a, b: a == b, 3: lambda a, b: a != b}
        op = ops.get(t.get('NumType', 0))
        if op is None:
            fail(f"a {t['FieldName']} test with NumType {t.get('NumType')}: special() needs reading again")
        holds = lambda v: op(int(v), t.get('IntValue', 0))
    a, b = holds(1), holds(0)
    return None if a == b else a


def scan(game, only=None):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    CLS = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    with open(os.path.join(aa, '..', 'catalog.bin'), 'rb') as fh:
        NAMES = {n.decode().lower(): n.decode() for n in re.findall(rb'([A-Za-z0-9_ ()-]+)\.unity', fh.read())}
    # The quests by their asset (a scene's quest test points at one in these bundles): their save names.
    qdir = os.path.join(aa, 'dataassets_assets_assets', 'dataassets', 'questsystem')
    QUESTS = {}
    for b in ('quests.bundle', 'mainquests.bundle'):
        for o in UnityPy.load(os.path.join(qdir, b)).objects:
            if o.type.name == 'MonoBehaviour':
                try:
                    QUESTS[(o.assets_file.name, o.path_id)] = o.read_typetree()['m_Name']
                except Exception:
                    pass
    sdir = os.path.join(aa, 'scenes_scenes_scenes')
    names = sorted(f[:-7] for f in os.listdir(sdir) if f.endswith('.bundle') and f != 'menu_title.bundle' and (not only or f[:-7] in only))
    items, receptacles, doors = {}, [], {}
    for n, scene in enumerate(names):
        if n % 50 == 0:
            print(f'{n}/{len(names)} {scene}', file=sys.stderr, flush=True)
        env = UnityPy.load(os.path.join(sdir, scene + '.bundle'))
        objs = list(env.objects)
        gos = {o.path_id: o.read() for o in objs if o.type.name == 'GameObject'}
        T = {o.path_id: o.read() for o in objs if o.type.name in ('Transform', 'RectTransform')}
        of_go = {t.m_GameObject.m_PathID: t for t in T.values()}
        comps, owner = {}, {}   # gid → [(class, object)]; a component's path id → its gid
        for o in objs:
            if o.type.name in ('GameObject', 'Transform', 'RectTransform'):
                continue
            raw = o.get_raw_data()
            if len(raw) < 12:
                continue
            gid = struct.unpack_from('<q', raw, 4)[0]
            if gid not in gos:
                continue
            owner[o.path_id] = gid
            cls = None
            if o.type.name == 'MonoBehaviour' and len(raw) >= 28:
                cls = CLS.get(struct.unpack_from('<q', raw, 20)[0])
            comps.setdefault(gid, []).append((cls or o.type.name, o))
        # The doors a wish's test shuts (the header's doors), before the scenes with nothing saved go.
        walls = [o for cs in comps.values() for c, o in cs if c == 'TestGameObjectActivator']
        if walls:
            world = world_of(T, of_go)
            exits = []
            for gid, cs in comps.items():
                for c, o in cs:
                    if c == 'TransitionPoint':
                        try:
                            if o.read_typetree().get('targetScene'):
                                exits.append((gos[gid].m_Name, world(gid)))
                        except Exception:
                            pass
            for o in walls:
                try:
                    d = o.read_typetree()
                except Exception:
                    continue
                qt, wall = d.get('questTests') or [], pptr(d.get('deactivateGameObject'))
                # A wall that saves its own state is one Hornet can open herself (Bone_East_16's
                # breakable wall, Hang_07's shortcut): not shut, a way the Map marks already.
                if len(qt) != 1 or tests_of(d) or wall not in gos or any(c in SAVED for c, _ in comps.get(wall, [])):
                    continue
                r = qt[0].get('Quest') or {}
                cab = o.assets_file.name if r.get('m_FileID') == 0 else o.assets_file.externals[r['m_FileID'] - 1].path.split('/')[-1]
                quest = QUESTS.get((cab, r.get('m_PathID'))) or fail(f'{scene}: a quest test points outside the quest bundles ({cab})')
                test = next((name for check, want, name in QUEST_TEST if qt[0].get(check) and qt[0].get(want)), None)
                at = world(wall)
                for door, p in exits:
                    if test and at and p and ((p[0] - at[0]) ** 2 + (p[1] - at[1]) ** 2) ** 0.5 <= NEAR_DOOR:
                        doors[f'{scene}|{door}'.lower()] = [quest, test]
        saved = [(gid, o) for gid, cs in comps.items() for c, o in cs if c in SAVED]
        if not saved:
            continue
        own = NAMES.get(scene) or fail(f'{scene} has no name in catalog.bin')

        def parent(gid):
            t = of_go.get(gid)
            f = t.m_Father.m_PathID if t is not None else 0
            return T[f].m_GameObject.m_PathID if f and f in T else None

        def chain(gid):
            out = []
            while gid is not None:
                out.append(gid)
                gid = parent(gid)
            return out

        def read(o):
            try:
                return o.read_typetree()
            except Exception:
                return {}

        # What switches things by the save, scene-wide: a TestGameObjectActivator's two objects, a
        # DeactivateIfPlayerdataTrue/False's (its objectToDeactivate, else its own).
        side = {}      # gid → [(field, True: shown only in Act 3 / Steel Soul, False: only outside it)]
        deact = {}     # gid → [(bool, True: switched off once set | False: switched off until set)]
        battle = set()   # gids a battle shuts and opens again: a BattleScene's gates, a "BG Control" FSM's
        battle_names = set()
        for gid, cs in comps.items():
            for c, o in cs:
                if c == 'TestGameObjectActivator':
                    d = read(o)
                    groups = [[t for t in g.get('Tests') or [] if t.get('FieldName')] for g in ((d.get('playerDataTest') or {}).get('TestGroups') or [])]
                    for f in (WORLD, MODE):
                        # Which way the test goes: only in the special state (Act 3, Steel Soul), or
                        # only outside it. With other tests beside it, only its activated side says.
                        ways = [special(t) for g in groups for t in g if t['FieldName'] == f]
                        if not ways or None in ways or len(set(ways)) > 1:
                            continue
                        alone = len(groups) == 1 and len(groups[0]) == 1
                        if not all(any(t['FieldName'] == f for t in g) for g in groups):
                            continue
                        for k, on in (('activateGameObject', True), ('deactivateGameObject', False)):
                            g = pptr(d.get(k))
                            if g in gos and (on or alone):
                                side.setdefault(g, []).append((f, ways[0] if on else not ways[0]))
                elif c == 'BattleScene':
                    g = pptr(read(o).get('gates'))
                    if g in gos:
                        battle.add(g)
                elif c == 'PlayMakerFSM' and (read(o).get('fsm') or {}).get('name') == 'BG Control':
                    battle_names.update(m.decode('latin1') for m in re.findall(rb'[\x20-\x7e]{3,}', o.get_raw_data()))
                elif c in ('DeactivateIfPlayerdataTrue', 'DeactivateIfPlayerdataFalse'):
                    d = read(o)
                    b = d.get('boolName')
                    if b:
                        g = pptr(d.get('objectToDeactivate'))
                        deact.setdefault(g if g in gos else gid, []).append((b, c.endswith('True')))
        # The saved items, by gid, and their IDs.
        sid = {}
        for gid, o in saved:
            d = read(o)
            it = d.get('itemData') or {}
            if it.get('IsSemiPersistent') or d.get('dontSave') or (it.get('SceneName') and it['SceneName'].lower() != scene):
                continue
            sid[gid] = it.get('ID') or gos[gid].m_Name
        rec = {gid: {} for gid in sid}

        def nearest_saved(gid, self_too):
            for g in chain(gid)[0 if self_too else 1:]:
                if g in sid:
                    return g
            return None
        # Flags the object's own components set; a Slab lock's FSM: its "PD Bool" and its "Partner Lock".
        fsm_names = {}   # an FSM's owner → the strings it carries (the names it finds things by)
        for gid, cs in comps.items():
            for c, o in cs:
                if c == 'PlayMakerFSM':
                    raw = o.get_raw_data()
                    runs = {m.decode('latin1') for m in re.findall(rb'[\x20-\x7e]{3,}', raw)}
                    fsm_names.setdefault(gid, set()).update(runs | {x for n in runs if '/' in n for x in n.split('/')})
                    if gid not in sid:
                        continue
                    d = read(o)
                    v = (d.get('fsm') or {}).get('variables') or {}
                    if any(c2 in GATES for c2, _ in comps.get(gid, [])):
                        rec[gid].setdefault('flags', []).extend(f for f in set_bools(d) if f not in rec[gid].get('flags', []))
                    for x in v.get('stringVariables') or []:
                        if x.get('name') == 'PD Bool' and x.get('value'):
                            rec[gid].setdefault('flags', []).append(x['value'])
                    for x in v.get('gameObjectVariables') or []:
                        g = pptr(x.get('value'))
                        if x.get('name') == 'Partner Lock' and g in sid:
                            rec[gid]['partner'] = sid[g]
                        if x.get('name') == 'Event Receiver' and owner.get(g, g) in sid and owner.get(g, g) != gid:
                            rec[gid]['breaks'] = sid[owner.get(g, g)]
                elif gid in sid and any((c, f) in FLAG_FIELDS for f in ('playerDataBool', 'setPlayerDataBool')):
                    d = read(o)
                    for f in ('playerDataBool', 'setPlayerDataBool'):
                        if (c, f) in FLAG_FIELDS and d.get(f):
                            rec[gid].setdefault('flags', []).append(d[f])
                if c == 'ItemReceptacle':
                    d = read(o)
                    p = owner.get(pptr(d.get('persistent')))
                    target = p if p in sid else nearest_saved(gid, True)
                    flag = d.get('playerDataBool') or None
                    if flag and target is not None:
                        rec[target].setdefault('flags', []).append(flag)
                    demo_r = any(gos[g].m_Name == 'Demo' and parent(g) is not None and gos[parent(g)].m_Name == 'Demo States' for g in chain(gid)) \
                        or any(b == DEMO and not on for g in chain(gid) for b, on in deact.get(g, []))
                    receptacles.append([own, gos[gid].m_Name, sid[p] if p in sid else None, flag, demo_r])
        # What's switched off in the file above a saved item, and which of those something switches
        # on: a component pointing at the object (its GameObject, its Transform or one of its
        # components; the first 12 bytes are a component's own GameObject), or an FSM naming it (a
        # name, or a part of a path it finds), or one of those pointing at or naming its parent
        # when that FSM switches on all of a thing's children (ActivateAllChildren: a chest's
        # prize). Only from something that is itself on, or switched on so: Clover_04b's two gates
        # are worked by a pressure plate that nothing switches on (a fixpoint over the scene).
        off_all = {g for gid in rec for g in chain(gid) if not gos[g].m_IsActive}
        cand = off_all | {parent(g) for g in off_all if parent(g) is not None}
        pats = {}
        for p, g in owner.items():
            if g in cand:
                pats[struct.pack('<iq', 0, p)] = g
        for tp, t in T.items():
            if t.m_GameObject.m_PathID in cand:
                pats[struct.pack('<iq', 0, tp)] = t.m_GameObject.m_PathID
        for g in cand:
            pats[struct.pack('<iq', 0, g)] = g
        edges = set()   # (who, what it switches on)
        for gg, said in fsm_names.items():
            for g in cand:
                if gg != g and gos[g].m_Name in said:
                    edges.add((gg, g))
        if pats:
            for gg, cs in comps.items():
                for c, o in cs:
                    if o.type.name != 'MonoBehaviour':
                        continue
                    raw = o.get_raw_data()[12:]
                    for p, g in pats.items():
                        if gg != g and p in raw:
                            edges.add((gg, g))
        children = {gg for gg, said in fsm_names.items() if any('ActivateAllChildren' in n for n in said)}
        edges |= {(gg, g) for gg, t in list(edges) if gg in children for g in off_all if parent(g) == t}
        woken = set()
        live = lambda g: all(gos[x].m_IsActive or x in woken or x not in off_all for x in chain(g))
        grew = True
        while grew:
            grew = False
            for gg, g in edges:
                if g in off_all and g not in woken and live(gg):
                    woken.add(g)
                    grew = True
        # Who stands in each part of the scene: every object above someone to talk to (a PlayMakerNPC)
        # → their name, a titled one's first (NpcDialogueTitle: the dump's <KEY>_MAIN), else the object's.
        person, named = {}, []
        for g2, cs in comps.items():
            if any(c == 'PlayMakerNPC' for c, _ in cs):
                title = next(((read(o).get('titles') or [{}])[0].get('Title') for c, o in cs if c == 'NpcDialogueTitle'), None)
                named.append((title is None, title or gos[g2].m_Name, g2))
        for _, title, g2 in sorted(named, key=lambda x: x[0]):
            for up in chain(g2):
                person.setdefault(up, title)
        # Each item's place among the switches above it.
        for gid, r in rec.items():
            ch = chain(gid)
            for g in ch:
                for f, sp in side.get(g, []):
                    if f == WORLD:
                        r['world'] = 'act3' if sp else 'normal'
                    else:
                        r['mode'] = 'steel' if sp else 'normal'
                if (g in battle or (g == gid and gos[g].m_Name in battle_names)) and not any(c == 'BattleScene' for c, _ in comps.get(gid, [])):
                    r['battle'] = True
                for b, on in deact.get(g, []):
                    if b == WORLD:
                        r['world'] = 'normal' if on else 'act3'
                    elif b == DEMO:
                        if not on:
                            r['demo'] = True
                    elif on:
                        r.setdefault('removedBy', []).append(b)
                        if g != gid and g in person:
                            r['withPerson'] = person[g]
                if gos[g].m_Name == 'Demo' and parent(g) is not None and gos[parent(g)].m_Name == 'Demo States':
                    r['demo'] = True
            up = nearest_saved(gid, False)
            if up is not None:
                r['inside'] = sid[up]
            if any(not gos[g].m_IsActive and g not in woken for g in ch):
                r['never'] = True
        # Several objects saved under one name (Bone_18's two arenas, one in each world): the flags
        # any of them sets, and what all of them share.
        by_key = {}
        for gid, r in rec.items():
            by_key.setdefault(own + '|' + sid[gid], []).append(r)
        for key, rs in by_key.items():
            m = {}
            flags = sorted({f for r in rs for f in r.get('flags', [])})
            if flags:
                m['flags'] = flags
            gone = sorted(set.intersection(*[set(r.get('removedBy', [])) for r in rs]))
            if gone:
                m['removedBy'] = gone
            for k in ('partner', 'world', 'mode', 'demo', 'never', 'inside', 'battle', 'withPerson', 'breaks'):
                vals = [r.get(k) for r in rs]
                if vals[0] is not None and all(v == vals[0] for v in vals):
                    m[k] = vals[0]
            if m:
                items[key] = m
    return items, receptacles, doors


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


def main(game, only=None, cache=None):
    got = pickle.load(open(cache, 'rb')) if cache and os.path.exists(cache) and not only else None
    items, receptacles, doors = got or scan(game, only)
    if cache and not got and not only:
        pickle.dump((items, receptacles, doors), open(cache, 'wb'))
    if only:   # a look at some scenes, nothing written
        print(json.dumps({'items': items, 'receptacles': receptacles, 'doors': doors}, indent=1))
        return
    kinds = {k: sum(1 for r in items.values() if k in r) for k in ('flags', 'removedBy', 'partner', 'world', 'mode', 'demo', 'never', 'inside', 'battle', 'withPerson', 'breaks')}
    if kinds['flags'] < 25 or kinds['world'] < 100 or kinds['partner'] < 4 or len(receptacles) < 8:
        fail(f'too few of something ({kinds}, {len(receptacles)} receptacles): the components need reading again')
    if doors.get('hang_08|right1') != ['Song Knight', 'accepted']:
        fail('Hang_08\'s Song_Knight_Wall no longer reads as Final Audience\'s at its door: the doors need reading again')
    out = {'items': dict(sorted(items.items())), 'receptacles': sorted(receptacles, key=lambda r: [str(x) for x in r]),
           'doors': dict(sorted(doors.items())), 'patch': game_patch(game)}
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f"{len(items)} items ({', '.join(f'{v} {k}' for k, v in kinds.items())}), {len(receptacles)} receptacles, {len(doors)} doors a wish shuts → {os.path.relpath(OUT)} ({os.path.getsize(OUT) // 1024} KB)")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-gating.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    cache = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--cache=')), None)
    main(args[0], [s.lower() for s in args[1:]], cache)
