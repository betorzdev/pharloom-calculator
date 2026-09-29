"""tools/extract-hero.py — how fast Hornet slashes with each Crest, from the game's own files, into
js/hero.js. Needs the game installed and UnityPy, as tools/extract-map.py does:
    uv venv /tmp/unitypy && uv pip install --python /tmp/unitypy/bin/python UnityPy
    /tmp/unitypy/bin/python tools/extract-hero.py "<Steam>/steamapps/common/Hollow Knight Silksong"
Re-run it after a patch that touches the Crests (design/00-study.md §2.3).

What the game does (its code, HeroController and HeroControllerConfig, read with ILSpy on
28-Sep-2026): a slash (sideways or up; DidAttack) sets the attack cooldown to the Crest's
attackCooldownTime, or quickAttackCooldownTime while Flea Brew's "quickening" lasts, but never
below its attackDuration; the next slash waits for it (CanAttack). So a slash every
max(cooldown, duration) seconds, the frame it runs out (at 60 fps, up to a frame later). The
Beast's config (HeroControllerConfigWarrior) has its own four values for its fury. Quickening
lasts the Hero prefab's QUICKENING_DURATION.

Silk Hearts' regeneration (HeroController.StartSilkRegen, ResetSilkRegen, AddSilk; PlayerData's
CurrentSilkRegenMax; read with ILSpy on 28-Sep-2026): a strand comes after a delay and then a
duration, both from the Hero prefab (FIRST_SILK_REGEN_* when the spool is empty, SILK_REGEN_*
otherwise), and only while the silk is below the cap, one strand per Silk Heart (silkRegenMax).
Any change of silk (a slash that lands, a Bind, a Skill, the regenerated strand itself) restarts
the delay. Weavelight (WHITE_RING) adds whiteRingSilkRegenIncrease to the cap and multiplies both
times by whiteRingSilkRegenTimeMultiplier, from the Gameplay settings.

Where it is:
  · herocontrollerconfigs.bundle: one HeroControllerConfig per moveset (Default, Wanderer,
    Warrior, Whip, Toolmaster, Reaper, Shaman, Cloakless).
  · crestitems.bundle: one ToolCrest per Crest (named as the save names it: Hunter, Warrior,
    Spell…), whose heroConfig points at its config; the Hunter's three stages point at none and
    use the Default one.
  · heroloading_assets_all.bundle: the Hero prefab's HeroController, with QUICKENING_DURATION
    and the four SILK_REGEN times.
  · globalsettings_assets_all.bundle: the Gameplay settings, with Weavelight's two values.

What a fight runs on (COMBAT, read on 29-Sep-2026 for js/fight.js): the Needle Strike's charge
(NAIL_CHARGE_TIME, and _QUICK with the Pin Badge) and the invulnerability after a hit (INVUL_TIME),
from the Hero prefab; from the Gameplay settings, the Hunter's focus (hunterComboHits needle hits
for hunterComboDamageMult, and evolved hunterCombo2ExtraHits more for hunterCombo2ExtraDamageMult),
the Beast's fury (warriorRageDuration, cut to warriorRageDamagedRemoveTime by a hit taken) and the
Reaper's mode after a Bind (reaperModeDuration).
The scripts are told apart by their MonoScript's class name, in the shared monoscripts bundle. """
import json, os, struct, sys
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = '6000.0.50f1'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'js', 'hero.js')
TIMES = ['attackDuration', 'attackCooldownTime', 'quickAttackCooldownTime']
RAGE = ['rageAttackDuration', 'rageAttackCooldownTime', 'rageQuickAttackCooldownTime']
REGEN = {'firstDelay': 'FIRST_SILK_REGEN_DELAY', 'firstDuration': 'FIRST_SILK_REGEN_DURATION',
         'delay': 'SILK_REGEN_DELAY', 'duration': 'SILK_REGEN_DURATION'}


def main(game):
    aa = os.path.join(game, 'Hollow Knight Silksong_Data', 'StreamingAssets', 'aa', 'StandaloneLinux64')
    bundles = {f: os.path.join(dp, f) for dp, dn, fn in os.walk(aa) for f in fn if f.endswith('.bundle')}
    mono = next(p for f, p in bundles.items() if f.endswith('_monoscripts.bundle'))
    CLASS = {o.path_id: o.read().m_ClassName for o in UnityPy.load(mono).objects if o.type.name == 'MonoScript'}
    env = UnityPy.load(bundles['herocontrollerconfigs.bundle'], bundles['crestitems.bundle'], bundles['heroloading_assets_all.bundle'],
                      bundles['globalsettings_assets_all.bundle'])

    def script(o):
        raw = o.get_raw_data()
        return CLASS.get(struct.unpack_from('<q', raw, 20)[0]) if len(raw) >= 28 else None

    configs, crests, quickening, regen, ring, hero, play = {}, {}, None, None, None, None, None
    for o in env.objects:
        if o.type.name != 'MonoBehaviour':
            continue
        cls = script(o)
        if cls in ('HeroControllerConfig', 'HeroControllerConfigWarrior'):
            d = o.read_typetree()
            c = {k: round(d[k], 4) for k in TIMES}
            if cls == 'HeroControllerConfigWarrior':
                c['rage'] = {k[4].lower() + k[5:]: round(d[k], 4) for k in RAGE}   # rageAttackDuration → attackDuration
            configs[o.path_id] = (d['m_Name'], c)
        elif cls == 'ToolCrest':
            d = o.read_typetree()
            crests[d['m_Name']] = d['heroConfig']['m_PathID']
        elif cls == 'HeroController':
            d = o.read_typetree()
            quickening = d['QUICKENING_DURATION']
            regen = {k: round(d[v], 4) for k, v in REGEN.items()}
            hero = d
        elif cls == 'Gameplay':
            d = o.read_typetree()
            ring = {'time': round(d['whiteRingSilkRegenTimeMultiplier'], 4), 'cap': d['whiteRingSilkRegenIncrease']}
            play = d
    default = next(c for name, c in configs.values() if name == 'Default')
    if quickening is None or regen is None or ring is None or not crests:
        sys.exit('extract-hero: the Hero prefab, the Gameplay settings or the Crests weren\'t found: the bundles changed')
    SLASH = {}
    for name, pid in sorted(crests.items()):
        if pid and pid not in configs:
            sys.exit(f'extract-hero: {name} points at a config that isn\'t in herocontrollerconfigs.bundle')
        SLASH[name] = configs[pid][1] if pid else default
    r4 = lambda x: round(x, 4)
    combat = {
        'charge': r4(hero['NAIL_CHARGE_TIME']), 'chargeQuick': r4(hero['NAIL_CHARGE_TIME_QUICK']), 'invul': r4(hero['INVUL_TIME']),
        'hunter': [[play['hunterComboHits'], r4(play['hunterComboDamageMult'])],
                   [play['hunterCombo2Hits'] + play['hunterCombo2ExtraHits'], r4(play['hunterCombo2ExtraDamageMult'])]],
        'fury': {'secs': r4(play['warriorRageDuration']), 'hurt': r4(play['warriorRageDamagedRemoveTime']), 'mult': r4(play['warriorDamageMultiplier'])},
        'reaper': r4(play['reaperModeDuration']),
    }
    data = {'SLASH': SLASH, 'QUICKENING': quickening, 'REGEN': {**regen, 'weavelight': ring}, 'COMBAT': combat}
    src = ("/* js/hero.js — how fast Hornet slashes with each Crest, in seconds.\n"
           "   GENERATED by tools/extract-hero.py from the game's own files (each Crest's\n"
           "   HeroControllerConfig): not edited by hand. SLASH: by the Crest's name as the save names it\n"
           "   (js/collectibles.js CRESTS), its attackDuration, attackCooldownTime and\n"
           "   quickAttackCooldownTime (Flea Brew's), and the Beast's in fury (rage). A slash waits\n"
           "   max(cooldown, duration) after the one before (js/engine.js). QUICKENING: how long Flea\n"
           "   Brew's lasts. REGEN: Silk Hearts' regeneration, a strand after delay + duration seconds\n"
           "   (first*: from an empty spool) while the silk is below the cap and doesn't change;\n"
           "   weavelight: its time multiplier and what it adds to the cap. COMBAT: what a fight runs on\n"
           "   (js/fight.js): the Needle Strike's charge, the Hunter's focus as [needle hits, ×damage],\n"
           "   the Beast's fury and the Reaper's mode in seconds. */\n"
           "(() => {\n  'use strict';\n  const SS = globalThis.SS || (globalThis.SS = {});\n"
           f"  SS.hero = {json.dumps(data, indent=2).replace(chr(10), chr(10) + '  ')};\n"
           "  if (typeof module !== 'undefined' && module.exports) module.exports = SS.hero;\n})();\n")
    open(OUT, 'w').write(src)
    for name, c in SLASH.items():
        print(f'{name:12} a slash every {max(c["attackCooldownTime"], c["attackDuration"]):.3f} s' + (
            f', {max(c["rage"]["attackCooldownTime"], c["rage"]["attackDuration"]):.3f} s in fury' if 'rage' in c else ''))
    print(f'Flea Brew: {quickening} s')
    print(f'Silk Hearts: a strand every {regen["delay"] + regen["duration"]:.3f} s '
          f'({regen["firstDelay"] + regen["firstDuration"]:.3f} s from empty); Weavelight ×{ring["time"]}, +{ring["cap"]} → js/hero.js')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('usage: extract-hero.py "<Steam>/steamapps/common/Hollow Knight Silksong"')
    main(sys.argv[1])
