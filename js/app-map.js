/* js/app-map.js — the Map: Pharloom as the game's map screen draws it (assets/map/rooms.webp,
   extracted from the game's files by tools/extract-map.py), and on it what your game needs: Hornet
   at the bench you rest at, and each loose piece you're missing, in its room (js/rooms.js turns a
   scene into a point on the map). The pieces go by kind, each kind switched on or off; in Free
   mode, every piece, as a guide. The marks are placed in percentages of the image, so they
   follow its zoom. Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const M = SS.map, R = SS.rooms, CO = SS.collectibles, D = SS.data;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n) => App.NF[0].format(n);
  // The kinds drawn, in order: their name and the token of their colour on the map.
  const KINDS = ['mask-shard', 'spool-fragment', 'memory-locket', 'craftmetal', 'pale-oil', 'flea'];
  const kindName = (k) => (k === 'flea' ? t('kind_flea') : pick(D.ITEMS.find((x) => x.id === k).name));
  const ZOOMS = [1, 1.5, 2.5];
  // A piece's scene: its floor check's, or the first floor check among its alternatives.
  const sceneOf = (c) => (c[0] === 'bool' ? c[1] : c[0] === 'any' ? (c.slice(1).find((x) => x[0] === 'bool') || [])[1] : null);
  const at = (x, y) => `left:${(x / M.W * 100).toFixed(3)}%;top:${(y / M.H * 100).toFixed(3)}%`;

  App.screens.map = (sec) => {
    const g = App.game();
    const shown = prefs.mapKinds || KINDS;
    const z = ZOOMS.includes(prefs.mapZoom) ? prefs.mapZoom : 1;
    // The pieces to mark: in a save, the ones missing; in Free mode, all of them.
    const marks = [];
    const count = Object.fromEntries(KINDS.map((k) => [k, 0]));
    CO.PIECES.forEach((p, i) => {
      if (!KINDS.includes(p[0]) || (g && g.pieces.includes(i))) return;
      const room = R.roomOf(sceneOf(p[2]));
      if (!room) return;
      count[p[0]]++;
      if (shown.includes(p[0])) marks.push({ kind: p[0], room, act: p[1] });
    });
    // Several in one room fan out a little, so each can be seen.
    const seen = new Map();
    const dots = marks.map((m) => {
      const n = seen.get(m.room.scene) || 0;
      seen.set(m.room.scene, n + 1);
      const title = kindName(m.kind) + ' · ' + t('saveAct', { n: m.act });
      return `<i class="mp-dot is-${m.kind}" style="${at(m.room.x + n * 14, m.room.y)}" title="${esc(title)}"></i>`;
    }).join('');
    const bench = g && g.bench ? R.roomOf(g.bench) : null;
    const hornet = bench ? `<img class="mp-hornet" src="${ART.resting}" alt="${esc(t('mapBench'))}" title="${esc(t('mapBench'))}" style="${at(bench.x, bench.y)}">` : '';
    const chips = KINDS.map((k) => `<button type="button" class="check mp-kind is-${k}" role="switch" aria-checked="${shown.includes(k)}" data-act="mapKind" data-value="${k}">
        <span class="check-box" aria-hidden="true">${App.tick}</span><i class="mp-dot is-${k}" aria-hidden="true"></i><span${NT}>${esc(kindName(k))}</span> <b>${num(count[k])}</b></button>`).join('');
    const zoom = `<div class="seg sm" role="group" aria-label="${esc(t('mapZoom'))}">${ZOOMS.map((v) =>
      `<button type="button" data-act="mapZoom" data-value="${v}" aria-pressed="${v === z}">${esc(v === 1 ? t('mapFit') : '×' + App.NF[1].format(v))}</button>`).join('')}</div>`;
    sec.innerHTML = `<div class="mp">${brackets}${screenHead(esc(t('navMap')), `<p class="saves-note">${esc(t(g ? 'mapLead' : 'mapFree'))}</p>`)}
      <div class="mp-bar"><div class="mp-kinds">${chips}</div>${zoom}</div>
      <div class="mp-view"><div class="mp-map" style="width:${z * 100}%">
        <img class="mp-rooms" src="assets/map/rooms.webp" alt="${esc(t('mapAlt'))}" width="${M.W}" height="${M.H}">
        ${dots}${hornet}
      </div></div>
      <p class="pg-note">${esc(t('mapNote'))}</p></div>`;
    // The bench in view once the map is drawn, at a zoom that scrolls.
    if (bench && z > 1) requestAnimationFrame(() => {
      const v = sec.querySelector('.mp-view'), h = sec.querySelector('.mp-hornet');
      if (v && h) v.scrollTo({ left: h.offsetLeft - v.clientWidth / 2, top: h.offsetTop - v.clientHeight / 2 });
    });
  };

  Object.assign(actions, {
    mapKind(node) {
      const k = node.dataset.value, cur = prefs.mapKinds || KINDS;
      prefs.mapKinds = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      savePrefs(); render();
    },
    mapZoom(node) { prefs.mapZoom = Number(node.dataset.value); savePrefs(); render(); },
  });
})();
