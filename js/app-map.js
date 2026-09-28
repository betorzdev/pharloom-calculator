/* js/app-map.js — the Map: Pharloom as the game's map screen draws it (assets/map/rooms.webp,
   extracted from the game's files by tools/extract-map.py) in your game's state: in Act 3 the
   Cradle, Cogwork Core and the Ventrica hub destroyed, and the Abyss's diving bell as your game
   has it (states.webp's layers, js/rooms.js mapFlags; Free mode: before Act 3), and on it what your game needs: Hornet
   at the bench you rest at (js/app-hornet.js walks her there from the previous one), and each loose piece you're missing, in its room (js/rooms.js turns a
   scene into a point on the map). The pieces go by kind, each kind switched on or off; in Free
   mode, every piece, as a guide. Then the places, each a glyph of its own: the benches, Bellway
   and Ventrica stations where the game's own pins are (js/map.js PINS), dimmed while your game
   hasn't opened them (a station not unlocked, a toll not paid: savefile's lit), and the enemy
   gauntlets you haven't cleared, in their arena's room. In a save, Hornet's way from the previous
   save's bench when it was another. What's missing closest to your bench, in rooms (js/rooms.js
   walks js/graph.js, the game's doors, and the stations your game has opened), is Your game's.
   The marks are placed in percentages of the image, so they follow its zoom. Shares SS.app with
   js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const M = SS.map, R = SS.rooms, CO = SS.collectibles, D = SS.data;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n) => App.NF[0].format(n);
  // The kinds drawn, in order: their name and the token of their colour on the map.
  const KINDS = ['mask-shard', 'spool-fragment', 'memory-locket', 'craftmetal', 'pale-oil', 'flea'];
  const kindName = (k) => (k === 'flea' ? t('kind_flea') : pick(D.ITEMS.find((x) => x.id === k).name));
  const PLACES = ['bench', 'bellway', 'ventrica', 'gauntlet'];
  // The benches cover the map in rings: off until you switch them on.
  const PLACES_ON = ['bellway', 'ventrica', 'gauntlet'];
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
  /* The marks (design/13-map-symbols-variants.html, C · the game's round badge): a piece is a dark
     disc with a rim in its kind's colour and the game's own picture inside; a place is the game's
     own map pin (assets/map/pins/, tools/extract-map-pins.py); a gauntlet, the badge with its
     two needles. `style` places it on the map; without one it sits in a line (legend, lists). */
  const PIECE_ART = { flea: 'assets/icons/pieces/flea.webp' };
  const pieceArt = (k) => PIECE_ART[k] || `assets/icons/items/${k}.webp`;
  const PIN_ART = { bench: 'pin_bench', bellway: 'pin_stag_station', ventrica: 'pin_tube_station' };
  // A mark with a key (data-mk) is a button: a tap opens its card (js/app-map.js, the card).
  const tap = (key, title) => (key ? ` data-mk="${key}" role="button" tabindex="0" aria-label="${esc(title)}"` : '');
  const mark = (k, style = '', title = '', key = '') => `<i class="mp-dot is-${k}${key && key === picked ? ' is-sel' : ''}"${style ? ` style="${style}"` : ''}${title ? ` title="${esc(title)}"` : ' aria-hidden="true"'}${tap(key, title)}><img src="${pieceArt(k)}" alt="" loading="lazy"></i>`;
  /* A gauntlet: its champion, the Journal's portrait of its last wave's enemy (design/14-gauntlet-
     mark-variants.html, A), on the badge's red rim; the legend, without one, the first arena's. */
  const champion = (x) => { const w = x && x.waves[x.waves.length - 1]; return w && w[0] ? w[0][0] : null; };
  const placeMark = (k, style = '', title = '', off = false, x = SS.gauntlets.GAUNTLETS[0], key = '') => k === 'gauntlet'
    ? `<span class="mp-pin is-gauntlet${off ? ' is-off' : ''}${key && key === picked ? ' is-sel' : ''}"${style ? ` style="${style}"` : ''}${title ? ` title="${esc(title)}"` : ' aria-hidden="true"'}${tap(key, title)}>${champion(x) ? `<img src="assets/icons/journal/${champion(x)}.webp" alt="" loading="lazy">` : GLYPH.gauntlet}</span>`
    : `<img class="mp-pin is-${k}${off ? ' is-off' : ''}${key && key === picked ? ' is-sel' : ''}" src="assets/map/pins/${PIN_ART[k]}.webp" alt=""${style ? ` style="${style}"` : ''}${title ? ` title="${esc(title)}"` : ' aria-hidden="true"'}${tap(key, title)}>`;
  let picked = '';   // the mark whose card is open: 'piece:<i>', 'pin:<i>' or 'gaunt:<id>'
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');
  const stepsText = (n) => (n === 0 ? t('mapHere') : t('mapSteps', { n: num(n) }));
  // The previous save's game (js/app-home.js keeps it for "Since the previous save"), or null.
  function before() {
    let prev = null;
    try { prev = JSON.parse(App.load('pharloom.prev') || 'null'); } catch (e) { prev = null; }
    return prev && prev.snap ? SS.savefile.gameOf(prev.snap) : null;
  }
  /* Where a bench is drawn: its own pin when its room has one there (pins: those the map shows
     for the game, R.pinsOn), else the room's middle; or null. */
  function benchPoint(scene, pins) {
    const room = scene ? R.roomOf(scene) : null;
    if (!room) return null;
    const pin = pins.find((p) => p[0] === 'bench' && (R.roomOf(p[3]) || {}).scene === room.scene);
    return pin ? { x: pin[1], y: pin[2] } : { x: room.x, y: room.y };
  }
  /* Hornet's way from the previous save's bench to this one, in the image's pixels: the old
     bench, the middles of the rooms between, the new bench. Its key names it (js/app-hornet.js
     walks it once). null with no save before, a bench that didn't move, or no way between. */
  /* The way's key, cheap (no path searched): the two benches and when this save was written, so
     a later return between the same two benches walks again. null with no way to walk. */
  function wayKey(g) {
    const b = before();
    if (!g || !b || !b.bench || !g.bench || b.bench === g.bench) return null;
    return b.bench + '>' + g.bench + '@' + ((App.gameMeta() || {}).saved || '');
  }
  function way(g, pins) {
    const key = wayKey(g);
    if (!key) return null;
    const b = before();
    const path = R.path(b.bench, g.bench, g.lit) || [];
    const mid = path.slice(1, -1).map((s) => R.roomOf(s)).filter(Boolean);
    pins = pins || R.pinsOn(R.mapFlags(g));   // the map's render passes the ones it shows
    const pts = [benchPoint(b.bench, pins), ...mid, benchPoint(g.bench, pins)].filter(Boolean);
    return path.length > 1 && pts.length > 1 ? { key, pts } : null;
  }
  /* Hornet's way drawn: a line through the rooms' middles, in the image's own pixels (the SVG
     stretches with it). */
  function wayHtml(g, pins) {
    const w = way(g, pins);
    if (!w) return '';
    const start = w.pts[0];
    return `<svg class="mp-way" viewBox="0 0 ${M.W} ${M.H}" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${w.pts.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')}"/></svg>
      <i class="mp-from" style="${at(start.x, start.y)}" title="${esc(t('mapFrom'))}"></i>`;
  }
  /* What's missing nearest your bench: the pieces of the kinds shown and the gauntlets, by rooms,
     nearest first. Your game shows the first few (App.nearList, App.nearRow). */
  function nearList(g, shown = KINDS, places = PLACES) {
    if (!g || !g.bench) return [];
    const w = R.walk(g.bench, g.lit);
    const list = [];
    CO.PIECES.forEach((p, i) => {
      if (!KINDS.includes(p[0]) || !shown.includes(p[0]) || g.pieces.includes(i)) return;
      const n = R.steps(g.bench, R.sceneOf(p[2]), g.lit, w);
      if (n != null) list.push({ n, mark: mark(p[0]), name: p[4] ? pick(p[4]) : kindName(p[0]), area: p[3] });
    });
    if (places.includes('gauntlet')) for (const x of SS.gauntlets.GAUNTLETS) {
      if (g.gauntlets.includes(x.id)) continue;
      const n = R.steps(g.bench, x.scene, g.lit, w);
      if (n != null) list.push({ n, mark: placeMark('gauntlet', '', '', false, x), name: App.gauntletName(x.id), area: x.area });
    }
    return list.sort((a, b) => a.n - b.n);
  }
  const nearRow = (x) => `<li>${x.mark}<span class="mp-near-name"${NT}>${esc(x.name)}</span>
        <span class="mp-near-area"${NT}>${esc(areaName(x.area))}</span><b>${esc(stepsText(x.n))}</b></li>`;
  App.nearList = nearList;
  App.nearRow = nearRow;
  const at = (x, y) => `left:${(x / M.W * 100).toFixed(3)}%;top:${(y / M.H * 100).toFixed(3)}%`;
  /* The rooms that change with the game (js/map.js LAYERS), those this game has: each a window on
     the map, placed in percentages as the marks are, onto its row of assets/map/states.webp. */
  const pct = (v, of) => (v / of * 100).toFixed(3) + '%';
  const layersHtml = (flags) => R.layersOn(flags).map(([, x, y, w, h, top]) =>
    `<span class="mp-layer" style="left:${pct(x, M.W)};top:${pct(y, M.H)};width:${pct(w, M.W)};height:${pct(h, M.H)}">`
    + `<img src="assets/map/states.webp" alt="" width="${M.SW}" height="${M.SH}" style="width:${pct(M.SW, w)};top:-${pct(top, h)}"></span>`).join('');

  /* Each area's name at the middle of its drawn rooms (js/map.js ROOMS, js/rooms.js areaOf), for
     the areas with more than three: worked out once. */
  let areaNames = null;
  function AREA_NAMES() {
    if (areaNames) return areaNames;
    const sum = {};
    for (const [scene, r] of Object.entries(M.ROOMS)) {
      const a = R.areaOf(scene);
      if (!a || !r[2] || !CO.AREAS[a]) continue;
      const s = sum[a] || (sum[a] = [0, 0, 0]);
      s[0] += r[0] + r[2] / 2; s[1] += r[1] + r[3] / 2; s[2]++;
    }
    return (areaNames = Object.entries(sum).filter(([, s]) => s[2] > 3).map(([id, s]) => ({ id, x: s[0] / s[2], y: s[1] / s[2] })));
  }
  // The search's candidates: the areas (by their names) and the enemy gauntlets, with a point each.
  function findables() {
    const out = AREA_NAMES().map((a) => ({ name: areaName(a.id), x: a.x, y: a.y }));
    for (const x of SS.gauntlets.GAUNTLETS) { const room = R.roomOf(x.scene); if (room) out.push({ name: App.gauntletName(x.id), x: room.x, y: room.y }); }
    return out;
  }
  const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let finds = [];

  App.screens.map = (sec) => {
    // Free mode with the Inventory's marks: what they say is missing (js/app-progress.js).
    const g = App.game() || (App.freeView ? App.freeView() : null);
    const shown = prefs.mapKinds || KINDS;
    const places = prefs.mapPlaces || PLACES_ON;
    const names = prefs.mapNames !== false;
    // The pieces to mark: in a save, the ones missing; in Free mode, all of them.
    const marks = [];
    const count = Object.fromEntries(KINDS.map((k) => [k, 0]));
    CO.PIECES.forEach((p, i) => {
      if (!KINDS.includes(p[0]) || (g && g.pieces.includes(i))) return;
      const room = R.roomOf(R.sceneOf(p[2]));
      if (!room) return;
      count[p[0]]++;
      if (shown.includes(p[0])) marks.push({ kind: p[0], room, act: p[1], i });
    });
    // Several in one room fan out a little, so each can be seen.
    const seen = new Map();
    const dots = marks.map((m) => {
      const n = seen.get(m.room.scene) || 0;
      seen.set(m.room.scene, n + 1);
      const title = kindName(m.kind) + ' · ' + t('saveAct', { n: m.act });
      return mark(m.kind, at(m.room.x + n * 24, m.room.y), title, 'piece:' + m.i);
    }).join('');
    /* The places. A pin with a condition (a station, a toll bench) is open in a save when the save
       lit it; in Free mode, every one is shown open. */
    const lit = new Set(App.game() ? App.game().lit : []);
    // The map as this game has it (Free mode: before Act 3): the rooms that change, and their pins.
    const flags = R.mapFlags(App.game()), shownPins = R.pinsOn(flags);
    const placeCount = { bench: 0, bellway: 0, ventrica: 0, gauntlet: 0 }, openCount = { bellway: 0, ventrica: 0 };
    const pins = shownPins.map((p, pi) => {
      const [kind, x, y] = p;
      const open = !p[4] || !App.game() || lit.has(pinKey(p));
      placeCount[kind]++;
      if (open && openCount[kind] !== undefined) openCount[kind]++;
      if (!places.includes(kind)) return '';
      const title = placeName(kind === 'bench' ? 'bench1' : kind) + (open ? '' : ' · ' + t(kind === 'bench' ? 'mapToll' : 'mapClosed'));
      return placeMark(kind, at(x, y), title, !open, undefined, 'pin:' + pi);
    }).join('');
    const inRoom = new Map();
    const gauntlets = SS.gauntlets.GAUNTLETS.filter((x) => !g || !g.gauntlets.includes(x.id)).map((x) => {
      const room = R.roomOf(x.scene);
      if (!room) return '';
      placeCount.gauntlet++;
      if (!places.includes('gauntlet')) return '';
      const n = inRoom.get(room.scene) || 0;
      inRoom.set(room.scene, n + 1);
      return placeMark('gauntlet', at(room.x + n * 24, room.y - 20), App.gauntletName(x.id), false, x, 'gaunt:' + x.id);
    }).join('');
    /* Hornet sitting at her bench (the .hn sprite, css), on its own pin when the room has one,
       else in the room's middle; js/app-hornet.js walks her here from the previous bench. */
    const bench = App.game() ? benchPoint(g.bench, shownPins) : null;
    const hornet = bench ? `<span class="mp-hornet hn is-sit" role="img" aria-label="${esc(t('mapBench'))}" title="${esc(t('mapBench'))}" style="${at(bench.x, bench.y)}"></span>` : '';
    /* The legend (design/03-redesign.md step 6): under the map, each layer's own mark its switch,
       dimmed off, with its count. */
    const sw = (act, k, on, mark, name, n, nt) => `<li><button type="button" class="mp-sw" data-act="${act}" data-value="${k}" aria-pressed="${on}">
        ${mark}<span${nt ? NT : ''}>${esc(name)}</span>${n != null ? ` <b>${n}</b>` : ''}</button></li>`;
    const kindsSw = KINDS.map((k) => sw('mapKind', k, shown.includes(k), mark(k), kindName(k), num(count[k]), true)).join('');
    const placesSw = PLACES.map((k) => {
      const n = openCount[k] !== undefined && g ? `${num(openCount[k])}<i class="u">/${num(placeCount[k])}</i>` : num(placeCount[k]);
      return sw('mapPlace', k, places.includes(k), placeMark(k), placeName(k), n, k === 'ventrica');
    }).join('') + sw('mapNames', 'names', names, '<span class="mp-aa" aria-hidden="true">Aa</span>', t('mapNames'), null);
    // Under the map, as the sibling's (Albert: floating on it, it was in the way): two rows.
    const legend = `<div class="mp-legend">
        <p class="lbl mp-legend-k">${esc(t('mapMissing'))}</p><ul class="mp-sws">${kindsSw}</ul>
        <p class="lbl mp-legend-k">${esc(t('mapPlaces'))}</p><ul class="mp-sws">${placesSw}</ul></div>`;
    // The zoom as the sibling's: in, out, and the large map (the window's whole width and height).
    const big = !!prefs.mapBig;
    const tools = `<div class="mp-tools" role="group" aria-label="${esc(t('mapZoom'))}">
        <button type="button" data-act="mapZoom" data-value="in" aria-label="${esc(t('mapCloser'))}" title="${esc(t('mapCloser'))}">+</button>
        <button type="button" data-act="mapZoom" data-value="out" aria-label="${esc(t('mapFurther'))}" title="${esc(t('mapFurther'))}">−</button>
        <button type="button" class="mp-big" data-act="mapBig" aria-pressed="${big}" aria-label="${esc(t(big ? 'mapSmall' : 'mapFull'))}" title="${esc(t(big ? 'mapSmall' : 'mapFull'))}">${big ? '⤡' : '⤢'}</button></div>`;
    const search = `<div class="mp-find"><label class="search">${App.lens}<input type="search" data-change="mapFind" placeholder="${esc(t('mapFind'))}" aria-label="${esc(t('mapFind'))}" autocomplete="off"></label>
        <ul class="mp-found" hidden></ul></div>`;
    const namesHtml = names ? AREA_NAMES().map((a) => `<span class="mp-name" style="${at(a.x, a.y)}"${NT}>${esc(areaName(a.id))}</span>`).join('') : '';
    sec.innerHTML = `<div class="mp${big ? ' is-big' : ''}">${brackets}${screenHead(esc(t('navMap')))}
      <div class="mp-stage">
        <div class="mp-view"><div class="mp-map">
          <img class="mp-rooms" src="assets/map/rooms${hdOn ? '-hd' : ''}.webp" alt="${esc(t('mapAlt'))}" width="${M.W}" height="${M.H}">${layersHtml(flags).replace(/states\.webp/g, hdOn ? 'states-hd.webp' : 'states.webp')}
          ${App.game() ? wayHtml(g, shownPins) : ''}${namesHtml}${pins}${gauntlets}${dots}${hornet}<i class="mp-ping" hidden></i>
        </div></div>
        ${search}${tools}
      </div>
      ${legend}
      <p class="pg-note">${esc(t('mapNote'))}</p></div>`;
    cardCtx = { g, shownPins, lit };
    // The view as it was, once the screen shows (render shows it after painting it).
    requestAnimationFrame(applyView);
  };

  /* ── Moving around, as the sibling's map (hallownest-calculator js/app-map.js) ──
     The map is the image and its marks in one layer (.mp-map), moved and scaled by a transform:
     dragging moves it, the wheel or a pinch zooms at the pointer, + and − zoom at the middle. The
     whole map fitted to the box is the furthest; eight times that the closest. The marks and the
     names keep their size on screen (--k, the scale's inverse). The view lasts while the page is
     open; it isn't saved. */
  let view = null;   // { s, x, y }: the scale and the offset in px; null = fitted
  const nodes = () => { const sec = App.screenOf('map'); return sec ? { v: sec.querySelector('.mp-view'), m: sec.querySelector('.mp-map') } : {}; };
  const fitOf = (W, H) => { const mh = W * M.H / M.W; const s = Math.min(1, H / mh); return { s, x: (W - W * s) / 2, y: (H - mh * s) / 2 }; };
  function clamp(W, H) {
    const mw = W * view.s, mh = W * M.H / M.W * view.s;
    view.x = mw <= W ? (W - mw) / 2 : Math.min(0, Math.max(W - mw, view.x));
    view.y = mh <= H ? (H - mh) / 2 : Math.min(0, Math.max(H - mh, view.y));
  }
  function applyView() {
    const { v, m } = nodes();
    if (!v || !m || !v.clientWidth) return;
    const W = v.clientWidth, H = v.clientHeight, fit = fitOf(W, H);
    if (!view) view = { ...fit };
    view.s = Math.min(fit.s * 8, Math.max(fit.s, view.s));
    clamp(W, H);
    m.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
    m.style.setProperty('--k', String(1 / view.s));
    v.classList.toggle('is-zoomed', view.s > fit.s * 1.5);
    // Close up, the map at twice the resolution (assets/map/rooms-hd.webp, tools/extract-map.py):
    // loaded the first time it's needed, and kept.
    if (view.s * W * (window.devicePixelRatio || 1) > M.W * 1.1) hd(m);
    paintCard();
  }

  /* ── The card of the mark tapped, over the map, as the sibling's: its picture, its name, where
     it is and how it's had; in Free mode a piece can be marked had from it, and a gauntlet takes
     you to fight it in Combat. It follows its mark as the map moves; ×, Escape or a tap on the
     empty map close it. ── */
  let cardCtx = null;
  function cardHtml(key) {
    const [kind, id] = key.split(/:(.*)/s);
    const c = cardCtx || {};
    const own = App.game();
    const line = (xs) => xs.filter(Boolean).map((x) => `<span${NT}>${esc(x)}</span>`).join('');
    let art = '', name = '', where = '', note = '', btn = '';
    if (kind === 'piece') {
      const i = Number(id), p = CO.PIECES[i];
      art = mark(p[0]); name = p[4] ? pick(p[4]) : kindName(p[0]);
      const n = own && own.bench ? R.steps(own.bench, R.sceneOf(p[2]), own.lit) : null;
      where = line([areaName(p[3]), t('saveAct', { n: p[1] }), n == null ? '' : stepsText(n)]);
      note = App.howPiece ? App.howPiece(i) : '';
      const had = !!(c.g && c.g.pieces && c.g.pieces.includes(i));
      btn = own ? `<span class="mp-card-state">${esc(t(had ? 'pgGot' : 'invMissing'))}</span>`
        : `<button type="button" class="text-btn" data-act="mapMark" data-value="${i}" aria-pressed="${had}">${esc(t(had ? 'mapUnmark' : 'mapMark'))}</button>`;
    } else if (kind === 'pin') {
      const p = (c.shownPins || [])[Number(id)];
      if (!p) return '';
      const open = !p[4] || !own || (c.lit && c.lit.has(pinKey(p)));
      art = placeMark(p[0]); name = placeName(p[0] === 'bench' ? 'bench1' : p[0]);
      where = line([areaName(R.areaOf(p[3]))]);
      btn = open ? '' : `<span class="mp-card-state">${esc(t(p[0] === 'bench' ? 'mapToll' : 'mapClosed'))}</span>`;
    } else if (kind === 'gauntlet' || kind === 'gaunt') {
      const x = SS.gauntlets.GAUNTLETS.find((y) => y.id === id);
      if (!x) return '';
      art = placeMark('gauntlet', '', '', false, x); name = App.gauntletName(x.id);
      const n = x.waves.length;
      where = line([areaName(x.area), t(n === 1 ? 'ftWaves1' : 'ftWaves', { n: num(n) })]);
      note = x.reward ? t('ftReward') + ': ' + pick(x.reward) : '';
      btn = `<button type="button" class="text-btn" data-act="mapFight" data-value="${esc(x.id)}">${esc(t('mapFight'))}</button>`;
    }
    return `<div class="mp-card" role="dialog" aria-label="${esc(name)}">
        <span class="mp-card-art">${art}</span>
        <span class="mp-card-t"><b${NT}>${esc(name)}</b>${where}${note ? `<span class="mp-card-note">${esc(note)}</span>` : ''}</span>
        ${btn}
        <button type="button" class="icon-btn mp-card-x" data-act="mapPick" data-value="" aria-label="${esc(t('mapCardClose'))}" title="${esc(t('mapCardClose'))}">${App.cross}</button>
      </div>`;
  }
  function paintCard() {
    const sec = App.screenOf('map'), stage = sec && sec.querySelector('.mp-stage');
    if (!stage) return;
    let c = stage.querySelector('.mp-card-wrap');
    const el = picked && stage.querySelector(`[data-mk="${CSS.escape(picked)}"]`);
    if (!el) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement('div'); c.className = 'mp-card-wrap'; stage.appendChild(c); }
    if (c.dataset.key !== picked) { c.innerHTML = cardHtml(picked); c.dataset.key = picked; }
    const r = el.getBoundingClientRect(), br = stage.getBoundingClientRect();
    const sx = r.left + r.width / 2 - br.left, sy = r.top - br.top;
    const half = c.firstElementChild ? c.firstElementChild.offsetWidth / 2 + 8 : 0;
    c.style.left = (half * 2 > br.width ? br.width / 2 : Math.max(half, Math.min(br.width - half, sx))) + 'px';
    c.style.top = sy + 'px';
    c.classList.toggle('is-below', sy < (c.firstElementChild ? c.firstElementChild.offsetHeight : 0) + 24);
  }
  const pick1 = (key) => { picked = key; const { m } = nodes(); if (m) for (const x of m.querySelectorAll('.is-sel')) x.classList.remove('is-sel');
    const el = key && m && m.querySelector(`[data-mk="${CSS.escape(key)}"]`); if (el) el.classList.add('is-sel');
    const sec = App.screenOf('map'), c = sec && sec.querySelector('.mp-card-wrap'); if (c) c.dataset.key = ''; paintCard(); };
  let hdOn = false;
  function hd(m) {
    for (const img of m.querySelectorAll('.mp-rooms, .mp-layer img')) {
      if (/-hd\.webp$/.test(img.getAttribute('src'))) continue;
      const big = img.getAttribute('src').replace(/\.webp$/, '-hd.webp');
      const pre = new Image();
      pre.onload = () => { img.src = big; };
      pre.src = big;
    }
    hdOn = true;
  }
  function zoomAt(f, cx, cy) {
    if (!view) return;
    const { v } = nodes();
    const fit = fitOf(v.clientWidth, v.clientHeight);
    const s = Math.min(fit.s * 8, Math.max(fit.s, view.s * f));
    view.x = cx - (cx - view.x) * (s / view.s); view.y = cy - (cy - view.y) * (s / view.s); view.s = s;
    applyView();
  }
  // A map point (the image's pixels) centred at a scale of the fitted one.
  function centreOn(px, py, times) {
    const { v } = nodes();
    if (!v) return;
    const W = v.clientWidth, H = v.clientHeight, fit = fitOf(W, H);
    const s = fit.s * times, k = W / M.W * s;
    view = { s, x: W / 2 - px * k, y: H / 2 - py * k };
    applyView();
  }
  // Keeps a map point in view (js/app-hornet.js, while she walks).
  App.mapKeep = (px, py) => {
    const { v } = nodes();
    if (!v || !view) return;
    const k = v.clientWidth / M.W * view.s, sx = view.x + px * k, sy = view.y + py * k;
    if (sx < 0 || sy < 0 || sx > v.clientWidth || sy > v.clientHeight) { view.x += v.clientWidth / 2 - sx; view.y += v.clientHeight / 2 - sy; applyView(); }
  };
  const touches = new Map();
  let drag = null, pinch = null, moved = false;
  // A tap (not the end of a drag): on a mark, its card; on the empty map, the card closes.
  document.addEventListener('click', (e) => {
    const v = inView(e);
    if (!v || e.target.closest('.mp-card-wrap')) return;
    if (moved) { moved = false; return; }
    const mk = e.target.closest('[data-mk]');
    pick1(mk && mk.dataset.mk !== picked ? mk.dataset.mk : '');
  });
  document.addEventListener('keydown', (e) => {
    const mk = e.target.closest && e.target.closest('.mp-map [data-mk]');
    if (mk && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick1(mk.dataset.mk); }
    else if (e.key === 'Escape' && picked) pick1('');
  });
  const inView = (e) => { const { v } = nodes(); return v && v.contains(e.target) && !e.target.closest('.mp-find, .mp-tools, .mp-card-wrap') ? v : null; };
  document.addEventListener('pointerdown', (e) => {
    const v = inView(e);
    if (!v || !view || (e.pointerType === 'mouse' && e.button !== 0)) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 1) { drag = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y }; moved = false; v.classList.add('is-grabbing'); }
    else if (touches.size === 2) {
      const [a, b] = [...touches.values()], r = v.getBoundingClientRect();
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: view.s, cx: (a[0] + b[0]) / 2 - r.left, cy: (a[1] + b[1]) / 2 - r.top };
      drag = null;
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId) || !view) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (drag) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) moved = true;
      view.x = drag.ox + e.clientX - drag.x; view.y = drag.oy + e.clientY - drag.y; applyView();
    }
    else if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      zoomAt((Math.hypot(a[0] - b[0], a[1] - b[1]) || 1) / pinch.d * pinch.s / view.s, pinch.cx, pinch.cy);
    }
  });
  const end = (e) => {
    if (!touches.delete(e.pointerId)) return;
    if (!touches.size) { drag = null; pinch = null; const { v } = nodes(); if (v) v.classList.remove('is-grabbing'); }
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  document.addEventListener('wheel', (e) => {
    const v = inView(e);
    if (!v || !view) return;
    e.preventDefault();
    const r = v.getBoundingClientRect();
    zoomAt(e.deltaY > 0 ? 1 / 1.15 : 1.15, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  document.addEventListener('dblclick', (e) => { const v = inView(e); if (v) { const r = v.getBoundingClientRect(); zoomAt(1.8, e.clientX - r.left, e.clientY - r.top); } });
  // The large map takes the window's width; 100vw would count the scrollbar.
  const pageWidth = () => document.documentElement.style.setProperty('--page-w', document.documentElement.clientWidth + 'px');
  pageWidth();
  window.addEventListener('resize', () => { pageWidth(); applyView(); });

  // For js/app-hornet.js: the way to walk, and a point's place on the image.
  Object.assign(App, { mapWay: () => way(App.game()), mapWayKey: () => wayKey(App.game()) });

  /* Typing in the search lists what matches under it (the areas, the gauntlets), up to eight. */
  document.addEventListener('input', (e) => {
    const inp = e.target.closest && e.target.closest('[data-change="mapFind"]');
    if (!inp) return;
    const list = inp.closest('.mp-find').querySelector('.mp-found');
    const q = fold(inp.value.trim());
    finds = q ? findables().filter((x) => fold(x.name).includes(q)).slice(0, 8) : [];
    list.hidden = !q;
    list.innerHTML = finds.length ? finds.map((x, i) => `<li><button type="button" data-act="mapGo" data-value="${i}"${NT}>${esc(x.name)}</button></li>`).join('')
      : `<li class="mp-found-none">${esc(t('mapFindNone'))}</li>`;
  });

  Object.assign(actions, {
    mapKind(node) {
      const k = node.dataset.value, cur = prefs.mapKinds || KINDS;
      prefs.mapKinds = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      savePrefs(); render();
    },
    mapPlace(node) {
      const k = node.dataset.value, cur = prefs.mapPlaces || PLACES_ON;
      prefs.mapPlaces = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      savePrefs(); render();
    },
    mapZoom(node) { const { v } = nodes(); if (v) zoomAt(node.dataset.value === 'in' ? 1.4 : 1 / 1.4, v.clientWidth / 2, v.clientHeight / 2); },
    // The large map, a choice (prefs.mapBig), as the sibling's: refitted and brought under the bar.
    mapBig() {
      prefs.mapBig = !prefs.mapBig; savePrefs(); view = null; render();
      const sec = App.screenOf('map'), b = sec && sec.querySelector('.mp-big'), st = sec && sec.querySelector('.mp-stage');
      if (b) b.focus({ preventScroll: true });
      if (prefs.mapBig && st) st.scrollIntoView({ block: 'start' });
    },
    mapPick() { pick1(''); },
    // Free mode: a piece marked had or not from its card (the Inventory's marks). With no marks
    // yet, the map's loose pieces start as missing, the rest as had (Free mode's everything).
    mapMark(node) {
      const i = Number(node.dataset.value), fresh = !App.freeGame();
      App.freeMark((m) => {
        if (fresh) m.pieces = m.pieces.filter((j) => !KINDS.includes(CO.PIECES[j][0]));
        m.pieces = m.pieces.includes(i) ? m.pieces.filter((j) => j !== i) : [...m.pieces, i];
      });
    },
    // A gauntlet's card: to Combat, that gauntlet chosen.
    mapFight(node) { prefs.ftMode = 'gauntlets'; prefs.gauntlet = node.dataset.value; savePrefs(); App.go('fight'); },
    mapNames() { prefs.mapNames = prefs.mapNames === false; savePrefs(); render(); },
    // A search result: the view close on it, and a ring that pulses where it is.
    mapGo(node) {
      const x = finds[Number(node.dataset.value)];
      if (!x) return;
      centreOn(x.x, x.y, 3);
      const sec = App.screenOf('map'), ping = sec && sec.querySelector('.mp-ping'), list = sec && sec.querySelector('.mp-found');
      if (list) list.hidden = true;
      if (ping) { ping.setAttribute('style', at(x.x, x.y)); ping.hidden = false; ping.classList.remove('is-on'); void ping.offsetWidth; ping.classList.add('is-on'); }
    },
  });
})();
