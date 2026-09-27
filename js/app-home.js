/* js/app-home.js — Your game, the start screen. In free mode, an invitation: drag the game's file
   here (js/app-saves.js reads it into the first empty save) or import it. In a save, what the
   game's profile screen says and more: the Act, the time played, the rosaries, and your 100%
   split into the wiki's ten categories (js/completion.js), each with what's still missing, set
   against the figure the game itself shows. The pieces one by one (which Mask Shard, where)
   come with Progress. Shares SS.app with js/app.js (see there). */
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
    return { list: CH.diff(F.gameOf(prev.snap), now), saved: prev.saved || null };
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
    return `<section class="hm-since" aria-labelledby="hm-since-h">
        <h3 class="hm-since-h" id="hm-since-h">${esc(t('homeSince'))}${saved ? ` <span class="hm-since-at">${esc(t('homeSinceAt', { ago: ago(saved) }))}</span>` : ''}
          ${up ? `<b class="hm-since-pct">+${num(up.to - up.from)}${pctSpace()}</b>` : ''}</h3>
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

  function invite() {
    return `<div class="hm-invite">
        <img class="hm-figure" src="${ART.resting}" alt="" width="207" height="186">
        <p class="hm-invite-title">${esc(t('homeInvite'))}</p>
        <p class="hm-invite-lead">${esc(t('homeInviteLead'))}</p>
        <div class="hm-invite-acts">
          <button type="button" class="btn btn-primary" data-act="homeImport">${esc(t('homeInviteBtn'))}</button>
          <a class="text-btn" href="${App.here(App.hashFor('saves'))}" data-act="view" data-value="saves">${esc(t('savesTitle'))}</a>
        </div>
      </div>`;
  }

  function game(g, m) {
    const c = CP.count(g);
    const h = Math.floor(m.time / 3600), min = Math.floor((m.time % 3600) / 60);
    const steel = m.steel ? ` · <span${NT}>${esc(t(m.dead ? 'saveDefeated' : 'steelSoul'))}</span>` : '';
    const top = `<p class="hm-meta">
        <span class="hm-act">${esc(t('saveAct', { n: g.act }))}${steel}</span>
        <span>${esc(t('impTime', { h: num(h), m: num(min) }))}</span>
        <span><span class="save-k"${NT}>${esc(t('rosaries'))}</span> <b>${num(m.rosaries)}</b></span>
      </p>`;
    // The game's own figure, when the save carries one: it has to be the same (npm run check-pack).
    const theirs = Math.round(m.completion);
    const check = m.completion || c.total ? `<p class="hm-check${theirs === c.total ? '' : ' is-off'}">${esc(t(theirs === c.total ? 'homeMatches' : 'homeDiffers', { pct: pct(theirs) }))}</p>` : '';
    const rows = c.categories.map((k) => {
      const full = k.got >= k.max;
      return `<li class="hm-cat${full ? ' is-full' : ''}" style="--f:${(k.got / k.max).toFixed(3)}">
          <span class="hm-cat-name">${esc(t('cat_' + k.id))}</span>
          <span class="hm-cat-bar" aria-hidden="true"><i></i></span>
          <span class="hm-cat-n"><b>${num(k.got)}</b><i class="u">/${num(k.max)}</i></span>
        </li>`;
    }).join('');
    const book = App.bookDone(g.journal, m.steel), bookMax = App.bookTotal(m.steel);
    return `${top}
      ${sinceHtml()}
      <div class="hm-total">
        <p class="hm-total-k">${esc(t('homeCompletion'))}</p>
        <p class="hm-total-n"><b>${num(c.total)}</b><span class="u">${esc(pctSpace().trim() || '%')}</span></p>
        ${check}
      </div>
      <ol class="hm-cats" aria-label="${esc(t('completion'))}">${rows}</ol>
      <p class="hm-journal"><span class="save-k">${esc(t('homeJournal'))}</span> <b>${num(book)}</b><i class="u">/${num(bookMax)}</i></p>`;
  }

  App.screens.home = (sec) => {
    const g = App.game(), m = App.gameMeta();
    sec.innerHTML = `<div class="hm">${brackets}${screenHead(esc(t('navHome')))}${g ? game(g, m) : invite()}</div>`;
  };
  Object.assign(App.actions, { homeImport() { App.importFirstEmpty(); } });
})();
