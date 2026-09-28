"""tools/extract-phases.py — each boss's phases, from the game's own files: the health at which
its FSM moves on. Needs the game installed and UnityPy, as tools/extract-map.py:
    /tmp/unitypy/bin/python tools/extract-phases.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--dump=<file>]

How the game does it (read on 28-Sep-2026, Lace's second fight first): a boss's PlayMakerFSM takes
its health when the fight starts (GetHP into an int variable), makes a share of it
(MultiplyIntByFloat: P2 HP = HP × 0.75, P3 HP = HP × 0.4) or sets a number (SetIntValue, or the
variable's own value), and a CompareHP state sends it to the next phase when the health is at or
below that variable. So each CompareHP gives a threshold, a share of the health or a number, and
this reads them by running those actions in order, state by state; the rest of the FSM isn't run.
Some compare otherwise (read on 28-Sep-2026 for the bosses the first pass missed): CompareHPBool,
or GetHP into a variable compared with IntCompare and its kin; and IntOperator makes a share too
(Lugoli's P2 HP = HP / 2).
The four that change phase with something other than their own health (read on 28-Sep-2026):
  · the Bell Eater's FSM (bellway_centipede_arena, Centipede Control) adds the head's health and
    the rear's (GetHPEveryFrame, IntOperator +) and compares the sum, 400 + 400, the fight's 800;
  · Father of the Flame (belltown_08) has no HealthManager in the fight: each of the four lanterns
    (wisp_brazier_arm) and then the core (Take Damage, which waits for CORE DAMAGE READY) keeps an
    HP of its own in its FSM (IntOperator HP - Damage Dealt) and breaks at 0 or after so many hits
    (IntCompare Total Times Hit > 11: 12). Those are `bars`, with their `pieces` and `hits`;
  · the Forebrothers (dock_09): Signis's FSM (Dock Guard Slasher) compares shares of his own
    health, 720 (`of`), not the fight's 1,240, and calls Gron at the last; when one falls, the
    scene's (Boss Scene) heals the other when at 350 or below (CompareHP, then CallMethodProper
    HealthManager.AddHP(200, 350), which adds and caps): `heal`;
  · Phantom (organ_01): its Rage HP is a share of a share (HP × 0.7 × 0.5), and at 0 the Cross
    Stitch: missed, its FSM sets its health back to 60 (SetHP): `reset`.
No threshold here changes with Act 3, black thread or Steel Soul: every variable compared is set in
one state, by one GetHP and its share, and the PlayerDataBoolTests are before the intro or a
refight, not before the thresholds; no FSM here tests Steel Soul. (Plasmified Zango's health starts
clamped to 1, 250, 500 or 750 by the Plasmified Blood taken, BlueAssistantBloodCount 0 to 3, but its
thresholds are shares of the full 1,000, taken first.) A black-threaded boss's health is doubled by
its BlackThreadState (SetupThreaded: hp × 2, floored), and the shares follow it: the wiki's
black-threaded thresholds are shares of the doubled health (Moorwing's 780 of 1,200, Lugoli's 600,
the Savage Beastfly's 880 and 585); the numbers (the Widow's 150, the Fourth Chorus's) are of
bosses that are never black-threaded.
A share is MultiplyIntByFloat, which the game truncates (forceRoundUp is off in all of them):
js/engine.js's phases() does the same.
A PlayMaker action's parameters are stored by type (paramDataType: 16 an FsmInt, 15 an FsmFloat,
18 an FsmString, 23 an event, 39 an FsmVar: CallMethodProper's arguments), each at paramDataPos in
its own list, or inline in byteData (paramByteDataSize bytes: Phantom's and the Forebrothers').
--dump=<file> writes every FSM with a CompareHP, its thresholds and the states they lead to;
--cache=<file> keeps the FSMs read, for the next run. """
import json, os, pickle, re, struct, subprocess, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'phases.js')
# The FSMs that change a boss's phase; the rest with a CompareHP are a fake death, a stun, a
# summon's timer. And the variables that are a phase, by their name (P2 HP, HP P3, Rage HP): the
# others are when the First Sinner can bind, a pilgrim flees (Init HP), a Coral Brawler or the Moss
# Mother calls (Call HP, HP Call Buddy), a hive spawns, Tormented Trobbio flashes (CrossFlash HP).
PHASE_FSMS = {'Control', 'Phase Control', 'Death Control'}
PHASES = re.compile(r'\bP\d\b|\bPhase\b|\bRage\b')
# The bosses whose FSM isn't on the object that carries their journal record, by scene, or by
# scene and object where two share a scene; and Lace and the Conchflies, whose fights share one.
SCENE_KEY = {
    'abyss_cocoon': 'NAME_LOST_LACE', 'belltown_shrine': 'NAME_SPINNER_BOSS', 'clover_10': 'NAME_CLOVER_DANCER',
    'cog_dancers_boss': 'NAME_CLOCKWORK_DANCER', 'coral_29': 'NAME_ZAP_CORE_ENEMY', 'coral_judge_arena': 'NAME_LAST_JUDGE',
    'cradle_03': 'NAME_SILK_BOSS', 'crawl_10': 'NAME_BLUE_ASSISTANT', 'ward_02_boss': 'NAME_CONDUCTOR_BOSS',
    'shadow_18': 'NAME_SWAMP_SHAMAN', 'slab_10b': 'NAME_FIRST_WEAVER',
    ('library_13', 'Trobbio'): 'NAME_TROBBIO', ('library_13', 'Tormented Trobbio'): 'NAME_TORMENTED_TROBBIO',
    'organ_01': 'NAME_PHANTOM', 'bellway_centipede_arena': 'NAME_GIANT_CENTIPEDE',
    'dock_09': 'NAME_DOCK_GUARD_THROWER', 'belltown_08': 'NAME_WISP_PYRE_EFFIGY',
}
SCENE_FOE = {'bone_east_12': 'lace', 'song_tower_01': 'lace-the-cradle', 'coral_27': 'raging-conchfly', 'coral_11': 'great-conchfly'}
# The fights broken in pieces, each with a health of its own in its FSM: by scene, the FSMs in the
# order the fight breaks them (Father of the Flame's lanterns, then its core).
PIECES = {'belltown_08': ['wisp_brazier_arm', 'Take Damage']}
INT, FLOAT, STRING, EVENT, ENUM, VAR = 16, 15, 18, 23, 7, 39
# IntOperator's operation (an enum, stored in byteData): the four that make a share.
OPERATION = {0: lambda a, b: a + b, 1: lambda a, b: a - b, 2: lambda a, b: a * b, 3: lambda a, b: a / b}


def fsms(game):
    """Every PlayMakerFSM that reads its health (CompareHP, GetHP), has a phase's own health, or
    keeps a health of its own (Total Times Hit: Father of the Flame's lanterns and core), scene by
    scene: (scene, object, the object's journal key or None, fsm, the object's HealthManager
    health or None). The key is the enemy's EnemyDeathEffects' record, as
    tools/extract-journal-rooms.py reads it."""
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    scenes = os.path.join(aa, 'scenes_scenes_scenes')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    cls = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    pm = {k for k, v in cls.items() if v == 'PlayMakerFSM'}
    death = {k for k, v in cls.items() if v.startswith('EnemyDeathEffects') and v != 'EnemyDeathEffectsProfile'}
    health = {k for k, v in cls.items() if v == 'HealthManager'}
    script = lambda raw: struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None
    record = {}
    for o in UnityPy.load(bundles['journalrecords.bundle']).objects:
        if o.type.name == 'MonoBehaviour' and cls.get(script(o.get_raw_data())) == 'EnemyJournalRecord':
            record[(o.assets_file.name.lower(), o.path_id)] = o.read_typetree()['displayName']['Key']
    names = sorted(f[:-7] for f in os.listdir(scenes) if f.endswith('.bundle'))
    for i, name in enumerate(names):
        env = UnityPy.load(os.path.join(scenes, name + '.bundle'))
        keys, hps, found = {}, {}, []
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            raw = o.get_raw_data()
            sid = script(raw)
            if sid in health:
                hps[struct.unpack_from('<q', raw, 4)[0]] = o.read_typetree().get('hp')
            elif sid in death:
                d = o.read_typetree()
                p = d.get('journalRecord') or {}
                if p.get('m_PathID'):
                    f = o.assets_file.name if p['m_FileID'] == 0 else o.assets_file.externals[p['m_FileID'] - 1].path.split('/')[-1]
                    keys[d['m_GameObject']['m_PathID']] = record.get((f.lower(), p['m_PathID']))
            elif sid in pm and any(w in raw for w in (b'CompareHP', b'GetHP', b'P1 HP', b'Phase 1 HP', b'Total Times Hit')):
                try:
                    go = o.read().m_GameObject.read().m_Name
                except Exception:
                    go = '?'
                found.append((struct.unpack_from('<q', raw, 4)[0], go, o.read_typetree()['fsm']))
        for gid, go, f in found:
            yield name, go, keys.get(gid), f, hps.get(gid)
        if i % 50 == 0:
            print(f'{i}/{len(names)} {name}', file=sys.stderr, flush=True)


def actions(state):
    """A state's actions as (short name, {param: value}): an FsmInt or FsmFloat is its variable's
    name when it points at one ({'var': name}), else its number; an event or an FsmString, its
    text; CallMethodProper's arguments, in `args`."""
    ad = state['actionData']
    start = list(ad['actionStartIndex']) + [len(ad['paramName'])]
    out = []
    raw = bytes(ad['byteData'])
    for i, full in enumerate(ad['actionNames']):
        ps = {}
        for j in range(start[i], start[i + 1]):
            kind, pos, size = ad['paramDataType'][j], ad['paramDataPos'][j], ad['paramByteDataSize'][j]
            lst = ad['fsmIntParams' if kind == INT else 'fsmFloatParams'] if kind in (INT, FLOAT) else None
            if kind in (INT, FLOAT) and size >= 5:
                # Stored inline, in byteData: the number (4 bytes), whether it's a variable (1),
                # and the variable's name (the rest). Phantom's and the Forebrothers' FSMs are so.
                n = struct.unpack_from('<i' if kind == INT else '<f', raw, pos)[0]
                var = raw[pos + 5:pos + size].decode('utf-8', 'replace')
                ps[ad['paramName'][j]] = {'var': var} if raw[pos + 4] and var else n
            elif lst is not None and pos < len(lst):   # an array's items are stored elsewhere
                p = lst[pos]
                ps[ad['paramName'][j]] = {'var': p['name']} if p.get('useVariable') and p.get('name') else p.get('value')
            elif kind == EVENT:
                ps[ad['paramName'][j]] = ad['stringParams'][pos] if pos < len(ad['stringParams']) else None
            elif kind == STRING and pos < len(ad['fsmStringParams']):
                ps[ad['paramName'][j]] = ad['fsmStringParams'][pos]['value']
            elif kind == VAR and pos < len(ad['fsmVarParams']):   # an argument: its number, if an int (type 1)
                v = ad['fsmVarParams'][pos]
                ps.setdefault('args', []).append(v.get('intValue') if v.get('type') == 1 else None)
            elif kind == ENUM and ad['paramByteDataSize'][j] == 4:
                ps[ad['paramName'][j]] = struct.unpack_from('<i', bytes(ad['byteData']), pos)[0]
        out.append((full.split(',')[0].split('.')[-1], ps))
    return out


def thresholds(f):
    """Runs the int actions over the states in order: a variable is ('share', x) of the health,
    or ('hp', n). Each comparison with the health: its threshold and the state its event leads to.
    The health is compared by CompareHP and CompareHPBool, or read into a variable (GetHP, a share
    of 1) and compared with another by IntCompare, IntTestToBool or IntCompareToBool (Sister
    Splinter, Gurr, the Raging Conchfly), or two healths added (the Bell Eater's head and rear,
    GetHPEveryFrame: the sum is the fight's health, a share of 1 too). A CompareHP whose state then
    calls HealthManager.AddHP isn't a phase but a heal (the Forebrothers'): 'heal', with its
    arguments. Run twice: the first pass only sets the variables, since a state can compare with
    one that a later state sets (Gurr's Choice, before Set HPs)."""
    val = {v['name']: ('hp', v['value']) for v in f.get('variables', {}).get('intVariables', []) if v['value']}
    get = lambda p: val.get(p['var']) if isinstance(p, dict) else ('hp', p) if isinstance(p, (int, float)) else None
    name = lambda p: p.get('var') if isinstance(p, dict) else None
    health = lambda p: isinstance(p, dict) and val.get(p['var']) == ('share', 1.0)
    found = []

    def compare(s, to, p, ev=None):
        v = get(p)
        if v and v != ('share', 1.0):
            found.append({'state': s['name'], 'var': name(p), v[0]: v[1], 'to': to.get(ev), 'events': to})

    for run in (0, 1):
        for s in f['states']:
            to = {t['fsmEvent']['name']: t['toState'] for t in s.get('transitions', [])}
            acts = actions(s)
            for i, (a, ps) in enumerate(acts):
                if a in ('GetHP', 'GetHPEveryFrame') and isinstance(ps.get('storeValue'), dict):
                    val[ps['storeValue']['var']] = ('share', 1.0)
                elif a == 'SetIntValue' and isinstance(ps.get('intVariable'), dict):
                    v = get(ps.get('intValue'))
                    if v:
                        val[ps['intVariable']['var']] = v
                elif a == 'MultiplyIntByFloat' and isinstance(ps.get('storeResult'), dict):
                    v, m = get(ps.get('integer')), ps.get('multiplyFloat')
                    if v and isinstance(m, (int, float)):
                        val[ps['storeResult']['var']] = (v[0], round(v[1] * m, 4))
                elif a == 'IntOperator' and isinstance(ps.get('storeResult'), dict) and ps.get('operation') in OPERATION:
                    v, w = get(ps.get('integer1')), get(ps.get('integer2'))
                    if v and w and w[0] == 'hp' and w[1]:   # a share or a health, by a number
                        val[ps['storeResult']['var']] = (v[0], round(OPERATION[ps['operation']](v[1], w[1]), 4))
                    elif v == w == ('share', 1.0) and ps['operation'] == 0:   # two healths added
                        val[ps['storeResult']['var']] = v
                elif not run:
                    continue
                elif a == 'CompareHP':
                    add = next((q['args'] for b, q in acts[i + 1:] if b == 'CallMethodProper' and q.get('methodName') == 'AddHP'), None)
                    if add and isinstance(ps.get('integer2'), int):
                        found.append({'state': s['name'], 'var': None, 'heal': [ps['integer2']] + add[:2], 'to': None, 'events': to})
                    else:
                        compare(s, to, ps.get('integer2'), ps.get('lessThan') or ps.get('equal'))
                elif a == 'CompareHPBool':
                    compare(s, to, ps.get('compareTo'))
                elif a in ('IntCompare', 'IntTestToBool', 'IntCompareToBool'):
                    x, y = (ps.get(k) for k in (('int1', 'int2') if a == 'IntTestToBool' else ('integer1', 'integer2')))
                    if health(x) and not health(y):
                        compare(s, to, y, ps.get('lessThan') or ps.get('equal'))
    return found


def bars(f):
    """A phase's own health, when the boss has one per phase (P1 HP, P2 HP… or Phase 1 HP…): the
    values in order, or None."""
    v = {}
    for x in f.get('variables', {}).get('intVariables', []):
        m = re.fullmatch(r'(?:P|Phase )(\d) HP', x['name'])
        if m:
            v[int(m.group(1))] = x['value']
    got = []
    for k in sorted(v):   # the phases fought: the first ones with a health (the Clover Dancers' 3 and 4 are 0)
        if not v[k]:
            break
        got.append(v[k])
    return got if len(got) > 1 and 1 in v else None


def piece(f):
    """A health its FSM keeps, with no HealthManager (Father of the Flame's lanterns and core): its
    HP variable, which it takes the damage dealt from (IntOperator HP - Damage Dealt), and the
    hits after which it breaks anyway (IntCompare Total Times Hit > n: n + 1). [hp, hits] or None."""
    iv = {v['name']: v['value'] for v in f.get('variables', {}).get('intVariables', [])}
    hurt = hits = None
    for s in f['states']:
        for a, ps in actions(s):
            if a == 'IntOperator' and ps.get('operation') == 1 and ps.get('integer1') == {'var': 'HP'} == ps.get('storeResult') \
                    and ps.get('integer2') == {'var': 'Damage Dealt'}:
                hurt = True
            elif a == 'IntCompare' and ps.get('integer1') == {'var': 'Total Times Hit'} and isinstance(ps.get('integer2'), int) and ps.get('greaterThan'):
                hits = ps['integer2'] + 1
    return [iv['HP'], hits] if hurt and iv.get('HP') else None


def reset(f):
    """The health its FSM sets back with a number (SetHP), as Phantom's 60 after a missed Cross
    Stitch (its Fail Hit state), or None. write() keeps it only below the boss's health."""
    for s in f['states']:
        for a, ps in actions(s):
            if a == 'SetHP' and isinstance(ps.get('hp'), int) and ps['hp'] > 1:
                return ps['hp']
    return None


def main(game, dump, cache):
    # --cache=<file>: the FSMs read once, kept (pickled) for the runs that follow.
    if cache and os.path.exists(cache):
        every = pickle.load(open(cache, 'rb'))
    else:
        every = list(fsms(game))
        if cache:
            pickle.dump(every, open(cache, 'wb'))
    found = []
    for sc, go, key, f, hp in every:
        t = thresholds(f)
        if t or bars(f) or piece(f):
            found.append({'scene': sc, 'object': go, 'key': key, 'fsm': f.get('name'), 'hp': hp, 'thresholds': t,
                          'bars': bars(f), 'piece': piece(f), 'reset': reset(f)})
    if dump:
        json.dump(found, open(dump, 'w'), indent=1)
        print(f'{len(found)} FSMs → {dump}')
    write(found)


def write(found):
    """js/phases.js: for each boss of js/enemies.js (its id), where its phases change, highest
    first (a number below 1 is a share of its health, from 1 up a health), and its bars when each
    phase has a health of its own that together make the fight's; with the rest described in
    js/phases.js's header (of, pieces and hits, heal, reset)."""
    foes = json.loads(subprocess.run(['node', '-e', "const E=require('./js/enemies.js');"
                                      "console.log(JSON.stringify(E.FOES.filter((f)=>f.boss).map((f)=>[f.id,f.key,f.hp,f.bars||null])))"],
                                     cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    by_key = {}
    for fid, key, hp, bs in foes:
        by_key.setdefault(key, []).append((fid, hp, bs))
    keyed = lambda x: x['key'] or SCENE_KEY.get((x['scene'], x['object'])) or SCENE_KEY.get(x['scene'])
    out = {}
    for x in found:
        key = keyed(x)
        if x['fsm'] not in PHASE_FSMS or key not in by_key:
            continue
        ids = [f for f in by_key[key] if f[0] == SCENE_FOE[x['scene']]] if x['scene'] in SCENE_FOE else by_key[key]
        at = [t.get('share', t.get('hp')) for t in x['thresholds'] if t['var'] is None or PHASES.search(t['var'])]
        at = [a for a in at if a and (0 < a < 1 or a >= 2)]
        heal = next((t['heal'] for t in x['thresholds'] if 'heal' in t), None)
        for fid, hp, bs in ids:
            e = out.setdefault(fid, {})
            if at:
                e['at'] = sorted(set(e.get('at', [])) | set(at), key=lambda a: -(a * (hp or 0) if a < 1 else a))
                # Shares of one of the fight's bars (Signis's 720 of the Forebrothers' 1,240): its own.
                if bs and x['hp'] in bs and x['hp'] != hp and any(a < 1 for a in at):
                    e['of'] = x['hp']
            if x['bars'] and sum(x['bars']) == hp:
                e['bars'] = x['bars']
            if heal:
                e['heal'] = heal
            # A health set back below the boss's own (the Cogwork and Clover Dancers' 9999 is a
            # dancer made unkillable while the other dances, not a reset).
            if x['reset'] and hp and x['reset'] < hp:
                e['reset'] = x['reset']
    # The fights in pieces: each FSM's pieces, in the order the fight breaks them, a bar.
    for sc, order in PIECES.items():
        got = [x for x in found if x['scene'] == sc and x['piece']]
        if not got or keyed(got[0]) not in by_key:
            continue
        ps = [[x['piece'] for x in got if x['fsm'] == name] for name in order]
        if not all(ps) or any(len({tuple(p) for p in each}) > 1 for each in ps):
            sys.exit(f'{sc}: the pieces changed: {ps}')
        for fid, hp, bs in by_key[keyed(got[0])]:
            if sum(len(each) * each[0][0] for each in ps) == hp:
                out.setdefault(fid, {}).update(bars=[len(each) * each[0][0] for each in ps], pieces=[len(each) for each in ps],
                                               hits=[each[0][1] for each in ps])
    out = {k: v for k, v in sorted(out.items()) if v}
    data = json.dumps(out, separators=(',', ':'))
    open(OUT, 'w').write(
        "/* js/phases.js — each boss's phases: where its FSM moves on (at: highest first, a number below\n"
        "   1 a share of its health, from 1 up a health) and, when each phase has a health of its own,\n"
        "   its bars. By the boss's id in js/enemies.js. And, for the few that go otherwise:\n"
        "     of      the health the shares are of, when it's one of the fight's bars (Signis's)\n"
        "     pieces  how many pieces make each bar, each breaking at its share or after its `hits`\n"
        "             (Father of the Flame's four lanterns, then its core)\n"
        "     heal    [at, add, max]: when one of two falls, the other at `at` or below heals `add`,\n"
        "             to `max` at most (the Forebrothers)\n"
        "     reset   at 0, the health it's set back to if the finishing prompt is missed (Phantom's)\n"
        "   GENERATED by tools/extract-phases.py from the game's own files: not edited by hand. */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.phases = {data};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.phases;\n})();\n")
    print(f'{len(out)} bosses with phases → js/phases.js')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-phases.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--dump=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--dump'), opt('--cache'))
