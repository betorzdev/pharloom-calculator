/* js/app-fight.js — Combat: your build against one enemy, played out as the sibling's arena
   (hollownest-calculator's js/app-arena.js), made Silksong's. Hornet and the enemy's whole Journal
   drawing face to face; between them the slashes that still win and the hits that still take you
   down, the clock, Undo (Ctrl+Z) and Start over; her HUD (masks, the Plasmium ones, the spool, what
   she's under: focus, fury, Flea Brew, Flintslate, a Bind's window) and its bars (a boss of two
   at once, a fight in pieces or in bars one after another), its stagger count and time. Under
   them your moves, grouped, and its attacks, all tappable: js/fight.js plays each and says what
   happened, which the log under them tells in three voices (you, it, the fight); the end is titled, with the
   fight in figures. The rest folds under «How it's worked out».
   Every number comes from the engine (js/engine.js, compute(state, { foe })): each enemy carries
   five damage modifiers, one per level of what hits, so how many hits kill it is a question per
   enemy. The build is the Crest screen's: in a save, what Hornet wears; in Free mode, the one being
   tried. Its attacks: a boss's are the wiki's (their names too: the game doesn't name them), any
   other enemy's from the game's own files (js/enemy-damage.js). The stagger, from the game's own
   files (js/stagger.js). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, EN = SS.enemies, E = SS.engine, J = SS.journal, FT = SS.fight, ST = SS.stagger, HERO = SS.hero;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n, d = 0) => App.NF[d].format(n);
  const FOE = new Map(EN.FOES.map((f) => [f.id, f]));
  const TOOL = new Map(D.TOOLS.map((x) => [x.id, x]));
  const toolName = (id) => pick(TOOL.get(id).name);
  const BOOK_BY_N = new Map(J.BOOK.map((e) => [e.n, e]));
  const portrait = (f) => { const e = BOOK_BY_N.get(f.hj); return e ? `assets/icons/journal/${e.id}.webp` : ''; };
  const foeName = (f) => pick(f.name) + (f.variant ? ' · ' + pick(f.variant) : '');
  // Bosses first, then the rest, each in the Journal's order.
  const ORDER = EN.FOES.slice().sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || a.hj - b.hj || foeName(a).localeCompare(foeName(b)));
  let query = '';
  const fold = (x) => String(x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const HAY = new Map(EN.FOES.map((f) => [f.id, fold([f.name.es, f.name.en, f.variant ? f.variant.es + ' ' + f.variant.en : ''].join(' '))]));

  function picker(cur) {
    // In both languages and without accents: "moor" finds Moorwing in Spanish too, «paramo» «Páramo».
    const q = fold(query.trim());
    const list = ORDER.filter((f) => !q || HAY.get(f.id).includes(q)).slice(0, 80);
    return `<div class="ft-pick">
        <label class="search"><span class="sr-only">${esc(t('ftSearch'))}</span>${App.lens}
          <input type="search" data-act="ftQuery" value="${esc(query)}" placeholder="${esc(t('ftSearch'))}" autocomplete="off"></label>
        <ul class="ft-foes">${list.map((f) => `<li><button type="button" class="ft-foe${cur && f.id === cur.id ? ' is-on' : ''}" data-act="ftFoe" data-value="${f.id}"
          aria-pressed="${!!cur && f.id === cur.id}"${NT}><img src="${portrait(f)}" alt="" loading="lazy"><span>${esc(foeName(f))}</span>${f.boss ? `<i class="ft-boss">${esc(t('ftBoss'))}</i>` : ''}</button></li>`).join('')}
          ${list.length ? '' : `<li class="pg-note">${esc(t('ftNone'))}</li>`}</ul>
      </div>`;
  }

  // What the duel leaves out, folded under «Cómo se calcula»: the damage it takes by level, the stagger, its phases.
  function about(f, r, hp) {
    const lv = r.state.needle, kit = r.state.kit;
    // An entry from the game's files (js/enemies.js src) has no modifiers: its first hit kills it.
    const mods = (f.mods || []).map((m, i) => `<li class="${i === lv ? 'is-needle' : ''}${i === kit ? ' is-kit' : ''}"><span>${num(i)}</span><b>×${num(m, 2)}</b></li>`).join('');
    const cfgs = stunCfgs(f);
    const stag = cfgs.map((c) => t(c.secs == null ? 'ftStaggerGameNoTime' : 'ftStaggerGame', { n: num(c.max + 1), c: num(c.combo), w: num(c.window, 1), s: num(c.secs || 0, 1), x: num(c.shave || 0, 2) }));
    return `${f.bars ? `<p class="ft-stagger"><span class="save-k">${esc(t('ftHp'))}</span> ${esc(f.bars.map((b) => num(b)).join(' + '))}</p>` : ''}
        ${f.mods ? `<div class="ft-mods"><span class="save-k">${esc(t('ftMods'))}</span><ol>${mods}</ol>
          <p class="pg-note">${esc(t('ftModsNote', { n: num(lv), k: num(kit) }))}</p></div>` : f.oneHit ? `<p class="pg-note">${esc(t('ftOneHit'))}</p>` : ''}
        ${stag.length ? `<p class="ft-stagger"><span class="save-k">${esc(t('ftStagger'))}</span> ${esc(stag.join(' · '))}</p>` : ''}
        ${phasesHtml(f, r, hp)}`;
  }

  /* Its phases (js/phases.js, the game's own FSMs): where each one starts, and how many slashes
     of yours get there from full health (js/engine.js, phases); then what the file says past the
     thresholds: a bar made of pieces (Father of the Flame: each piece's health and counted hits,
     with the cooldown between two that count, and at your slash's pace which way breaks it
     first), a heal (the Forebrothers), a reset (Phantom). */
  function phasesHtml(f, r, hp) {
    const P = SS.phases[f.id] || {};
    const h = r.needle.attacks[0], every = r.needle.speed && r.needle.speed.interval;
    const list = E.phases(P, hp, h, every);
    if (!list.length) return '';
    const slashes = (n) => t(n === 1 ? 'ftPlanSlash' : 'ftPlanSlashes', { n: num(n) });
    const items = list.map((x) => {
      const where = P.bars ? t('ftPhaseAfter', { n: num(x.n), x: num(x.dealt) })
        : t(x.of ? 'ftPhaseAtOf' : x.share ? 'ftPhaseAt' : 'ftPhaseAtHp', { n: num(x.n), x: num(x.left), o: num(x.of || 0), p: num(Math.round(x.share * 100)) });
      const u = x.uses == null ? '' : ' · ' + slashes(x.uses);
      return `<li>${esc(where + u)}</li>`;
    });
    for (const p of E.pieces(P, h, every)) {
      const what = [t(p.k > 1 ? 'ftPhasePieces' : 'ftPhasePiece', { n: num(p.n), k: num(p.k), x: num(p.hp), h: num(p.hits) })];
      if (p.gap != null) what.push(t('ftPieceCount', { c: num(p.cooldown, 2), r: num(p.recover, 2), g: num(p.gap, 2) }));
      items.push(`<li>${esc(what.join(' · '))}</li>`);
      if (p.uses == null || !every || p.gap == null) continue;
      const pace = [t(p.each == null ? 'ftPiecePaceFirst' : p.each === 1 ? 'ftPiecePaceAll' : 'ftPiecePace', { t: num(every, 2), e: num(p.each || 0) }),
        t(p.by === 'hits' ? 'ftPieceHits' : 'ftPieceDamage', { u: slashes(p.uses) })];
      if (p.by === 'damage' && p.spaced != null) pace.push(t('ftPieceSpaced', { g: num(p.gap, 2), h: num(p.spaced) }));
      items.push(`<li>${esc(pace.join(' · '))}</li>`);
    }
    if (P.heal) items.push(`<li>${esc(t('ftPhaseHeal', { x: num(P.heal[0]), a: num(P.heal[1]), m: num(P.heal[2]) }))}</li>`);
    if (P.reset) items.push(`<li>${esc(t('ftPhaseReset', { x: num(P.reset) }))}</li>`);
    const note = t(P.bars ? 'ftPhasesBarsNote' : 'ftPhasesNote') + (list.some((x) => x.below) ? ' ' + t('ftPhasesBelowNote') : '');
    return `<div class="ft-phases"><span class="save-k">${esc(t('ftPhases'))}</span><ul>${items.join('')}</ul>
      <p class="pg-note">${esc(note)}</p></div>`;
  }

  const icon = (list, id) => `assets/icons/${list}/${id}.webp`;
  const hitsText = (each) => (each.length > 1 ? each.map((x) => num(x)).join(' + ') : '');

  /* The fight as a whole (js/engine.js, plan): the red Tools' loads first, then the fewest slashes
     with the Skill casts their silk pays for, the spool full to start and no Bind. */
  function planHtml(r) {
    const p = E.plan(r, r.foe && r.foe.hp);
    if (!p) return '';
    const parts = p.throws.map((x) => t('ftPlanThrows', { n: num(x.n), name: toolName(x.id) }));
    if (p.slashes) parts.push(t(p.slashes === 1 ? 'ftPlanSlash' : 'ftPlanSlashes', { n: num(p.slashes) }));
    const sk = r.skills.find((x) => x.equipped);
    if (p.casts) parts.push(t('ftPlanCasts', { n: num(p.casts), name: pick(D.SKILLS.find((y) => y.id === sk.id).name) }));
    const list = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' ' + t('ftAnd') + ' ' + parts.at(-1) : parts[0];
    return `<p class="ft-plan"><span class="save-k">${esc(t('ftPlan'))}</span> <b${NT}>${esc(list)}</b></p>`;
  }

  /* What it does to you: how many hits of each take your masks, and how many if you Bind in the
     quickest fight, the hits spread over it and its silk in order, up to the spool (js/engine.js,
     binds and endure).
     A boss's attacks are the wiki's (js/enemies.js ATTACKS); any other enemy's come from the game's
     own files (js/enemy-damage.js): its body on contact and the strongest hitbox it carries or
     spawns, and black-threaded every hit is 2 masks (the game sets the Void flag on all of them).
     The Barbed Bracelet multiplies each hit, floored, by the game's own figure (BARBED). */
  const DMG = SS.enemyDamage;
  function gameAttacks(f, black) {
    const d = DMG.BY_KEY[f.key];
    if (!d) return [];
    const max = (l) => Math.max(...l);
    const rows = [];
    if (d.body) rows.push({ name: t('ftContact'), masks: [black ? 2 : max(d.body)], sub: d.body.length > 1 && !black ? t('ftMixed', { a: num(d.body[0]), b: num(max(d.body)) }) : '' });
    // Its hitboxes and what it spawns (spit, bombs, a corpse's burst), less what only a
    // black-threaded one does (threaded: its void spit or shot).
    const att = Object.entries(d.attacks || {}).filter(([g]) => !(d.threaded || []).includes(g));
    if (att.length && !black) {
      const top = max(att.map(([, v]) => max(v)));
      const type = att.filter(([, v]) => max(v) === top).map(([g]) => (d.types || {})[g]).find(Boolean);
      if (!d.body || top > max(d.body)) rows.push({ name: t('ftStrongest'), masks: [top], sub: type ? t('ftType_' + type) : '' });
    }
    return rows;
  }

  function theirs(f, r) {
    const a = EN.ATTACKS[f.page];
    const black = !!prefs.ftBlack && !!f.bt;
    const fromGame = !a || !a.attacks.length;
    const hits = fromGame ? gameAttacks(f, black)
      // Black-threaded, every hit is void and takes 2 masks (the game sets them, js/enemy-damage.js).
      : a.attacks.map((x) => ({ name: pick(x.name), masks: (x.masks || [1]).map((m) => (black ? 2 : m)),
        sub: [x.where ? pick(x.where) : '', black ? t('ftType_void') : x.type ? t('ftType_' + x.type) : ''].filter(Boolean).join(' · ') }));
    const masks = r.health.masks, barbed = r.state.tools.includes('barbed-bracelet');
    const b = E.binds(r, E.plan(r, r.foe && r.foe.hp));
    const list = hits.map((x) => {
      const per = x.masks.reduce((s, m) => s + (barbed ? Math.floor(m * DMG.BARBED) : m), 0);
      const bare = Math.ceil(masks / per), end = E.endure(r, per, b);
      return { ...x, per, bare, bind: end && end.hits > bare ? end.hits : null };
    });
    /* Silk Hearts (js/engine.js, regen): up to their cap, and only while the silk doesn't change,
       over the seconds the slash takes to kill (the figure on the slash's row). */
    const H = b.hearts, ring = r.state.tools.includes('weavelight');
    const hearts = !H.cap ? t('ftBindNoHearts') : H.seconds == null ? ''
      : t('ftBindHearts', { n: num(H.cap), b: num(H.next, 2), a: num(H.first, 2), t: num(H.seconds, 1), i: num(r.needle.speed.interval, 2), x: num(H.strands) });
    const extra = [b.reserve ? t('ftBindReserve', { name: toolName('reserve-bind') }) : '',
      ['druids-eyes', 'druids-eye'].filter((id) => r.state.tools.includes(id)).map((id) => t('ftBindEye', { name: toolName(id) }))[0] || '',
      hearts, ring && H.cap ? t('ftBindRing', { name: toolName('weavelight'), k: num(HERO.REGEN.weavelight.time, 2) }) : ''];
    const notes = [black ? t('ftTheirsBlackNote') : fromGame ? t('ftTheirsGameNote') : t('ftTheirsNote'),
      [t('ftBindNote', { s: num(b.spool), c: num(r.silk.bind), h: num(r.health.bind.heals) }), ...extra].filter(Boolean).join(' ')];
    return { list, fromGame, notes };
  }

  /* ── The enemy gauntlets (js/gauntlets.js): an arena's waves, one after another ──
     Named by the place the wiki files it under, or its area (with a number when an area has
     several); its reward, the game's name for it, when it gives something the game names. */
  const G = SS.gauntlets.GAUNTLETS;
  const CO = SS.collectibles;
  // Its place's name, or its area's; numbered when several share it (Craw Lake has two).
  const baseName = (g) => (g.place ? pick(g.place) : g.area && CO.AREAS[g.area] ? pick(CO.AREAS[g.area]) : g.id);
  const gauntletName = (g) => {
    const same = G.filter((x) => baseName(x) === baseName(g));
    return same.length > 1 ? `${baseName(g)} ${num(same.indexOf(g) + 1)}` : baseName(g);
  };
  // By id, for the screens before this one ("since the previous save" on Your game).
  App.gauntletName = (id) => { const g = G.find((x) => x.id === id); return g ? gauntletName(g) : id; };
  const gHp = (g) => g.waves.reduce((a, w) => a + w.reduce((b, [id, n]) => b + ((FOE.get(id) || {}).hp || 0) * n, 0), 0);

  // In a save, the ones it has cleared (js/savefile.js reads each one's condition), ticked.
  function gauntletPicker(cur, done) {
    return `<div class="ft-pick"><ul class="ft-foes is-gauntlets">${G.map((g) => `<li><button type="button" class="ft-foe${g === cur ? ' is-on' : ''}"
        data-act="ftGauntlet" data-value="${g.id}" aria-pressed="${g === cur}"${NT}><img src="${portrait(FOE.get(g.waves[g.waves.length - 1][0][0]))}" alt="" loading="lazy">
        <span>${esc(gauntletName(g))}</span><i class="ft-boss">${done.has(g.id) ? `${App.tick}<span class="sr-only">${esc(t('ftCleared'))}</span> ` : ''}${esc(t('ftWaves', { n: num(g.waves.length) }))}</i></button></li>`).join('')}</ul></div>`;
  }
  function gauntletCard(g, game) {
    const area = g.area && CO.AREAS[g.area] ? pick(CO.AREAS[g.area]) : '';
    return `<div class="ft-summary">
        <h3 class="inv-name"${NT}>${esc(gauntletName(g))}</h3>
        ${g.place && area ? `<p class="ft-hp"${NT}>${esc(area)}</p>` : ''}
        <p class="ft-hp"><span class="save-k">${esc(t('ftHp'))}</span> <b>${num(gHp(g))}</b></p>
        ${g.reward ? `<p class="ft-stagger"><span class="save-k">${esc(t('ftReward'))}</span> <span${NT}>${esc(pick(g.reward))}</span></p>` : ''}
        ${game ? `<p class="ft-stagger">${game.gauntlets.includes(g.id) ? `${App.tick} ${esc(t('ftCleared'))}` : esc(t('ftNotCleared'))}</p>` : ''}
      </div>`;
  }
  function gauntletWaves(g, st) {
    return g.waves.map((w, i) => {
      const rows = w.map(([id, n]) => {
        const f = FOE.get(id), r = E.compute(st, { foe: f });
        const a = r.needle.attacks[0];
        return `<li><img src="${portrait(f)}" alt=""><span class="ct-list-name"${NT}>${esc(pick(f.name))}${n > 1 ? ` ×${num(n)}` : ''}</span>
          <span class="ct-list-sub">${esc(t('ftHp') + ' ' + (f.hp == null ? '?' : num(f.hp)))}</span><b>${num(a.total)}</b>
          <span class="ft-uses">${a.uses == null ? '' : esc(t('ftUses', { n: num(a.uses) }))}</span></li>`;
      }).join('');
      return `<section class="ct-block"><h3 class="ct-h">${esc(t('ftWave', { n: num(i + 1) }))}</h3><ul class="ct-list ft-list">${rows}</ul></section>`;
    }).join('');
  }

  /* The dropdown the enemy (or the arena) is chosen in: closed, the one on screen; open, the
     search and the list. Picking re-renders, which closes it. */
  const choose = (label, face, body) => `<details class="ft-choose"><summary><span class="sr-only">${esc(label)}</span>${face}
      <svg class="ic ft-choose-v" width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1 1.5 L6 6.5 L11 1.5"/></svg></summary>
      <div class="ft-choose-body">${body}</div></details>`;
  const foeFace = (f) => `<img src="${portrait(f)}" alt=""><span class="ft-choose-name"${NT}>${esc(foeName(f))}</span>${f.boss ? `<i class="ft-boss">${esc(t('ftBoss'))}</i>` : ''}`;
  // The enemy's whole drawing (the Journal's, assets/journal/art/), else its portrait.
  const drawing = (f) => { const e = BOOK_BY_N.get(f.hj); return e ? `assets/journal/art/${e.key.toLowerCase()}.webp` : portrait(f); };

  /* ── The fight ─────────────────────────────────────────────────────────
     The kit (js/fight.js's header): what the engine says each move does for this build against
     this enemy. The Needle's damage is computed once per combination of what comes and goes in a
     fight (the Hunter's focus level, the Beast's fury, Flintslate, the Challenge), each a
     compute() with those set; the fight picks the one that holds at each hit. */
  const C = HERO.COMBAT;
  const FLINT_SECS = 8;       // wiki, "Flintslate": 8 seconds (not read from the game's files)
  const WISP_EVERY = 4;       // wiki, "Wispfire Lantern": a wisp for a strand every 4 seconds
  const stunOf = (table, id, per = 1) => (table && table[id] != null ? table[id] : 1) * per;

  function kitOf(f, r, black) {
    const s = r.state, has = (id) => s.tools.includes(id);
    const opt = { foe: f, black };
    const fl = s.crest === 'hunter' ? (s.hunterStage >= 3 ? [0, 1, 2] : s.hunterStage >= 2 ? [0, 1] : [0]) : [0];
    const table = {}, crit = {};
    for (const fo of fl) for (const fu of s.crest === 'beast' ? [0, 1] : [0]) for (const fi of has('flintslate') ? [0, 1] : [0]) for (const ch of [0, 1]) {
      const v = E.compute({ ...s, focus: fo > 0, hunterStage: fo ? fo + 1 : s.hunterStage, fury: !!fu, flint: !!fi, challenge: !!ch }, opt);
      const k = `${fo}${fu}${fi}${ch}`;
      const use = (a) => (ch ? a.total : a.rest ?? a.total);
      for (const a of v.needle.attacks) (table['att:' + a.id] || (table['att:' + a.id] = {}))[k] = use(a);
      if (v.strike) (table.strike || (table.strike = {}))[k] = use(v.strike);
      if (v.needle.crit) (crit['att:slash'] || (crit['att:slash'] = {}))[k] = v.needle.crit.damage;
    }
    const H = ST.HORNET, crest = s.crest;
    const every = E.interval(s), quick = E.interval(s, true), rage = crest === 'beast' ? E.interval({ ...s, fury: true }) : null;
    const moves = {}, list = [];
    const add = (m, kitMove) => { list.push(m); moves[m.id] = kitMove; };
    const crestAtt = D.CRESTS.find((c) => c.id === crest).attacks;
    // The Needle: the slash, and the Crest's own down- and run-slashes.
    for (const a of r.needle.attacks.filter((x) => x.id === 'slash' || crestAtt)) {
      add({ id: 'att:' + a.id, group: 'needle', name: t('ctAtt_' + a.id), img: App.ART.needle(r.needle.level), needle: true, each: a.each, uses: a.uses, total: a.total },
        { kind: 'needle', dmg: table['att:' + a.id], crit: crit['att:' + a.id], stun: stunOf(H.slash, crest, a.each.length), hits: a.each.length, silk: 1, dur: every, quick, rage });
    }
    if (r.strike) {
      add({ id: 'strike', group: 'needle', name: t('ctStrike'), img: icon('arts', 'needle-strike'), each: r.strike.each, uses: r.strike.uses, total: r.strike.total },
        { kind: 'strike', dmg: table.strike, stun: stunOf(H.strike, crest, r.strike.each.length), hits: r.strike.each.length, silk: crest === 'hunter' ? 2 : 1,
          dur: has('pin-badge') ? C.chargeQuick : C.charge });
    }
    // The Challenge (wiki, "Combat (Silksong)"): 2 damage a Needle level, through the bracket and the enemy's modifier.
    const ch = D.MODIFIERS.find((m) => m.id === 'challenge');
    const chDmg = E.roundHalfEven(2 * (r.needle.level + 1) * r.needle.bracket * r.needle.enemy);
    add({ id: 'taunt', group: 'needle', name: pick(ch.name), img: '', total: chDmg, note: t('ftTauntNote') },
      { kind: 'challenge', dmg: chDmg, stun: H.challenge, hits: 1, silk: 1 });
    // Silk: the Skill in the Crest's slot.
    const sk = r.skills.find((x) => x.equipped);
    if (sk) {
      add({ id: 'skill', group: 'silk', name: pick(D.SKILLS.find((x) => x.id === sk.id).name), img: icon('skills', sk.id), each: sk.each, uses: sk.uses, total: sk.total, cost: sk.silk },
        { kind: 'skill', dmg: sk.rest ?? sk.total, stun: stunOf(H.skills, sk.id, sk.each.length), hits: sk.each.length, cost: sk.silk });
    }
    // The Tools you throw, drink or set off; the ones that answer something (a Bind, a hit, the clock) are the kit's own.
    const passive = new Set(['memory-crystal', 'claw-mirror', 'claw-mirrors', 'warding-bell', 'wispfire-lantern', 'pollip-pouch']);
    for (const x of r.tools) {
      const eff = x.id === 'flea-brew' ? 'brew' : x.id === 'flintslate' ? 'flint' : x.id === 'plasmium-phial' ? 'plasm' : null;
      const a = x.attacks.find((y) => !y.bonus);
      if (passive.has(x.id) || (!eff && !a)) continue;
      const base = { id: 'tool:' + x.id, group: 'tools', name: toolName(x.id), img: icon('tools', x.id), ammo: x.ammo };
      if (eff) {
        const s2 = eff === 'brew' ? HERO.QUICKENING : FLINT_SECS;
        add({ ...base, note: t('ftEff_' + eff, { s: num(s2) }) }, { kind: 'tool', effect: eff, ammo: x.ammo });
      } else {
        add({ ...base, each: a.each, uses: a.uses, total: a.total, load: x.loadShare },
          { kind: 'tool', dmg: a.rest ?? a.total, stun: stunOf(H.tools, x.id, a.each.length), hits: a.each.length, ammo: x.ammo });
      }
    }
    const tool = (id) => { const x = r.tools.find((y) => y.id === id); return x && x.attacks[0] ? x.attacks[0].total : 0; };
    const mirror = tool('claw-mirrors') || tool('claw-mirror');
    const rg = E.regen(r, 0, 0);
    const kit = {
      masks: r.health.masks, spool: r.silk.spool, fractured: has('fractured-mask'),
      regen: rg.cap ? { cap: rg.cap, first: rg.first, next: rg.next } : null,
      bind: { cost: r.silk.bind, heals: r.health.bind.heals, seconds: r.health.bind.seconds,
        crest: crest === 'beast' ? 'beast' : crest === 'reaper' ? 'reaper' : null,
        warding: tool('warding-bell'), wardingStun: 1, mirror, mirrorStun: mirror ? 1 : 0, reserve: has('reserve-bind') ? 1 : 0 },
      moves, hunter: crest === 'hunter' ? C.hunter.slice(0, Math.max(0, s.hunterStage - 1)).map((x) => x[0]) : [],
      fury: { secs: C.fury.secs, hurt: C.fury.hurt }, reaper: { secs: C.reaper }, brew: HERO.QUICKENING, flint: FLINT_SECS,
      eye: has('druids-eyes') ? 2 : has('druids-eye') ? 1 : 0, memory: tool('memory-crystal'), memoryStun: 1,
      wisp: has('wispfire-lantern') ? { every: WISP_EVERY, dmg: tool('wispfire-lantern'), stun: 1 } : null,
    };
    return { kit, list };
  }

  /* The bars: what's standing now, and what comes after. A boss of two at once (the Forebrothers,
     each with its own stagger), a fight in pieces (Father of the Flame: four lanterns, then its
     core), in bars one after another (the Dancers, Grand Mother Silk), or one bar with the ticks
     where it changes phase. Black-threaded, its health is another and the bars don't add up to it:
     one bar. */
  // A name in both languages from the dictionary, for a bar's name that outlives a change of language.
  const pair = (key, vars = {}) => Object.fromEntries(['es', 'en'].map((l) => [l, Object.entries(vars).reduce((x, [k, v]) => x.split('{' + k + '}').join(v), SS.i18n.UI[key][l])]));
  const PART_NAMES = {
    signis: { es: 'Signis', en: 'Signis', key: 'DOCK_GUARD_SOLO_MAIN' },
    gron: { es: 'Gron', en: 'Gron', key: 'DOCK_GUARD_THROWER_MAIN' },
  };
  function phasesOf(f, hp, black) {
    const P = SS.phases[f.id] || {};
    const whole = (bars) => !black && bars && bars.reduce((a, b) => a + b, 0) === hp;
    const one = (x, key) => ({ key: key || 'main', foeId: f.id, name: x.name || f.name, hp: x.hp });
    if (f.id === 'forebrothers-signis-and-gron' && whole(f.bars)) {
      return [[one({ name: PART_NAMES.signis, hp: f.bars[0] }, 'signis'), one({ name: PART_NAMES.gron, hp: f.bars[1] }, 'gron')]];
    }
    if (P.pieces && whole(P.bars)) {
      return P.bars.map((b, i) => Array.from({ length: P.pieces[i] }, (_, k) => one({
        name: P.pieces[i] > 1 ? pair('ftPiece', { n: k + 1 }) : pair('ftCore'), hp: b / P.pieces[i] }, 'piece')));
    }
    if (P.bars && whole(P.bars)) return P.bars.map((b) => [one({ hp: b })]);
    return [[one({ hp })]];
  }
  /* A gauntlet's waves (js/gauntlets.js): a phase each, a bar per enemy, each with its own health
     (one, for an entry the game gives none: its first hit kills it). */
  function wavesOf(g) {
    return g.waves.map((w) => w.flatMap(([id, n]) => {
      const f = FOE.get(id);
      return Array.from({ length: n }, () => ({ key: 'main', foeId: id, name: f.name, hp: f.hp || 1 }));
    }));
  }
  // The stagger of each bar (js/stagger.js): a boss of two, each its own; a piece, none.
  function stunCfgs(f) { const b = ST.BOSSES[f.id]; return !b ? [] : b.parts ? Object.values(b.parts) : [b]; }
  function stunFor(f, part) {
    const b = f && ST.BOSSES[f.id];
    if (!b || !part || part.key === 'piece') return null;
    return b.parts ? b.parts[part.key] || null : b;
  }
  // Where each phase starts on a single bar, in health left (js/phases.js through the engine).
  function phaseMarks(f, r, hp, single) {
    const P = SS.phases[f.id] || {};
    if (!hp || !single || P.bars) return [];
    return E.phases(P, hp, r.needle.attacks[0], r.needle.speed && r.needle.speed.interval)
      .map((x) => ({ n: x.n, at: x.left })).filter((x) => x.at > 0 && x.at < hp);
  }

  /* The fight's state lives here while the page is open, for this enemy and this build (a change
     of either starts it over): js/fight.js's (Hornet's side, the clock) and the bars, the phase,
     who you're hitting, the log. Undo keeps whole copies, up to 50. */
  let fight = null, cur = null;
  const undoStack = [];
  const UNDO_MAX = 50;
  function newPart(x) { return { key: x.key, foeId: x.foeId, name: x.name, hp: x.hp, max: x.hp }; }
  /* cur, what the screen computed for this fight: its key, its name (title), health (hp), its phases
     (a boss's bars, or a gauntlet's waves: wave), and a kit per enemy in it (kits: each enemy takes
     its own modifiers; the rest of a kit is the same in all). */
  function startFight(c) {
    undoStack.length = 0;
    const phases = c.phases;
    fight = { key: c.key, s: FT.reset(Object.values(c.kits)[0].kit), phases, phase: 0, parts: phases[0].map(newPart), target: 0, log: [], over: null, started: false };
    logLine(t('ftLogStart', { name: pick(c.title), hp: num(c.hp || 0) }), 'sys');
    hudPrev = null; foePrev = null;
  }
  const snapshot = () => { undoStack.push(structuredClone({ ...fight })); if (undoStack.length > UNDO_MAX) undoStack.shift(); };
  function undo() {
    const snap = undoStack.pop();
    if (!snap) return false;
    fight = snap;
    hudPrev = null; foePrev = null; endFresh = false;
    return true;
  }
  /* The log speaks in three voices (the sibling's): 'you', 'foe' and 'sys' (phases, stagger, what
     wears off), newest first, nine lines. */
  const logLine = (text, side = 'sys') => { fight.log.unshift({ text, side }); if (fight.log.length > 9) fight.log.pop(); };

  const targetOf = () => { const p = fight.parts[fight.target]; return p && p.hp > 0 ? p : null; };
  function retarget() { const i = fight.parts.findIndex((p) => p.hp > 0); fight.target = i < 0 ? 0 : i; }
  const ctxOf = () => { const tg = targetOf(); return { target: tg, stun: stunFor(tg && FOE.get(tg.foeId), tg), parts: fight.parts }; };
  // The kit of whoever you're hitting (or the first standing): its damage against that enemy; sync() makes it cur's.
  const sync = () => { const k = kitNow(); cur.kit = k.kit; cur.list = k.list; cur.r = k.r; };
  const kitNow = () => { const p = targetOf() || fight.parts.find((x) => x.hp > 0) || fight.parts[0]; return cur.kits[p.foeId] || Object.values(cur.kits)[0]; };
  // What's left to take, this phase's standing bars and every phase to come.
  const remaining = () => fight.parts.reduce((a, p) => a + Math.max(0, p.hp), 0)
    + fight.phases.slice(fight.phase + 1).reduce((a, ph) => a + ph.reduce((b, x) => b + x.hp, 0), 0);

  /* The reducer's events (js/fight.js), told: this is where the language comes in. */
  const moveName = (id) => { const m = cur.list.find((x) => x.id === id); return m ? m.name : id; };
  const WHAT = { fury: () => t('ftFury'), reaper: () => pick(D.CRESTS.find((c) => c.id === 'reaper').name), brew: () => toolName('flea-brew'), flint: () => toolName('flintslate') };
  function tell(evs) {
    const n = (x) => num(x);
    for (const e of evs) {
      const you = (text) => logLine(text, 'you'), foe = (text) => logLine(text, 'foe'), sys = (text) => logLine(text, 'sys');
      switch (e.kind) {
        case 'hit': you(t(e.crit ? 'ftLogCrit' : 'ftLogYou', { name: moveName(e.id), n: n(e.n), hp: n(e.left) })); break;
        case 'wisp': you(t('ftLogYou', { name: toolName('wispfire-lantern'), n: n(e.n), hp: n(e.left) })); break;
        case 'mirror': you(t('ftLogYou', { name: toolName(cur.r.state.tools.includes('claw-mirrors') ? 'claw-mirrors' : 'claw-mirror'), n: n(e.n), hp: n(e.left) })); break;
        case 'bell': you(t('ftLogYou', { name: toolName('warding-bell'), n: n(e.n), hp: n(e.left) })); break;
        case 'memory': you(t('ftLogYou', { name: toolName('memory-crystal'), n: n(e.n), hp: n(e.left) })); break;
        case 'stagger': sys(t(e.s ? (e.combo ? 'ftLogStaggerCombo' : 'ftLogStagger') : 'ftLogStaggerNoTime', { name: pick(e.name), s: num(e.s, 1) })); break;
        case 'staggerEnd': sys(t('ftLogStaggerEnd')); break;
        case 'hearts': you(t('ftLogHearts', { n: n(e.left) })); break;
        case 'over': sys(t('ftLogOver', { name: WHAT[e.what]() })); break;
        case 'bindLost': foe(t(e.silk ? 'ftLogBindLost' : 'ftLogBindLostKept', { n: n(e.n), s: n(e.silk) })); break;
        case 'warded': foe(t('ftLogWarded', { name: toolName('warding-bell'), move: e.label })); break;
        case 'take': foe(t('ftLogHit', { name: e.label, n: n(e.n), m: n(e.left) })); break;
        case 'down': foe(t('ftLogLose')); break;
        case 'fractured': foe(t('ftLogFractured', { name: toolName('fractured-mask') })); break;
        case 'eye': you(t('ftLogEye', { name: toolName(cur.kit.eye === 2 ? 'druids-eyes' : 'druids-eye'), n: n(e.silk) })); break;
        case 'focus': sys(t('ftLogFocus', { x: num(C.hunter[e.level - 1][1], 1) })); break;
        case 'focusLost': foe(t('ftLogFocusLost')); break;
        case 'lifesteal': you(t('ftLogLifesteal', { m: n(e.left) })); break;
        case 'reaperSilk': you(t('ftLogReaperSilk')); break;
        case 'brew': you(t('ftLogBrew', { name: toolName('flea-brew'), s: n(e.s) })); break;
        case 'flint': you(t('ftLogFlint', { name: toolName('flintslate'), s: n(e.s) })); break;
        case 'plasm': you(t('ftLogPlasm', { name: toolName('plasmium-phial'), m: n(e.left) })); break;
        case 'challenge': you(t('ftLogChallenge')); break;
        case 'bind': you(t(e.free ? 'ftLogBindFree' : 'ftLogBind', { n: n(e.n), name: toolName('reserve-bind') })); break;
        case 'fury': you(t('ftLogFury', { s: n(e.s), n: n(e.n) })); break;
        case 'reaper': you(t('ftLogReaper', { name: WHAT.reaper(), s: n(e.s) })); break;
        case 'wait': you(t('ftLogWait', { s: num(e.s, 2) })); break;
        default: break;
      }
    }
  }

  /* After each action: the bars that fell (a boss of two heals the other; a phase gives way to the
     next; the last, the win), the phase ticks crossed, who you're hitting. */
  function settle(before) {
    const P = cur.wave ? {} : SS.phases[cur.f.id] || {};
    for (const p of fight.parts) {
      if (p.hp > 0 || p.settled) continue;
      p.settled = true;
      if (fight.parts.length > 1) logLine(t('ftLogPartDown', { name: pick(p.name) }), 'sys');
      // The Forebrothers: when one falls, the other, at or under its figure, heals (js/phases.js heal).
      if (P.heal && fight.parts.length === 2) {
        const o = fight.parts.find((x) => x.hp > 0);
        if (o && o.hp <= P.heal[0]) {
          const was = o.hp;
          o.hp = Math.min(P.heal[2], o.hp + P.heal[1]);
          o.max = Math.max(o.max, o.hp);
          logLine(t('ftLogHeal', { name: pick(o.name), n: num(o.hp - was), hp: num(o.hp) }), 'sys');
        }
      }
    }
    const after = remaining();
    for (const m of cur.marks) if (before > m.at && after <= m.at && after > 0) logLine(t('ftLogPhase', { n: num(m.n) }), 'sys');
    if (fight.parts.every((p) => p.hp <= 0)) {
      if (fight.phase + 1 < fight.phases.length) {
        fight.phase += 1;
        fight.parts = fight.phases[fight.phase].map(newPart);
        logLine(t(cur.wave ? 'ftWave' : 'ftLogPhase', { n: num(fight.phase + 1) }), 'sys');
      } else if (!fight.over) {
        fight.over = 'win';
        endFresh = true;
        logLine(t('ftLogWin', { name: pick(cur.title), n: num(fight.s.hits) }), 'sys');
      }
    }
    if (!targetOf()) retarget();
  }

  function act(action) {
    if (!fight || fight.over) return;
    snapshot();
    const before = remaining();
    const evs = FT.apply(fight.s, kitNow().kit, action, ctxOf());
    fight.started = true;
    sync();
    tell(evs);
    if (!FT.alive(fight.s) && !fight.over) { fight.over = 'lose'; endFresh = true; }
    settle(before);
    hudEvent = action.type === 'foeHit' ? 'hit' : action.type === 'bind' ? 'bind' : '';
    render();
  }

  /* ── The duel, drawn (the sibling's scene): what changes is animated by comparing it with the
     last thing painted: the mask that breaks, the silk that moves, the hit that flashes the enemy
     and rises as its figure, the bar's pale trail, the dust when it falls. Nothing bounces. */
  let hudPrev = null, foePrev = null, hudEvent = '', endFresh = false;
  const MASK = '<img src="assets/hud/mask.png" alt="">';
  const secsLeft = (until) => Math.max(0, until - fight.s.clock);

  function hornetSide() {
    const s = fight.s, k = cur.kit;
    const prev = hudPrev;
    hudPrev = { masks: s.masks + s.plasm, silk: s.silk };
    const hit = prev && hudEvent === 'hit' && s.masks + s.plasm < prev.masks;
    const healed = prev && s.masks + s.plasm > prev.masks;
    const down = !FT.alive(s);
    const masks = Array.from({ length: k.masks }, (_, i) => `<img src="assets/hud/mask.png" alt="" class="${i < s.masks ? '' : 'is-off'}${i === 0 && s.fractured ? ' is-fractured' : ''}${prev && i >= s.masks && i < prev.masks - s.plasm ? ' is-broken' : ''}">`).join('')
      + Array.from({ length: s.plasm }, () => '<img src="assets/hud/mask.png" alt="" class="is-plasm">').join('');
    const chips = [];
    const lv = FT.focusLevel(s, k);
    if (k.hunter.length) chips.push(lv ? t('ftChipFocus', { x: num(C.hunter[lv - 1][1], 1) }) : t('ftChipFocusBuild', { n: num(s.focus), m: num(k.hunter[0]) }));
    if (s.furyUntil > s.clock) chips.push(t('ftChipFury', { s: num(secsLeft(s.furyUntil), 1), n: num(s.furyHeals) }));
    if (s.reaperUntil > s.clock) chips.push(t('ftChipTimed', { name: WHAT.reaper(), s: num(secsLeft(s.reaperUntil), 1) }));
    if (s.brewUntil > s.clock) chips.push(t('ftChipTimed', { name: toolName('flea-brew'), s: num(secsLeft(s.brewUntil), 1) }));
    if (s.flintUntil > s.clock) chips.push(t('ftChipTimed', { name: toolName('flintslate'), s: num(secsLeft(s.flintUntil), 1) }));
    if (s.challenge) chips.push(t('ftChipChallenge'));
    if (k.fractured) chips.push(t(s.fractured ? 'ftChipMask' : 'ftChipMaskBroken', { name: toolName('fractured-mask') }));
    if (k.bind.reserve) chips.push(t(s.reserve ? 'ftChipReserve' : 'ftChipReserveUsed', { name: toolName('reserve-bind') }));
    const cls = [down && 'is-down', hit && !down && 'is-hit', healed && !down && 'is-bind', s.binding && 'is-binding'].filter(Boolean).join(' ');
    const bindWhy = FT.why(s, k, 'bind', ctxOf());
    return `<div class="ft-fighter ft-hornet ${cls}">
        <div class="ft-art"><img src="${down ? App.ART.corpse : App.ART.idle}" alt=""></div><h3>Hornet</h3>
        <span class="ft-masks" role="img" aria-label="${esc(t('ftMasksN', { n: num(s.masks + s.plasm) }))}">${masks}</span>
        <span class="ft-silk${prev && prev.silk !== s.silk ? ' is-changed' : ''}" role="img" aria-label="${esc(t('invSilk') + ' ' + num(s.silk))}" style="--s:${(s.silk / k.spool * 100).toFixed(1)}%"><span><img class="is-dim" src="assets/hud/spool.png" alt=""><img class="is-lit" src="assets/hud/spool.png" alt=""></span><b>${num(s.silk)}</b></span>
        ${chips.length ? `<ul class="ft-chips">${chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        ${s.binding ? `<div class="ft-binding"><span>${esc(t(k.bind.warding ? 'ftBindingBell' : 'ftBinding', { name: toolName('warding-bell') }))}</span>
          <button type="button" class="text-btn" data-act="ftDone">${esc(t('ftDone'))}</button></div>`
          : `<button type="button" class="btn ft-bind" data-act="ftBind"${bindWhy ? ` disabled title="${esc(t('ftWhy_' + bindWhy))}"` : ''}>${esc(t(k.bind.crest === 'beast' ? 'ftBindFury' : 'ftBindBtn', { n: num(k.bind.heals), c: num(k.bind.cost) }))}</button>`}
      </div>`;
  }

  function foeSide(f, hp) {
    const x = targetOf() || fight.parts.find((p) => p.hp > 0) || fight.parts[0];
    const key = [f.id, fight.phase, fight.target].join('|');
    const prev = foePrev && foePrev.key === key ? foePrev : null;
    const cur2 = x ? Math.max(0, x.hp) : 0;
    foePrev = { key, hp: cur2, over: fight.over };
    const hit = prev && prev.hp > cur2;
    const dying = fight.over === 'win' && endFresh;
    const pct = x && x.max ? cur2 / x.max * 100 : 0;
    const st = x && x.stag, cfg = stunFor(f, x);
    const downNow = !!(st && st.down);
    const several = fight.parts.length > 1;
    const ticks = fight.phases.length === 1 && !several ? cur.marks.map((m) => `<i style="left:${(m.at / hp * 100).toFixed(1)}%"></i>`).join('') : '';
    let stagger = '';
    if (cfg && x && x.hp > 0 && fight.over == null) {
      const live = st && st.lastAt != null && fight.s.clock - st.lastAt <= cfg.window + FT.EPS;
      stagger = downNow ? t(cfg.secs == null ? 'ftStaggeredWait' : 'ftStaggered', { s: num(secsLeft(st.until), 2) })
        : t('ftStaggerCount', { n: num(st ? st.total : 0, 2), max: num(cfg.max), c: num(live ? st.combo : 0, 2), k: num(cfg.combo) });
    }
    const phaseLbl = fight.phases.length > 1 ? t(cur.wave ? 'ftWaveN' : 'ftPhaseN', { n: num(fight.phase + 1), m: num(fight.phases.length) }) : '';
    const black = !!prefs.ftBlack && f.bt;
    const cls = [fight.over === 'win' && 'is-down', dying && 'is-dying', hit && 'is-hit', downNow && 'is-staggered'].filter(Boolean).join(' ');
    const dust = dying ? Array.from({ length: 10 }, (_, i) => `<span class="ft-dust" style="--i:${i}"></span>`).join('') : '';
    return `<div class="ft-fighter ft-enemy ${cls}"><div class="ft-art"><img src="${drawing(f)}" alt="" onerror="this.src='${portrait(f)}'">
          ${hit ? `<span class="ft-dmg">−${num(prev.hp - cur2)}</span>` : ''}${dust}</div>
        <h3${NT}>${esc(pick(f.name))}</h3>
        ${phaseLbl ? `<span class="ft-phase-n">${esc(phaseLbl)}</span>` : ''}
        ${several && x && !cur.wave ? `<span class="ft-part-name"${NT}>${esc(pick(x.name))}</span>` : ''}
        <span class="ft-hpbar${pct <= 25 ? ' is-low' : ''}">${hit ? `<span class="ft-trail" style="width:${Math.min(100, prev.hp / x.max * 100).toFixed(1)}%"></span>` : ''}<span class="ft-fill" style="width:${pct.toFixed(1)}%"></span>${ticks}</span>
        <span class="ft-hpn">${esc(hp == null ? t('ftHpN', { n: '?' }) : t('ftHpLeft', { n: num(cur2), m: num(x ? x.max : 0) }))}</span>
        ${stagger ? `<span class="ft-stag${downNow ? ' is-down' : ''}">${esc(stagger)}</span>` : ''}
        ${f.bt && !cur.wave ? `<button type="button" class="check" role="switch" aria-checked="${!!black}" data-act="ftBlack"><span class="check-box" aria-hidden="true">${App.tick}</span><span>${esc(t('ftBlack', { n: num(f.bt) }))}</span></button>` : ''}</div>`;
  }

  // Undo and Start over, with their circled arrows.
  const UNDO_ICON = '<svg class="ic" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h7a3.5 3.5 0 0 1 0 7H6"/><path d="M6 3L3 6l3 3"/></svg>';
  const RESET_ICON = '<svg class="ic" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.8-4.1"/><path d="M12.2 1.2v3.2H9"/></svg>';
  const undoBtn = (band) => `<button type="button" class="text-btn ft-undo" data-act="ftUndo"${undoStack.length ? '' : ' disabled'}${band ? ' tabindex="-1"' : ' aria-keyshortcuts="Control+Z"'} title="${esc(t('ftUndoHint'))}">${UNDO_ICON}${esc(t('ftUndo'))}</button>`;

  // Hits left on both sides: slashes to finish what's standing and what comes, and of its strongest hit you can still take.
  /* Each bar's slashes, with the slash against that enemy (a gauntlet's differ by modifier); and
     the strongest hit among who's standing now. */
  const standingFoes = () => [...new Set(fight.parts.filter((p) => p.hp > 0).map((p) => p.foeId))];
  function score() {
    const per = (id) => { const k = cur.kits[id].kit; return k.moves['att:slash'] ? FT.damage(fight.s, k, 'att:slash') : 0; };
    let win = 0;
    for (const p of [...fight.parts, ...fight.phases.slice(fight.phase + 1).flat()]) {
      if (p.hp <= 0) continue;
      const d = per(p.foeId);
      if (!d) { win = null; break; }
      win += Math.ceil(p.hp / d);
    }
    const worst = standingFoes().reduce((m, id) => Math.max(m, ...cur.theirs[id].list.map((x) => x.per), 0), 0);
    return { win: cur.hp == null ? null : win, fall: worst ? Math.ceil(FT.total(fight.s) / worst) : null };
  }
  function midHtml() {
    const sc = score();
    return `<div class="ft-mid">
        ${fight.over ? '' : `<p><b>${sc.win == null ? '?' : num(sc.win)}</b><span>${esc(t('ftToWin'))}</span></p>
        ${sc.fall != null ? `<p class="is-sub"><b>${num(sc.fall)}</b><span>${esc(t('ftToFall'))}</span></p>` : ''}`}
        <p class="ft-clock"><span>${esc(t('ftClock', { s: num(fight.s.clock, 2) }))}</span></p>
        <div class="ft-log-tools">${undoBtn()}<button type="button" class="text-btn" data-act="ftReset"${fight.started ? '' : ' disabled'}>${RESET_ICON}${esc(t('ftReset'))}</button></div>
      </div>`;
  }

  /* The band: when the duel scrolls out of view, the same face-off in small sticks under the bar
     (the sibling's), so the lists below can be played with the fight in sight. It repeats what the
     duel says: hidden from screen readers, its Undo out of the tab order. */
  function bandHtml(f) {
    const s = fight.s, x = targetOf() || fight.parts[0], sc = score();
    const pct = x && x.max ? Math.max(0, x.hp) / x.max * 100 : 0;
    return `<div class="ft-band" aria-hidden="true"><div class="ft-band-in">
        <span class="ft-band-me"><span class="ft-masks">${Array.from({ length: cur.kit.masks }, (_, i) => `<img src="assets/hud/mask.png" alt="" class="${i < s.masks ? '' : 'is-off'}">`).join('')}${'<img src="assets/hud/mask.png" alt="" class="is-plasm">'.repeat(s.plasm)}</span><b>${num(s.silk)}</b></span>
        <span class="ft-band-vs">${sc.win == null || fight.over ? '' : `<b>${num(sc.win)}</b> · `}${esc(t('ftClock', { s: num(s.clock, 1) }))} ${undoBtn(true)}</span>
        <span class="ft-band-foe"><span${NT}>${esc(pick(x ? x.name : f.name))}</span><span class="ft-hpbar"><span class="ft-fill" style="width:${pct.toFixed(1)}%"></span></span></span>
      </div></div>`;
  }
  let bandOn = false;
  function bandCheck() {
    const duel = document.querySelector('.ft-duel'), band = document.querySelector('.ft-band');
    if (!duel || !band || !duel.offsetParent) { bandOn = false; return; }
    const nav = document.getElementById('nav');
    const top = nav ? nav.getBoundingClientRect().bottom : 0;
    document.documentElement.style.setProperty('--ft-band-top', Math.round(top) + 'px');
    const r = duel.getBoundingClientRect();
    bandOn = r.bottom < top + 120;
    band.classList.toggle('is-on', bandOn);
  }
  window.addEventListener('scroll', bandCheck, { passive: true });
  window.addEventListener('resize', bandCheck);

  /* Your moves, in groups as the game hands them out: the Needle (its slashes, the Strike, the
     Challenge), silk (the Skill), the Tools, and time (Wait, only when something will happen). A
     card says its damage, what it costs or has left, and why it can't be done now. The Wanderer's
     critical is a second button beside the slash: whoever plays decides it, with its chance in view. */
  const GROUPS = [['needle', 'ftGNeedle'], ['silk', 'ftGSilk'], ['tools', 'ftGTools'], ['time', 'ftGTime']];
  function movesHtml() {
    const s = fight.s, k = cur.kit, ctx = ctxOf();
    const cards = cur.list.map((m) => {
      const why = fight.over ? 'over' : FT.why(s, k, m.id, ctx);
      const dmg = k.moves[m.id].dmg != null ? FT.damage(s, k, m.id) : null;
      const sub = m.ammo != null ? t('ftLeft', { n: num(s.ammo[m.id] ?? 0), m: num(m.ammo) }) : m.cost ? t('ctSilkCost', { n: num(m.cost) }) : m.note || '';
      const how = [m.each ? hitsText(m.each) : '', m.load != null ? t('ftLoad', { p: num(Math.min(999, m.load * 100)) }) : ''].filter(Boolean).join(' · ');
      const card = `<button type="button" class="ft-cardx" data-act="ftAct" data-value="${m.id}"${why ? ' disabled' : ''}${how || why ? ` title="${esc(why && why !== 'over' ? t('ftWhy_' + why) : how)}"` : ''}>
        ${m.img ? `<img class="${m.needle ? 'is-needle' : ''}" src="${m.img}" alt="">` : '<span class="ft-card-glyph" aria-hidden="true">✦</span>'}<span${NT}>${esc(m.name)}</span>${dmg != null ? `<b>${num(dmg)}</b>` : ''}
        ${m.uses == null ? '' : `<em>${esc(t('ftUses', { n: num(m.uses) }))}</em>`}${sub ? `<small>${esc(sub)}</small>` : ''}${why && why !== 'over' && why !== 'target' ? `<small class="ft-why">${esc(t('ftWhy_' + why))}</small>` : ''}</button>`;
      const critTable = k.moves[m.id].crit;
      const crit = critTable ? `<button type="button" class="ft-cardx is-crit" data-act="ftCrit" data-value="${m.id}"${why ? ' disabled' : ''} title="${esc(t('ftCritTitle'))}">
        <span>${esc(t('ftCrit'))}</span><b>${num(FT.damage(s, k, m.id, true))}</b><em>${esc(t('ftCritHint', { p: num(cur.r.needle.crit.chance * 100, 1) }))}</em></button>` : '';
      return { group: m.group, html: `<li${crit ? ' class="has-crit"' : ''}>${card}${crit}</li>` };
    });
    const tk = FT.nextTick(s, k, ctx);
    if (tk && !fight.over) {
      cards.push({ group: 'time', html: `<li><button type="button" class="ft-cardx" data-act="ftWait"><span class="ft-card-glyph" aria-hidden="true">⧖</span>
        <span>${esc(t('ftWait'))}</span><b>${num(tk.s, 2)} s</b><em>${esc(t('ftWaitFor_' + tk.what))}</em></button></li>` });
    }
    return `<section class="ft-side"><h3 class="ct-h">${esc(t('ftYours'))}</h3>${GROUPS.map(([g, key]) => {
      const cs = cards.filter((c) => c.group === g);
      return cs.length ? `<div class="ft-group"><h4 class="ft-group-h">${esc(t(key))}</h4><ul class="ft-cards">${cs.map((c) => c.html).join('')}</ul></div>` : '';
    }).join('')}</section>`;
  }

  /* Its side: who you're hitting when there are several, and the attacks of each enemy standing (a
     gauntlet's wave, grouped by enemy), which can't land while it's down. */
  function theirsHtml() {
    const parts = fight.parts.length > 1 ? `<div class="ft-targets" role="group" aria-label="${esc(t('ftTarget'))}">${fight.parts.map((p, i) => {
      const pct = p.max ? Math.max(0, p.hp) / p.max * 100 : 0;
      return `<button type="button" class="ft-target${i === fight.target ? ' is-on' : ''}" data-act="ftTarget" data-value="${i}" aria-pressed="${i === fight.target}"${p.hp > 0 ? '' : ' disabled'}>
        <span${NT}>${esc(pick(p.name))}</span><span class="ft-hpbar"><span class="ft-fill" style="width:${pct.toFixed(1)}%"></span></span><b>${num(Math.max(0, p.hp))}</b></button>`;
    }).join('')}</div>` : '';
    const ids = cur.wave ? [...new Set(fight.parts.map((p) => p.foeId))] : Object.keys(cur.theirs);
    let downNote = false;
    const groups = ids.map((id) => {
      const th = cur.theirs[id], mine = fight.parts.filter((p) => p.foeId === id && p.hp > 0);
      const down = mine.length > 0 && mine.every((p) => p.stag && p.stag.down);
      downNote = downNote || down;
      const off = !!fight.over || !mine.length || down;
      const head = ids.length > 1 ? `<h4 class="ft-group-h"${NT}>${esc(foeName(FOE.get(id)))}${mine.length > 1 ? ` ×${num(mine.length)}` : ''}</h4>` : '';
      return head + `<ul class="ft-hits">${th.list.map((x, i) => `<li><button type="button" class="ft-hit" data-act="ftHit" data-value="${id}:${i}"${off ? ' disabled' : ''}${x.sub ? ` title="${esc(x.sub)}"` : ''}>
        <span class="ft-hit-name"${th.fromGame ? '' : NT}>${esc(x.name)}</span>
        <span class="ft-hit-masks" role="img" aria-label="${esc(t('ftMasksN', { n: num(x.per) }))}">${x.per > 6 ? `${MASK}<b>×${num(x.per)}</b>` : MASK.repeat(x.per)}</span>
        <em>${esc([t(x.bare === 1 ? 'ftToDie1' : 'ftToDie', { n: num(x.bare) }), x.bind && !cur.wave ? t('ftIfBind', { n: num(x.bind) }) : ''].filter(Boolean).join(' · '))}</em></button></li>`).join('')}</ul>`;
    }).join('');
    return `<section class="ft-side"><h3 class="ct-h">${esc(t('ftTheirsShort'))}</h3>${parts}${groups}
      ${downNote ? `<p class="pg-note">${esc(t('ftStaggeredNote'))}</p>` : ''}</section>`;
  }

  /* The log, newest first, under the moves (the least of the screen): what you did, what it did to
     you (with a mask), and the fight's own lines between rules. */
  const logHtml = () => `<div class="ft-log"><ol class="ft-log-lines">${fight.log.map((l, i) => `<li class="is-${l.side}${i ? '' : ' is-last'}">${l.side === 'foe' ? '<img class="ft-log-mask" src="assets/hud/mask.png" alt="">' : ''}<span>${esc(l.text)}</span></li>`).join('')}</ol></div>`;

  /* The end, titled the way the game titles an area on entry, and the fight in figures under it:
     the time your actions took and the damage per second, the moves, the masks lost, the silk
     spent, the Binds. It fades in only when the action causes it. */
  function endHtml() {
    if (!fight.over) return '';
    const s = fight.s, won = fight.over === 'win';
    const items = [
      s.clock > 0 && [t('ftSumTime'), num(s.clock, 1) + ' s'],
      s.clock > 0 && [t('ftSumDps'), num(s.dealt / s.clock, 1)],
      [t('ftSumHits'), num(s.hits)], [t('ftSumTaken'), num(s.taken)], [t('ftSumSilk'), num(s.silkSpent)], [t('ftSumBinds'), num(s.binds)],
    ].filter(Boolean);
    return `<div class="ft-end ${won ? 'is-won' : 'is-dead'}${endFresh ? ' is-fresh' : ''}" role="status">
        <p class="ft-end-title">${esc(t(won ? 'ftWon' : 'ftLogLose'))}</p>
        <span class="ft-end-rule" aria-hidden="true"><i></i><svg viewBox="0 0 14 12" width="14" height="12"><path d="M7 1L13 6L7 11L1 6Z"/></svg><i></i></span>
        <p class="ft-end-note">${esc(won ? t('ftLogWin', { name: pick(cur.title), n: num(s.hits) }) : t('ftDeadNote', { n: num(s.dealt), m: num(cur.hp || 0) }))}</p>
        <dl class="ft-sum">${items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <button type="button" class="btn btn-primary" data-act="ftReset">${esc(t('ftAgain'))}</button>
      </div>`;
  }

  App.screens.fight = (sec) => {
    const mode = prefs.ftMode === 'gauntlets' ? 'gauntlets' : 'foe';
    const modes = `<div class="seg pg-seg" role="group" aria-label="${esc(t('ftModes'))}">
        <button type="button" data-act="ftMode" data-value="foe" aria-pressed="${mode === 'foe'}">${esc(t('ftModeFoe'))}</button>
        <button type="button" data-act="ftMode" data-value="gauntlets" aria-pressed="${mode === 'gauntlets'}">${esc(t('ftModeGauntlets'))}</button></div>`;
    const how = (body) => `<details class="ft-how"><summary class="ct-h">${esc(t('ftHow'))}</summary><div class="ft-how-body">${body}</div></details>`;
    const st = App.currentBuild();
    let face, picked, top, how2, plan;
    if (mode === 'gauntlets') {
      /* A gauntlet, played as one fight: its waves one after another, a bar per enemy, your masks,
         silk, uses and the clock carried from wave to wave. Each enemy takes its own modifiers, so
         each gets its own kit. */
      const g = G.find((x) => x.id === prefs.gauntlet) || G[0];
      const game = App.game(), done = new Set(game ? game.gauntlets : []);
      /* The quickest way through the whole arena: its health as your Needle's level sees it (each
         enemy's health over its modifier at that level). The Tools hit at the Kit's level, where
         the modifiers can differ: an estimate, and it says so. */
      const lvl = E.normalize(st).needle;
      const hpAll = Math.ceil(g.waves.reduce((a, w) => a + w.reduce((b, [id, n]) => {
        const f = FOE.get(id) || {};
        return b + (f.hp ? (f.hp / (f.mods ? f.mods[lvl] : 1)) * n : 0);
      }, 0), 0));
      plan = planHtml(E.compute(st, { foe: { id: g.id, hp: hpAll, mods: [1, 1, 1, 1, 1] } }));
      const ids = [...new Set(g.waves.flat().map(([id]) => id))];
      const kits = {}, their = {};
      for (const id of ids) {
        const f = FOE.get(id), r = E.compute(st, { foe: f });
        kits[id] = { ...kitOf(f, r, false), r };
        their[id] = theirs(f, r);
      }
      const phases = wavesOf(g);
      cur = { key: ['g', g.id, SS.codec.encode(E.normalize(st))].join('|'), wave: true, title: g.place || (CO.AREAS[g.area] || { es: g.id, en: g.id }),
        hp: phases.flat().reduce((a, p) => a + p.hp, 0), kits, theirs: their, phases, marks: [] };
      face = `<img src="${portrait(FOE.get(g.waves[g.waves.length - 1][0][0]))}" alt=""><span class="ft-choose-name"${NT}>${esc(gauntletName(g))}</span>
          <i class="ft-boss">${done.has(g.id) ? App.tick + ' ' : ''}${esc(t('ftWaves', { n: num(g.waves.length) }))}</i>`;
      picked = choose(t('ftModeGauntlets'), face, gauntletPicker(g, done));
      top = gauntletCard(g, game);
      how2 = `<div class="ct-figs ft-waves">${gauntletWaves(g, st)}</div><p class="pg-note">${esc(t('ftGauntletNote'))}</p>
        ${game ? `<p class="pg-note">${esc(t('ftClearedCount', { n: num(done.size), of: num(G.length) }))}</p>` : ''}`;
    } else {
      const f = FOE.get(prefs.foe) || FOE.get('lace');
      const black = !!prefs.ftBlack && !!f.bt;
      const r = E.compute(st, { foe: f, black });
      const hp = black ? f.bt : f.hp;
      const th = theirs(f, r);
      const phases = phasesOf(f, hp, black);
      // A new enemy, black thread or build starts the fight over.
      cur = { key: [f.id, black, SS.codec.encode(r.state)].join('|'), f, title: f.name, hp, black, kits: { [f.id]: { ...kitOf(f, r, black), r } },
        theirs: { [f.id]: th }, phases, marks: phaseMarks(f, r, hp, phases.length === 1 && phases[0].length === 1) };
      picked = choose(t('ftSearch'), foeFace(f), picker(f));
      top = '';
      plan = planHtml(r);
      how2 = `${about(f, r, hp)}<p class="pg-note">${esc(t('ftYoursNote'))}</p><p class="pg-note">${esc(t('ftPlanNote', { s: num(r.silk.spool) }))}</p>
        ${th.notes.map((n) => `<p class="pg-note">${esc(n)}</p>`).join('')}`;
    }
    if (!fight || fight.key !== cur.key) startFight(cur);
    sync();
    // The enemy on the stage: whoever you're hitting (in a gauntlet, each wave's).
    const tp = targetOf() || fight.parts.find((p) => p.hp > 0) || fight.parts[0];
    const shown = FOE.get(tp.foeId);
    const note = `<p class="pg-note">${esc(t('ftSimNote', { flint: toolName('flintslate'), wisp: toolName('wispfire-lantern'), wanderer: pick(D.CRESTS.find((c) => c.id === 'wanderer').name) }))}</p>`;
    sec.innerHTML = `<div class="ft">${brackets}${screenHead(esc(t('navFight')), modes)}
      ${picked}${top}
      ${bandHtml(shown)}
      <div class="ft-duel">${hornetSide()}${midHtml()}${foeSide(shown, cur.hp)}</div>
      ${endHtml()}${plan}
      <div class="ft-two">${movesHtml()}${theirsHtml()}</div>
      ${logHtml()}
      ${how(how2 + note)}</div>`;
    hudEvent = '';
    endFresh = false;
    requestAnimationFrame(bandCheck);
  };

  /* A boss's page (tools/pages-bosses.js) opens on that boss: <html data-foe>, applied at boot
     once the preferences are read, unless the link names another screen. Not saved: going back
     to the calculator's own page keeps the enemy you had. */
  App.adoptFoe = (linkedView) => {
    const id = document.documentElement.dataset.foe;
    if (!id || !FOE.has(id) || (linkedView && linkedView !== 'fight')) return;
    prefs.foe = id;
    prefs.ftMode = 'foe';
  };

  Object.assign(actions, {
    ftFoe(node) { prefs.foe = node.dataset.value; savePrefs(); render(); },
    ftBlack() { prefs.ftBlack = !prefs.ftBlack; savePrefs(); render(); },
    ftMode(node) { prefs.ftMode = node.dataset.value; savePrefs(); render(); },
    ftGauntlet(node) { prefs.gauntlet = node.dataset.value; savePrefs(); render(); },
    // The fight played out: a move, a critical slash, one of its hits, a Bind and its window, Wait.
    ftAct(node) { act({ type: 'move', id: node.dataset.value }); },
    ftCrit(node) { act({ type: 'move', id: node.dataset.value, crit: true }); },
    ftHit(node) {
      const [id, i] = node.dataset.value.split(':');
      const x = cur && cur.theirs[id] && cur.theirs[id].list[+i];
      if (x) act({ type: 'foeHit', masks: x.per, label: x.name });
    },
    ftBind() { act({ type: 'bind' }); },
    ftDone() { act({ type: 'done' }); },
    ftWait() { act({ type: 'wait' }); },
    ftTarget(node) { if (fight) { fight.target = +node.dataset.value; render(); } },
    ftUndo() { if (undo()) render(); },
    ftReset() { if (cur) { startFight(cur); render(); } },
  });
  /* Ctrl+Z (Cmd+Z on a Mac) undoes the last move while Combat is in view, except inside a text
     field, where it belongs to the text. */
  document.addEventListener('keydown', (ev) => {
    if (!(ev.ctrlKey || ev.metaKey) || ev.shiftKey || ev.altKey || ev.key.toLowerCase() !== 'z') return;
    if (prefs.view !== 'fight' || !undoStack.length) return;
    if (ev.target.closest && ev.target.closest('input, textarea, select, [contenteditable]')) return;
    ev.preventDefault();
    if (undo()) render();
  });
  // The search filters as you type; only the list is repainted, so the field keeps its focus.
  document.addEventListener('input', (e) => {
    if (!e.target.matches || !e.target.matches('[data-act="ftQuery"]')) return;
    query = e.target.value;
    const f = FOE.get(prefs.foe) || FOE.get('lace');
    const box = document.createElement('div');
    box.innerHTML = picker(f);
    const list = document.querySelector('.ft-foes');
    if (list) list.replaceWith(box.querySelector('.ft-foes'));
  });
})();
