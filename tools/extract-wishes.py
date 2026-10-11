"""tools/extract-wishes.py: where the wishes and the main objectives are done, from the game's own
files, into kb/data/game/wishes.json (tools/gen-spots.js reads it, offline), and the pictures the
Map marks them with, into assets/map/icons/. Needs the game installed and UnityPy, as
tools/extract-pickups.py:
    /tmp/unitypy/bin/python tools/extract-wishes.py "<Steam>/steamapps/common/Hollow Knight Silksong"
About a minute (every scene, in parallel). Re-run it after a patch.

What it reads (read on 11-Oct-2026, patch 1.0.30000):
  questsystem/quests.bundle, mainquests.bundle  each quest (Quest, MainQuest): its type
      (questsystem/types.bundle: the wish's emblem, typeIcon) and what it asks for (targets: a
      Collectable by reference).
  scenes_scenes_scenes/*.bundle  in every scene:
      - each CollectableItemPickup of a wish's target (the thing lying there), each PlayMakerFSM
        that collects one (CollectableItemCollect, the Pollip Hearts' flowers) or gives one
        (SavedItemGet: the Maiden's and the Hermit's Souls), and each PersistentEnemyItemDrop (the
        Flintbeetles: it names the quest, and drops its target): [scene, component, object, bool, x, y],
        bool the sceneData flag the object keeps (its PersistentBoolItem's ID, else the object's
        name; a PersistentEnemyItemDrop's is "<object>_item_<quest>"), null when it has none;
      - where the game ends each quest: a PlayMakerFSM action EndQuest, EndQuestV2 or
        TryEndQuestV2 whose quest parameter is that quest (as tools/extract-quests.py maps an
        offer): [scene, object, x, y];
      - the FSMs that name a playerData field MushroomQuestFound<n> (the Herald's seven spots).
  maps_assets_all.bundle  the map's own quest pins (Game_Map_Hornet / Main Quest Pins: each a
      QuestMapMarker with its quest, or the delivery item it stands for, and the scene it's for
      when the save chooses among several: the Steel Sentinel's), in world units, with the bench
      pins' world places (tools/gen-spots.js puts the quest pins on the map by them).
  collectables/collectableitems.bundle  each target's name in the game's text (displayName).
  atlases: each target's inventory sprite and the emblems of EMBLEMS' wish types, saved to
      assets/map/icons/<sprite, lower case>.webp, at most 128 px.
Every [scene, …] ends with the object's place in the world, its Transforms composed. Scene names
are the bundles', lower case. """
import bisect, json, os, re, struct, sys
from concurrent.futures import ProcessPoolExecutor
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'kb', 'data', 'game', 'wishes.json')
ICONS = os.path.join(HERE, '..', 'assets', 'map', 'icons')
DATA = ['questsystem/quests.bundle', 'questsystem/mainquests.bundle', 'questsystem/types.bundle', 'collectables/collectableitems.bundle']
ATLASES = ['inventory', 'inventory_furniture_items']
END = {'EndQuest', 'EndQuestV2', 'TryEndQuestV2'}
GIVE = {'CollectableItemCollect', 'SavedItemGet', 'SavedItemGetV2'}
FSM_OBJECT = 24   # PlayMaker's ParamDataType.FsmObject
FIELD = re.compile(rb'MushroomQuestFound\d')
MAX = 128
# What a wish wants that no target names: the Twisted Bud the Wood Witch takes for Rite of Rebirth
# (tools/gen-spots.js WISH_OF).
EXTRA = ['Wood Witch Item']
# Targets the Map already shows another way, left out: the Mossberries (their own layer), Pale Oil
# (a piece of the 100%), the Mossberry Stew (the Druid makes it from the berries).
ELSEWHERE = {'Mossberry', 'Pale_Oil', 'Mossberry Stew'}
# The wish types whose emblem marks a place on the Map (tools/gen-spots.js TASKS: the deliveries,
# the Steel Sentinel's spots, the Herald's, the rescues and fights). It stops on a missing one.
EMBLEMS = {'Courier', 'Steel Sentinel', 'Herald', 'Wayfarer'}
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


def scene(args):
    """One scene: its pickups, givers and enemy drops of the targets, where it ends a quest, the
    Herald's fields."""
    import warnings
    warnings.filterwarnings('ignore')
    path, targets = args
    name = os.path.basename(path)[:-len('.bundle')]
    env = UnityPy.load(path)
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
        return [round(x, 2), round(y, 2)] if chain else []

    def at(af, r):
        """A reference in assets file af → (name, class) of a quest or a target, or None."""
        if not isinstance(r, dict) or not r.get('m_PathID'):
            return None
        cab = af.name if r['m_FileID'] == 0 else af.externals[r['m_FileID'] - 1].path.split('/')[-1]
        return targets.get(cab.lower(), {}).get(r['m_PathID'])

    bools, found = {}, []   # GameObject → its PersistentBoolItem's ID; (kind, gid, …)
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        cls = script_of(o)
        if cls not in ('CollectableItemPickup', 'PersistentEnemyItemDrop', 'PersistentBoolItem', 'PlayMakerFSM'):
            continue
        raw = o.get_raw_data()
        gid = struct.unpack_from('<q', raw, 4)[0]
        if cls == 'PlayMakerFSM':
            hit = FIELD.findall(raw)
            ext = {e.path.split('/')[-1].lower() for e in o.assets_file.externals}
            if not hit and not ext & targets.keys():
                continue
            tt = o.read_typetree()
            var = {v['name']: v.get('value') for v in (tt['fsm'].get('variables') or {}).get('objectVariables') or []}
            ends, gives = set(), set()
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
                    elif action in GIVE and ref[1] not in ('Quest', 'MainQuest', 'SubQuest'):
                        gives.add(ref[0])
            if ends or gives or hit:
                found.append(('fsm', gid, sorted(ends), sorted(gives), sorted({h.decode() for h in hit})))
        elif cls == 'PersistentBoolItem':
            tt = o.read_typetree()
            bools[gid] = (tt.get('itemData') or {}).get('ID') or ''
        else:
            tt = o.read_typetree()
            ref = at(o.assets_file, tt.get('item'))
            if ref:
                found.append((cls, gid, ref))
    out = {'items': [], 'ends': [], 'fields': []}
    for f in found:
        gid = f[1]
        try:
            go = of_go[gid].m_GameObject.read().m_Name
        except Exception:
            go = ''
        xy = world(gid)
        own = bools.get(gid)
        flag = (own or go) if own is not None else None
        if f[0] == 'CollectableItemPickup':
            if f[2][1] not in ('Quest', 'MainQuest'):   # one that only waits on a quest isn't the thing
                out['items'].append([f[2][0], name, f[0], go, flag, *xy])
        elif f[0] == 'PersistentEnemyItemDrop':
            # It names the quest, and drops its target (main() files it under the target).
            out['items'].append([f[2][0], name, f[0], go, f'{go}_item_{f[2][0]}', *xy])
        else:
            for q in f[2]:
                out['ends'].append([q, name, go, *xy])
            for it in f[3]:
                out['items'].append([it, name, 'PlayMakerFSM', go, flag, *xy])
            for fld in f[4]:
                out['fields'].append([fld, name, go, *xy])
    return out


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
        sprite, marker = None, None
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
        if not marker or not sprite:
            continue
        c, tt = marker
        quest = ref_name(c, tt.get('quest'))
        item = ref_name(c, tt.get('collectableItem'))
        quest_pins.append([go.m_Name, sprite, quest, item, tt.get('targetSceneName') or '', *world(ts)])
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

    icons = {}   # sprite name → the sprite

    def icon(o, field):
        p = getattr(o.read(), field, None)
        try:
            s = p.read()
        except Exception:
            return None
        icons[s.m_Name] = s
        return s.m_Name.lower()

    quests, targets = {}, {}
    for (cab, pid), (c, tt, o) in objs.items():
        if c not in ('Quest', 'MainQuest'):
            continue
        typ = ref(o, tt.get('questType'))
        want = []
        for t in tt.get('targets') or []:
            hit = ref(o, t.get('Counter'))
            if hit:
                want.append(hit[1]['m_Name'])
            if hit and hit[0] in ('CollectableItemBasic', 'CollectableItemStates', 'CollectableItemStack'):
                targets.setdefault(hit[2].assets_file.name.lower(), {})[hit[2].path_id] = (hit[1]['m_Name'], hit[0])
        q = {'main': c == 'MainQuest', 'targets': want}
        if typ:
            q['type'] = typ[1]['m_Name']
            q['emblem'] = icon(typ[2], 'icon')
        quests[tt['m_Name']] = q
        targets.setdefault(cab, {})[pid] = (tt['m_Name'], c)
    # The targets' own sprites, by name (icon() above kept them by sprite).
    item_icon, item_name = {}, {}
    for (cab, pid), (c, tt, o) in objs.items():
        if c in ('CollectableItemBasic', 'CollectableItemStates', 'CollectableItemStack') and (tt['m_Name'] in EXTRA or any(tt['m_Name'] in q['targets'] for q in quests.values())):
            targets.setdefault(cab, {})[pid] = (tt['m_Name'], c)
            s = icon(o, 'icon')
            if s:
                item_icon[tt['m_Name']] = s
            item_name[tt['m_Name']] = (tt.get('displayName') or {}).get('Key')
    if len(quests) < 70:
        fail(f'only {len(quests)} quests: the bundles changed')
    sdir = os.path.join(base, 'scenes_scenes_scenes')
    paths = sorted(os.path.join(sdir, f) for f in os.listdir(sdir) if f.endswith('.bundle') and f != 'menu_title.bundle')
    items, ends, fields = {}, {}, {}
    with ProcessPoolExecutor(min(12, os.cpu_count() or 1), initializer=init, initargs=(cls,)) as ex:
        for r in ex.map(scene, [(p, targets) for p in paths], chunksize=2):
            for x in r['items']:
                q = quests.get(x[0])
                if (q['targets'][0] if q else x[0]) in ELSEWHERE:
                    continue
                items.setdefault(q['targets'][0] if q else x[0], []).append(x[1:])
            for x in r['ends']:
                ends.setdefault(x[0], []).append(x[1:])
            for x in r['fields']:
                fields.setdefault(x[0], []).append(x[1:])
    qpins, benches = pins(game)
    if len(qpins) < 50 or len(benches) < 40:
        fail(f'{len(qpins)} quest pins, {len(benches)} bench pins on the map: Game_Map_Hornet changed')
    # The pictures the Map uses: each wish type's emblem, and the targets found in a scene.
    item_icon = {k: v for k, v in item_icon.items() if k in items}
    used = {q['emblem'] for q in quests.values() if q.get('type') in EMBLEMS} | set(item_icon.values())
    os.makedirs(ICONS, exist_ok=True)
    for n, s in sorted(icons.items()):
        if n.lower() not in used:
            continue
        im = s.image.convert('RGBA')
        im = im.crop(im.getbbox())
        im.thumbnail((MAX, MAX))
        im.save(os.path.join(ICONS, n.lower() + '.webp'), 'WEBP', quality=90, method=6)
    srt = lambda d: {k: sorted(v, key=lambda x: [str(y) for y in x]) for k, v in sorted(d.items())}
    out = {'quests': dict(sorted(quests.items())), 'icons': dict(sorted(item_icon.items())), 'names': {k: v for k, v in sorted(item_name.items()) if k in items}, 'items': srt(items), 'ends': srt(ends),
           'fields': srt(fields), 'pins': qpins, 'benches': benches}
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f'{len(quests)} quests, {len(items)} targets found in the scenes, {len(ends)} quests ended in one, {len(fields)} fields, '
          f'{len(qpins)} quest pins, {len(icons)} icons → {os.path.relpath(OUT)} ({os.path.getsize(OUT) // 1024} KB)')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/.steam/steam/steamapps/common/Hollow Knight Silksong'))
