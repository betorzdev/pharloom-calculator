/* js/engine.js — Hornet's figures for a build: what the Crest screen shows. Pure: no DOM, and
   the maths never depends on the language (compute(state, lang) only picks the names).

   The damage model is the wiki's ("Damage Values and Enemy Health (Silksong)", design/00-study.md
   §2.1): weapon[level] × enemy_modifier[level] × (1 + Σ player modifiers), rounded half to the
   even integer, per hit. The enemy's modifier comes with Combat (phase 5): here it's 1. Two
   ladders: the Needle's level for the Needle, its Strike and the Silk Skills; the Crafting Kit's
   for the Tools (already per level in js/data.js). Player modifiers ADD inside the bracket
   (Hunter's focus, Beast's fury, Barbed Bracelet, Flintslate, Challenge; Shaman and Volt
   Filament for Skills); the Wanderer's critical hit multiplies after it. The wiki's exceptions
   to the rounding: the follow-up hits of Threefold Pin and Silkshot round down (roundDown).

   A build (normalize() fills what's missing):
     crest       a Crest id (js/data.js CRESTS)       hunterStage  1, 2 or 3 (Eva's evolutions)
     needle      0–4        kit, pouch   0–4         masks 0–5, spools 0–9, hearts 0–3 (gained)
     tools       Tool ids equipped                    skill        a Silk Skill id or null
     vest        the Vesticrest's extra slots open: { yellow, blue } (Eva's, at 12 and 20 slots)
     focus       the Hunter's focus is up (its full stage: +0.3, or +0.5 evolved)
     fury        the Beast's fury is up                flint        Flintslate's buff is up
     challenge   the next hit after a Challenge (+0.5)
   compute() → { needle, strike, skills, tools, silk, health, slots, mods } (see each below).

   How fast: js/hero.js, each Crest's timings from the game's files. A slash waits max(cooldown,
   duration) after the one before (the game's HeroController.DidAttack); the Beast in fury has
   its own; Flea Brew's cooldown is shorter, but never below the slash itself. needle.speed. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const D = SS.data || require('./data.js');
  const HERO = SS.hero || require('./hero.js');
  const CO = SS.collectibles || require('./collectibles.js');

  /* Half to the even integer, as the game rounds (0.5 → 0, 1.5 → 2, 2.5 → 2). The products are
     floats: a value within 1e-9 of .5 counts as .5 (29 × 2.75 = 79.75 is exact; 5 × 1.3 isn't). */
  function roundHalfEven(x) {
    const f = Math.floor(x), d = x - f;
    if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
    return Math.round(x);
  }
  const clamp = (v, lo, hi, def) => (Number.isFinite(Number(v)) ? Math.max(lo, Math.min(hi, Math.round(Number(v)))) : def);

  const CREST = new Map(D.CRESTS.map((c) => [c.id, c]));
  const TOOL = new Map(D.TOOLS.map((t) => [t.id, t]));
  const SKILL = new Map(D.SKILLS.map((s) => [s.id, s]));

  function normalize(s) {
    const x = s && typeof s === 'object' ? s : {};
    const crest = CREST.has(x.crest) ? x.crest : 'hunter';
    const tools = Array.isArray(x.tools) ? [...new Set(x.tools.filter((id) => TOOL.has(id)))] : [];
    return {
      crest, hunterStage: clamp(x.hunterStage, 1, 3, 1),
      needle: clamp(x.needle, 0, 4, 0), kit: clamp(x.kit, 0, 4, 0), pouch: clamp(x.pouch, 0, 4, 0),
      masks: clamp(x.masks, 0, 5, 0), spools: clamp(x.spools, 0, 9, 0), hearts: clamp(x.hearts, 0, 3, 0),
      tools, skill: SKILL.has(x.skill) ? x.skill : null,
      vest: { yellow: !!(x.vest && x.vest.yellow), blue: !!(x.vest && x.vest.blue) },
      focus: !!x.focus, fury: !!x.fury, flint: !!x.flint, challenge: !!x.challenge,
    };
  }

  /* The player's modifiers that apply now, to the Needle or to the Skills: { add, first, mul,
     active: [ids] }. first: what only the first hit of an attack takes (the Challenge: the wiki's
     own example, a Needle Strike's two hits at 2.75 and 2.25). The Hunter's focus is its evolved
     stages' sum: stage 2 +0.3, stage 3 +0.3 +0.2. */
  function modsFor(st, to) {
    let add = 0, first = 0, mul = 1;
    const active = [];
    const has = (id) => st.tools.includes(id);
    for (const m of D.MODIFIERS) {
      if (m.to !== to) continue;
      let on = false;
      if (m.id === 'challenge') on = st.challenge;
      else if (m.crest === 'hunter') on = st.crest === 'hunter' && st.focus && st.hunterStage >= m.stage;
      else if (m.id === 'beast-fury') on = st.crest === 'beast' && st.fury;
      else if (m.id === 'wanderer-critical') on = false;   // a chance, told apart (needle.crit)
      else if (m.id === 'flintslate') on = has('flintslate') && st.flint;
      else if (m.crest) on = st.crest === m.crest;
      else if (m.tool) on = has(m.tool);
      if (!on) continue;
      if (m.add && m.firstHit) first += m.add;
      else if (m.add) add += m.add;
      if (m.mul) mul *= m.mul;
      active.push(m.id);
    }
    return { add, first, mul, active };
  }

  /* A list of [damage, times] hits at one level → each hit's damage, one product rounded once:
     weapon × mult (the enemy's modifier × the bracket); the attack's very first hit takes first
     instead (the Challenge's). Returns each hit, the total, and rest: the total when the first
     hit takes no more than the others (a second use, after the Challenge is spent). */
  function hitsOf(list, mult = 1, roundDown = false, first = mult) {
    const round = (v, i) => (roundDown && i > 0 ? Math.floor(v + 1e-9) : roundHalfEven(v));
    const each = [], plain = [];
    let k = 0;
    list.forEach(([d, n], i) => {
      for (let j = 0; j < n; j++, k++) {
        each.push(round(d * (k === 0 ? first : mult), i));
        plain.push(round(d * mult, i));
      }
    });
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    return { each, total: sum(each), rest: sum(plain) };
  }
  // Uses of an attack to take hp: the first use as it is (with the Challenge), the rest plain.
  const usesToKill = (h, hp) => (!hp || !h.rest ? null : h.total >= hp ? 1 : 1 + Math.ceil((hp - h.total) / h.rest));

  /* Seconds between two slashes: the Crest's config by its name in the save (the Hunter's stages
     are Hunter_v2, Hunter_v3), the Beast's fury values while it rages; brew, under Flea Brew. */
  function interval(st, brew = false) {
    const name = CO.CRESTS[st.crest] + (st.crest === 'hunter' && st.hunterStage > 1 ? '_v' + st.hunterStage : '');
    const cfg = HERO.SLASH[name] || HERO.SLASH.Hunter;
    const c = st.crest === 'beast' && st.fury && cfg.rage ? cfg.rage : cfg;
    return Math.max(brew ? c.quickAttackCooldownTime : c.attackCooldownTime, c.attackDuration);
  }

  /* compute(state, { foe, black }): with an enemy (js/enemies.js FOES), every hit takes its
     modifier at the level of what hits, and each attack says how many uses kill it (black: its
     black-threaded health, Act 3). */
  function compute(state, opts = {}) {
    const st = normalize(state);
    const crest = CREST.get(st.crest);
    const has = (id) => st.tools.includes(id);
    const nm = modsFor(st, 'needle'), sm = modsFor(st, 'skill');
    const bracketN = 1 + nm.add, bracketS = 1 + sm.add;
    const foe = opts.foe || null;
    const em = (level) => (foe && Array.isArray(foe.mods) ? foe.mods[level] : 1);
    const hp = foe ? (opts.black ? foe.bt : foe.hp) : null;
    const eN = em(st.needle), eK = em(st.kit);
    // The Needle's multiplier and its first hit's (with the Challenge), the enemy's inside.
    const mN = bracketN * eN, fN = (bracketN + nm.first) * eN;
    const kill = (h) => (hp ? { ...h, uses: usesToKill(h, hp) } : h);

    /* The Needle: one slash at its level, through the bracket; the Wanderer's critical hit is ×3
       after it, 2% of hits (2.2% with Magnetite Dice, the wiki's figure). */
    const base = D.NEEDLES[st.needle].damage;
    const slash = roundHalfEven(base * fN);
    const critChance = st.crest === 'wanderer' ? (has('magnetite-dice') ? 0.022 : 0.02) : 0;
    const needle = {
      level: st.needle, base, bracket: bracketN + nm.first, slash, enemy: eN,
      crit: critChance ? { damage: roundHalfEven(base * fN) * 3, chance: critChance } : null,
    };

    /* The Crest's three slashes: one hit at 1x the Needle but for the Crests that split them
       (js/data.js, attacks: the Architect's drills, the Witch's whip); each hit is Needle ×
       multiplier × bracket, rounded on its own. charged: what holding the attack adds; onHit:
       the hit that only comes when the first ones land. */
    const ownAttacks = crest.attacks || {};
    const attack = (id) => {
      const a = ownAttacks[id] || { hits: [[1, 1]] };
      const at = (list, f = mN) => hitsOf((list || []).map(([m, n]) => [base * m, n]), mN, false, f);
      const h = kill(at(a.hits, fN));
      return { id, ...h, charged: a.charged ? at(a.charged).total : null, onHit: a.onHit ? at(a.onHit).total : null };
    };
    needle.attacks = ['slash', 'down', 'run'].map(attack);

    /* How fast the slash kills: its interval, damage per second (every hit landing, the enemy's
       modifier in; the Wanderer's criticals left out), under Flea Brew when it's equipped (for its
       QUICKENING seconds), and against an enemy the seconds until the killing slash: the first
       lands at 0, so (uses − 1) intervals. */
    const sl = needle.attacks[0], every = interval(st), brewEvery = has('flea-brew') ? interval(st, true) : null;
    const secs = (n, t) => (n ? Math.round((n - 1) * t * 100) / 100 : null);
    needle.speed = {
      interval: every, dps: sl.total / every, seconds: secs(sl.uses, every),
      brew: brewEvery ? { interval: brewEvery, dps: sl.total / brewEvery, seconds: secs(sl.uses, brewEvery), lasts: HERO.QUICKENING } : null,
    };

    // The Needle Strike: the Crest's own, at the Needle's level, through the same bracket.
    const sHits = crest.strike ? crest.strike.hits[st.needle] : null;
    const strike = sHits ? { ...kill(hitsOf(sHits, mN, false, fN)), minHits: crest.strike.minHits || null } : null;

    // The Silk Skills, all six at the Needle's level, and whether one is in the Crest's slot.
    const skills = D.SKILLS.map((s) => {
      const a = s.attacks[0];
      const h = kill(hitsOf(a.hits[st.needle], bracketS * eN, a.roundDown));
      return { id: s.id, equipped: st.skill === s.id, silk: has('egg-of-flealia') ? 3 : s.silk, ...h };
    });

    /* The Tools equipped that deal damage: each attack at the Kit's level (no player modifier
       reaches a Tool: they're Needle and Skill modifiers); the red ones' ammo at the Pouch's
       level, a full load's damage and its refill in shell shards. */
    const tools = st.tools.map((id) => {
      const t = TOOL.get(id);
      const attacks = (t.attacks || []).map((a) => {
        // Bonus damage (a burn, a venom) takes no modifier at all, neither the enemy's nor Hornet's.
        const lvl = a.scale === 'needle' ? st.needle : st.kit;
        const mult = a.bonus ? 1 : (a.scale === 'needle' ? bracketN : 1) * em(lvl);
        const h = kill(hitsOf(a.hits[lvl], mult, a.roundDown));
        return { scale: a.scale, bonus: !!a.bonus, ...h };
      });
      const ammo = Array.isArray(t.ammo) ? t.ammo[st.pouch] : null;
      const main = attacks.find((a) => !a.bonus);
      return {
        id, color: t.color, attacks, ammo,
        load: ammo && main ? ammo * main.total : null,
        // A full load against the enemy: how much of its health, as a share (1 = it dies).
        loadShare: hp && ammo && main ? (ammo * main.total) / hp : null,
        refill: ammo && t.refill && t.refill.shards ? Math.round(ammo * t.refill.shards) : null,
      };
    });

    // Silk: the spool (9 + whole spools, +3 with the Spool Extender), a Bind's cost, Skill casts.
    const H = D.HORNET;
    const spool = H.silk.base + st.spools + (has('spool-extender') ? H.silk.extender : 0);
    const skillCost = has('egg-of-flealia') ? 3 : H.silk.skill;
    const silk = { spool, bind: H.silk.bind, skill: skillCost, casts: Math.floor(spool / skillCost), hearts: st.hearts };

    /* Health and the Bind: masks, what a Bind heals (Multibinder: two of 2) and how long it takes
       (Injector Band: 40% less). */
    const multi = has('multibinder');
    const health = {
      masks: H.masks.base + st.masks,
      bind: { heals: multi ? 4 : H.bind.heals, parts: multi ? [2, 2] : [H.bind.heals],
        seconds: Math.round(H.bind.seconds * (has('injector-band') ? 0.6 : 1) * 100) / 100 },
    };

    /* The slots: the Crest's per colour, open and locked (Memory Lockets open them), the
       Vesticrest's (extra: one yellow, one blue, whatever the Crest), and how many the build
       fills. A build that doesn't fit says so; it isn't cut. */
    const used = { red: 0, blue: 0, yellow: 0 };
    for (const id of st.tools) used[TOOL.get(id).color]++;
    const slots = {};
    for (const c of ['red', 'blue', 'yellow']) {
      const [open, locked] = crest.slots[c];
      const extra = st.vest[c] ? 1 : 0;
      slots[c] = { open, locked, extra, used: used[c], over: Math.max(0, used[c] - open - locked - extra) };
    }
    slots.skill = { open: crest.slots.skill, used: st.skill ? 1 : 0 };

    return { state: st, needle, strike, skills, tools, silk, health, slots,
      mods: { needle: nm.active, skill: sm.active }, foe: foe ? { id: foe.id, hp, black: !!opts.black, needle: eN, kit: eK } : null };
  }

  /* The fight as a whole against hp: the fewest slashes, spending first every red Tool's full load
     and every cast of the Silk Skill equipped that silk pays for. Silk: the spool full to start
     (as leaving a bench) and one strand per slash that lands; no Bind (no damage taken). When the
     loads alone kill it, only the throws needed, the Tools in their order. → { slashes, casts,
     throws: [{ id, n }], dealt } or null (no health: nothing to kill). */
  function plan(r, hp) {
    if (!hp) return null;
    const slash = r.needle.attacks[0].rest || r.needle.slash;
    const skill = r.skills.find((x) => x.equipped);
    const red = r.tools.filter((x) => x.ammo && x.attacks.length && !x.attacks[0].bonus);
    const throws = [];
    let dealt = 0;
    for (const x of red) {
      const per = x.attacks[0].rest || x.attacks[0].total;
      const n = Math.min(x.ammo, Math.ceil((hp - dealt) / per));
      if (n <= 0) break;
      throws.push({ id: x.id, n });
      dealt += n * per;
    }
    if (dealt >= hp) return { slashes: 0, casts: 0, throws, dealt };
    for (let s = 0; s <= 100000; s++) {
      const casts = skill && skill.rest ? Math.floor((r.silk.spool + s) / skill.silk) : 0;
      // Only the casts that are needed: the last slash counts first, then Skills top it up.
      const need = hp - dealt - s * slash;
      const used = skill && need > 0 ? Math.min(casts, Math.ceil(need / skill.rest)) : 0;
      if (dealt + s * slash + used * (skill ? skill.rest : 0) >= hp) {
        return { slashes: s, casts: used, throws, dealt: dealt + s * slash + used * (skill ? skill.rest : 0) };
      }
    }
    return null;
  }

  /* What the plan's fight leaves for Binds: its silk (the spool full to start, one strand per
     slash, less the Skill casts), a Bind's cost each, and the Reserve Bind's free one. */
  function binds(r, p) {
    const skill = r.skills.find((x) => x.equipped);
    const silk = r.silk.spool + (p ? p.slashes - p.casts * (skill ? skill.silk : 0) : 0);
    return { silk, paid: Math.floor(silk / r.silk.bind), reserve: r.state.tools.includes('reserve-bind') ? 1 : 0 };
  }

  /* How many hits of per masks Hornet takes before dying, with the Binds b pays for (binds()):
     she binds as soon as one heals in full, or when the next hit would kill her. Druid's Eye adds
     a strand every two hits taken (its upgrade, two), which may pay for another. Silk Hearts'
     regeneration and the spool's cap on what comes in are left out. → { hits, binds } */
  function endure(r, per, b) {
    const max = r.health.masks, heals = r.health.bind.heals, cost = r.silk.bind;
    const has = (id) => r.state.tools.includes(id);
    const eye = has('druids-eyes') ? 1 : has('druids-eye') ? 0.5 : 0;
    let h = max, silk = b ? b.silk : 0, free = b ? b.reserve : 0, hits = 0, used = 0;
    if (!(per > 0)) return null;
    for (;;) {
      h -= per;
      hits++;
      if (h <= 0) return { hits, binds: used };
      silk += eye;
      while (h < max && (h <= per || max - h >= heals)) {
        if (silk >= cost) silk -= cost;
        else if (free) free--;
        else break;
        h = Math.min(max, h + heals);
        used++;
      }
    }
  }

  SS.engine = { roundHalfEven, normalize, modsFor, hitsOf, usesToKill, interval, compute, plan, binds, endure };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.engine;
})();
