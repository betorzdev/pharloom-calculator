/* js/fight.js — Combat's fight played out, the sibling's arena rules (hollownest-calculator's
   js/fight.js) made Silksong's. apply(f, kit, action, ctx) → events. Pure: no DOM, no language,
   no storage. It mutates the state it's given and returns a list of events with numbers, which
   js/app-fight.js turns into log lines with t(). The phases, the bars and who you're hitting stay
   in js/app-fight.js: here health is only taken from ctx.target, and the screen settles the deaths.

   The kit is what js/app-fight.js builds from js/engine.js for one build and one enemy, so every
   number comes from the engine: a move's damage (for the Needle's, one per combination of the
   modifiers that come and go in a fight: the Hunter's focus, the Beast's fury, Flintslate's fire,
   the Challenge; key()), its silk, its uses, the stagger it adds, the seconds it takes.

   The rules, each from where it was read (September 2026):
     · The clock only counts what your actions take: a slash is the Crest's pace (js/hero.js; Flea
       Brew's quick one while it lasts), a Needle Strike its charge, a Bind its time (js/engine.js).
       A Skill, a Tool throw and the Challenge take 0 s: neither the game's files read here nor the
       wiki give their time. Enemy attacks take none.
     · Silk (wiki, "Silk"; PlayerData.AddSilk): a Needle hit that lands gives one strand, up to
       the spool, and a strand past it is lost. Silk Hearts regenerate below their cap while the
       silk doesn't change (js/hero.js REGEN, as js/engine.js's regen()).
     · The Bind (wiki, "Bind"): it spends its silk and heals when it ends; a hit before it ends
       loses the heal and every strand on the spool; with the Warding Bell the hit does no damage and
       the bell strikes, but the Bind is still lost (its silk wasn't, past the cost). The window
       closes with your next action, or "Done". The Reserve Bind pays one when the silk doesn't.
       The Claw Mirror strikes when a Bind ends. The Beast's Bind is fury instead (Gameplay:
       warriorRageDuration 5 s, ×1.25 needle, a mask back per needle hit up to the Bind's heal; a
       hit takes it down to 2.5 s, warriorRageDamagedRemoveTime); the Reaper's opens its mode
       (reaperModeDuration 10 s) in which needle hits release silk, a third of a strand each.
     · The Hunter's focus (Gameplay: hunterComboHits 6, ×1.3; evolved, 6 more, ×1.5): it builds
       with needle hits that land and is lost when you're hit.
     · Stagger (each boss's Stun Control FSM, js/stagger.js): every hit adds its stun (a needle
       slash 1, the Wanderer's 0.8, a drill a third…); the boss staggers at the hit after the total
       reaches its maximum, or when a combo reaches its count, a combo being hits each within its
       window of the last. Staggered, it's down for its seconds, and every hit it takes shortens
       that (the boss's Stun Damage state); what it takes meanwhile counts towards the next.
       The wiki's "no combos, 75 damage" isn't what the files do.
     · A hit taken: Plasmium masks go first (wiki, "Plasmium Phial"), then the masks; the
       Fractured Mask leaves one mask instead of the last, once; Druid's Eye(s) add silk every
       second hit taken below a full spool (HeroController.DoMossToolHit, as js/engine.js);
       the Memory Crystal strikes (it's taken to land). The Barbed Bracelet and black thread are
       in the hit's masks already (the kit's).
   Loadable from the browser (global SS) and from Node (tests). */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const EPS = 1e-9;

  /* ── Hornet's side ────────────────────────────────────────────────────
       masks, plasm      her masks and the Plasmium ones on top
       fractured         the Fractured Mask still whole
       silk, thirds      strands, and the Reaper's fragments (thirds of one)
       still             seconds the silk hasn't changed, for Silk Hearts
       ammo              uses left of each Tool
       reserve           the Reserve Bind's free Bind left
       binding           the Bind's window: { heals, free } until your next action
       focus             needle hits landed since the last one taken (the Hunter's)
       furyUntil, furyHeals, reaperUntil, brewUntil, flintUntil   the timed states
       challenge         the next needle hit carries the Challenge
       eye               hits counted for Druid's Eye
       wispAt            seconds on the clock of the next wisp
       clock             seconds your actions have taken
       dealt, hits, taken, silkSpent, binds   for the summary */
  function reset(kit) {
    const ammo = {};
    for (const [id, m] of Object.entries(kit.moves)) if (m.ammo != null) ammo[id] = m.ammo;
    return {
      masks: kit.masks, plasm: 0, fractured: !!kit.fractured, silk: kit.spool, thirds: 0, still: 0, ammo,
      reserve: kit.bind.reserve || 0, binding: null, focus: 0, furyUntil: 0, furyHeals: 0, reaperUntil: 0,
      brewUntil: 0, flintUntil: 0, challenge: false, eye: 0, wispAt: kit.wisp ? kit.wisp.every : 0, clock: 0,
      dealt: 0, hits: 0, taken: 0, silkSpent: 0, binds: 0,
    };
  }

  const total = (f) => f.masks + f.plasm;
  const alive = (f) => total(f) > 0;
  const on = (until, f) => until > f.clock + EPS;
  // The Hunter's focus level: 0, 1 (×1.3) or 2 (×1.5, evolved).
  const focusLevel = (f, kit) => (kit.hunter || []).filter((n) => f.focus >= n).length;
  /* Which of the move's damages applies now: the Hunter's focus, the Beast's fury, Flintslate and the
     Challenge (only on a needle hit), as the key of kit.moves[id].dmg. */
  const key = (f, kit, needle) => [focusLevel(f, kit), on(f.furyUntil, f) ? 1 : 0, on(f.flintUntil, f) ? 1 : 0, needle && f.challenge ? 1 : 0].join('');
  function damage(f, kit, id, crit) {
    const m = kit.moves[id];
    const table = crit ? m.crit : m.dmg;
    if (typeof table === 'number') return table;
    return table[key(f, kit, m.kind === 'needle' || m.kind === 'strike')] ?? table['0000'] ?? 0;
  }

  /* Silk in or out: capped at the spool, and any change starts Silk Hearts' wait again. */
  function setSilk(f, kit, n) {
    const v = Math.max(0, Math.min(kit.spool, n));
    if (v !== f.silk) { f.silk = v; f.still = 0; }
    if (f.silk >= kit.spool) f.eye = 0;
  }

  /* What an action takes on the clock. */
  function duration(f, kit, id) {
    if (id === 'bind') return kit.bind.seconds;
    const m = kit.moves[id];
    if (!m) return 0;
    if (m.kind === 'needle') return on(f.brewUntil, f) && m.quick ? m.quick : (on(f.furyUntil, f) && m.rage) || m.dur || 0;
    return m.dur || 0;
  }

  /* ── Stagger (js/stagger.js through the screen: ctx.stun = { max, combo, window, secs, shave }) ──
     The state lives on the bar (tg.stag), so a new phase starts from zero. */
  const stagOf = (tg) => tg.stag || (tg.stag = { total: 0, combo: 0, lastAt: null, down: false, until: 0 });
  function lift(st, events, why) {
    st.down = false; st.until = 0; st.combo = 0; st.lastAt = null;
    events.push({ kind: 'staggerEnd', why });
  }
  // A hit's stun, one hit at a time, as the Stun Control FSM runs it (its header, above).
  function stun(f, ctx, s, events, name) {
    const cfg = ctx.stun, tg = ctx.target;
    if (!cfg || !tg || ctx.targetIsMinion || !(s > 0)) return;
    const st = stagOf(tg);
    if (st.down) {
      st.total += s;
      st.until = Math.max(f.clock, st.until - cfg.shave);
      return;
    }
    if (st.total >= cfg.max - 0.01) return down(f, cfg, st, events, name, false);
    const inCombo = st.lastAt !== null && f.clock - st.lastAt <= cfg.window + EPS;
    st.combo = (inCombo ? st.combo : 0) + s;
    st.total += s;
    st.lastAt = f.clock;
    if (cfg.combo && st.combo >= cfg.combo - 0.01) down(f, cfg, st, events, name, true);
  }
  function down(f, cfg, st, events, name, combo) {
    st.total = 0; st.combo = 0; st.lastAt = null;
    st.down = true;
    st.until = f.clock + (cfg.secs || 0);
    events.push({ kind: 'stagger', name, combo, s: cfg.secs || 0 });
  }

  /* Take health from the target, and add its stun. hits: how many hits the move is, each adding
     its share of the stun (a multi-hit Tool is several). */
  function hurt(f, ctx, n, ev, events, s = 0, hits = 1) {
    const tg = ctx.target;
    if (!tg || tg.hp <= 0 || !(n > 0)) return 0;
    const taken = Math.min(n, tg.hp);
    tg.hp -= taken;
    if (!ctx.targetIsMinion) f.dealt += taken;
    events.push({ ...ev, n: taken, left: Math.max(0, tg.hp) });
    if (tg.hp > 0) for (let i = 0; i < hits; i++) stun(f, ctx, s / hits, events, tg.name);
    return taken;
  }

  /* The first thing that will happen if the clock runs: { s, what }. "Wait" waits for it. null if nothing. */
  function nextTick(f, kit, ctx) {
    const opts = [];
    const add = (until, what) => { if (until > f.clock + EPS) opts.push({ s: until - f.clock, what }); };
    const r = kit.regen;
    if (r && r.cap && f.silk < Math.min(r.cap, kit.spool)) opts.push({ s: Math.max(EPS, (f.silk === 0 ? r.first : r.next) - f.still), what: 'hearts' });
    for (const p of (ctx && ctx.parts) || []) if (p.hp > 0 && p.stag && p.stag.down) add(p.stag.until, 'stagger');
    add(f.furyUntil, 'fury'); add(f.reaperUntil, 'reaper'); add(f.brewUntil, 'brew'); add(f.flintUntil, 'flint');
    if (kit.wisp && f.silk >= 1 && ctx && ctx.target && ctx.target.hp > 0) add(f.wispAt, 'wisp');
    if (!opts.length) return null;
    return opts.reduce((a, b) => (b.s < a.s - EPS ? b : a));
  }

  /* ── The clock runs: what comes with it ─────────────────────────────── */
  function advance(f, kit, dt, ctx, events) {
    const end = f.clock + dt;
    // Silk Hearts, strand by strand, while the silk stays below their cap.
    const r = kit.regen;
    let t = f.clock;
    if (r && r.cap) {
      for (;;) {
        if (f.silk >= Math.min(r.cap, kit.spool)) break;
        const need = (f.silk === 0 ? r.first : r.next) - f.still;
        if (t + need > end + EPS) { f.still += end - t; t = end; break; }
        t += need;
        f.silk += 1; f.still = 0;
        events.push({ kind: 'hearts', left: f.silk });
      }
    }
    if (t < end) f.still += end - t;
    // The Wispfire Lantern: a wisp every few seconds, for a strand, while there's something to burn.
    if (kit.wisp) {
      while (f.wispAt <= end + EPS) {
        if (f.silk >= 1 && ctx.target && ctx.target.hp > 0) {
          f.silk -= 1; f.still = 0; f.silkSpent += 1;
          const was = f.clock; f.clock = f.wispAt;
          hurt(f, ctx, kit.wisp.dmg, { kind: 'wisp' }, events, kit.wisp.stun || 0);
          f.clock = was;
        }
        f.wispAt += kit.wisp.every;
      }
    }
    f.clock = end;
    // What wears off.
    for (const p of ctx.parts || []) if (p.hp > 0 && p.stag && p.stag.down && p.stag.until <= f.clock + EPS) lift(p.stag, events, 'time');
    for (const [k, what] of [['furyUntil', 'fury'], ['reaperUntil', 'reaper'], ['brewUntil', 'brew'], ['flintUntil', 'flint']]) {
      if (f[k] && f[k] <= f.clock + EPS) { f[k] = 0; if (what === 'fury') f.furyHeals = 0; events.push({ kind: 'over', what }); }
    }
  }

  /* The Bind's window closes: it healed (already counted), and now what comes after it strikes. */
  function closeBind(f, kit, ctx, events) {
    const b = f.binding;
    if (!b) return;
    f.binding = null;
    if (kit.bind.mirror) hurt(f, ctx, kit.bind.mirror, { kind: 'mirror' }, events, kit.bind.mirrorStun || 0);
  }

  /* ── A hit taken ─────────────────────────────────────────────────────── */
  function foeHit(f, kit, a, ctx, events) {
    if (f.binding) {
      // The Bind's heal is lost, and without the Warding Bell every strand on the spool.
      const b = f.binding;
      f.binding = null;
      if (b.healed) { f.masks = Math.max(0, f.masks - b.healed); }
      if (b.fury) { f.furyUntil = 0; f.furyHeals = 0; }
      if (b.reaper) f.reaperUntil = 0;
      if (kit.bind.warding) {
        events.push({ kind: 'bindLost', n: b.healed, silk: 0 });
        events.push({ kind: 'warded', label: a.label, n: a.masks });
        hurt(f, ctx, kit.bind.warding, { kind: 'bell' }, events, kit.bind.wardingStun || 0);
        return;
      }
      const lost = f.silk;
      setSilk(f, kit, 0);
      events.push({ kind: 'bindLost', n: b.healed, silk: lost });
    }
    let d = a.masks;
    const before = total(f);
    const p = Math.min(f.plasm, d); f.plasm -= p; d -= p;
    f.masks = Math.max(0, f.masks - d);
    let saved = false;
    if (!alive(f) && f.fractured) { f.fractured = false; f.masks = 1; saved = true; }
    f.taken += before - total(f);
    if (focusLevel(f, kit) || f.focus) { if (focusLevel(f, kit)) events.push({ kind: 'focusLost' }); f.focus = 0; }
    if (on(f.furyUntil, f) && kit.fury) f.furyUntil = Math.min(f.furyUntil, f.clock + kit.fury.hurt);
    events.push(alive(f) ? { kind: 'take', label: a.label, n: a.masks, left: total(f) } : { kind: 'down' });
    if (saved) events.push({ kind: 'fractured' });
    if (!alive(f)) return;
    if (kit.eye && f.silk < kit.spool && ++f.eye >= 2) {
      f.eye = 0;
      const was = f.silk;
      setSilk(f, kit, f.silk + kit.eye);
      events.push({ kind: 'eye', silk: f.silk - was });
    }
    if (kit.memory) hurt(f, ctx, kit.memory, { kind: 'memory' }, events, kit.memoryStun || 0);
  }

  /* Whether a move can be done now; the reason when it can't ('silk', 'ammo', 'full', 'target'). */
  function why(f, kit, id, ctx) {
    if (!alive(f)) return 'over';
    if (id === 'bind') {
      if (!kit.bind.crest && f.masks >= kit.masks) return 'full';
      return f.silk >= kit.bind.cost || f.reserve > 0 ? '' : 'silk';
    }
    if (id === 'wait') return nextTick(f, kit, ctx) ? '' : 'nothing';
    if (id === 'done') return f.binding ? '' : 'nothing';
    const m = kit.moves[id];
    if (!m) return 'nothing';
    if (m.cost && f.silk < m.cost) return 'silk';
    if (m.ammo != null && !f.ammo[id]) return 'ammo';
    if (m.effect === 'plasm') return '';
    if (m.effect) return '';
    if (!ctx || !ctx.target || ctx.target.hp <= 0) return 'target';
    return '';
  }

  /* ── apply ───────────────────────────────────────────────────────────────
     action: { type: 'move', id, crit } · { type: 'bind' } · { type: 'done' } · { type: 'wait' }
             · { type: 'foeHit', masks, label }
     ctx: { target, targetIsMinion, stun, parts } */
  function apply(f, kit, action, ctx) {
    const events = [];
    const own = () => closeBind(f, kit, ctx, events);   // your next action closes the Bind's window
    let dt = 0;
    switch (action.type) {
      case 'move': {
        const id = action.id, m = kit.moves[id];
        own();
        if (m.cost) { setSilk(f, kit, f.silk - m.cost); f.silkSpent += m.cost; }
        // The Challenge swirls a strand when there's one (wiki, "Combat (Silksong)"): only then
        // does the next needle hit carry its +50%.
        let armed = false;
        if (m.kind === 'challenge' && f.silk >= 1) { setSilk(f, kit, f.silk - 1); f.silkSpent += 1; armed = true; }
        if (m.ammo != null) f.ammo[id] -= 1;
        dt = duration(f, kit, id);
        if (m.effect === 'brew') { f.brewUntil = f.clock + dt + kit.brew; events.push({ kind: 'brew', s: kit.brew }); break; }
        if (m.effect === 'flint') { f.flintUntil = f.clock + dt + kit.flint; events.push({ kind: 'flint', s: kit.flint }); break; }
        if (m.effect === 'plasm') { f.plasm += 1; events.push({ kind: 'plasm', left: total(f) }); break; }
        f.hits += 1;
        const needle = m.kind === 'needle' || m.kind === 'strike';
        const n = damage(f, kit, id, action.crit);
        const at = f.clock;
        if (m.kind === 'strike') f.clock += dt;   // a Needle Strike lands on release, after its charge
        const done = hurt(f, ctx, n, { kind: 'hit', id, crit: !!action.crit }, events, m.stun || 0, m.hits || 1);
        f.clock = at;
        if (m.kind === 'challenge') { f.challenge = armed; if (armed) events.push({ kind: 'challenge' }); }
        else if (needle) f.challenge = false;
        if (done) {
          if (m.silk) setSilk(f, kit, f.silk + m.silk);
          if (needle) {
            if (kit.hunter && kit.hunter.length) {
              const was = focusLevel(f, kit);
              f.focus += 1;
              if (focusLevel(f, kit) > was) events.push({ kind: 'focus', level: focusLevel(f, kit) });
            }
            if (on(f.furyUntil, f) && f.furyHeals > 0 && f.masks < kit.masks) { f.masks += 1; f.furyHeals -= 1; events.push({ kind: 'lifesteal', left: total(f) }); }
            if (on(f.reaperUntil, f)) {
              f.thirds += 1;
              if (f.thirds >= 3) { f.thirds -= 3; setSilk(f, kit, f.silk + 1); events.push({ kind: 'reaperSilk' }); }
            }
          }
        }
        break;
      }
      case 'bind': {
        own();
        const free = f.silk < kit.bind.cost;
        if (free) f.reserve -= 1;
        else { setSilk(f, kit, f.silk - kit.bind.cost); f.silkSpent += kit.bind.cost; }
        f.binds += 1;
        dt = duration(f, kit, 'bind');
        const b = { healed: 0, free };
        if (kit.bind.crest === 'beast') {
          f.furyUntil = f.clock + dt + kit.fury.secs; f.furyHeals = kit.bind.heals; b.fury = true;
          events.push({ kind: 'fury', s: kit.fury.secs, n: kit.bind.heals });
        } else {
          b.healed = Math.max(0, Math.min(kit.bind.heals, kit.masks - f.masks));
          f.masks += b.healed;
          events.push({ kind: 'bind', n: b.healed, left: total(f), free });
          if (kit.bind.crest === 'reaper') { f.reaperUntil = f.clock + dt + kit.reaper.secs; b.reaper = true; events.push({ kind: 'reaper', s: kit.reaper.secs }); }
        }
        f.binding = b;
        break;
      }
      case 'done': own(); break;
      case 'wait': {
        own();
        const tk = nextTick(f, kit, ctx);
        dt = tk ? tk.s : 0;
        events.push({ kind: 'wait', s: dt, what: tk && tk.what });
        break;
      }
      case 'foeHit': foeHit(f, kit, action, ctx, events); break;
      default: throw new Error('Unknown action: ' + action.type);
    }
    if (dt > 0) advance(f, kit, dt, ctx, events);
    return events;
  }

  SS.fight = { reset, apply, why, total, alive, duration, nextTick, focusLevel, key, damage, EPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.fight;
})();
