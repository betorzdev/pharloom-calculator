/* js/app-fight.js — Combat: your build against one enemy, as a duel (design/21-combat-variants.html,
   A, the sibling's): Hornet and the enemy's whole Journal drawing face to face, the slashes that
   win and the hits that take you down between them; your attacks as cards and its with their
   masks, all of them tappable to play the fight out (js/sim.js: damage, masks, silk, uses, the
   Bind, a log, undo); the rest folded under «How it's worked out». Every enemy carries five damage
   modifiers, one per level of what hits (js/enemies.js, the wiki's master tables), so how many
   hits kill it is a question per enemy: the engine (js/engine.js, compute(state, { foe })) takes
   the enemy's modifier at the Needle's level for the Needle, its Strike and the Silk Skills, and at
   the Crafting Kit's for the Tools, and says how many uses of each attack take its health, normal
   or black-threaded (Act 3). The build is the Crest screen's: in a save, what Hornet wears; in
   Free mode, the one being tried. And the other way: how many hits of each of a boss's attacks
   take your masks (the wiki's figures, one mask when it gives none; the attacks' names are the
   wiki's, the game doesn't name them), and for any other enemy what its body and its strongest
   hitbox take, from the game's own files (js/enemy-damage.js). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, EN = SS.enemies, E = SS.engine, J = SS.journal;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n, d = 0) => App.NF[d].format(n);
  const FOE = new Map(EN.FOES.map((f) => [f.id, f]));
  const BOOK_BY_N = new Map(J.BOOK.map((e) => [e.n, e]));
  const portrait = (f) => { const e = BOOK_BY_N.get(f.hj); return e ? `assets/icons/journal/${e.id}.webp` : ''; };
  const foeName = (f) => pick(f.name) + (f.variant ? ' · ' + pick(f.variant) : '');
  // Bosses first, then the rest, each in the Journal's order.
  const ORDER = EN.FOES.slice().sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0) || a.hj - b.hj || foeName(a).localeCompare(foeName(b)));
  let query = '';
  const fold = (x) => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    const st = (EN.ATTACKS[f.page] || { staggers: [] }).staggers;
    return `${f.bars ? `<p class="ft-stagger"><span class="save-k">${esc(t('ftHp'))}</span> ${esc(f.bars.map((b) => num(b)).join(' + '))}</p>` : ''}
        ${f.mods ? `<div class="ft-mods"><span class="save-k">${esc(t('ftMods'))}</span><ol>${mods}</ol>
          <p class="pg-note">${esc(t('ftModsNote', { n: num(lv), k: num(kit) }))}</p></div>` : f.oneHit ? `<p class="pg-note">${esc(t('ftOneHit'))}</p>` : ''}
        ${st.length ? `<p class="ft-stagger"><span class="save-k">${esc(t('ftStagger'))}</span> ${esc(st.map((x) => t('ftHits', { n: num(x) })).join(' · '))}</p>` : ''}
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

  // What you do to it: each attack, its damage, the uses that kill it, and how it's made (its title).
  function yours(r) {
    const n = r.needle, out = [];
    // The slash says its product: the Needle × Hornet's bracket × the enemy's modifier at its level.
    const formula = t('ftFormula', { base: num(n.base), x: num(n.bracket, 2), m: num(n.enemy, 2) });
    for (const a of n.attacks.filter((x) => x.id === 'slash' || D.CRESTS.find((c) => c.id === r.state.crest).attacks)) {
      // The slash also says how long slashing nonstop takes, at the Crest's own pace (js/hero.js).
      const time = a.id === 'slash' && n.speed.seconds != null ? t('ftSeconds', { s: num(n.speed.seconds, 1) }) : '';
      out.push({ id: 'att:' + a.id, dmg: a.rest ?? a.total, gain: 1, img: `assets/needles/${n.level}.png`, name: t('ctAtt_' + a.id), total: a.total, uses: a.uses,
        how: [hitsText(a.each), a.id === 'slash' ? formula : '', time].filter(Boolean).join(' · '), needle: true });
    }
    if (r.strike) out.push({ id: 'strike', dmg: r.strike.rest ?? r.strike.total, img: icon('arts', 'needle-strike'), name: t('ctStrike'), total: r.strike.total, uses: r.strike.uses, how: hitsText(r.strike.each) });
    const sk = r.skills.find((s) => s.equipped);
    if (sk) out.push({ id: 'skill', dmg: sk.rest ?? sk.total, cost: r.silk.skill, img: icon('skills', sk.id), name: pick(D.SKILLS.find((x) => x.id === sk.id).name), total: sk.total, uses: sk.uses, how: hitsText(sk.each) });
    for (const x of r.tools.filter((y) => y.attacks.length)) {
      const a = x.attacks[0];
      const load = x.loadShare != null ? t('ftLoad', { p: num(Math.min(999, x.loadShare * 100)) }) : '';
      out.push({ id: 'tool:' + x.id, dmg: a.rest ?? a.total, ammo: x.ammo, img: icon('tools', x.id), name: pick(D.TOOLS.find((y) => y.id === x.id).name), total: a.total, uses: a.uses, how: [hitsText(a.each), load].filter(Boolean).join(' · ') });
    }
    return out;
  }
  /* As cards: art, name, damage, the uses that kill it; the one that needs fewest, marked. A tap
     plays it on the fight (js/sim.js); under it what it costs or has left, and it can't be played
     without the silk or the uses. */
  function yoursHtml(list, kit, fs) {
    const best = Math.min(...list.map((x) => (x.uses == null ? Infinity : x.uses)));
    return `<section class="ft-side"><h3 class="ct-h">${esc(t('ftYours'))}</h3><ul class="ft-cards">${list.map((x) => {
      const left = x.ammo != null ? t('ftLeft', { n: num(fs.ammo[x.id]), m: num(x.ammo) }) : x.cost ? t('ctSilkCost', { n: num(x.cost) }) : '';
      return `<li><button type="button" class="ft-cardx${x.uses === best ? ' is-best' : ''}" data-act="ftAct" data-value="${x.id}"${SIM.can(kit, fs, x.id) ? '' : ' disabled'}${x.how ? ` title="${esc(x.how)}"` : ''}>
        <img class="${x.needle ? 'is-needle' : ''}" src="${x.img}" alt=""><span${NT}>${esc(x.name)}</span><b>${num(x.total)}</b>
        <em>${x.uses == null ? '' : esc(t('ftUses', { n: num(x.uses) }))}</em>${left ? `<small>${esc(left)}</small>` : ''}</button></li>`;
    }).join('')}</ul></section>`;
  }

  /* The fight as a whole (js/engine.js, plan): the red Tools' loads first, then the fewest slashes
     with the Skill casts their silk pays for, the spool full to start and no Bind. */
  function planHtml(r) {
    const p = E.plan(r, r.foe && r.foe.hp);
    if (!p) return '';
    const parts = p.throws.map((x) => t('ftPlanThrows', { n: num(x.n), name: pick(D.TOOLS.find((y) => y.id === x.id).name) }));
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
    const tool = (id) => pick(D.TOOLS.find((y) => y.id === id).name);
    /* Silk Hearts (js/engine.js, regen): up to their cap, and only while the silk doesn't change,
       over the seconds the slash takes to kill (the figure on the slash's row). */
    const H = b.hearts, ring = r.state.tools.includes('weavelight');
    const hearts = !H.cap ? t('ftBindNoHearts') : H.seconds == null ? ''
      : t('ftBindHearts', { n: num(H.cap), b: num(H.next, 2), a: num(H.first, 2), t: num(H.seconds, 1), i: num(r.needle.speed.interval, 2), x: num(H.strands) });
    const extra = [b.reserve ? t('ftBindReserve', { name: tool('reserve-bind') }) : '',
      ['druids-eyes', 'druids-eye'].filter((id) => r.state.tools.includes(id)).map((id) => t('ftBindEye', { name: tool(id) }))[0] || '',
      hearts, ring && H.cap ? t('ftBindRing', { name: tool('weavelight'), k: num(SS.hero.REGEN.weavelight.time, 2) }) : ''];
    const notes = [black ? t('ftTheirsBlackNote') : fromGame ? t('ftTheirsGameNote') : t('ftTheirsNote'),
      [t('ftBindNote', { s: num(b.spool), c: num(r.silk.bind), h: num(r.health.bind.heals) }), ...extra].filter(Boolean).join(' ')];
    return { list, fromGame, notes };
  }
  // Its attacks: the name, its masks drawn, and how many take yours.
  const MASK = '<img src="assets/hud/mask.png" alt="">';
  function theirsHtml(th, kit, fs) {
    if (!th.list.length) return '';
    return `<section class="ft-side"><h3 class="ct-h">${esc(t('ftTheirsShort'))}</h3><ul class="ft-hits">${th.list.map((x, i) => `<li><button type="button" class="ft-hit" data-act="ftAct" data-value="hit:${i}"${SIM.can(kit, fs, 'hit:' + i) ? '' : ' disabled'}${x.sub ? ` title="${esc(x.sub)}"` : ''}>
        <span class="ft-hit-name"${th.fromGame ? '' : NT}>${esc(x.name)}</span>
        <span class="ft-hit-masks" role="img" aria-label="${esc(t('ftMasksN', { n: num(x.per) }))}">${x.per > 6 ? `${MASK}<b>×${num(x.per)}</b>` : MASK.repeat(x.per)}</span>
        <em>${esc([t(x.bare === 1 ? 'ftToDie1' : 'ftToDie', { n: num(x.bare) }), x.bind ? t('ftIfBind', { n: num(x.bind) }) : ''].filter(Boolean).join(' · '))}</em></button></li>`).join('')}</ul></section>`;
  }

  /* ── The fight played out (js/sim.js): the screen describes it as a kit, from what the engine
     computes; the state lives here while the page is open, for this enemy and this build (a
     change of either starts it over). ── */
  const SIM = SS.sim;
  let fight = null;
  function kitOf(f, r, hp, moves, th, ticks) {
    return { hp: hp || 0, masks: r.health.masks, spool: r.silk.spool, bind: { cost: r.silk.bind, heals: r.health.bind.heals },
      moves: Object.fromEntries(moves.map((x) => [x.id, { dmg: x.dmg, gain: x.gain || 0, cost: x.cost || 0, ammo: x.ammo }])),
      hits: Object.fromEntries(th.list.map((x, i) => ['hit:' + i, x.per])), phases: ticks };
  }
  // Where each phase starts, in health left (js/phases.js through the engine).
  function phaseMarks(f, r, hp) {
    const P = SS.phases[f.id] || {};
    if (!hp) return [];
    return E.phases(P, hp, r.needle.attacks[0], r.needle.speed && r.needle.speed.interval)
      .map((x) => ({ n: x.n, at: P.bars ? hp - x.dealt : x.left })).filter((x) => x.at > 0 && x.at < hp);
  }
  // The log, newest first: what each move did.
  function logHtml(fs, moves, th, f) {
    const name = (id) => (moves.find((x) => x.id === id) || {}).name || id;
    const line = (e) => (e.k === 'you' ? t('ftLogYou', { name: name(e.id), n: num(e.dmg), hp: num(e.hp) })
      : e.k === 'hit' ? t('ftLogHit', { name: th.list[+e.id.split(':')[1]].name, n: num(e.m), m: num(e.masks) })
      : e.k === 'bind' ? t('ftLogBind', { n: num(e.h) })
      : e.k === 'phase' ? t('ftLogPhase', { n: num(e.n) })
      : e.k === 'win' ? t('ftLogWin', { name: pick(f.name), n: num(e.n) }) : t('ftLogLose'));
    const lines = fs.log.slice(-4).reverse();
    return `<div class="ft-log">
        <div class="ft-log-tools"><button type="button" class="text-btn" data-act="ftUndo"${fs.past ? '' : ' disabled'}>↶ ${esc(t('ftUndo'))}</button>
          <button type="button" class="text-btn" data-act="ftReset"${fs.past ? '' : ' disabled'}>⟲ ${esc(t('ftReset'))}</button></div>
        ${lines.length ? `<ol class="ft-log-lines">${lines.map((e) => `<li class="is-${e.k}"${NT}>${esc(line(e))}</li>`).join('')}</ol>` : `<p class="pg-note">${esc(t('ftLogStart'))}</p>`}
      </div>`;
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

  /* The duel (design/21-combat-variants.html, A, the sibling's): Hornet and the enemy face to
     face, each on the Journal's light; between them, the slashes that still win and the fewest of
     its hits that still take you down; her masks and silk and its health as the fight stands, a
     tick on its bar where each phase starts. */
  function duel(f, r, hp, th, kit, fs, marks) {
    const slash = r.needle.attacks[0], per = slash.rest ?? slash.total;
    const worst = th.list.reduce((m, x) => (!m || x.per > m.per ? x : m), null);
    const toWin = hp == null || !per ? null : Math.ceil(fs.hp / per);
    const toFall = worst ? Math.ceil(fs.masks / worst.per) : null;
    const ticks = marks.map((x) => `<i style="left:${(x.at / hp * 100).toFixed(1)}%"></i>`).join('');
    const black = !!prefs.ftBlack && f.bt;
    const masks = Array.from({ length: kit.masks }, (_, i) => `<img src="assets/hud/mask.png" alt=""${i < fs.masks ? '' : ' class="is-off"'}>`).join('');
    return `<div class="ft-duel">
        <div class="ft-fighter"><div class="ft-art"><img src="${App.ART.idle}" alt=""></div><h3>Hornet</h3>
          <span class="ft-masks" role="img" aria-label="${esc(t('ftMasksN', { n: num(fs.masks) }))}">${masks}</span>
          <span class="ft-silk" role="img" aria-label="${esc(t('invSilk') + ' ' + num(fs.silk))}" style="--s:${(fs.silk / kit.spool * 100).toFixed(1)}%"><span><img class="is-dim" src="assets/hud/spool.png" alt=""><img class="is-lit" src="assets/hud/spool.png" alt=""></span><b>${num(fs.silk)}</b></span>
          <button type="button" class="btn ft-bind" data-act="ftAct" data-value="bind"${SIM.can(kit, fs, 'bind') ? '' : ' disabled'}>${esc(t('ftBindBtn', { n: num(kit.bind.heals), c: num(kit.bind.cost) }))}</button></div>
        <div class="ft-mid">
          <p><b>${toWin == null ? '?' : num(toWin)}</b><span>${esc(t('ftToWin'))}</span></p>
          ${worst ? `<p class="is-sub"><b>${num(toFall)}</b><span>${esc(t('ftToFall'))}</span></p>` : ''}
        </div>
        <div class="ft-fighter${fs.over === 'win' ? ' is-down' : ''}"><div class="ft-art"><img src="${drawing(f)}" alt="" onerror="this.src='${portrait(f)}'"></div><h3${NT}>${esc(pick(f.name))}</h3>
          <span class="ft-hpbar" style="--h:${hp ? (fs.hp / hp * 100).toFixed(1) : 100}%">${ticks}</span><span class="ft-hpn">${esc(hp == null ? t('ftHpN', { n: '?' }) : t('ftHpLeft', { n: num(fs.hp), m: num(hp) }))}</span>
          ${f.bt ? `<button type="button" class="check" role="switch" aria-checked="${!!black}" data-act="ftBlack"><span class="check-box" aria-hidden="true">${App.tick}</span><span>${esc(t('ftBlack', { n: num(f.bt) }))}</span></button>` : ''}</div>
      </div>`;
  }

  App.screens.fight = (sec) => {
    const mode = prefs.ftMode === 'gauntlets' ? 'gauntlets' : 'foe';
    const modes = `<div class="seg pg-seg" role="group" aria-label="${esc(t('ftModes'))}">
        <button type="button" data-act="ftMode" data-value="foe" aria-pressed="${mode === 'foe'}">${esc(t('ftModeFoe'))}</button>
        <button type="button" data-act="ftMode" data-value="gauntlets" aria-pressed="${mode === 'gauntlets'}">${esc(t('ftModeGauntlets'))}</button></div>`;
    const how = (body) => `<details class="ft-how"><summary class="ct-h">${esc(t('ftHow'))}</summary><div class="ft-how-body">${body}</div></details>`;
    if (mode === 'gauntlets') {
      const g = G.find((x) => x.id === prefs.gauntlet) || G[0];
      const st = App.currentBuild();
      const game = App.game(), done = new Set(game ? game.gauntlets : []);
      /* The whole arena at once, silk and loads carrying over: its health as your Needle's level
         sees it (each enemy's health over its modifier at that level), against the plan. The Tools
         hit at the Kit's level, where the modifiers can differ: an estimate, and it says so. */
      const lvl = E.normalize(st).needle;
      const hpAll = Math.ceil(g.waves.reduce((a, w) => a + w.reduce((b, [id, n]) => {
        const f = FOE.get(id) || {};
        return b + (f.hp ? (f.hp / (f.mods ? f.mods[lvl] : 1)) * n : 0);
      }, 0), 0));
      const whole = E.compute(st, { foe: { id: g.id, hp: hpAll, mods: [1, 1, 1, 1, 1] } });
      const face = `<img src="${portrait(FOE.get(g.waves[g.waves.length - 1][0][0]))}" alt=""><span class="ft-choose-name"${NT}>${esc(gauntletName(g))}</span>
          <i class="ft-boss">${done.has(g.id) ? App.tick + ' ' : ''}${esc(t('ftWaves', { n: num(g.waves.length) }))}</i>`;
      sec.innerHTML = `<div class="ft">${brackets}${screenHead(esc(t('navFight')), modes)}
        ${choose(t('ftModeGauntlets'), face, gauntletPicker(g, done))}
        ${gauntletCard(g, game)}${planHtml(whole)}
        <div class="ct-figs ft-waves">${gauntletWaves(g, st)}</div>
        ${how(`<p class="pg-note">${esc(t('ftGauntletNote'))}</p>${game ? `<p class="pg-note">${esc(t('ftClearedCount', { n: num(done.size), of: num(G.length) }))}</p>` : ''}`)}</div>`;
      return;
    }
    const f = FOE.get(prefs.foe) || FOE.get('lace');
    const black = !!prefs.ftBlack && !!f.bt;
    const r = E.compute(App.currentBuild(), { foe: f, black });
    const hp = black ? f.bt : f.hp;
    const th = theirs(f, r);
    const moves = yours(r), marks = phaseMarks(f, r, hp);
    const kit = kitOf(f, r, hp, moves, th, marks);
    // A new enemy, black thread or build starts the fight over.
    const key = [f.id, black, SS.codec.encode(r.state)].join('|');
    if (!fight || fight.key !== key) fight = { key, kit, s: SIM.start(kit) };
    fight.kit = kit;
    const fs = fight.s;
    sec.innerHTML = `<div class="ft">${brackets}${screenHead(esc(t('navFight')), modes)}
      ${choose(t('ftSearch'), foeFace(f), picker(f))}
      ${duel(f, r, hp, th, kit, fs, marks)}${planHtml(r)}${logHtml(fs, moves, th, f)}
      <div class="ft-two">${yoursHtml(moves, kit, fs)}${theirsHtml(th, kit, fs)}</div>
      ${how(`${about(f, r, hp)}<p class="pg-note">${esc(t('ftYoursNote'))}</p><p class="pg-note">${esc(t('ftPlanNote', { s: num(r.silk.spool) }))}</p>
        ${th.notes.map((n) => `<p class="pg-note">${esc(n)}</p>`).join('')}`)}</div>`;
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
    // The fight played out: a move, one back, from the start.
    ftAct(node) { if (fight) { fight.s = SIM.act(fight.kit, fight.s, node.dataset.value); render(); } },
    ftUndo() { if (fight) { fight.s = SIM.undo(fight.s); render(); } },
    ftReset() { if (fight) { fight.s = SIM.start(fight.kit); render(); } },
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
