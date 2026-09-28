/* js/app-home.js — Your game, the start screen. In free mode, the ghost bench: the card a save
   shows, unlit, waiting for a game (the file dropped here goes, through js/app-saves.js, into the first empty save). In a save, the game's
   area title card where Hornet rests, with the 100% (set against the figure the game itself
   shows), the Journal, the masks and the rosaries; under it what changed since the previous
   save, what's missing closest to the bench and the 100% split into the wiki's ten categories
   (js/completion.js); then the ways on to the other screens. Shares SS.app with js/app.js (see
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
  function sinceHtml() {
    const { list, saved } = gained();
    if (!list.length) return '';
    const up = list.find((c) => c.kind === 'pct');
    const items = lines(list).map((x) => `<li class="hm-gain"><span class="hm-gain-name"${x.nt ? NT : ''}>${esc(x.name)}</span>${x.where ? `<span class="hm-gain-where"${NT}>${esc(x.where)}</span>` : ''}</li>`).join('');
    return `<section class="hm-col hm-since" aria-labelledby="hm-since-h">
        <h3 class="ct-h" id="hm-since-h">${esc(t('homeSince'))}</h3>
        ${saved || up ? `<p class="hm-since-at">${saved ? esc(t('homeSinceAt', { ago: ago(saved) })) : ''}${up ? ` <b class="hm-since-pct">+${num(up.to - up.from)}${pctSpace()}</b>` : ''}</p>` : ''}
        <ul class="hm-gains">${items}</ul>
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

  /* Free mode: the bench card a save shows, unlit (design/03-redesign.md, step 3, "the ghost
     bench"): «Resting at» over the kingdom, Hornet in silhouette, the four figures waiting, and
     the one thing to do. The card takes the file dropped on the screen (js/app-saves.js). */
  function invite() {
    const dash = '—';
    const fig = (k, v, nt = false) => `<span class="hm-fig"><span class="hm-fig-k"${nt ? NT : ''}>${esc(k)}</span><b>${v}</b></span>`;
    return `<div class="hm-card is-ghost hm-invite">
        <p class="hm-sup">${esc(t('homeRest'))}</p><p class="hm-area"${NT}>${esc(t('homeKingdom'))}</p>
        <img class="hm-figure" src="${ART.resting}" alt="" width="207" height="186">
        <div class="hm-figs">
          ${fig(t('homeCompletion'), dash)}
          ${fig(t('homeJournal'), `${dash}<span class="u">/${num(App.bookTotal(false))}</span>`, true)}
          ${fig(t('cat_masks'), dash)}
          ${fig(t('rosaries'), dash, true)}
        </div>
        <p class="hm-ghost">${esc(t('homeGhost'))}</p>
        <div class="hm-invite-acts">
          <button type="button" class="btn btn-primary" data-act="homeImport">${esc(t('homeInviteBtn'))}</button>
          <a class="text-btn" href="${App.here(App.hashFor('saves'))}" data-act="view" data-value="saves">${esc(t('savesTitle'))}</a>
        </div>
      </div>`;
  }

  /* A save: the game's area title card, where Hornet rests (design/03-redesign.md, step 3, the
     sibling's "bench"): «Resting at» over the area of her bench, lit by that area's own light
     from the game's map (css/tokens.css, --area-*), Hornet at the bench and four figures. Under
     it what changed since the previous save, what's missing closest to the bench (the Map's own
     list, App.nearList) and the 100% by part, each a way into Progress; then the ways on. */
  const areaId = (a) => a.toLowerCase().replace(/_/g, '-');
  const NEAR = 5;
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
        <img class="hm-figure" src="${ART.resting}" alt="" width="207" height="186">
        <div class="hm-figs">
          ${fig(t('homeCompletion'), num(c.total), esc(pctSpace().trim() || '%'))}
          ${fig(t('homeJournal'), num(book), '/' + num(bookMax), true)}
          ${fig(t('cat_masks'), num(5 + g.masks))}
          ${fig(t('rosaries'), num(m.rosaries), '', true)}
        </div>
        ${check}
      </div>`;
    // The road to the next Act (js/acts.js), in one line that opens it in Progress.
    // The step you're on and how far into it: "step 1 of 5, 14 of 15".
    const r = SS.acts.next(g);
    const at = r ? r.steps.findIndex((x) => !x.ok && !x.bypassed) : -1;
    const cur = at >= 0 ? r.steps[at] : null;
    const roadText = r && cur ? t(cur.total > 1 ? 'homeRoadPart' : 'homeRoad', { n: num(r.act), k: num(at + 1), total: num(r.total), done: num(cur.done), of: num(cur.total) }) : '';
    const link = (v, text) => `<a class="text-btn" href="${App.here(App.hashFor(v))}" data-act="view" data-value="${v}">${esc(text)}</a>`;
    const road = roadText ? `<p class="hm-road">${link('progress', roadText)}</p>` : '';
    const near = App.nearList ? App.nearList(g).slice(0, NEAR) : [];
    const nearCol = near.length ? `<section class="hm-col" aria-labelledby="hm-near-h"><h3 class="ct-h" id="hm-near-h">${esc(t('mapNear'))}</h3>
        <ol class="mp-near-list">${near.map(App.nearRow).join('')}</ol>${link('map', t('homeNearMap'))}</section>` : '';
    const rows = c.categories.map((k) => `<li class="hm-part${k.got >= k.max ? ' is-full' : ''}"><a href="${App.here(App.hashFor('progress'))}" data-act="view" data-value="progress">
        <span class="hm-part-name">${esc(t('cat_' + k.id))}</span><span class="hm-part-n"><b>${num(k.got)}</b><i class="u">/${num(k.max)}</i></span></a></li>`).join('');
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
    return `${card}${road}<div class="hm-cols">${sinceHtml()}${nearCol}${parts}</div>${next}`;
  }

  App.screens.home = (sec) => {
    const g = App.game(), m = App.gameMeta();
    sec.innerHTML = `<div class="hm">${brackets}${screenHead(esc(t('navHome')))}${g ? game(g, m) : invite()}</div>`;
  };
  Object.assign(App.actions, { homeImport() { App.importFirstEmpty(); } });
})();
