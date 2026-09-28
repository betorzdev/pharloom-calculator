"""tools/extract-quests.py: the wishes' rules, from the game's own files: what opens the way to
Act 3, how each wish follows another, where each is taken, and the doors a key opens. Needs the game installed and UnityPy, as
tools/extract-phases.py, and the game's text (kb/data/all_text.json: npm run text downloads it):
    /tmp/unitypy/bin/python tools/extract-quests.py "<Steam>/steamapps/common/Hollow Knight Silksong"

What it reads (read on 28-Sep-2026, patch 1.0.30000), in
StreamingAssets/aa/StandaloneLinux64/dataassets_assets_assets/dataassets/:
  questsystem/completetotalgroups.bundle  each QuestCompleteTotalGroup: its quests ({ Quest,
      Value, IsRequired }), its target and an additionalTest (a PlayerDataTest). The game's
      IsFulfilled (Assembly-CSharp): the test holds, every required quest is complete, and the
      values of the complete ones (required included) add up to the target or more. A null quest
      is skipped ("Skipping null quest"): Belltown House Key has one.
  questsystem/quests.bundle, mainquests.bundle  each quest (FullQuestBase): m_Name, the name the
      save's QuestCompletionData uses; displayName, its title's key; previousQuestStep,
      requiredCompleteQuests and requiredCompleteTotalGroups, what it waits for; playerDataTest,
      what the save must say before it's offered; targets, what it asks for (a Collectable or a
      Tool by reference, or a playerData test: the Bellshrines).
  collectables/collectableitems.bundle, tools/toolitems.bundle  the things a target names.
A PlayerDataTest is groups of tests: any group whose tests all hold. Its enums, read from
Assembly-CSharp: TestType Bool 0, Int 1, Float 2, Enum 3, String 4; NumTestType Equal 0,
NotEqual 1, LessThan 2, MoreThan 3 (an Enum compares its IntValue).

Where each wish is taken (FROM, read on 28-Sep-2026):
  questsystem/*questboard*.asset.bundle  each QuestBoardList's list: the wishes a Wishwall offers.
      The scene that places it is the one whose QuestBoardInteractable's questList names it
      (Bellhart, Bone Bottom, Songclave; Pilgrim's Rest's list is empty and placed nowhere).
  scenes_scenes_scenes/*.bundle  an NPC's offer is a PlayMakerFSM action that takes the quest:
      QuestYesNo(V2), BeginQuest(V2), CanBeginQuest (the other quest actions only check or end
      one). The quest is an FsmObject parameter (PlayMaker's ParamDataType 24), mapped to its
      action by actionStartIndex, or an object variable the parameter names. An FSM built from a
      template (fsmtemplates_*.bundle: the Huntress's, Zylotol's) offers what the template's
      actions offer, in the scene of the FSM that uses it. The couriers of Bellhart hand theirs
      through a SimpleQuestsShopOwner (its quests), used only for a quest no FSM offers (Great
      Gourmand's Rasher is theirs too, but the wish is Mergwin's). A main objective isn't taken
      from anyone: the story begins it, so only the wishes of quests.bundle are kept.
  The same pass reads the key locks (LOCKS): each ItemReceptacle and the collectable it takes
  (collectables/collectableitems.bundle): the four Simple Key doors the wiki lists, the
  Architect's chapel, the Whiteward's two, the Bellhome's and the Diving Bell's. The Slab's doors
  aren't ItemReceptacles. """
import json, os, re, sys
from concurrent.futures import ProcessPoolExecutor
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'quests.js')
TEXT = os.path.join(ROOT, 'kb', 'data', 'all_text.json')
BUNDLES = ['questsystem/completetotalgroups.bundle', 'questsystem/quests.bundle', 'questsystem/mainquests.bundle',
           'collectables/collectableitems.bundle', 'tools/toolitems.bundle']
# The main quest whose targets are the five Bellshrines, and the wish whose targets are the
# Soul Snare's four pieces.
BELLSHRINES = 'Grand Gate Bellshrines'
SNARE = 'Soul Snare'
NUM_OP = {0: '==', 1: '!=', 2: '<', 3: '>'}


def fail(msg):
    sys.exit('extract-quests: ' + msg)


def text():
    if not os.path.exists(TEXT):
        fail(f'{TEXT} is missing: run npm run text -- --key ACT_ once to download it')
    d = json.load(open(TEXT, encoding='utf-8'))
    norm = lambda s: ' '.join(str(s).replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').split())
    return lambda key: {'es': norm(d['ES'][key]), 'en': norm(d['EN'][key]), 'key': key} if key and key in d['EN'] else None


def load(game):
    """Every MonoBehaviour of the bundles above: (CAB, path id) → (bundle, typetree), and the
    assets file of each, to resolve a reference."""
    base = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64',
                        'dataassets_assets_assets', 'dataassets')
    objs = {}
    boards = sorted('questsystem/' + f for f in os.listdir(os.path.join(base, 'questsystem')) if 'questboard' in f)
    for b in BUNDLES + boards:
        for o in UnityPy.load(os.path.join(base, b)).objects:
            if o.type.name != 'MonoBehaviour':
                continue
            try:
                tt = o.read_typetree()
            except Exception:
                continue
            objs[(o.assets_file.name, o.path_id)] = (b, tt, o.assets_file)
    return objs


def resolver(objs):
    def ref(af, r):
        """A reference → (bundle, typetree), None for a null one; fails loudly if it points
        outside the bundles read."""
        if not r or not r.get('m_PathID'):
            return None
        cab = af.name if r['m_FileID'] == 0 else af.externals[r['m_FileID'] - 1].path.split('/')[-1]
        hit = objs.get((cab, r['m_PathID']))
        if not hit:
            fail(f'unresolved reference {cab}:{r["m_PathID"]}')
        return hit[0], hit[1]
    return ref


def tests(t):
    """A PlayerDataTest → [[{ field, op, value }]]: any group, all its tests."""
    out = []
    for g in (t or {}).get('TestGroups', []):
        group = []
        for x in g['Tests']:
            kind = x['Type']
            if kind == 0:
                group.append({'field': x['FieldName'], 'op': '==', 'value': bool(x['BoolValue'])})
            elif kind in (1, 3):
                group.append({'field': x['FieldName'], 'op': NUM_OP[x['NumType']], 'value': x['IntValue']})
            elif kind == 2:
                group.append({'field': x['FieldName'], 'op': NUM_OP[x['NumType']], 'value': x['FloatValue']})
            else:
                fail(f'a String test on {x["FieldName"]}: not read yet')
        out.append(group)
    return out


OFFER = {'QuestYesNo', 'QuestYesNoV2', 'BeginQuest', 'BeginQuestV2', 'CanBeginQuest'}
FSM_OBJECT = 24   # PlayMaker's ParamDataType.FsmObject
SCRIPT_AT = 20    # a MonoBehaviour's raw data: its m_Script's path id, as tools/extract-graph.py reads it


def aa(game):
    return os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')


def pointer(af, cabs):
    """A reference in assets file af (m_FileID 0: af itself) → (CAB, path id) when it points into one
    of cabs."""
    ext = [e.path.split('/')[-1] for e in af.externals]
    def at(r):
        if not isinstance(r, dict) or not r.get('m_PathID'):
            return None
        cab = af.name if r['m_FileID'] == 0 else ext[r['m_FileID'] - 1]
        return (cab, r['m_PathID']) if cab in cabs else None
    return at


def fsm_info(fsm, quest_of, tpl_at):
    """What an FSM offers: (fixed, by_var, runs). fixed, the quests its offer actions name;
    by_var, those an offer takes through one of its object variables (its default value); runs,
    the templates its RunFSM actions run, [(template, [quests passed in])]."""
    import bisect
    var = {v['name']: v.get('value') for v in (fsm.get('variables') or {}).get('objectVariables') or []}
    fixed, by_var, runs = set(), set(), []
    for st in fsm.get('states') or []:
        ad = st['actionData']
        starts = ad['actionStartIndex']
        for j, (t, pos) in enumerate(zip(ad['paramDataType'], ad['paramDataPos'])):
            if t != FSM_OBJECT:
                continue
            action = ad['actionNames'][bisect.bisect_right(starts, j) - 1].split(',')[0].split('.')[-1]
            if action not in OFFER:
                continue
            o = ad['fsmObjectParams'][pos]
            if o.get('useVariable'):
                q = quest_of(var.get(o.get('name')))
                by_var.add(q)
            elif quest_of(o.get('value')):
                fixed.add(quest_of(o.get('value')))
        for c in ad.get('fsmTemplateControlParams') or []:
            k = tpl_at(c.get('target'))
            if k:
                runs.append((k, [q for q in (quest_of(iv['fsmVar'].get('objectReference')) for iv in c.get('inputVariables') or []) if q]))
    return fixed, by_var, runs


def offers(info, templates, passed=(), depth=0):
    """The quests an FSM offers, its templates' included. A template run with a quest passed in
    offers that one where it takes a quest through a variable (the Runt's Huntress), else the
    variable's own (the Huntress's)."""
    fixed, by_var, runs = info
    out = set(fixed) | (set(passed) if passed and by_var else {q for q in by_var if q})
    if depth > 8:
        fail('templates run each other in a loop')
    for k, p in runs:
        if k in templates:
            out |= offers(templates[k], templates, p, depth + 1)
    return out


def scene_givers(args):
    """One scene: the boards it places, the quests its FSMs offer, a quest shop's quests, and the
    keys its locks take."""
    path, quests, boards, templates, script, items = args
    tcabs = {cab for cab, _ in templates}
    wanted = set(quests) | set(boards) | tcabs | set(items)
    board, offer, shop, lock = set(), set(), set(), set()
    for o in UnityPy.load(path).objects:
        if o.type.name != 'MonoBehaviour':
            continue
        ext = {e.path.split('/')[-1] for e in o.assets_file.externals}
        if not ext & wanted:
            continue
        raw = o.get_raw_data()
        kind = script.get(int.from_bytes(raw[SCRIPT_AT:SCRIPT_AT + 8], 'little', signed=True)) if len(raw) >= 28 else None
        if not kind:
            continue
        tt = o.read_typetree()
        q_at, b_at, t_at = (pointer(o.assets_file, m) for m in (quests, boards, tcabs))
        quest_of = lambda r: (lambda k: k and quests[k[0]].get(k[1]))(q_at(r))
        if kind == 'ItemReceptacle':
            i_at = pointer(o.assets_file, items)
            def walk(v):
                if isinstance(v, dict):
                    k = i_at(v) if 'm_PathID' in v else None
                    if k:
                        lock.add(items[k[0]][k[1]])
                    for x in v.values():
                        walk(x)
                elif isinstance(v, list):
                    for x in v:
                        walk(x)
            walk(tt)
        elif kind == 'QuestBoardInteractable':
            k = b_at(tt.get('questList'))
            if k:
                board.add(boards[k[0]][k[1]])
        elif kind == 'SimpleQuestsShopOwner':
            shop.update(q for q in (quest_of(x.get('Quest')) for x in tt.get('quests') or []) if q)
        else:
            info = fsm_info(tt['fsm'], quest_of, t_at)
            k = t_at(tt.get('fsmTemplate'))
            if k:
                info[2].append((k, []))
            offer.update(offers(info, templates))
    return os.path.basename(path)[:-len('.bundle')], board, offer, shop, lock


def givers(game, objs, ref):
    """FROM: each wish of quests.bundle → { board?, npc? }: the scene of the Wishwall that lists it,
    and the scenes of the NPCs who offer it."""
    base = aa(game)
    quests = {}   # CAB → { path id: quest name }, quests.bundle only
    boards = {}   # CAB → { path id: board name }
    lists = {}    # board name → [quest name]
    for (cab, pid), (b, tt, af) in objs.items():
        if b == 'questsystem/quests.bundle' and 'displayName' in tt:
            quests.setdefault(cab, {})[pid] = tt['m_Name']
        elif 'questboard' in b:
            boards.setdefault(cab, {})[pid] = tt['m_Name']
            lists[tt['m_Name']] = [ref(af, r)[1]['m_Name'] for r in tt['list']]
    # The FSM templates (fsmtemplates_*.bundle): (CAB, path id) → fsm_info.
    loaded = []
    for f in sorted(os.listdir(base)):
        if f.startswith('fsmtemplates_'):
            loaded += [o for o in UnityPy.load(os.path.join(base, f)).objects if o.type.name == 'MonoBehaviour']
    tcabs = {o.assets_file.name for o in loaded}
    templates = {}
    for o in loaded:
        tt = o.read_typetree()
        if 'fsm' not in tt:
            continue
        q_at, t_at = pointer(o.assets_file, quests), pointer(o.assets_file, tcabs)
        templates[(o.assets_file.name, o.path_id)] = fsm_info(tt['fsm'], lambda r: (lambda k: k and quests[k[0]].get(k[1]))(q_at(r)), t_at)
    mono = next(os.path.join(base, f) for f in os.listdir(base) if f.endswith('_monoscripts.bundle'))
    script = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    script = {k: v for k, v in script.items() if v in ('QuestBoardInteractable', 'SimpleQuestsShopOwner', 'PlayMakerFSM', 'ItemReceptacle')}
    items = {}    # CAB → { path id: collectable's save name }
    for (cab, pid), (b, tt, af) in objs.items():
        if b == 'collectables/collectableitems.bundle' and tt.get('m_Name'):
            items.setdefault(cab, {})[pid] = tt['m_Name']
    sdir = os.path.join(base, 'scenes_scenes_scenes')
    paths = sorted(os.path.join(sdir, f) for f in os.listdir(sdir) if f.endswith('.bundle'))
    board_at, offer_at, shop_at, locks = {}, {}, {}, {}
    with ProcessPoolExecutor(min(12, os.cpu_count() or 1)) as ex:
        for scene, board, offer, shop, lock in ex.map(scene_givers, [(p, quests, boards, templates, script, items) for p in paths], chunksize=4):
            for k in lock:
                locks.setdefault(k, set()).add(scene)
            for b in board:
                board_at.setdefault(b, set()).add(scene)
            for q in offer:
                offer_at.setdefault(q, set()).add(scene)
            for q in shop:
                shop_at.setdefault(q, set()).add(scene)
    proper = scene_names()
    name = lambda s: proper.get(s, s)
    out = {}
    for b, qs in lists.items():
        if not qs:
            continue
        at = board_at.get(b) or fail(f'the board {b} is placed in no scene')
        if len(at) != 1:
            fail(f'the board {b} is in {sorted(at)}')
        for q in qs:
            out.setdefault(q, {})['board'] = name(next(iter(at)))
    for q in sorted({n for m in quests.values() for n in m.values()}):
        npc = offer_at.get(q) or shop_at.get(q)
        if npc:
            out.setdefault(q, {})['npc'] = sorted(name(s) for s in npc)
    return dict(sorted(out.items())), {k: sorted(name(s) for s in v) for k, v in sorted(locks.items())}


def scene_names():
    """Lower case → the scene's name with its capitals, as js/graph.js and js/map.js write it."""
    proper = {}
    g = json.loads(re.search(r'SS\.graph = (\{.*\});', open(os.path.join(ROOT, 'js', 'graph.js'), encoding='utf-8').read()).group(1))
    for k, v in g.items():
        for s in [k, *v]:
            proper.setdefault(s.lower(), s)
    m = json.loads(re.search(r'SS\.map = (\{.*\});', open(os.path.join(ROOT, 'js', 'map.js'), encoding='utf-8').read()).group(1))
    for s in m['ROOMS']:
        proper.setdefault(s.lower(), s)
    return proper


def main(game):
    name = text()
    objs = load(game)
    ref = resolver(objs)
    quest = lambda b: b.startswith('questsystem/quest') or b.startswith('questsystem/mainquest')
    groups, chain, shrines, snare = {}, {}, None, None
    for (cab, pid), (b, tt, af) in sorted(objs.items(), key=lambda kv: kv[1][1].get('m_Name') or ''):
        if b == 'questsystem/completetotalgroups.bundle':
            qs = []
            for q in tt['quests']:
                hit = ref(af, q['Quest'])
                if hit:
                    qs.append({'quest': hit[1]['m_Name'], 'value': q['Value'], 'required': bool(q['IsRequired'])})
            groups[tt['m_Name']] = {'target': tt['target'], 'quests': qs, 'tests': tests(tt['additionalTest'])}
        elif quest(b) and tt.get('m_Name') and 'displayName' in tt:
            n = tt['m_Name']
            prev = ref(af, tt.get('previousQuestStep'))
            needs = [h[1]['m_Name'] for h in (ref(af, r) for r in tt.get('requiredCompleteQuests', [])) if h]
            gs = [h[1]['m_Name'] for h in (ref(af, r) for r in tt.get('requiredCompleteTotalGroups', [])) if h]
            e = {'name': name(tt['displayName'].get('Key')), 'main': b.endswith('mainquests.bundle')}
            if prev:
                e['prev'] = prev[1]['m_Name']
            if needs:
                e['needs'] = needs
            if gs:
                e['groups'] = gs
            when = tests(tt.get('playerDataTest'))
            if when:
                e['when'] = when
            if n in chain and chain[n] != e:
                fail(f'two quests named {n}')
            chain[n] = e
            if n == BELLSHRINES:
                shrines = []
                for t in tt['targets']:
                    (only,), = tests(t['AltTest'])
                    shrines.append({'field': only['field'], 'name': name(t['ItemName']['Key'])})
            if n == SNARE and b.endswith('/quests.bundle'):
                snare = []
                for t in tt['targets']:
                    hb, ht = ref(af, t['Counter'])
                    kind = 'tool' if hb.startswith('tools/') else 'collectable'
                    key = (ht.get('displayName') or {}).get('Key')
                    snare.append({'kind': kind, 'save': ht['m_Name'], 'name': name(key)})
    for g in groups.values():
        for q in g['quests']:
            if q['quest'] not in chain:
                fail(f'{q["quest"]} is in a group but not among the quests')
    if not shrines or not snare:
        fail(f'{BELLSHRINES} or {SNARE} not found')
    missing = [n for n, e in chain.items() if not e['name']] + [x['save'] for x in snare if not x['name']] \
        + [x['field'] for x in shrines if not x['name']]
    if missing:
        print('no game text for: ' + ', '.join(missing), file=sys.stderr)
    frm, locks = givers(game, objs, ref)
    for q in frm:
        if q not in chain:
            fail(f'{q} is taken somewhere but not among the quests')
    wishes = [n for n, e in chain.items() if not e['main']]
    none = [n for n in wishes if n not in frm]
    if none:
        print('taken from nowhere found: ' + ', '.join(none), file=sys.stderr)
    write(groups, chain, shrines, snare, frm, locks)


def write(groups, chain, shrines, snare, frm, locks):
    js = lambda v: json.dumps(v, ensure_ascii=False, separators=(',', ':'))
    lines = [
        "/* js/quests.js: the wishes' rules, as the game's own files keep them.",
        "   GENERATED by tools/extract-quests.py from the installed game and its text: not edited by hand.",
        "",
        "     GROUPS       the game's QuestCompleteTotalGroups, by name: { target, quests: [{ quest, value,",
        "                  required }], tests }. Fulfilled when the tests hold, every required quest is",
        "                  complete, and the values of the complete ones add up to target or more.",
        "                  'Soul Snare' opens the wish Silk and Soul (Soul Snare Pre), the way to Act 3;",
        "                  'Belltown House Key', with Bellhart's Glory, has Pavo give the Bellhome's key.",
        "     CHAIN        each quest by its save name (QuestCompletionData): { name, main, prev?, needs?,",
        "                  groups?, when? }: its title, whether it's a main objective, the step before it,",
        "                  the quests and groups it waits for, and the playerData test it's offered on.",
        "     BELLSHRINES  the five Bellshrines the Grand Gate asks for: [{ field, name }], field the",
        "                  playerData bool rung.",
        "     SNARE        the four pieces the wish Soul Snare asks for: [{ kind, save, name }], kind",
        "                  'collectable' (playerData.Collectables, Amount 1 while held) or 'tool'.",
        "     FROM         where each wish (of quests.bundle, not a main objective) is taken, by save name:",
        "                  { board?, npc? }: the scene of the Wishwall that lists it, and the scenes of",
        "                  the NPCs who offer it. A wish after another (prev) is taken where that one",
        "                  leaves off: Crawbug Clearing's Pre on Bellhart's board, then Creige's.",
        "     LOCKS        the doors a key opens (an ItemReceptacle), by the key's save name (its",
        "                  collectable): [scene]. The Slab's keys open its doors another way: not here.",
        "   A test is { field, op, value } on playerData, op '==', '!=', '<' or '>'; tests is [[test]]:",
        "   any group whose tests all hold (none: always). */",
        "(() => {",
        "  'use strict';",
        "  const SS = globalThis.SS || (globalThis.SS = {});",
        f"  const GROUPS = {js(groups)};",
        f"  const CHAIN = {js(dict(sorted(chain.items())))};",
        f"  const BELLSHRINES = {js(shrines)};",
        f"  const SNARE = {js(snare)};",
        f"  const FROM = {js(frm)};",
        f"  const LOCKS = {js(locks)};",
        "  SS.quests = { GROUPS, CHAIN, BELLSHRINES, SNARE, FROM, LOCKS };",
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.quests;",
        "})();",
        "",
    ]
    open(OUT, 'w', encoding='utf-8').write('\n'.join(lines))
    print(f'{len(groups)} groups, {len(chain)} quests, {len(shrines)} Bellshrines, {len(snare)} Soul Snare pieces, {len(frm)} wishes with where each is taken → js/quests.js')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-quests.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
