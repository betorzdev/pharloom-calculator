"""tools/extract-journal-rooms.py — where each Hunter's Journal entry's enemies are, from the game's
own files, into js/journal-rooms.js: for each entry (its NAME_ key, as js/journal.js), the scenes
it's in and how many. Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-journal-rooms.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]
Re-run it after a patch that adds or moves enemies. The scan reads every scene (about ten minutes);
--cache=<file> keeps what it read (pickled) for the runs that follow.

Where it is (found on 28-Sep-2026): an enemy's EnemyDeathEffects (the game's class, abstract: the
components are EnemyDeathEffectsRegular, …NoEffect) points at its
EnemyJournalRecord, one of the 237 assets in journalrecords.bundle, whose displayName is the
entry's key (Journal sheet, NAME_<X>). Each scene is a bundle of its own; the enemies placed in
it (a gauntlet's waves too, waiting disabled) carry their EnemyDeathEffects, so counting them per
record gives where to find each entry: 208 of the 237 ('placed' in HOW).

The other 29 aren't placed: the game makes them at run time. For those, the scene holds what
names the record or what spawns it, read from the raw data of every component in the scene (a
reference is its file's index and the object's path id, 12 bytes, found without the type tree),
and each entry says in RUNTIME which objects count (by name) and how they make it:
  'record'  a component in the scene names the record itself: a boss's own object or its fight's
            Boss Scene FSM, a hazard's (each Sandcarver's attacker, each Stilkin's burrow), the
            Void Mass's core, the Void Tendrils' tablet (an inspect region), the Wisp lanterns.
            Every water names the Muckmaggots' record; only the MaggotRegions that are on count
            (overrideActive if set, else the scene's MapZone in the region's mask: Sinner's Road,
            Bilewater and Putrified Ducts, and one in the Wisp Thicket that's on everywhere).
  'spawn'   a component in the scene points at a prefab (the bundles outside the scenes) whose
            enemy carries the record, directly or through another prefab: a Gloomsac's cocoon
            and the Gargant Gloom, the Lifeseeds' Health Cocoon, the Shellwood Goomba's and Pond
            Skater's corpse (it lets the Gnats out), the Last Judge's own corpse.
  'duel'    Shakra and Garmond & Zaza: the FSM that makes them fight at Hornet's side names
            their record in every scene they're met in, but the entry is their duel's (RUNTIME).
A count for these is how many objects in the scene name it or spawn it, not how many enemies.
Nuu names every entry in her dialogue, and isn't where any of them is (NAMES_ONLY).
Two arenas aren't on the map or reached by a door (Lost Lace's cocoon and the Bell Eater's): each
is given as the scenes on the map that load it (LOADED).

It also prints, not writes, the health each record's enemies have in the game (HealthManager.hp,
on the same object) against js/enemies.js's, the wiki's: a check, since the site's numbers are the
wiki's (CLAUDE.md). """
import json, os, pickle, re, struct, sys
from collections import defaultdict, Counter
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
copy = lambda n: re.sub(r'\s*\(\d+\)$', '', n).strip()   # "Pond Skater (1)" is a Pond Skater
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'journal-rooms.js')
# The bundles outside the scenes worth reading for prefabs: not the art, the sound or the text.
SKIP = re.compile(r'^(sfx|herosfx|textures|utilitytextures|materials|animations|audiocues|tk2d|fonts|shaders|vibration|'
                  r'herocollections|journalrecords)|monoscripts|unitybuiltin')
# Objects that name entries without being where they are: Nuu, in her dialogue (Halfway_01).
NAMES_ONLY = {'Nuu'}
# The 29 entries the game makes at run time, each by the objects that are where it is (their names
# without the copy's " (1)"), how they make it and, for a duel, its scene. Anything else that names
# them isn't counted: the Wishes' board (the Void Mass's), the game manager's lists, a boss's shrine
# NPC. An entry that stops being placed, or one of these that no longer matches, stops the run.
RUNTIME = {
    # Bosses: the boss's own object in its arena, or its fight's Boss Scene FSM.
    'NAME_BLUE_ASSISTANT': ('record', 'Blue Assistant', None),             # Plasmified Zango, Crawl_10
    'NAME_CLOCKWORK_DANCER': ('record', 'Boss Scene', None),               # Cog_Dancers
    'NAME_CONDUCTOR_BOSS': ('record', 'Conductor Boss', None),             # The Unravelled, Ward_02_boss
    'NAME_DOCK_GUARD_THROWER': ('record', 'Boss Scene', None),             # Forebrothers, Dock_09
    'NAME_FIRST_WEAVER': ('record', 'First Weaver', None),                 # First Sinner, Slab_10b
    'NAME_GIANT_CENTIPEDE': ('record', 'Centipede Control', None),         # Bell Eater, its arena
    'NAME_GIANT_FLEA': ('record', 'Giant Flea', None),                     # Huge Flea, Arborium_08
    'NAME_LOST_LACE': ('record', 'Superjump Sequence', None),              # Lost Lace, her cocoon
    'NAME_PHANTOM': ('record', 'Phantom', None),                           # Organ_01
    'NAME_SILK_BOSS': ('record', 'Silk Boss', None),                       # Grand Mother Silk, Cradle_03
    'NAME_SPINNER_BOSS': ('record', 'Spinner Boss', None),                 # Widow, Belltown_Shrine
    'NAME_SWAMP_SHAMAN': ('record', 'Swamp Shaman', None),                 # Groal, Shadow_18
    'NAME_TROBBIO': ('record', 'Trobbio', None),                           # Library_13
    'NAME_TORMENTED_TROBBIO': ('spawn', 'Tormented Trobbio', None),        # Library_13, its prefab
    'NAME_WISP_PYRE_EFFIGY': ('record', 'Wisp Pyre Effigy', None),         # Father of the Flame, Belltown_08
    'NAME_ZAP_CORE_ENEMY': ('record', 'Zap Core Enemy', None),             # Voltvyrm, Coral_29
    'NAME_LAST_JUDGE': ('spawn', 'Last Judge', None),                      # its corpse, Coral_Judge_Arena
    # Hazards and hidden ones: the object that makes them.
    'NAME_MAGGOTS': ('record', 'Surface Water Region.*', None),            # Muckmaggots: the waters where on
    'NAME_SAND_CENTIPEDE': ('record', 'Sand Centipede Attacker', None),    # Sandcarver: each pit's attacker
    'NAME_SWAMP_MUCKMAN': ('record', 'Swamp Muckman.*', None),             # Stilkin: each burrow
    'NAME_CENTIPEDE_TRAP': ('record', 'Centipede Trap', None),             # Garpid, Border Caves
    # Void Mass: each core (Black_Thread_Core, _Citadel), 47 in 45 scenes, all of them Act 3's: each
    # carries a DeactivateIfPlayerdataFalse on blackThreadWorld, and all but one (Bone_East_26's)
    # sit under a Black Thread World object off by default, which a TestGameObjectActivator turns
    # on when blackThreadWorld is true. Styx's two (Dust_11) are in a battle scene under Steel Soul
    # States, only with permadeathMode off: Classic. Area by area the wiki's Location list agrees
    # (47, 45 in Steel Soul), read on 28-Sep-2026.
    'NAME_BLACK_THREAD_CORE': ('record', 'Black_Thread_Core.*', None),
    'NAME_ABYSS_TENDRIL': ('record', 'Inspect Region - Void Tendrils', None),  # their tablet, Abyss_08
    'NAME_WISP': ('record', 'Wisp Flame Lantern', None),                   # the lanterns that let them out
    # Summoned: what lets them out (a cocoon, a Gargant Gloom, a corpse).
    'NAME_GLOOMFLY': ('spawn', 'Gloomfly Cocoon.*|Gloom Beast', None),     # Gloomsac
    'NAME_LIFEBLOOD_FLY': ('spawn', 'Health Cocoon', None),                # Winged Lifeseed: Plasmium Cocoon
    'NAME_SHELLWOOD_GNAT': ('spawn', 'Pond Skater|Shellwood Goomba.*', None),  # from their corpses
    # Duels: the FSM that makes them fight at Hornet's side names their record in every scene they're
    # met in (Shakra's Attack Enemies, Garmond's Control), so only the duel's scene. Shakra's is the
    # game's own object, the Mapper Spar NPC (the wiki's "Greymoor Duel" map agrees). Garmond's is
    # the wiki's (the duel is on the roof above the Whispering Vaults): of the 17 scenes the game has
    # him in, Library_09 is the one in the Vaults, and the only one with a Garmond Scene FSM.
    'NAME_SHAKRA': ('duel', 'Mapper Spar NPC', 'greymoor_08_mapper'),
    'NAME_GARMOND_ZAZA': ('duel', 'Garmond Fighter', 'library_09'),
}
# Two arenas aren't on the map or reached by a door, so they're given as the scenes that load them,
# found by their names in the scenes' components: Lost Lace's cocoon is loaded by Last_Dive, which
# Abyss_05's Abyss Dive Cutscene loads; the Bell Eater's arena by Bellway_Centipede_additive, which
# each station's Bell Centipede Loader loads (in Act 3). The two arenas and the scenes in between.
LOADED = ('abyss_cocoon', 'last_dive', 'bellway_centipede_arena', 'bellway_centipede_additive')


def main(game, cache):
    if cache and os.path.exists(cache):
        where, hp, other, total, loads = pickle.load(open(cache, 'rb'))
    else:
        where, hp, other, total, loads = scan(game)
        if cache:
            pickle.dump((where, hp, other, total, loads), open(cache, 'wb'))
    # The scenes' names with their capitals, from js/graph.js and js/map.js.
    proper = {}
    for f in ('graph.js', 'map.js'):
        src = open(os.path.join(ROOT, 'js', f)).read()
        obj = json.loads(re.search(r'SS\.\w+ = (\{.*\});', src, re.S).group(1))
        for k in (obj['ROOMS'] if f == 'map.js' else list(obj) + [t for v in obj.values() for t in v]):
            proper.setdefault(k.lower(), k)

    def entered(scene, path=()):
        """A scene off the map: the scenes on it that load it, through the ones in between (LOADED).
        One that nothing loads stays as it is; a loader that leads nowhere is dropped."""
        if scene in proper or not loads.get(scene) or scene in path:
            return [scene] if scene in proper or not path else []
        return sorted({x for l in loads[scene] for x in entered(l, path + (scene,))}) or ([] if path else [scene])

    rooms, how, loaded = {}, {}, {}
    for key, scenes in where.items():
        rooms[key], how[key] = scenes, 'placed'
    for key, scenes in other.items():
        if key in rooms:   # placed: what spawns more of it isn't counted
            continue
        if key not in RUNTIME:
            sys.exit(f'extract-journal-rooms: {key} is made at run time and not in RUNTIME: read what names it')
        kind, who, only = RUNTIME[key]
        count = Counter()
        for scene, objs in scenes.items():
            if only and scene != only:
                continue
            for n, kinds in objs.values():
                if kind in kinds or kind == 'duel':
                    if re.fullmatch(who, copy(n or '')):
                        for at in entered(scene):
                            count[at] += 1
                            if at != scene:
                                loaded[key] = scene
        if not count:
            sys.exit(f'extract-journal-rooms: nothing named {who!r} makes {key} any more: RUNTIME needs reading again')
        rooms[key], how[key] = count, kind
    for key in RUNTIME:
        if key in where:
            print(f'{key} is placed now: RUNTIME can lose it', file=sys.stderr)
        elif key not in how:
            sys.exit(f'extract-journal-rooms: nothing names {key} any more: RUNTIME needs reading again')
    ROOMS = {k: sorted(([proper.get(s, s), n] for s, n in v.items()), key=lambda x: (-x[1], x[0])) for k, v in sorted(rooms.items())}
    HOW = {k: how[k] for k in sorted(how) if how[k] != 'placed'}
    open(OUT, 'w').write(
        "/* js/journal-rooms.js: where to find each Hunter's Journal entry, by its NAME_ key (js/journal.js) →\n"
        "   [scene, how many] in the scene, the most first.\n"
        "   GENERATED by tools/extract-journal-rooms.py from the game's own files: not edited by hand.\n"
        "   An enemy placed in a scene carries its EnemyJournalRecord (EnemyDeathEffects): how many is\n"
        "   how many enemies. One the game makes at run time is where something names its record or\n"
        "   spawns it (SS.journalHow: 'record', 'spawn' or 'duel'; the generator's header): how many is\n"
        "   how many objects do. SS.journalLoads: the entries whose arena is off the map, given as the\n"
        "   scenes that load it → that arena. */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.journalRooms = {json.dumps(ROOMS, separators=(',', ':'))};\n"
        f"  SS.journalHow = {json.dumps(HOW, separators=(',', ':'))};\n"
        f"  SS.journalLoads = {json.dumps(dict(sorted(loaded.items())), separators=(',', ':'))};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.journalRooms;\n})();\n")
    placed = sum(sum(v.values()) for v in where.values())
    print(f'{len(where)} entries placed, {placed} enemies in {len({s for v in where.values() for s in v})} scenes; '
          f'{len(HOW)} more by what makes them ({", ".join(f"{n} {k}" for k, n in sorted(Counter(HOW.values()).items()))}); '
          f'{len(ROOMS)} of {total} → js/journal-rooms.js ({os.path.getsize(OUT) // 1024} KB)')
    missing = total - len(ROOMS)
    if missing:
        print(f'{missing} entries nowhere', file=sys.stderr)
    # The game's health per entry, to set against the wiki's (js/enemies.js) by hand or by test.
    with open(os.path.join(os.environ.get('TMPDIR', '/tmp'), 'journal-hp.json'), 'w') as f:
        json.dump({k: dict(v) for k, v in hp.items()}, f)


def scan(game):
    """Every scene read once: where (key → scene → enemies placed), hp (key → health → how many),
    other (key → scene → {'record' | 'spawn': how many components}) and how many records."""
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    scenes = os.path.join(aa, 'scenes_scenes_scenes')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    CLS = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    sid = {v: k for k, v in CLS.items() if v in ('EnemyJournalRecord', 'HealthManager', 'CustomSceneManager', 'MaggotRegion')}
    # EnemyDeathEffects is abstract: the components placed are its subclasses (Regular, NoEffect…).
    DEATH = {k for k, v in CLS.items() if v.startswith('EnemyDeathEffects') and v != 'EnemyDeathEffectsProfile'}

    def script(o):
        raw = o.get_raw_data()
        return struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None

    # The records: (their file, path id) → the entry's key.
    RECORD, rcab = {}, None
    for o in UnityPy.load(bundles['journalrecords.bundle']).objects:
        if o.type.name == 'MonoBehaviour' and script(o) == sid['EnemyJournalRecord']:
            d = o.read_typetree()
            RECORD[(o.assets_file.name.lower(), o.path_id)] = d['displayName']['Key']
            rcab = o.assets_file.name.lower()
    if len(RECORD) < 200:
        sys.exit(f'extract-journal-rooms: {len(RECORD)} records in journalrecords.bundle: the bundles changed')
    targets = {rcab: {pid: ('record', k) for (c, pid), k in RECORD.items()}}
    targets.update(prefabs(bundles, scenes, targets))

    where = defaultdict(Counter)   # key → scene → how many
    hp = defaultdict(Counter)      # key → health → how many
    other = defaultdict(lambda: defaultdict(dict))   # key → scene → object → (its name, its kinds)
    loads = defaultdict(set)       # a scene in LOADED → the scenes whose components name it
    named = re.compile(('(?i)' + '|'.join(sorted(LOADED, key=len, reverse=True))).encode())
    names = sorted(f[:-7] for f in os.listdir(scenes) if f.endswith('.bundle'))
    for i, name in enumerate(names):
        env = UnityPy.load(os.path.join(scenes, name + '.bundle'))
        rec, health, zone, maggots = {}, {}, None, []
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            s = script(o)
            for m in named.findall(o.get_raw_data()):
                if m.decode().lower() != name:
                    loads[m.decode().lower()].add(name)
            if s in DEATH:
                d = o.read_typetree()
                p = d.get('journalRecord') or {}
                if p.get('m_PathID'):
                    f = o.assets_file.name if p['m_FileID'] == 0 else o.assets_file.externals[p['m_FileID'] - 1].path.split('/')[-1]
                    key = RECORD.get((f.lower(), p['m_PathID']))
                    if key:
                        rec[d['m_GameObject']['m_PathID']] = key
            elif s == sid['HealthManager']:
                d = o.read_typetree()
                health[d['m_GameObject']['m_PathID']] = d.get('hp')
                continue
            elif s == sid['CustomSceneManager']:
                zone = o.read_typetree().get('mapZone')
                continue
            # What the component names or spawns, each key once per component; an enemy's own
            # record is already counted above, what its corpse lets out isn't.
            got = {r for r in refs(o, targets) if not (s in DEATH and r[0] == 'record')}
            if not got:
                continue
            go = struct.unpack_from('<q', o.get_raw_data(), 4)[0]
            if s == sid['MaggotRegion']:   # decided once the scene's map zone is known
                maggots.append((o.read_typetree(), go, got, read_name(o)))
                continue
            who = read_name(o)
            if who not in NAMES_ONLY:
                for kind, key in got:
                    add(other[key][name], go, who, kind)
        # Every water names the Muckmaggots' record; the maggots are there only where the region is
        # on (MaggotRegion.IsActive: its overrideActive if set, else the scene's MapZone in its mask).
        for d, go, got, who in maggots:
            ov = d.get('overrideActive') or {}
            on = ov.get('Value') if ov.get('IsEnabled') else zone is not None and (d.get('mapZoneMask', 0) >> zone) & 1
            if on:
                for kind, key in got:
                    add(other[key][name], go, who, kind)
        for go, key in rec.items():
            where[key][name] += 1
            if health.get(go):
                hp[key][health[go]] += 1
        if i % 50 == 0:
            print(f'{i}/{len(names)} {name}', file=sys.stderr, flush=True)
    other = {k: {s: {go: (n, sorted(ks)) for go, (n, ks) in c.items()} for s, c in v.items()} for k, v in other.items()}
    return dict(where), dict(hp), other, len(set(RECORD.values())), dict(loads)


def add(objs, go, name, kind):
    n, ks = objs.get(go, (name, set()))
    objs[go] = (n, ks | {kind})


def refs(o, targets):
    """The (kind, key) a component refers to: a reference to another file is its index there (an
    int32, 1 up) and the object's path id (an int64), so each index of a file with targets is
    looked for in the raw data and the 8 bytes after it read."""
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


def read_name(o):
    try:
        return o.read().m_GameObject.read().m_Name
    except Exception:
        return None


def prefabs(bundles, scenes, records):
    """The prefabs that make an entry: every object in the bundles outside the scenes whose
    prefab (its topmost parent) carries a record or points at another prefab that does, as
    targets {file: {path id: ('spawn', key)}}. A prefab naming more than one record is a list
    (the Journal's own, an area's), not an enemy, and is left out."""
    names = sorted(f for f, p in bundles.items() if not p.startswith(scenes) and not SKIP.search(f))
    envs = [UnityPy.load(bundles[f]) for f in names]
    kinds, father, of_tr = {}, {}, {}
    for env in envs:
        for o in env.objects:
            cab = o.assets_file.name.lower()
            kinds.setdefault(cab, {})[o.path_id] = o.type.name
            if o.type.name in ('Transform', 'RectTransform'):
                t = o.read()
                of_tr[(cab, o.path_id)] = t.m_GameObject.m_PathID
                father[(cab, t.m_GameObject.m_PathID)] = t.m_Father.m_PathID
    top = {}

    def root(n):
        if n not in top:
            f = father.get(n)
            top[n] = root((n[0], of_tr[(n[0], f)])) if f and (n[0], f) in of_tr else n
        return top[n]

    everything = {cab: {pid: (cab, pid) for pid, ty in d.items() if ty in ('GameObject', 'MonoBehaviour')} for cab, d in kinds.items()}
    everything.update(records)
    keys, edges, on = defaultdict(set), defaultdict(set), {}
    for env in envs:
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            raw = o.get_raw_data()
            go = struct.unpack_from('<q', raw, 4)[0] if len(raw) >= 12 else 0
            cab = o.assets_file.name.lower()
            if go:
                on[(cab, o.path_id)] = go
            owner = root((cab, go)) if go else (cab, o.path_id)   # an asset without an object is its own
            for r in refs(o, everything):
                if r[0] == 'record':
                    keys[owner].add(r[1])
                else:
                    edges[owner].add(r)

    def node(x):   # a GameObject or a component: its prefab; an asset: itself
        return root((x[0], on[x])) if x in on else root(x) if x in father else x
    lists = {n for n, k in keys.items() if len(k) > 1}
    made = {n: set(k) for n, k in keys.items() if n not in lists}
    while True:   # what a prefab points at, it makes too
        grew = False
        for n, es in edges.items():
            if n in lists:
                continue
            for e in es:
                k = made.get(node(e))
                if k and not k <= made.get(n, set()):
                    made.setdefault(n, set()).update(k)
                    grew = True
        if not grew:
            break
    out = {}
    for cab, d in kinds.items():
        for pid, ty in d.items():
            if ty in ('GameObject', 'MonoBehaviour'):
                for k in made.get(node((cab, pid)), ()):
                    out.setdefault(cab, {})[pid] = ('spawn', k)   # one key each: made has one per prefab
    print(f'{len(made)} prefabs make an entry, in {len(names)} bundles', file=sys.stderr)
    return out


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-journal-rooms.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'))
