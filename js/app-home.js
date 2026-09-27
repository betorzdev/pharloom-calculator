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
  const { t, esc, NT, ART, brackets, screenHead, pctSpace } = App;

  const num = (n) => App.NF[0].format(n);
  const pct = (n) => num(n) + pctSpace();

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
