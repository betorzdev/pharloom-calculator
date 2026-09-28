"""tools/extract-quests.py: the wishes' rules, from the game's own files: what opens the way to
Act 3, and how each wish follows another. Needs the game installed and UnityPy, as
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
NotEqual 1, LessThan 2, MoreThan 3 (an Enum compares its IntValue). """
import json, os, sys
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
    for b in BUNDLES:
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
    write(groups, chain, shrines, snare)


def write(groups, chain, shrines, snare):
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
        "   A test is { field, op, value } on playerData, op '==', '!=', '<' or '>'; tests is [[test]]:",
        "   any group whose tests all hold (none: always). */",
        "(() => {",
        "  'use strict';",
        "  const SS = globalThis.SS || (globalThis.SS = {});",
        f"  const GROUPS = {js(groups)};",
        f"  const CHAIN = {js(dict(sorted(chain.items())))};",
        f"  const BELLSHRINES = {js(shrines)};",
        f"  const SNARE = {js(snare)};",
        "  SS.quests = { GROUPS, CHAIN, BELLSHRINES, SNARE };",
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.quests;",
        "})();",
        "",
    ]
    open(OUT, 'w', encoding='utf-8').write('\n'.join(lines))
    print(f'{len(groups)} groups, {len(chain)} quests, {len(shrines)} Bellshrines, {len(snare)} Soul Snare pieces → js/quests.js')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-quests.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
