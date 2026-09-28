/* js/app-map.js — the Map: Pharloom as the game's map screen draws it (assets/map/rooms.webp,
   extracted from the game's files by tools/extract-map.py), and on it what your game needs: Hornet
   at the bench you rest at, and each loose piece you're missing, in its room (js/rooms.js turns a
   scene into a point on the map). The pieces go by kind, each kind switched on or off; in Free
   mode, every piece, as a guide. Then the places, each a glyph of its own: the benches, Bellway
   and Ventrica stations where the game's own pins are (js/map.js PINS), dimmed while your game
   hasn't opened them (a station not unlocked, a toll not paid: savefile's lit), and the enemy
   gauntlets you haven't cleared, in their arena's room. In a save, Hornet's way from the previous
   save's bench when it was another, and under the map what's missing closest to your bench, in
   rooms (js/rooms.js walks js/graph.js, the game's doors, and the stations your game has opened).
   The marks are placed in percentages of the image, so they follow its zoom. Shares SS.app with
   js/app.js (see there). */
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
  const PLACES = ['bench', 'bellway', 'ventrica', 'gauntlet'];
  const placeName = (k) => t(k === 'gauntlet' ? 'ftModeGauntlets' : 'mapPlace_' + k);
  // The places' glyphs, drawn in currentColor on a 14-unit grid: a bench, a bell, a Ventrica car, two needles crossed.
  const svg = (d) => `<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const GLYPH = {
    bench: svg('<path d="M2 8h10M3.5 8v3.5M10.5 8v3.5M3 4.5h8"/>'),
    bellway: svg('<path d="M7 2.2c-2.4 0-3.4 1.9-3.4 4.3v2.3L2.4 10.4h9.2L10.4 8.8V6.5C10.4 4.1 9.4 2.2 7 2.2zM6 12h2"/>'),
    ventrica: svg('<rect x="3" y="3" width="8" height="8" rx="2.6"/><path d="M7 1v2M7 11v2"/>'),
    gauntlet: svg('<path d="M2.5 2.5l9 9M11.5 2.5l-9 9"/>'),
  };
  const pinKey = SS.savefile.pinKey;
  const NEAR = 12;
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  const stepsText = (n) => (n === 0 ? t('mapHere') : t('mapSteps', { n: num(n) }));
  // The previous save's game (js/app-home.js keeps it for "Since the previous save"), or null.
  function before() {
    let prev = null;
    try { prev = JSON.parse(App.load('pharloom.prev') || 'null'); } catch (e) { prev = null; }
    return prev && prev.snap ? SS.savefile.gameOf(prev.snap) : null;
  }
  /* Hornet's way from the previous bench to this one: a line through the rooms' middles, drawn in
     the image's own pixels (the SVG stretches with it). */
  function wayHtml(g) {
    const b = before();
    if (!b || !b.bench || !g.bench || b.bench === g.bench) return '';
    const way = R.path(b.bench, g.bench, g.lit);
    const pts = (way || []).map((s) => R.roomOf(s)).filter(Boolean);
    if (pts.length < 2) return '';
    const start = pts[0];
    return `<svg class="mp-way" viewBox="0 0 ${M.W} ${M.H}" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${pts.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')}"/></svg>
      <i class="mp-from" style="${at(start.x, start.y)}" title="${esc(t('mapFrom'))}"></i>`;
  }
  /* What's missing nearest your bench: the pieces of the kinds shown and the gauntlets, by rooms. */
  function nearHtml(g, shown, places) {
    if (!g || !g.bench) return '';
    const w = R.walk(g.bench, g.lit);
    const list = [];
    CO.PIECES.forEach((p, i) => {
      if (!KINDS.includes(p[0]) || !shown.includes(p[0]) || g.pieces.includes(i)) return;
      const n = R.steps(g.bench, R.sceneOf(p[2]), g.lit, w);
      if (n != null) list.push({ n, mark: `<i class="mp-dot is-${p[0]}" aria-hidden="true"></i>`, name: p[4] ? pick(p[4]) : kindName(p[0]), area: p[3] });
    });
    if (places.includes('gauntlet')) for (const x of SS.gauntlets.GAUNTLETS) {
      if (g.gauntlets.includes(x.id)) continue;
      const n = R.steps(g.bench, x.scene, g.lit, w);
      if (n != null) list.push({ n, mark: `<span class="mp-pin is-gauntlet" aria-hidden="true">${GLYPH.gauntlet}</span>`, name: App.gauntletName(x.id), area: x.area });
    }
    if (!list.length) return '';
    list.sort((a, b) => a.n - b.n);
    return `<section class="mp-near" aria-labelledby="mp-near-h"><h3 class="ct-h" id="mp-near-h">${esc(t('mapNear'))}</h3>
      <ol class="mp-near-list">${list.slice(0, NEAR).map((x) => `<li>${x.mark}<span class="mp-near-name"${NT}>${esc(x.name)}</span>
        <span class="mp-near-area"${NT}>${esc(areaName(x.area))}</span><b>${esc(stepsText(x.n))}</b></li>`).join('')}</ol>
      <p class="pg-note">${esc(t('mapNearNote'))}</p></section>`;
  }
  const at = (x, y) => `left:${(x / M.W * 100).toFixed(3)}%;top:${(y / M.H * 100).toFixed(3)}%`;

  App.screens.map = (sec) => {
    const g = App.game();
    const shown = prefs.mapKinds || KINDS;
    const places = prefs.mapPlaces || PLACES;
    const z = ZOOMS.includes(prefs.mapZoom) ? prefs.mapZoom : 1;
    // The pieces to mark: in a save, the ones missing; in Free mode, all of them.
    const marks = [];
    const count = Object.fromEntries(KINDS.map((k) => [k, 0]));
    CO.PIECES.forEach((p, i) => {
      if (!KINDS.includes(p[0]) || (g && g.pieces.includes(i))) return;
      const room = R.roomOf(R.sceneOf(p[2]));
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
    /* The places. A pin with a condition (a station, a toll bench) is open in a save when the save
       lit it; in Free mode, every one is shown open. */
    const lit = new Set(g ? g.lit : []);
    const placeCount = { bench: 0, bellway: 0, ventrica: 0, gauntlet: 0 }, openCount = { bellway: 0, ventrica: 0 };
    const pins = M.PINS.map((p) => {
      const [kind, x, y] = p;
      const open = !p[4] || !g || lit.has(pinKey(p));
      placeCount[kind]++;
      if (open && openCount[kind] !== undefined) openCount[kind]++;
      if (!places.includes(kind)) return '';
      const title = placeName(kind === 'bench' ? 'bench1' : kind) + (open ? '' : ' · ' + t(kind === 'bench' ? 'mapToll' : 'mapClosed'));
      return `<span class="mp-pin is-${kind}${open ? '' : ' is-off'}" style="${at(x, y)}" title="${esc(title)}">${GLYPH[kind]}</span>`;
    }).join('');
    const inRoom = new Map();
    const gauntlets = SS.gauntlets.GAUNTLETS.filter((x) => !g || !g.gauntlets.includes(x.id)).map((x) => {
      const room = R.roomOf(x.scene);
      if (!room) return '';
      placeCount.gauntlet++;
      if (!places.includes('gauntlet')) return '';
      const n = inRoom.get(room.scene) || 0;
      inRoom.set(room.scene, n + 1);
      return `<span class="mp-pin is-gauntlet" style="${at(room.x + n * 16, room.y - 16)}" title="${esc(App.gauntletName(x.id))}">${GLYPH.gauntlet}</span>`;
    }).join('');
    // Hornet on her bench's own pin when the room has one, else in the room's middle.
    const room = g && g.bench ? R.roomOf(g.bench) : null;
    const pin = room && M.PINS.find((p) => p[0] === 'bench' && (R.roomOf(p[3]) || {}).scene === room.scene);
    const bench = pin ? { x: pin[1], y: pin[2] } : room;
    const hornet = bench ? `<img class="mp-hornet" src="${ART.resting}" alt="${esc(t('mapBench'))}" title="${esc(t('mapBench'))}" style="${at(bench.x, bench.y)}">` : '';
    const chips = KINDS.map((k) => `<button type="button" class="check mp-kind is-${k}" role="switch" aria-checked="${shown.includes(k)}" data-act="mapKind" data-value="${k}">
        <span class="check-box" aria-hidden="true">${App.tick}</span><i class="mp-dot is-${k}" aria-hidden="true"></i><span${NT}>${esc(kindName(k))}</span> <b>${num(count[k])}</b></button>`).join('');
    const placeChips = PLACES.map((k) => {
      const n = openCount[k] !== undefined && g ? `${num(openCount[k])}<i class="u">/${num(placeCount[k])}</i>` : num(placeCount[k]);
      return `<button type="button" class="check mp-kind" role="switch" aria-checked="${places.includes(k)}" data-act="mapPlace" data-value="${k}">
        <span class="check-box" aria-hidden="true">${App.tick}</span><span class="mp-pin is-${k}" aria-hidden="true">${GLYPH[k]}</span><span${k === 'ventrica' ? NT : ''}>${esc(placeName(k))}</span> <b>${n}</b></button>`;
    }).join('');
    const zoom = `<div class="seg sm" role="group" aria-label="${esc(t('mapZoom'))}">${ZOOMS.map((v) =>
      `<button type="button" data-act="mapZoom" data-value="${v}" aria-pressed="${v === z}">${esc(v === 1 ? t('mapFit') : '×' + App.NF[1].format(v))}</button>`).join('')}</div>`;
    sec.innerHTML = `<div class="mp">${brackets}${screenHead(esc(t('navMap')), `<p class="saves-note">${esc(t(g ? 'mapLead' : 'mapFree'))}</p>`)}
      <div class="mp-bar"><div class="mp-kinds">${chips}</div>${zoom}</div>
      <div class="mp-bar is-places"><div class="mp-kinds">${placeChips}</div></div>
      <div class="mp-view"><div class="mp-map" style="width:${z * 100}%">
        <img class="mp-rooms" src="assets/map/rooms.webp" alt="${esc(t('mapAlt'))}" width="${M.W}" height="${M.H}">
        ${g ? wayHtml(g) : ''}${pins}${gauntlets}${dots}${hornet}
      </div></div>
      <p class="pg-note">${esc(t('mapNote'))}</p>${nearHtml(g, shown, places)}</div>`;
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
    mapPlace(node) {
      const k = node.dataset.value, cur = prefs.mapPlaces || PLACES;
      prefs.mapPlaces = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      savePrefs(); render();
    },
    mapZoom(node) { prefs.mapZoom = Number(node.dataset.value); savePrefs(); render(); },
  });
})();
