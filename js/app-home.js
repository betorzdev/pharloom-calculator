/* js/app-home.js — Your game, the start screen. In free mode, the ghost bench: the card a save
   shows, unlit, waiting for a game (the file dropped here goes, through js/app-saves.js, into the first empty save). In a save, the game's
   area title card where Hornet rests, with the 100% (set against the figure the game itself
   shows), the Journal, the masks and the rosaries; under it what changed since the previous
   save, what's missing closest to the bench and the 100% split into the wiki's ten categories
   (js/completion.js); then the ways on to the other screens. Beside the card, the map of the area
   she rests in (js/app-map.js, App.mapAreaHtml; the sibling's area map). Shares SS.app with js/app.js (see
   there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const CP = SS.completion;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, pctSpace } = App;

  const num = (n) => App.NF[0].format(n);
  const pct = (n) => num(n) + pctSpace();
  const D = SS.data, CO = SS.collectibles, F = SS.savefile, CH = SS.changes;

  /* ── What the game gained since the save before (pharloom.prev, kept by js/saves.js when the
     followed file brings a new save) ── */
  function gained() {
    const now = App.game();
    let prev = null;
    try { prev = JSON.parse(App.load('pharloom.prev') || 'null'); } catch (e) { prev = null; }
    if (!now || !prev || !prev.snap) return { list: [], saved: null };
    const before = F.gameOf(prev.snap);
    // A slot kept before the site read the gauntlets has none: they aren't new, just unread then.
    if (!/"gauntlets"/.test(prev.snap['pharloom.progress'] || '')) before.gauntlets = now.gauntlets;
    return { list: CH.diff(before, now), saved: prev.saved || null };
  }
  const nameIn = (list, id) => { const x = list.find((y) => y.id === id); return x ? pick(x.name) : id; };
  const itemName = (id) => nameIn(D.ITEMS, id);
  const KIND_ITEM = { 'mask-shard': 'mask-shard', 'spool-fragment': 'spool-fragment', 'memory-locket': 'memory-locket',
    craftmetal: 'craftmetal', 'pale-oil': 'pale-oil' };
  // Each change as { name, where }: named with the game's own words where it has them.
  function describe(c) {
    switch (c.kind) {
      case 'act': return { name: t('saveAct', { n: c.to }) };
      case 'tool': return { name: nameIn(D.TOOLS, c.id), nt: true };
      case 'crest': return { name: nameIn(D.CRESTS, c.id), nt: true };
      case 'skill': return { name: nameIn(D.SKILLS, c.id), nt: true };
      case 'art': return { name: nameIn(D.ARTS, c.id), nt: true };
      case 'everbloom': return { name: itemName('everbloom'), nt: true };
      case 'upgrade':
        if (c.id === 'needle') return { name: pick(D.NEEDLES[c.to].name), nt: true };
        return { name: t({ masks: 'chMasks', spools: 'chSpools', hearts: 'chHearts', kit: 'chKit', pouch: 'chPouch' }[c.id], { n: num(c.id === 'masks' ? 5 + c.to : c.to) }) };
      case 'wish': return { name: pick(CO.WISHES[c.i][4]), where: t('chWish'), nt: true };
      case 'gauntlet': return { name: App.gauntletName(c.id), where: t('chGauntlet'), nt: true };
      case 'piece': {
        const p = CO.PIECES[c.i];
        const name = p[4] ? pick(p[4]) : p[0] === 'flea' ? t('kind_flea') : itemName(KIND_ITEM[p[0]]);
        return { name, where: p[3] && CO.AREAS[p[3]] ? pick(CO.AREAS[p[3]]) : '', nt: true };
      }
      default: return null;
    }
  }
  // The Journal's entries in one line, and the rest one by one; the completion last.
  function lines(list) {
    const out = list.filter((c) => c.kind !== 'journal' && c.kind !== 'pct').map(describe).filter(Boolean);
    const j = list.filter((c) => c.kind === 'journal').length;
    if (j) out.push({ name: j === 1 ? t('chJournalOne') : t('chJournal', { n: num(j) }) });
    return out;
  }
  function ago(ms) {
    if (!ms) return '';
    const m = Math.round((ms - Date.now()) / 60000);
    try {
      const rtf = new Intl.RelativeTimeFormat(App.prefs.lang, { numeric: 'auto' });
      return Math.abs(m) < 60 ? rtf.format(m, 'minute') : Math.abs(m) < 60 * 24 ? rtf.format(Math.round(m / 60), 'hour') : rtf.format(Math.round(m / 1440), 'day');
    } catch (e) { return ''; }
  }
  /* Since the previous save, as rows (design/03-redesign.md, step 3, the lists round, A): each
     thing with its picture (a Tool on its slot's diamond, the map's own mark for what the map
     shows, the game's picture for the rest), its name and where under it, grouped by kind in
     js/changes.js's order; the Journal's entries as their portraits. The completion's gain opens
     it, as a bar. Past CAP rows the rest wait behind «Show all n». */
  const CAP = 8;
  let sinceAll = false;
  const img = (src, alt = '') => `<img src="${src}" alt="${esc(alt)}" loading="lazy">`;
  const icon = (p) => `assets/icons/${p}.webp`;
  const art = (inner, cls = '', style = '') => `<span class="hm-art${cls}"${style ? ` style="${style}"` : ''} aria-hidden="true">${inner}</span>`;
  const areaOf = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  const UPGRADE_ART = { masks: 'items/mask-shard', spools: 'items/spool-fragment', hearts: 'pieces/silk-heart', kit: 'items/crafting-kit', pouch: 'items/tool-pouch' };
  const OWN_KIND = { crest: ['crests', 'cat_crests'], skill: ['skills', 'cat_skills'], art: ['arts', 'cat_arts'] };
  function groups(list) {
    const M = App.mapMark || {};
    const out = [];
    const add = (id, head, row) => { let g = out.find((x) => x.id === id); if (!g) out.push(g = { id, head, rows: [] }); g.rows.push(row); };
    for (const c of list) {
      if (c.kind === 'journal') { add('journal', t('navJournal'), c.id); continue; }
      const d = describe(c);
      if (!d) continue;
      if (c.kind === 'act') add('act', '', { ...d, art: art('', ' is-glyph') });
      else if (OWN_KIND[c.kind]) add(c.kind, t(OWN_KIND[c.kind][1]), { ...d, art: art(img(icon(OWN_KIND[c.kind][0] + '/' + c.id))) });
      else if (c.kind === 'tool') {
        const tool = D.TOOLS.find((x) => x.id === c.id);
        add('tools', t('cat_tools'), { ...d, art: art(img(icon('tools/' + c.id)), ' is-slot', tool ? `--c:var(--slot-${tool.color})` : '') });
      } else if (c.kind === 'upgrade') add('upgrades', t('homeKindUpgrades'), { ...d, art: art(img(c.id === 'needle' ? App.ART.needle(c.to) : icon(UPGRADE_ART[c.id]))) });
      else if (c.kind === 'everbloom') add('upgrades', t('homeKindUpgrades'), { ...d, art: art(img(icon('items/everbloom'))) });
      else if (c.kind === 'piece') add('pieces', t('homeKindPieces'), { ...d, sub: d.where, art: art(M.piece ? M.piece(c.i) : '', ' is-mark') });
      else if (c.kind === 'wish') add('wishes', t('pgTasks'), { ...d, sub: areaOf(CO.WISHES[c.i][3]), art: art(M.wish ? M.wish() : '', ' is-mark') });
      else if (c.kind === 'gauntlet') {
        const x = SS.gauntlets.GAUNTLETS.find((y) => y.id === c.id);
        add('gauntlets', t('ftModeGauntlets'), { ...d, sub: x ? areaOf(x.area) : '', art: art(M.gauntlet ? M.gauntlet(c.id) : '', ' is-mark') });
      }
    }
    return out;
  }
  // A row, its place in the fade (--i) and what goes at its end (the Map's pin).
  const rowHtml = (r, i, end = '') => `<li class="hm-row" style="--i:${i}">${r.art}<span class="hm-row-txt"><span class="hm-row-name"${r.nt ? NT : ''}>${esc(r.name)}</span>${r.sub ? `<span class="hm-row-sub"${NT}>${esc(r.sub)}</span>` : ''}</span>${end}</li>`;
  const BOOK = new Map(SS.journal.BOOK.map((e) => [e.id, e]));
  function sinceHtml() {
    const { list, saved } = gained();
    if (!list.length) return '';
    const up = list.find((c) => c.kind === 'pct');
    const gs = groups(list);
    const total = gs.reduce((n, g) => n + (g.id === 'journal' ? 1 : g.rows.length), 0);
    const long = total > CAP + 2, capped = long && !sinceAll;
    let left = capped ? CAP : Infinity, i = 0, body = '';
    for (const g of gs) {
      if (left <= 0) break;
      const head = g.head ? `<p class="hm-kind" style="--i:${i++}"><span>${esc(g.head)}</span><span class="hm-kind-n">${num(g.rows.length)}</span></p>` : '';
      if (g.id === 'journal') {
        const faces = g.rows.map((id) => { const e = BOOK.get(id); const name = e ? pick(e.name) : id; return `<img src="${icon('journal/' + id)}" alt="${esc(name)}" title="${esc(name)}" loading="lazy">`; }).join('');
        body += `${head}<p class="hm-faces" style="--i:${i++}"${NT}>${faces}</p>`;
        left--;
        continue;
      }
      const rows = g.rows.slice(0, left);
      left -= rows.length;
      body += `${head}<ul class="hm-rows">${rows.map((r) => rowHtml(r, i++)).join('')}</ul>`;
    }
    const more = long ? `<button type="button" class="text-btn" data-act="homeSinceAll" aria-expanded="${!capped}">${esc(capped ? t('homeSinceAll', { n: num(total) }) : t('homeSinceFewer'))}</button>` : '';
    const at = saved ? `<span class="hm-gain-at">${esc(t('homeSinceAt', { ago: ago(saved) }))}</span>` : '';
    const gain = up ? `<div class="hm-gain"><span class="hm-gain-k">${esc(t('completion'))}</span><span class="hm-gain-v">${num(up.from)} → ${esc(pct(up.to))}</span>
        <span class="hm-bar" aria-hidden="true"><i style="width:${up.from}%"></i><i style="left:${up.from}%;width:${up.to - up.from}%"></i></span>${at}</div>`
      : at ? `<div class="hm-gain">${at}</div>` : '';
    return `<section class="hm-col hm-since" aria-labelledby="hm-since-h">
        <h3 class="ct-h" id="hm-since-h">${esc(t('homeSince'))}</h3>
        ${gain}${body}${more}
      </section>`;
  }
  /* The notice when the followed file brings a new save (js/app-saves.js): three things by name at most. */
  App.gainedLine = () => {
    const list = gained().list;
    if (!list.length) return '';
    const named = lines(list).map((x) => x.name);
    let text = named.slice(0, 3).join(', ');
    if (named.length > 3) text += ' ' + t('chMore', { n: num(named.length - 3) });
    const up = list.find((c) => c.kind === 'pct');
    if (up) text += ' · +' + num(up.to - up.from) + pctSpace();
    return t('chToast', { list: text });
  };

  /* Hornet on the bench she rests at: the room's bench (js/benches.js, from the game's files: the
     wiki's picture of it and the row of its seat), Bone Bottom's, the first one, for a room it
     doesn't know and in Free mode. Her hem (row 154 of ART.resting's 186) sits on the seat; the
     box holds both, the places in percents of it so it scales as one (css: .hm-rest). */
  const HORNET = [207, 186, 154];
  function rest(scene) {
    const B = SS.benches;
    const id = (scene && B.scenes[scene.toLowerCase()]) || 'bone-bottom';
    const [w, h, seat] = B.art[id];
    const [hw, hh, hem] = HORNET;
    const top = Math.max(0, hem - seat), W = Math.max(w, hw), H = Math.max(top + h, top + seat - hem + hh);
    const at = (x, y, width) => `left:${+(x / W * 100).toFixed(2)}%;top:${+(y / H * 100).toFixed(2)}%;width:${+(width / W * 100).toFixed(2)}%`;
    return `<span class="hm-rest" style="--w:${W};aspect-ratio:${W} / ${H}" aria-hidden="true">
          <img src="assets/benches/${id}.png" alt="" style="${at((W - w) / 2, top, w)}">
          <img src="${ART.resting}" alt="" style="${at((W - hw) / 2, top + seat - hem, hw)}"></span>`;
  }

  /* Free mode: the bench card a save shows, unlit (design/03-redesign.md, step 3, "the ghost
     bench"): «Resting at» over the kingdom, Hornet in silhouette, the four figures waiting, and
     the one thing to do. The card takes the file dropped on the screen (js/app-saves.js). */
  function invite() {
    const unknown = '?';   // what no save has told yet
    const fig = (k, v, nt = false) => `<span class="hm-fig"><span class="hm-fig-k"${nt ? NT : ''}>${esc(k)}</span><b>${v}</b></span>`;
    return `<div class="hm-card is-ghost hm-invite">
        <p class="hm-sup">${esc(t('homeRest'))}</p><p class="hm-area"${NT}>${esc(t('homeKingdom'))}</p>
        ${rest('')}
        <div class="hm-figs">
          ${fig(t('homeCompletion'), unknown)}
          ${fig(t('homeJournal'), `${unknown}<span class="u">/${num(App.bookTotal(false))}</span>`, true)}
          ${fig(t('cat_masks'), unknown)}
          ${fig(t('rosaries'), unknown, true)}
        </div>
        <p class="hm-ghost">${esc(t('homeGhost'))}</p>
        <div class="hm-invite-acts">
          <button type="button" class="btn btn-primary" data-act="homeImport">${esc(t('homeInviteBtn'))}</button>
        </div>
      </div>`;
  }

  /* A save: the game's area title card, where Hornet rests (design/03-redesign.md, step 3, the
     sibling's "bench"): «Resting at» over the area of her bench, lit by that area's own light
     from the game's map (css/tokens.css, --area-*), Hornet at the bench and four figures. Under
     it what changed since the previous save, what's missing closest to the bench (js/app-map.js's
     list, App.nearList) and the 100% by part, each a way into Progress; then the ways on. */
  const areaId = (a) => a.toLowerCase().replace(/_/g, '-');
  const NEAR = 5;
  // Each part of the 100% by one of its pictures.
  const PART_ART = { tools: 'tools/straight-pin', spools: 'items/spool-fragment', upgrades: 'items/crafting-kit', arts: 'arts/clawline', skills: 'skills/silkspear',
    crests: 'crests/hunter', masks: 'items/mask-shard', needle: 'items/needle', hearts: 'pieces/silk-heart', items: 'items/everbloom' };
  function game(g, m) {
    const c = CP.count(g);
    const h = Math.floor(m.time / 3600), min = Math.floor((m.time % 3600) / 60);
    const home = (g.bench && SS.rooms.areaOf(g.bench)) || g.area;
    const areaName = home && CO.AREAS[home] ? pick(CO.AREAS[home]) : '';
    const inside = g.area && g.area !== home && CO.AREAS[g.area] ? pick(CO.AREAS[g.area]) : '';
    const light = home ? `--area-line:var(--area-${areaId(home)}-line, var(--spotlight));--area-fill:var(--area-${areaId(home)}-fill, var(--scene-glow))` : '';
    const steel = m.steel ? ` · <span${NT}>${esc(t(m.dead ? 'saveDefeated' : 'steelSoul'))}</span>` : '';
    const sub = [inside ? `<span${NT}>${esc(inside)}</span>` : '', esc(t('saveAct', { n: g.act })) + steel, esc(t('impTime', { h: num(h), m: num(min) }))].filter(Boolean).join(' · ');
    // The game's own figure, when the save carries one: it has to be the same (npm run check-pack).
    const theirs = Math.round(m.completion);
    const check = m.completion || c.total ? `<p class="hm-check${theirs === c.total ? '' : ' is-off'}">${esc(t(theirs === c.total ? 'homeMatches' : 'homeDiffers', { pct: pct(theirs) }))}</p>` : '';
    const book = App.bookDone(g.journal, m.steel), bookMax = App.bookTotal(m.steel);
    const fig = (k, v, u = '', nt = false) => `<span class="hm-fig"><span class="hm-fig-k"${nt ? NT : ''}>${esc(k)}</span><b>${v}${u ? `<span class="u">${u}</span>` : ''}</b></span>`;
    const card = `<div class="hm-card"${light ? ` style="${light}"` : ''}>
        ${areaName ? `<p class="hm-sup">${esc(t('homeRest'))}</p><p class="hm-area"${NT}>${esc(areaName)}</p>` : ''}
        <p class="hm-sub">${sub}</p>
        ${rest(g.bench)}
        <div class="hm-figs">
          ${fig(t('homeCompletion'), num(c.total), esc(pctSpace().trim() || '%'))}
          ${fig(t('homeJournal'), num(book), '/' + num(bookMax), true)}
          ${fig(t('cat_masks'), num(5 + g.masks))}
          ${fig(t('rosaries'), num(m.rosaries), '', true)}
        </div>
        ${check}
      </div>`;
    // The road to the next Act (js/acts.js), in one line that opens it in Progress.
    // The step you're on, by its name, and how far into it, as Progress's card counts it:
    // "step 1 of 5: Unlock "Silk and Soul" · 28 of 31" (design/41, 5 A).
    const now = App.roadNow ? App.roadNow(g) : null;
    const pts = (n) => (Number.isInteger(n) ? num(n) : App.NF[1].format(n));
    const roadText = now ? t(now.of > 1 ? 'homeRoadPart' : 'homeRoad', { n: num(now.act), k: num(now.k), total: num(now.total), step: now.step, done: pts(now.got), of: num(now.of) }) : '';
    const link = (v, text) => `<a class="text-btn" href="${App.here(App.hashFor(v))}" data-act="view" data-value="${v}">${esc(text)}</a>`;
    const road = roadText ? `<p class="hm-road">${link('progress', roadText)}</p>` : '';
    const near = App.nearList ? App.nearList(g).slice(0, NEAR) : [];
    const onMap = (x) => `<button type="button" class="pg-onmap" data-act="mapShow" data-value="${esc(x.key)}" aria-label="${esc(t('mapOnMap') + ': ' + x.name)}" title="${esc(t('mapOnMap'))}">${App.pin}</button>`;
    const nearCol = near.length ? `<section class="hm-col" aria-labelledby="hm-near-h"><h3 class="ct-h" id="hm-near-h">${esc(t('mapNear'))}</h3>
        <ol class="hm-rows">${near.map((x, i) => rowHtml({ name: x.name, nt: true, sub: areaOf(x.area), art: art(x.mark, ' is-mark') }, i, onMap(x))).join('')}</ol>${link('map', t('homeNearMap'))}</section>` : '';
    // Each part with its picture, its count and a gauge; a full one with the lit diamond.
    const rows = c.categories.map((k, i) => `<li class="hm-part${k.got >= k.max ? ' is-full' : ''}${k.got ? '' : ' is-none'}" style="--i:${i}"><a href="${App.here(App.hashFor('progress'))}" data-act="view" data-value="progress">
        ${art(img(icon(PART_ART[k.id])))}<span class="hm-part-name">${esc(t('cat_' + k.id))}</span><span class="hm-part-n"><b>${num(k.got)}</b><i class="u">/${num(k.max)}</i></span>
        <span class="hm-bar" aria-hidden="true"><i style="width:${+(k.got / k.max * 100).toFixed(1)}%"></i></span></a></li>`).join('');
    const parts = `<section class="hm-col" aria-labelledby="hm-parts-h"><h3 class="ct-h" id="hm-parts-h">${esc(t('homeParts'))}</h3>
        <ol class="hm-parts">${rows}</ol>${link('progress', t('homeAllParts'))}</section>`;
    const left = bookMax - book;
    const crest = g.build && D.CRESTS.some((x) => x.id === g.build.crest) ? g.build.crest : 'hunter';
    const go = (v, img, text) => `<li><a class="hm-go" href="${App.here(App.hashFor(v))}" data-act="view" data-value="${v}">
        <img src="${img}" alt="" loading="lazy"><b>${esc(t(App.VIEW_KEY[v]))}</b><span>${esc(text)}</span></a></li>`;
    const next = `<nav class="hm-next" aria-label="${esc(t('homeGoLabel'))}"><ul>
        ${go('progress', 'assets/icons/items/mask-shard.webp', t('homeGoProgress'))}
        ${go('map', 'assets/icons/items/farsight.webp', t('homeGoMap'))}
        ${go('journal', 'assets/icons/items/hunters-journal.webp', left > 0 ? t(left === 1 ? 'homeGoJournal1' : 'homeGoJournal', { n: num(left) }) : t('homeGoJournal0'))}
        ${go('tools', `assets/icons/crests/${crest}.webp`, t('homeGoCrest'))}
      </ul></nav>`;
    // The map of the area she rests in beside the card (js/app-map.js, App.mapAreaHtml); under it on a phone.
    const map = App.mapAreaHtml ? App.mapAreaHtml(g) : '';
    return `<div class="hm-hero${map ? ' has-map' : ''}">${card}${map}</div>${road}<div class="hm-cols">${sinceHtml()}${nearCol}${parts}</div>${next}`;
  }

  /* The rows fade in one by one when the screen is arrived at or another save shows, not when
     it's only repainted (a language, «Show all»). */
  let lastKey = null;
  App.screens.home = (sec) => {
    const g = App.game(), m = App.gameMeta();
    const key = g ? [m.saved, m.time, m.completion].join('|') : '';
    if (key !== lastKey) sinceAll = false;
    const enter = sec.hidden || key !== lastKey;
    lastKey = key;
    sec.innerHTML = `<div class="hm${enter && g ? ' is-enter' : ''}">${brackets}${screenHead(esc(t('navHome')))}${g ? game(g, m) : invite()}</div>`;
    if (g && App.mapAreaPaint) App.mapAreaPaint();
  };
  Object.assign(App.actions, {
    homeImport() { App.importFirstEmpty(); },
    homeSinceAll() { sinceAll = !sinceAll; App.render(); },
  });
})();
