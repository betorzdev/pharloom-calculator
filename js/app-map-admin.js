/* js/app-map-admin.js: the Map's admin mode, for the maintainer (#view=map&admin=1, App.admin;
   ported from hallownest-calculator's and widened): a mark of the data moved where it really
   goes, hidden, or a mark added that the data doesn't have; saved into js/map-fixes.js, which
   js/app-map.js applies for everyone (design/30-map-admin-variants.html, all A).
     The panel     a band under the map, above the legend: the counts, the chosen mark (its
                   points, Restore and Hide; Show for a hidden one; for an added one its Act, its
                   save check and Delete), Add, Undo and Save, and every fix by kind (a tap goes
                   to it).
     Moving        drag a mark (the map stays), or nudge it with the arrow keys (a pixel of the
                   image; Shift: five). The save's own marks (cocoon, Journal) never move.
     Adding        Add shows the legend's marks of Places, People and Other collectibles; with one
                   chosen, each tap on the map drops one there, in the room under it, until Esc.
     On the map    a dashed way from the data's point to a moved mark (in the accent while
                   unsaved), a hidden mark faint and struck through, an added one with a "+".
     Saving        the changes wait in sessionStorage (pharloom.mapPending) through a reload, until
                   Save sends them to `npm run admin` (tools/admin.js), which writes
                   js/map-fixes.js; with no server (file://, the published site) Copy puts the new
                   FIXES on the clipboard, to paste over the file's.
   Shares SS.app with js/app.js (see there); reads the Map through App.mapApi (js/app-map.js). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const App = SS.app, A = App.mapApi, MF = SS.mapFixes, M = SS.map;
  if (!A || !MF) return;
  const { t, esc, NT, render, actions } = App;
  const on = () => !!App.admin;

  /* ── The fixes being edited: the file's, with the unsaved changes on top ── */
  const PENDING_KEY = 'pharloom.mapPending';
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let work = null;      // { moved, hidden, added }: what Save would write
  let undo = [];        // the earlier states of work, as JSON, last first
  let server = null;    // whether `npm run admin` answers: null until asked
  let copyText = '';    // the text to copy by hand, when the clipboard can't be written
  let adding = null;    // while adding, the layer ('' until one is picked); null when not adding
  function cur() {
    if (work) return work;
    let kept = null;
    try { kept = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch (e) { kept = null; }
    work = kept && typeof kept === 'object' && kept.moved && kept.hidden && Array.isArray(kept.added) ? kept : clone(MF.FIXES);
    return work;
  }
  App.mapFixes = () => (on() ? cur() : MF.FIXES);
  const keep = () => { try { if (same(cur(), MF.FIXES)) sessionStorage.removeItem(PENDING_KEY); else sessionStorage.setItem(PENDING_KEY, JSON.stringify(cur())); } catch (e) { /* no storage */ } };
  // A change: the state before it kept for Undo, the Map worked out again.
  function change(fn) {
    undo.push(JSON.stringify(cur()));
    fn(cur());
    keep();
    A.dirty();
    render();
  }
  const addedOf = (id) => cur().added.find((a) => a.id === id);
  // Whether a key's fix differs from the file's (unsaved).
  function unsaved(key) {
    const w = cur(), f = MF.FIXES;
    if (key.startsWith('add:')) return !same(addedOf(key), (f.added || []).find((a) => a.id === key));
    return !same(w.moved[key], f.moved[key]) || !same(w.hidden[key], f.hidden[key]);
  }
  const allKeys = () => [...new Set([...Object.keys(cur().moved), ...Object.keys(MF.FIXES.moved), ...Object.keys(cur().hidden),
    ...Object.keys(MF.FIXES.hidden), ...cur().added.map((a) => a.id), ...(MF.FIXES.added || []).map((a) => a.id)])];
  // The room under a map point: the smallest drawn room whose box holds it.
  function sceneAt(x, y) {
    let best = null, area = Infinity;
    for (const [scene, r] of Object.entries(M.ROOMS)) {
      if (!r[2] || x < r[0] || y < r[1] || x > r[0] + r[2] || y > r[1] + r[3]) continue;
      if (r[2] * r[3] < area) { area = r[2] * r[3]; best = scene; }
    }
    return best;
  }
  const r1 = (v) => Math.round(v * 10) / 10;
  const markBy = (key) => A.list().find((m) => m.key === key);
  const movable = (m) => !!m && !A.OWN_ONLY.has(m.layer);
  // A mark to p: an added one keeps its point (and the room under it), a data one its fix.
  function moveTo(key, p) {
    const m = markBy(key);
    if (!movable(m)) return;
    change((w) => {
      if (m.added) { const a = w.added.find((x) => x.id === key); a.x = r1(p.x); a.y = r1(p.y); a.scene = sceneAt(a.x, a.y) || a.scene; }
      else w.moved[key] = [r1(p.x), r1(p.y), m.scene];
    });
  }

  /* ── Saving ── */
  function askServer() {
    if (server !== null) return;
    server = false;
    if (location.protocol === 'file:') return;
    fetch('/__admin/ping').then((r) => r.ok, () => false).then((ok) => { if (ok) { server = true; paintPanel(); } });
  }
  async function save() {
    const all = clone(cur());
    if (server) {
      try {
        const r = await fetch('/__admin/map-fixes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(all) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || String(r.status));
        // The file holds them now: the page's copy too, nothing unsaved.
        Object.assign(MF.FIXES, clone(all));
        undo = []; keep(); A.dirty();
        App.toast(t('admSaved'));
      } catch (e) { App.toast(t('admFail', { e: e.message })); }
      render();
      return;
    }
    const text = MF.format(all);
    const done = () => { copyText = ''; App.toast(t('admCopied')); paintPanel(); };
    const fallback = () => { copyText = text; paintPanel(); };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
  }

  /* ── The panel ── */
  const n1 = (v) => App.NF[1].format(v);
  const xy = (p) => `${n1(p.x)} · ${n1(p.y)}`;
  const sgn = (v) => (v >= 0 ? '+' : '−') + n1(Math.abs(v));
  const art = (m) => m.draw('', '', '', '');
  const btn = (act, label, value = '', cls = '') => `<button type="button" class="text-btn${cls}" data-act="${act}"${value ? ` data-value="${esc(value)}"` : ''}>${esc(label)}</button>`;
  const GROUPS = ['places', 'people', 'extras'];
  const addable = (gr) => MF.LAYERS.filter((id) => A.LAYER.get(id) && A.LAYER.get(id).group === gr);
  const layerMark = (id) => { const m = A.list().find((x) => x.layer === id); return m ? art(m) : ''; };
  const roomOf = (m) => (m.added ? m.added.scene : m.scene);
  function selHtml() {
    if (adding !== null) {
      const pick = GROUPS.map((gr) => `<p>${esc(t('mapGroup_' + gr))}</p><div class="mp-adm-grid">${addable(gr).map((id) =>
        `<button type="button" data-act="admLayer" data-value="${id}" title="${esc(A.LAYER.get(id).name())}" aria-label="${esc(A.LAYER.get(id).name())}" aria-pressed="${id === adding}"${NT}>${layerMark(id)}</button>`).join('')}</div>`).join('');
      return `<div class="mp-adm-pick">${pick}<span class="mp-adm-hint">${esc(adding ? t('admAddHint', { layer: A.LAYER.get(adding).name() }) : t('admAddPick'))}</span></div>`;
    }
    const key = A.picked(), m = key && markBy(key);
    if (!movable(m)) return `<span class="mp-adm-hint">${esc(t('admHint'))}</span>`;
    let body = '', acts = '';
    if (m.hidden) {
      body = `<span class="mp-adm-state">${esc(t('admIsHidden'))}</span>`;
      acts = btn('admShow', t('admShow'), key);
    } else if (m.added) {
      const a = m.added, act = a.act || 0;
      body = `<div class="mp-adm-field"><span>${esc(t('admAct'))}</span><div class="seg" role="group" aria-label="${esc(t('admAct'))}">${[0, 1, 2, 3].map((n) =>
        `<button type="button" data-act="admAct" data-value="${n}" aria-pressed="${n === act}">${n || '·'}</button>`).join('')}</div></div>
        <label class="mp-adm-field"><span>${esc(t('admCheck'))}</span><input class="mp-adm-in mp-adm-check" data-key="${esc(key)}" spellcheck="false" autocomplete="off"${NT}
          value="${esc(a.check ? JSON.stringify(a.check).replace(/,/g, ', ') : `["bool", "${a.scene}", ""]`)}"></label>
        <span class="mp-adm-hint mp-adm-check-hint">${esc(t('admCheckHint'))}</span>`;
      acts = btn('admDelete', t('admDelete'), key);
    } else {
      const p0 = A.pointOf(m), p = m.fix;
      body = `<dl class="mp-adm-xy"><dt>${esc(t('admData'))}</dt><dd>${p0 ? xy(p0) : '·'}</dd>${p ? `<dt>${esc(t('admNow'))}</dt><dd>${xy(p)}${p0 ? ` <small>(${sgn(p.x - p0.x)}, ${sgn(p.y - p0.y)})</small>` : ''}</dd>` : ''}</dl>`;
      acts = (p ? btn('admReset', t('admReset'), key) : '') + btn('admHide', t('admHide'), key);
    }
    return `<div class="mp-adm-sel"><span class="mp-adm-art">${art(m)}</span><div><b class="mp-adm-name"${NT}>${esc(m.name)}</b><code${NT}>${esc(key)} · ${esc(roomOf(m))}</code></div>
      <div class="mp-adm-body">${body}<div class="mp-adm-acts">${acts}</div></div></div>`;
  }
  function listHtml() {
    const w = cur(), byKey = new Map(A.list().map((m) => [m.key, m]));
    const item = (k) => {
      const m = byKey.get(k);
      return `<li><button type="button" class="${unsaved(k) ? 'is-pending' : ''}" data-act="admGo" data-value="${esc(k)}"${NT}>${m ? art(m) : '<i></i>'}<span>${esc(m ? m.name : k)}</span><code>${esc(m ? roomOf(m) : '×')}</code></button></li>`;
    };
    const grp = (label, ks) => (ks.length ? `<details open><summary>${esc(label)} <span>${ks.length}</span></summary><ul>${ks.sort().map(item).join('')}</ul></details>` : '');
    return grp(t('admMoved'), Object.keys(w.moved)) + grp(t('admHidden'), Object.keys(w.hidden)) + grp(t('admAdded'), w.added.map((a) => a.id));
  }
  function panelHtml() {
    askServer();
    const w = cur(), n = allKeys().filter(unsaved).length;
    const counts = t('admCount', { m: String(Object.keys(w.moved).length), h: String(Object.keys(w.hidden).length), a: String(w.added.length) });
    return `<div class="mp-adm" role="region" aria-label="${esc(t('admTitle'))}">
      <div class="mp-adm-h"><b>${esc(t('admTitle'))}</b><span>${esc(counts)}${n ? ` · <em class="is-pending">${esc(t('admPending', { n: String(n) }))}</em>` : ''}</span></div>
      <div class="mp-adm-col">${selHtml()}
        <div class="mp-adm-foot">${btn('admAdd', t(adding !== null ? 'admAddStop' : 'admAdd'))}
          <button type="button" class="text-btn" data-act="admUndo"${undo.length ? '' : ' disabled'}>${esc(t('admUndo'))}</button>
          <button type="button" class="text-btn" data-act="admSave"${n ? '' : ' disabled'}>${esc(t(server ? 'admSave' : 'admCopy'))}</button>
          <span class="mp-adm-hint">${esc(t(server ? 'admServer' : 'admNoServer'))}</span></div>
        ${copyText ? `<textarea class="mp-adm-in mp-adm-text" readonly aria-label="${esc(t('admCopy'))}"${NT}>${esc(copyText)}</textarea>` : ''}</div>
      <div class="mp-adm-col mp-adm-list">${listHtml()}</div>
    </div>`;
  }
  function paintPanel() {
    const sec = App.screenOf('map'), el = sec && sec.querySelector('.mp-adm');
    if (el) el.outerHTML = panelHtml();
  }

  /* ── The Map, then the admin's pieces on it ── */
  const paint = App.screens.map;
  App.screens.map = (sec) => {
    paint(sec);
    if (!on()) return;
    const svg = sec.querySelector('.mp-svg'), marks = svg && svg.querySelector('.mp-marks');
    if (!marks) return;
    svg.classList.add('is-admin');
    const ways = A.list().filter((m) => m.fix && !m.added && A.placed().has(m.key)).map((m) => {
      const p0 = A.pointOf(m), p = m.fix;
      return p0 ? `<g class="${unsaved(m.key) ? 'is-pending' : ''}"><line x1="${p0.x}" y1="${p0.y}" x2="${p.x}" y2="${p.y}"/><circle cx="${p0.x}" cy="${p0.y}" r="2.2"/></g>` : '';
    }).join('');
    marks.insertAdjacentHTML('beforebegin', `<g class="mp-adm-ways" aria-hidden="true">${ways}</g>`);
    for (const g of marks.querySelectorAll('.mp-mk.is-added')) g.insertAdjacentHTML('beforeend', '<g class="mp-adm-plus" transform="translate(0.4 -0.4)"><circle r="0.2"/><path d="M-0.1 0H0.1M0 -0.1V0.1"/></g>');
    for (const g of marks.querySelectorAll('.mp-mk.is-hidden')) g.insertAdjacentHTML('beforeend', '<line class="mp-adm-strike" x1="-0.42" y1="0.42" x2="0.42" y2="-0.42"/>');
    sec.querySelector('.mp-stage').insertAdjacentHTML('afterend', panelHtml());
    sec.querySelector('.mp-view').classList.toggle('is-adding', !!adding);
  };

  /* ── Moving: a drag, or the arrow keys ── */
  let pinDrag = null, down = null, dragEnd = 0;
  const inView = (e) => { const sec = App.screenOf('map'), v = sec && sec.querySelector('.mp-view'); return v && v.contains(e.target) && !e.target.closest('.mp-find, .mp-tools, .mp-card-wrap') ? v : null; };
  window.addEventListener('pointerdown', (e) => {
    if (!on() || !inView(e) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    down = { x: e.clientX, y: e.clientY };
    const g = adding === null && e.target.closest('.mp-svg .mp-mk[data-mk]'), m = g && markBy(g.dataset.mk), at = m && A.placed().get(m.key);
    if (!movable(m) || !at) return;
    // The mark comes along with the pointer; the map stays (js/app-map.js never sees it).
    e.stopPropagation();
    const [fx, fy] = A.toMap(e.clientX, e.clientY);
    pinDrag = { key: m.key, g, from: { x: fx, y: fy }, p0: { x: m.fix ? m.fix.x : at.x, y: m.fix ? m.fix.y : at.y }, p: null };
  }, true);
  window.addEventListener('pointermove', (e) => {
    if (!pinDrag) return;
    e.stopPropagation();
    const [mx, my] = A.toMap(e.clientX, e.clientY);
    const p = { x: pinDrag.p0.x + mx - pinDrag.from.x, y: pinDrag.p0.y + my - pinDrag.from.y };
    if (!pinDrag.p && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) < 5) return;   // a tap, not a drag
    pinDrag.p = p;
    pinDrag.g.style.setProperty('--px', p.x + 'px');
    pinDrag.g.style.setProperty('--py', p.y + 'px');
  }, true);
  const endDrag = (e) => {
    if (!pinDrag) return;
    const d = pinDrag;
    pinDrag = null;
    if (!d.p) return;   // a tap: the click that follows picks the mark
    e.stopPropagation();
    dragEnd = performance.now();
    A.pick(d.key);
    moveTo(d.key, d.p);
  };
  window.addEventListener('pointerup', endDrag, true);
  window.addEventListener('pointercancel', endDrag, true);
  window.addEventListener('click', (e) => {
    if (!on()) return;
    const v = inView(e);
    if (!v) return;
    // A drag's own click picks nothing more.
    if (performance.now() - dragEnd < 350) { e.stopPropagation(); dragEnd = 0; return; }
    // Adding: a tap on the map (not the end of a pan) drops a mark of the layer there.
    if (adding) {
      e.stopPropagation();
      if (down && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 4) return;
      const [x, y] = A.toMap(e.clientX, e.clientY), scene = sceneAt(x, y);
      if (!scene) { App.toast(t('admNoRoom')); return; }
      const n = Math.max(0, ...cur().added.map((a) => Number(a.id.slice(4)) || 0), ...(MF.FIXES.added || []).map((a) => Number(a.id.slice(4)) || 0)) + 1;
      change((w) => w.added.push({ id: 'add:' + n, layer: adding, x: r1(x), y: r1(y), scene }));
    }
  }, true);
  // After js/app-map.js's own click (a mark picked or let go): the panel says so.
  document.addEventListener('click', (e) => { if (on() && inView(e)) paintPanel(); });
  const ARROW = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  document.addEventListener('keydown', (e) => {
    if (!on()) return;
    if (e.key === 'Escape' && adding !== null) { adding = null; render(); return; }
    const g = e.target.closest && e.target.closest('.mp-svg .mp-mk[data-mk]'), m = g && ARROW[e.key] && markBy(g.dataset.mk), at = m && A.placed().get(m.key);
    if (!movable(m) || !at) return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1, from = m.fix || at;
    A.pick(m.key);
    moveTo(m.key, { x: from.x + ARROW[e.key][0] * step, y: from.y + ARROW[e.key][1] * step });
    const back = App.screenOf('map').querySelector(`.mp-svg [data-mk="${CSS.escape(m.key)}"]`);
    if (back) back.focus({ preventScroll: true });
  });
  // The save check, once typed (Enter or leaving the field): a valid one kept, an empty one dropped.
  document.addEventListener('input', (e) => {
    const inp = e.target.closest && e.target.closest('.mp-adm-check');
    if (inp) inp.classList.toggle('is-bad', !!inp.value.trim() && !checkOf(inp.value));
  });
  document.addEventListener('change', (e) => {
    const inp = e.target.closest && e.target.closest('.mp-adm-check');
    if (!inp) return;
    const text = inp.value.trim(), c = text ? checkOf(text) : null;
    if (text && !c) { App.toast(t('admCheckBad')); return; }
    // The prefilled check with no id yet says nothing.
    const real = c && !(c[0] === 'bool' && !c[2]) ? c : null;
    const a = addedOf(inp.dataset.key);
    if (a && !same(a.check || null, real)) change((w) => { const x = w.added.find((y) => y.id === inp.dataset.key); if (real) x.check = real; else delete x.check; });
  });
  function checkOf(text) { try { const c = JSON.parse(text); return MF.isCheck(c) ? c : null; } catch (e) { return null; } }

  Object.assign(actions, {
    admAdd() { adding = adding === null ? '' : null; render(); },
    // A layer to add: switched on, so what's added shows.
    admLayer(node) {
      adding = node.dataset.value;
      const cur1 = A.layersOn();
      if (!cur1.includes(adding)) { App.prefs.mapLayers = [...cur1, adding]; App.savePrefs(); }
      render();
    },
    admUndo() {
      const last = undo.pop();
      if (!last) return;
      work = JSON.parse(last);
      keep(); A.dirty(); render();
    },
    admReset(node) { const k = node.dataset.value; change((w) => { delete w.moved[k]; }); },
    admHide(node) { const k = node.dataset.value, m = markBy(k); if (m) change((w) => { w.hidden[k] = m.scene; }); },
    admShow(node) { const k = node.dataset.value; change((w) => { delete w.hidden[k]; }); },
    admDelete(node) { const k = node.dataset.value; A.pick(''); change((w) => { w.added = w.added.filter((a) => a.id !== k); }); },
    admAct(node) { const k = A.picked(), n = Number(node.dataset.value) || 0; change((w) => { const a = w.added.find((x) => x.id === k); if (a) { if (n) a.act = n; else delete a.act; } }); },
    admSave() { save(); },
    // A fix in the list: the view on it, its card open (its layer switched on first).
    admGo(node) { const k = node.dataset.value; if (markBy(k)) App.mapShow(k); },
  });
})();
