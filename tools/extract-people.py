"""tools/extract-people.py: the people of Pharloom, from the game's own files: who stands in which
room, what playerData their scripts read, and each one's figure. Writes kb/data/game/people.json,
which tools/gen-people.js reads (offline, in npm run data), and assets/map/people/<id>.webp. Needs
the game installed and UnityPy, as tools/extract-map.py does:
    /tmp/unitypy/bin/python tools/extract-people.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Re-run it after a patch that moves people. The scan reads every scene (about ten minutes).
Team Cherry's art, shown as the rest of the site's sprites are (a fan project; the colophon says so).

How the game names a person (read on 11-Oct-2026, patch 1.0.30000):
  · A person's title card is an NpcDialogueTitle on their object: its `titles` are text keys,
    <KEY>_SUPER / _MAIN / _SUB in the dump (FIXER is «Flick» «El arreglador»). 64 keys.
  · Some talkers have no NpcDialogueTitle: their own FSM shows the title, so its raw data holds the
    key as a string (GILLY, MR_MUSHROOM, BELL_HERMIT…). Those count only on an object that talks
    (a PlayMakerNPC or BasicNPC on it): a key named by a scene's manager, a boss or a map pole isn't
    a person standing there.
What it writes:
  people   title key → { spots: [[scene, object, x, y]] (one per scene, an active object first;
           x, y its place, its parents' turns counted, and for one who walks between scenes, a
           SplineWalker, the last point of its path on the ground),
           fields: the identifiers the person's scripts read: every length-prefixed name in the raw
           data of the FSMs on their objects and the four objects above them, and the playerData
           tests (Deactivate/ActivateIfPlayerdata…, PlayerDataTestResponse, TestGameObjectActivator)
           that switch those objects. tools/gen-people.js checks its hand table against them. }
  shops    [scene, object, class]: every ShopOwner and SimpleQuestsShopOwner.
  figures  title key → the sprite drawn (its collection and definition): the person's figure as the
           scene first draws it (the tk2dSprite on their object, else the first under it),
           cut to head and shoulders (a square from the top), FIG pixels, into
           assets/map/people/<id>.webp, id the key in lower case with dashes. """
import json, os, re, struct, sys, warnings
import UnityPy
from PIL import Image
from scene_place import placer, world_of

warnings.filterwarnings('ignore')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'kb', 'data', 'game', 'people.json')
FIGS = os.path.join(ROOT, 'assets', 'map', 'people')
TEXT = os.path.join(ROOT, 'kb', 'data', 'all_text.json')
FIG = 72
# The figures whose first sprite isn't the person (an effect, Hornet at the dice, a pod): left out,
# tools/gen-people.js draws them with their Journal portrait or the herald.
NO_FIGURE = {'CREST_UPG_SHRINE', 'DICE_PILGRIM', 'LAST_CONDUCTOR', 'SONG_KNIGHT', 'WICKER_BUG', 'SHELLWOOD_WITCH', 'MAPPER', 'GARMOND'}
# Where the head is, as a share of the figure's height from its top, for those whose antlers fill
# the top square (Styx, the Huntress).
BUST_TOP = {'GRUBFARMER': 0.3, 'HUNTRESS': 0.2}
NAME = re.compile(rb'[A-Za-z][A-Za-z0-9_]{4,47}')
TESTS = {'DeactivateIfPlayerdataTrue', 'DeactivateIfPlayerdataFalse', 'ActivateIfPlayerdataTrue', 'ActivateIfPlayerdataFalse',
         'TestGameObjectActivator', 'PlayerDataTestResponse'}
READ = TESTS | {'NpcDialogueTitle', 'ShopOwner', 'SimpleQuestsShopOwner', 'tk2dSprite', 'SplineWalker'}
TALKS = {'PlayMakerNPC', 'BasicNPC'}
# The talkers whose title only their FSM shows (read on 11-Oct-2026): a talker's FSM also names
# areas, bosses and other people (Shakra's names every area she maps), so only these keys, and the
# keys some NpcDialogueTitle carries, are taken from FSMs.
FSM_PEOPLE = {'BELL_HERMIT', 'COURIER_TALL', 'CROWFATHER', 'CHEF', 'WICKER_BUG', 'BELLWAY_PILGRIM', 'GILLY', 'LITTLE_PILGRIM_N',
              'LITTLE_PILGRIM', 'DICE_PILGRIM', 'DICE_PILGRIM_DEFEATED', 'LARGE_COG_WORK', 'MR_MUSHROOM', 'SLAB_PRISONER',
              'GRUBFARMER_MIMIC', 'STEEL_SERVANT', 'FLEAMEMBER_TALL', 'SETH_NPC_BC'}


def names_in(raw):
    """The length-prefixed identifiers in an object's raw data (with a lower-case letter: not an event)."""
    out = set()
    for m in NAME.finditer(raw):
        p, s = m.start(), m.group()
        if p >= 4 and struct.unpack_from('<i', raw, p - 4)[0] == len(s) and re.search(rb'[a-z]', s):
            out.add(s.decode())
    return out


def tests_of(c, d):
    if c.startswith(('Deactivate', 'Activate')):
        return {d.get('boolName')} - {None, ''}
    t = d.get('test') if c == 'PlayerDataTestResponse' else d.get('playerDataTest')
    return {x['FieldName'] for g in (t or {}).get('TestGroups', []) for x in g.get('Tests', []) if x.get('FieldName')}


def main(game):
    text = json.load(open(TEXT))['EN']
    keys = sorted({k[:-5] for k in text if k.endswith('_MAIN')}, key=len, reverse=True)
    key_re = re.compile(b'|'.join(re.escape(k.encode()) for k in keys))
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    mono = next(os.path.join(aa, f) for f in os.listdir(aa) if f.endswith('_monoscripts.bundle'))
    CLS = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    script = lambda o: (lambda raw: struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None)(o.get_raw_data())
    # The sprite collections' files (CAB-…) → their bundles.
    cab = {}
    for f in os.listdir(aa):
        if f.startswith(('tk2dcollections', 'herocollections')):
            env = UnityPy.load(os.path.join(aa, f))
            for n, fl in env.files.items():
                cab[n.lower()] = f
                for m in getattr(fl, 'files', None) or {}:
                    cab[m.lower()] = f
    colls, envs = {}, {}

    def figure(o, d):
        c = d.get('collection') or d.get('_collection') or {}
        fid, pid = c.get('m_FileID'), c.get('m_PathID')
        if not fid:
            return None
        b = cab.get(o.assets_file.externals[fid - 1].path.split('/')[-1].lower())
        if not b:
            return None
        if (b, pid) not in colls:
            env = envs.get(b) or envs.setdefault(b, UnityPy.load(os.path.join(aa, b)))
            by = {x.path_id: x for x in env.objects}
            t = by[pid].read_typetree()
            colls[(b, pid)] = (t, [by[x['m_PathID']].read().image if x['m_PathID'] in by else None for x in t['textures']])
        t, tex = colls[(b, pid)]
        defs = t['spriteDefinitions']
        sid = d.get('_spriteId', 0)
        if sid >= len(defs) or defs[sid]['materialId'] >= len(tex) or tex[defs[sid]['materialId']] is None:
            return None
        df = defs[sid]
        im = tex[df['materialId']]
        W, H = im.size
        us = [p['x'] for p in df['uvs']]; vs = [p['y'] for p in df['uvs']]
        im = im.crop((round(min(us) * W), round((1 - max(vs)) * H), round(max(us) * W), round((1 - min(vs)) * H)))
        if df['flipped']:
            im = im.transpose(Image.Transpose.TRANSVERSE)
        return im, f"{t.get('spriteCollectionName')}/{df['name']}"

    people, shops, figures, done = {}, [], {}, set()
    sdir = os.path.join(aa, 'scenes_scenes_scenes')
    scenes = sorted(f[:-7] for f in os.listdir(sdir) if f.endswith('.bundle'))
    only = os.environ.get('PEOPLE_ONLY')   # a try on a few scenes: PEOPLE_ONLY=belltown,bonetown (writes nothing)
    if only:
        scenes = only.split(',')
    for i, scene in enumerate(scenes):
        if scene == 'menu_title':
            continue
        env = UnityPy.load(os.path.join(sdir, scene + '.bundle'))
        GO, T = {}, {}
        for o in env.objects:
            if o.type.name == 'GameObject':
                d = o.read(); GO[o.path_id] = (d.m_Name, d.m_IsActive)
            elif o.type.name == 'Transform':
                T[o.path_id] = o.read()
        of_go = {t.m_GameObject.m_PathID: t for t in T.values()}
        go_of = {pid: t.m_GameObject.m_PathID for pid, t in T.items()}
        parent = lambda g: (lambda t: go_of.get(t.m_Father.m_PathID) if t is not None and t.m_Father.m_PathID else None)(of_go.get(g))

        def chain(g):
            out = []
            while g is not None and len(out) < 40:
                out.append(g); g = parent(g)
            return out

        world = world_of(T, of_go, 2)   # its place, its parents' turns counted (tools/scene_place.py)
        by_pid = {}

        def walk_end(g):
            """One who walks between scenes (a SplineWalker, parked off the scene until its
            CrossSceneWalker's turn comes: Pondcatcher Reed): the last point of its path on the
            ground (z 0; it flies in and out above it), where it stops walking in this scene."""
            for c, d, _ in comps.get(g, []):
                pid = c == 'SplineWalker' and (d.get('path') or {}).get('m_PathID')
                if not pid:
                    continue
                if not by_pid:
                    by_pid.update((o.path_id, o) for o in env.objects)
                o = by_pid.get(pid)
                tt = o.read_typetree() if o is not None else {}
                ground = [q for q in tt.get('controlPoints') or [] if abs(q['z']) < 0.01]
                if ground:
                    x, y = placer(T, of_go)(tt['m_GameObject']['m_PathID'])(ground[-1]['x'], ground[-1]['y'])
                    return [round(x, 2), round(y, 2)]
            return None
        comps = {}   # gid → [(class, data, object)]
        fsm_names, fsm_keys = {}, {}
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            c = CLS.get(script(o))
            if c not in READ and c not in TALKS and c != 'PlayMakerFSM':
                continue
            try:
                gid = o.read().m_GameObject.m_PathID
            except Exception:
                continue
            if c == 'PlayMakerFSM':
                raw = o.get_raw_data()
                fsm_names.setdefault(gid, set()).update(names_in(raw))
                for m in key_re.finditer(raw):
                    p, s = m.start(), m.group()
                    if p >= 4 and struct.unpack_from('<i', raw, p - 4)[0] == len(s):
                        fsm_keys.setdefault(gid, set()).add(s.decode())
                continue
            try:
                d = o.read_typetree() if c in READ else {}
            except Exception:
                d = {}
            comps.setdefault(gid, []).append((c, d, o))
        # The tests that switch an object, by the object they switch.
        switch = {}
        for gid, cs in comps.items():
            for c, d, _ in cs:
                if c not in TESTS:
                    continue
                targets = [gid]
                if c == 'TestGameObjectActivator':
                    targets = [d.get(k, {}).get('m_PathID') for k in ('activateGameObject', 'deactivateGameObject')]
                elif c.startswith('Activate'):
                    targets = [d.get('objectToActivate', {}).get('m_PathID')]
                elif c.startswith('Deactivate'):
                    targets = [d.get('objectToDeactivate', {}).get('m_PathID') or gid]
                for t in targets:
                    if t:
                        switch.setdefault(t, set()).update(tests_of(c, d))
        talkers = {}
        for gid, cs in comps.items():
            for c, d, _ in cs:
                if c == 'NpcDialogueTitle':
                    ks = [x.get('Title') for x in d.get('titles') or [] if x.get('Title')] + ([d['npcTitle']] if d.get('npcTitle') else [])
                    for k in ks:
                        if k + '_MAIN' in text:
                            talkers.setdefault(gid, {})[k] = 'title'
                elif c in ('ShopOwner', 'SimpleQuestsShopOwner'):
                    shops.append([scene, GO.get(gid, ('?',))[0], c])
            if any(c in TALKS for c, _, _ in cs) and fsm_keys.get(gid):
                for k in fsm_keys[gid]:
                    talkers.setdefault(gid, {}).setdefault(k, 'fsm')
        for gid, ks in talkers.items():
            ch = chain(gid)
            fields = set()
            for g in ch[:5]:
                fields |= fsm_names.get(g, set())
            for g in ch:
                fields |= switch.get(g, set())
            active = all(GO.get(g, ('', True))[1] for g in ch)
            name = GO.get(gid, ('?',))[0]
            at = walk_end(gid) or world(gid)
            for k, via in ks.items():
                p = people.setdefault(k, {'spots': {}, 'fields': set(), 'titled': False})
                p['titled'] = p['titled'] or via == 'title'
                p['fields'] |= fields
                old = p['spots'].get(scene)
                if old is None or (active and not old[1]):
                    p['spots'][scene] = ([scene, name, *at], active)
                # The figure: from the first object that has a sprite.
                if k in done or k in NO_FIGURE or (via == 'fsm' and k not in FSM_PEOPLE):
                    continue
                sprites = [(x, d) for g, cs in comps.items() if gid in chain(g) for c, d, x in cs if c == 'tk2dSprite']
                sprites.sort(key=lambda s: 0 if s[1]['m_GameObject']['m_PathID'] == gid else 1)
                for o, d in sprites:
                    got = figure(o, d)
                    if got:
                        figures[k] = got[1]
                        bust(got[0], os.path.join(FIGS, k.lower().replace('_', '-') + '.webp'), BUST_TOP.get(k, 0))
                        done.add(k)
                        break
        if i % 50 == 0:
            print(f'{i}/{len(scenes)} {scene}', file=sys.stderr, flush=True)
    # A key only a talker's FSM names is a person when it's in FSM_PEOPLE, or some title card carries it.
    people = {k: p for k, p in people.items() if p['titled'] or k in FSM_PEOPLE}
    # A name nearly every person's scripts carry (an FSM's own variables, the act's flag) says
    # nothing of one: left out, so the file keeps what's each one's.
    common = {}
    for p in people.values():
        for f in p['fields']:
            common[f] = common.get(f, 0) + 1
    shared = {f for f, n in common.items() if n > len(people) // 4}
    out = {'people': {k: {'spots': sorted(s for s, _ in p['spots'].values()), 'fields': sorted(p['fields'] - shared)} for k, p in sorted(people.items())},
           'shops': sorted(shops), 'figures': dict(sorted(figures.items()))}
    if only:
        print(json.dumps({k: p['spots'] for k, p in out['people'].items()}), out['figures'])
        return
    if len(out['people']) < 60:
        sys.exit(f"extract-people: only {len(out['people'])} people: the scenes changed")
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f"{len(out['people'])} title keys, {sum(len(p['spots']) for p in out['people'].values())} spots, {len(shops)} shop owners, "
          f"{len(figures)} figures → {os.path.relpath(OUT)} ({os.path.getsize(OUT) // 1024} KB)")


def bust(im, path, top=0):
    """Head and shoulders: the figure trimmed, a square from its top, FIG pixels a side."""
    im = im.convert('RGBA')
    im = im.crop(im.getbbox())
    w, h = im.size
    side = min(w, h)
    x0 = (w - side) // 2
    y0 = min(round(h * top), h - side)
    b = im.crop((x0, y0, x0 + side, y0 + side))
    b.thumbnail((FIG, FIG), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (FIG, FIG))
    out.alpha_composite(b, ((FIG - b.width) // 2, (FIG - b.height) // 2))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.save(path, 'WEBP', quality=88, method=6)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
