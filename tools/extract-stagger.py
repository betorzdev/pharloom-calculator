"""tools/extract-stagger.py — how bosses stagger and how much each of Hornet's hits counts towards
it, from the game's own files, into js/stagger.js. Needs the game installed and UnityPy, as
tools/extract-hero.py does:
    /tmp/unitypy/bin/python tools/extract-stagger.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]

What the game does (read on 29-Sep-2026, Lace's first fight first). A boss that staggers carries a
PlayMakerFSM named "Stun Control", fed by its HealthManager with each hit's stun (STUN DAMAGE, the
hit's DamageEnemies.stunDamage):
  · Max Check: if Hits Total is already at Stun Hit Max or more (FloatCompare, equal or greater →
    STUN), this hit staggers it; so it staggers at the hit after the total reaches its maximum,
    the wiki's {{Stagger}} figure being Stun Hit Max + 1 for a needle slash of 1.
  · In Combo: the hit adds its stun to Hits Total and to Combo Counter, and at Stun Combo or more it
    staggers; the combo runs out after Combo Time (a Wait) with no hit, and starts over.
  · Stun: both counters back to 0. Until the boss's own FSM sends STUN CONTROL START, the hits it
    takes still add to Hits Total (Unstun Increment), not to the combo.
The boss's own FSM (Control) holds how long: its Stun Start sets Stun Timer (2 s for most; Phantom
1.5), Stunned counts it down each second (FloatAdd −1 per second) and ends at 0, and each hit it
takes meanwhile goes through Stun Damage, which takes a fixed amount off it (0.25 s; 0.1 for the
Moss Mother and the Savage Beastfly). Groal's has no timer (it waits in the air, then pauses): no
seconds, and the site lets it get up when you wait. So the wiki's "a stagger ends after 75
damage, and combos no longer exist" isn't what the files do.
Hornet's side: each attack's DamageEnemies (the Hero prefab's Attacks, one folder per Crest's
moveset: Default the Hunter's, Scythe the Reaper's, Warrior the Beast's, Toolmaster the
Architect's, Spell's is Shaman; its Charge Slash per Crest, the Needle Strike; the Special
Attacks, the Silk Skills; Taunt Slash, the Challenge) and each Tool's, in the hero's dynamic
bundle: its stunDamage, per hit.
--cache=<file> keeps the scenes' FSMs read, for the next run. """
import json, os, pickle, struct, subprocess, sys, warnings
import importlib.util
import UnityPy

warnings.filterwarnings('ignore')
UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'js', 'stagger.js')
_spec = importlib.util.spec_from_file_location('phases', os.path.join(HERE, 'extract-phases.py'))
P = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(P)
actions = P.actions

# The bosses whose Stun Control isn't on the object with their journal record, or several fights of
# one record: by scene (and object), the foe ids of js/enemies.js. What isn't here goes by its key.
SCENE_FOES = {
    'abyss_cocoon': ['lost-lace'], 'belltown_shrine': ['widow'], 'coral_judge_arena': ['last-judge'],
    'cradle_03': ['grand-mother-silk'], 'library_13': {'Trobbio': ['trobbio'], 'Tormented Trobbio': ['tormented-trobbio']},
    'organ_01': ['phantom'], 'shadow_18': ['groal-the-great'], 'slab_10b': ['first-sinner'],
    'bone_east_12': ['lace'], 'song_tower_01': ['lace-the-cradle'], 'coral_33': ['lost-garmond'],
    'library_09': ['garmond-and-zaza'], 'tut_03': ['moss-mother-ruined-chapel'], 'tut_02': ['moss-mother-act-3-moss-grotto'], 'weave_03': ['moss-mother-weavenest-atla'],
}
# The fights of two bosses at once, each staggering on its own: by scene, each object's part.
PARTS = {'dock_09': ('forebrothers-signis-and-gron', {'Dock Guard Slasher': 'signis', 'Dock Guard Thrower': 'gron'})}
# Helpers with a Stun Control that aren't a boss of the site (Shakra's spar with the Mapper).
SKIP = {('greymoor_08_mapper', 'Mapper Spar NPC')}

# Hornet's attacks: the Crest's moveset folder in the Hero prefab, by the site's Crest id.
MOVESET = {'Default': 'hunter', 'Scythe': 'reaper', 'Wanderer': 'wanderer', 'Warrior': 'beast', 'Witch': 'witch',
           'Toolmaster': 'architect', 'Shaman': 'shaman', 'Cloakless': 'cloakless'}
STRIKE = {'Charge Slash Basic': 'hunter', 'Charge Slash Scythe': 'reaper', 'Charge Slash Wanderer': 'wanderer',
          'Charge Slash Warrior': 'beast', 'Charge Slash Witch': 'witch', 'Charge Slash Toolmaster': 'architect',
          'Charge Slash Shaman': 'shaman'}
SKILLS = {'Needle Throw': 'silkspear', 'Silk Charge Damager': 'sharpdart', 'Sphere Ball': 'thread-storm', 'ParryDash Dmg': 'cross-stitch'}
# The Tools' prefabs, by the object that deals the damage (the hero's dynamic bundle and the Tools'
# own), and the site's Tool id.
TOOLS = {'Tool Pin': 'straight-pin', 'Curve Claw': 'curveclaw', 'Curve Claw Upgraded': 'curvesickle',
         'Lightning Bola Ball': 'voltvessels', 'Tool Wheel': 'cogwork-wheel', 'Tool_pinpilo_explosion': 'pimpillo',
         'Hero Conch Projectile': 'conchcutter', 'Snare Loop Damager': 'snare-setter', 'Extractor Hit': 'needle-phial',
         'SnipeShot Impact': 'silkshot'}


def bundles(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    return aa, {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}


def classes(files):
    mono = next(p for f, p in files.items() if f.endswith('_monoscripts.bundle'))
    return {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}


script = lambda raw: struct.unpack_from('<q', raw, 20)[0] if len(raw) >= 28 else None


def scenes(game, cls):
    """Every object that carries a Stun Control, scene by scene: (scene, object, journal key, its FSMs)."""
    aa, files = bundles(game)
    pm = {k for k, v in cls.items() if v == 'PlayMakerFSM'}
    death = {k for k, v in cls.items() if v.startswith('EnemyDeathEffects') and v != 'EnemyDeathEffectsProfile'}
    record = {}
    for o in UnityPy.load(files['journalrecords.bundle']).objects:
        if o.type.name == 'MonoBehaviour' and cls.get(script(o.get_raw_data())) == 'EnemyJournalRecord':
            record[(o.assets_file.name.lower(), o.path_id)] = o.read_typetree()['displayName']['Key']
    folder = os.path.join(aa, 'scenes_scenes_scenes')
    names = sorted(f[:-7] for f in os.listdir(folder) if f.endswith('.bundle'))
    out = []
    for i, name in enumerate(names):
        env = UnityPy.load(os.path.join(folder, name + '.bundle'))
        keys, by = {}, {}
        for o in env.objects:
            if o.type.name != 'MonoBehaviour':
                continue
            raw = o.get_raw_data()
            sid = script(raw)
            if sid in death:
                d = o.read_typetree()
                p = d.get('journalRecord') or {}
                if p.get('m_PathID'):
                    f = o.assets_file.name if p['m_FileID'] == 0 else o.assets_file.externals[p['m_FileID'] - 1].path.split('/')[-1]
                    keys[d['m_GameObject']['m_PathID']] = record.get((f.lower(), p['m_PathID']))
            elif sid in pm and b'Stun' in raw:
                by.setdefault(struct.unpack_from('<q', raw, 4)[0], []).append(o)
        for gid, objs in by.items():
            fsms = [o.read_typetree()['fsm'] for o in objs]
            if any(f['name'] == 'Stun Control' for f in fsms):
                out.append((name, objs[0].read().m_GameObject.read().m_Name, keys.get(gid), fsms))
        if i % 50 == 0:
            print(f'{i}/{len(names)} {name}', file=sys.stderr, flush=True)
    return out


def events(state):
    """Each action's events, inline in byteData (Stun Control's FloatCompares keep them there)."""
    ad = state['actionData']
    raw = bytes(ad['byteData'])
    start = list(ad['actionStartIndex']) + [len(ad['paramName'])]
    out = []
    for i, full in enumerate(ad['actionNames']):
        ev = {}
        for j in range(start[i], start[i + 1]):
            if ad['paramDataType'][j] == P.EVENT:
                pos, size = ad['paramDataPos'][j], ad['paramByteDataSize'][j]
                ev[ad['paramName'][j]] = raw[pos:pos + size].decode('utf-8', 'replace') if size else (
                    ad['stringParams'][pos] if pos < len(ad['stringParams']) else '')
        out.append((full.split(',')[0].split('.')[-1], ev))
    return out


def stun(fsms):
    """{ max, combo, window, secs, shave } from one object's FSMs, as the header says."""
    sc = next(f for f in fsms if f['name'] == 'Stun Control')
    V = sc['variables']
    iv = {v['name']: v['value'] for v in V.get('intVariables', [])}
    fv = {v['name']: v['value'] for v in V.get('floatVariables', [])}
    st = {s['name']: s for s in sc['states']}
    # The checks must still be "at or over": a patch that makes them strict moves every figure.
    for name, want in (('Max Check', 'STUN'), ('In Combo', 'STUN')):
        cmp = next((e for a, e in events(st[name]) if a == 'FloatCompare'), None)
        if not cmp or cmp.get('equal') != want or cmp.get('greaterThan') != want:
            sys.exit(f'extract-stagger: {name} no longer staggers at or over its figure: {cmp}')
    secs = shave = None
    for f in fsms:
        if f['name'] == 'Stun Control':
            continue
        for s in f['states']:
            for a, p in actions(s):
                var = p.get('floatVariable')
                if not (isinstance(var, dict) and var.get('var') == 'Stun Timer'):
                    continue
                if a == 'SetFloatValue' and s['name'].startswith('Stun') and 'Bell' not in s['name'] and secs is None:
                    secs = round(p['floatValue'], 4)
                if a == 'FloatAdd' and s['name'] == 'Stun Damage':
                    shave = round(-p['add'], 4)
    return {'max': iv['Stun Hit Max'], 'combo': iv['Stun Combo'], 'window': round(fv['Combo Time'], 4),
            'secs': secs, 'shave': shave if secs is not None else None}


def hornet(files, cls):
    """Each of Hornet's attacks' stun, per hit, from the Hero prefab and the Tools' prefabs."""
    dmg = {k for k, v in cls.items() if v == 'DamageEnemies'}
    env = UnityPy.load(files['heroloading_assets_all.bundle'], files['herodynamic_assets_all.bundle'])
    rows = []
    for o in env.objects:
        if o.type.name != 'MonoBehaviour' or script(o.get_raw_data()) not in dmg:
            continue
        d = o.read_typetree()
        path, go = [], o.read().m_GameObject.read()
        while go is not None and len(path) < 8:
            path.append(go.m_Name)
            tr = go.m_Component[0].component.read()
            go = tr.m_Father.read().m_GameObject.read() if tr.m_Father and tr.m_Father.path_id else None
        rows.append((list(reversed(path)), round(d['stunDamage'], 4)))
    out = {'slash': {}, 'strike': {}, 'skills': {}, 'tools': {}, 'challenge': None}
    for path, s in rows:
        top = path[0]
        if top == 'Hero_Hornet' and len(path) >= 4 and path[1] == 'Attacks' and path[2] in MOVESET and path[3] in ('Slash', 'Kick'):
            out['slash'][MOVESET[path[2]]] = s
        elif top == 'Hero_Hornet' and len(path) >= 3 and path[1] == 'Attacks' and path[2] in STRIKE:
            # The hits' stun: the Crest's strike deals several, each carrying it (the front one, the Architect's).
            out['strike'].setdefault(STRIKE[path[2]], s)
        elif top == 'Hero_Hornet' and path[1:2] == ['Special Attacks'] and len(path) >= 3:
            sk = next((SKILLS[x] for x in path[2:] if x in SKILLS), None)
            if sk:
                out['skills'][sk] = s
        elif top == 'Hero_Hornet' and path[1:] == ['Taunt Slash']:
            out['challenge'] = s
        else:
            tool = next((TOOLS[x] for x in path if x in TOOLS), None)
            if tool:
                out['tools'][tool] = max(out['tools'].get(tool, 0), s)
    missing = [k for k in MOVESET.values() if k not in out['slash']] + [k for k in STRIKE.values() if k not in out['strike']]
    if missing or out['challenge'] is None:
        sys.exit(f'extract-stagger: the Hero prefab changed, not found: {missing}')
    return out


def main(game, cache):
    aa, files = bundles(game)
    cls = classes(files)
    if cache and os.path.exists(cache):
        found = pickle.load(open(cache, 'rb'))
    else:
        found = scenes(game, cls)
        if cache:
            pickle.dump(found, open(cache, 'wb'))
    foes = json.loads(subprocess.run(['node', '-e', "const E=require('./js/enemies.js');"
                                      "console.log(JSON.stringify(E.FOES.filter((f)=>f.boss).map((f)=>[f.id,f.key])))"],
                                     cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    by_key = {}
    for fid, key in foes:
        by_key.setdefault(key, []).append(fid)
    bosses = {}
    for sc, go, key, fsms in found:
        if (sc, go) in SKIP:
            continue
        s = stun(fsms)
        if sc in PARTS:
            fid, parts = PARTS[sc]
            bosses.setdefault(fid, {'parts': {}})['parts'][parts[go]] = s
            continue
        ids = SCENE_FOES.get(sc)
        if isinstance(ids, dict):
            ids = ids.get(go)
        ids = ids or by_key.get(key) or []
        if not ids:
            print(f'  no boss for {sc} {go} {key}', file=sys.stderr)
        for fid in ids:
            if fid in bosses and bosses[fid] != s:
                sys.exit(f'extract-stagger: {fid} staggers two ways: {bosses[fid]} and {s}')
            bosses[fid] = s
    data = {'BOSSES': dict(sorted(bosses.items())), 'HORNET': hornet(files, cls)}
    open(OUT, 'w').write(
        "/* js/stagger.js — how bosses stagger and what each of Hornet's hits counts towards it, from the\n"
        "   game's own files (tools/extract-stagger.py's header says how the game runs it).\n"
        "   BOSSES, by the boss's id in js/enemies.js (parts: two bosses at once, each its own):\n"
        "     max     it staggers at the hit after its hits' stun adds up to this\n"
        "     combo   or when hits each within `window` seconds of the last add up to this\n"
        "     secs    how long it's down (null: until you wait), and shave, what each hit it takes\n"
        "             meanwhile takes off that\n"
        "   HORNET: the stun of one hit: a slash by Crest, a Needle Strike's hit by Crest, a Silk Skill's,\n"
        "   the Challenge's, a Tool's (by the site's ids; what isn't here wasn't found, and counts 1).\n"
        "   GENERATED by tools/extract-stagger.py: not edited by hand. */\n"
        "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
        f"  SS.stagger = {json.dumps(data, separators=(',', ':'))};\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.stagger;\n})();\n")
    print(f'{len(bosses)} bosses, {len(data["HORNET"]["tools"])} Tools → js/stagger.js')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit('usage: extract-stagger.py "<Steam>/steamapps/common/Hollow Knight Silksong" [--cache=<file>]')
    opt = lambda k: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(k + '=')), None)
    main(args[0], opt('--cache'))
