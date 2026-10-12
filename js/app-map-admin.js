/* js/app-map-admin.js: the Map's admin mode, for the maintainer (#view=map&admin=1, App.admin;
   ported from hallownest-calculator's): a mark of the data moved where it really goes, or
   hidden; saved into js/map-fixes.js, which js/app-map.js applies for everyone
   (design/30-map-admin-variants.html, all A). Nothing is added by hand: a mark the data doesn't
   have would have no way to follow the save.
     The panel     a band under the map, above the legend: the counts, the chosen mark (its
                   points, Restore and Hide; Show for a hidden one), Undo and Save, and every fix
                   by kind (a tap goes to it).
     Moving        drag a mark (the map stays), or nudge it with the arrow keys (a pixel of the
                   image; Shift: five). The save's own marks (cocoon, Journal) never move.
     On the map    a dashed way from the data's point to a mark moved and not saved yet (the
                   saved ones' would cover the map), a hidden mark faint and struck through.
     Saving        the changes wait in sessionStorage (pharloom.mapPending) through a reload, until
                   Save sends them to `npm run admin` (tools/admin.js), which writes
                   js/map-fixes.js; with no server (file://, the published site) Copy puts the new
                   FIXES on the clipboard, to paste over the file's.
   Shares SS.app with js/app.js (see there); reads the Map through App.mapApi (js/app-map.js). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const App = SS.app, A = App.mapApi, MF = SS.mapFixes;
  if (!A || !MF) return;
  const { t, esc, NT, render, actions } = App;
  const on = () => !!App.admin;

  /* ── The fixes being edited: the file's, with the unsaved changes on top ── */
  const PENDING_KEY = 'pharloom.mapPending';
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let work = null;      // { moved, hidden }: what Save would write
  let undo = [];        // the earlier states of work, as JSON, last first
  let server = null;    // whether `npm run admin` answers: null until asked
  let copyText = '';    // the text to copy by hand, when the clipboard can't be written
  function cur() {
    if (work) return work;
    let kept = null;
    try { kept = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch (e) { kept = null; }
    work = kept && typeof kept === 'object' && kept.moved && kept.hidden ? { moved: kept.moved, hidden: kept.hidden } : clone(MF.FIXES);
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
  // Whether a key's fix differs from the file's (unsaved).
  function unsaved(key) {
    const w = cur(), f = MF.FIXES;
    return !same(w.moved[key], f.moved[key]) || !same(w.hidden[key], f.hidden[key]);
  }
  const allKeys = () => [...new Set([...Object.keys(cur().moved), ...Object.keys(MF.FIXES.moved), ...Object.keys(cur().hidden),
    ...Object.keys(MF.FIXES.hidden)])];
  const r1 = (v) => Math.round(v * 10) / 10;
  const markBy = (key) => A.list().find((m) => m.key === key);
  const movable = (m) => !!m && !A.OWN_ONLY.has(m.layer);
  // A mark to p: its fix, with the room it was moved in.
  function moveTo(key, p) {
    const m = markBy(key);
    if (!movable(m)) return;
    change((w) => { w.moved[key] = [r1(p.x), r1(p.y), m.scene]; });
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
  function selHtml() {
    const key = A.picked(), m = key && markBy(key);
    if (!movable(m)) return `<span class="mp-adm-hint">${esc(t('admHint'))}</span>`;
    let body = '', acts = '';
    if (m.hidden) {
      body = `<span class="mp-adm-state">${esc(t('admIsHidden'))}</span>`;
      acts = btn('admShow', t('admShow'), key);
    } else {
      const p0 = A.pointOf(m), p = m.fix;
      body = `<dl class="mp-adm-xy"><dt>${esc(t('admData'))}</dt><dd>${p0 ? xy(p0) : '·'}</dd>${p ? `<dt>${esc(t('admNow'))}</dt><dd>${xy(p)}${p0 ? ` <small>(${sgn(p.x - p0.x)}, ${sgn(p.y - p0.y)})</small>` : ''}</dd>` : ''}</dl>`;
      acts = (p ? btn('admReset', t('admReset'), key) : '') + btn('admHide', t('admHide'), key);
    }
    return `<div class="mp-adm-sel"><span class="mp-adm-art">${art(m)}</span><div><b class="mp-adm-name"${NT}>${esc(m.name)}</b><code${NT}>${esc(key)} · ${esc(m.scene)}</code></div>
      <div class="mp-adm-body">${body}<div class="mp-adm-acts">${acts}</div></div></div>`;
  }
  function listHtml() {
    const w = cur(), byKey = new Map(A.list().map((m) => [m.key, m]));
    const item = (k) => {
      const m = byKey.get(k);
      return `<li><button type="button" class="${unsaved(k) ? 'is-pending' : ''}" data-act="admGo" data-value="${esc(k)}"${NT}>${m ? art(m) : '<i></i>'}<span>${esc(m ? m.name : k)}</span><code>${esc(m ? m.scene : '×')}</code></button></li>`;
    };
    const grp = (label, ks) => (ks.length ? `<details open><summary>${esc(label)} <span>${ks.length}</span></summary><ul>${ks.sort().map(item).join('')}</ul></details>` : '');
    return grp(t('admMoved'), Object.keys(w.moved)) + grp(t('admHidden'), Object.keys(w.hidden));
  }
  function panelHtml() {
    askServer();
    const w = cur(), n = allKeys().filter(unsaved).length;
    const counts = t('admCount', { m: String(Object.keys(w.moved).length), h: String(Object.keys(w.hidden).length) });
    return `<div class="mp-adm" role="region" aria-label="${esc(t('admTitle'))}">
      <div class="mp-adm-h"><b>${esc(t('admTitle'))}</b><span>${esc(counts)}${n ? ` · <em class="is-pending">${esc(t('admPending', { n: String(n) }))}</em>` : ''}</span></div>
      <div class="mp-adm-col">${selHtml()}
        <div class="mp-adm-foot"><button type="button" class="text-btn" data-act="admUndo"${undo.length ? '' : ' disabled'}>${esc(t('admUndo'))}</button>
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
    const ways = A.list().filter((m) => m.fix && A.placed().has(m.key) && unsaved(m.key)).map((m) => {
      const p0 = A.pointOf(m), p = m.fix;
      return p0 ? `<g><line x1="${p0.x}" y1="${p0.y}" x2="${p.x}" y2="${p.y}"/><circle cx="${p0.x}" cy="${p0.y}" r="2.2"/></g>` : '';
    }).join('');
    marks.insertAdjacentHTML('beforebegin', `<g class="mp-adm-ways" aria-hidden="true">${ways}</g>`);
    for (const g of marks.querySelectorAll('.mp-mk.is-hidden')) g.insertAdjacentHTML('beforeend', '<line class="mp-adm-strike" x1="-0.42" y1="0.42" x2="0.42" y2="-0.42"/>');
    sec.querySelector('.mp-stage').insertAdjacentHTML('afterend', panelHtml());
  };

  /* ── Moving: a drag, or the arrow keys ── */
  let pinDrag = null, down = null, dragEnd = 0;
  const inView = (e) => { const sec = App.screenOf('map'), v = sec && sec.querySelector('.mp-view'); return v && v.contains(e.target) && !e.target.closest('.mp-find, .mp-tools, .mp-card-wrap') ? v : null; };
  window.addEventListener('pointerdown', (e) => {
    if (!on() || !inView(e) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    down = { x: e.clientX, y: e.clientY };
    const g = e.target.closest('.mp-svg .mp-mk[data-mk]'), m = g && markBy(g.dataset.mk), at = m && A.placed().get(m.key);
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
    if (!on() || !inView(e)) return;
    // A drag's own click picks nothing more.
    if (performance.now() - dragEnd < 350) { e.stopPropagation(); dragEnd = 0; }
  }, true);
  // After js/app-map.js's own click (a mark picked or let go): the panel says so.
  document.addEventListener('click', (e) => { if (on() && inView(e)) paintPanel(); });
  const ARROW = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  document.addEventListener('keydown', (e) => {
    if (!on()) return;
    const g = e.target.closest && e.target.closest('.mp-svg .mp-mk[data-mk]'), m = g && ARROW[e.key] && markBy(g.dataset.mk), at = m && A.placed().get(m.key);
    if (!movable(m) || !at) return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1, from = m.fix || at;
    A.pick(m.key);
    moveTo(m.key, { x: from.x + ARROW[e.key][0] * step, y: from.y + ARROW[e.key][1] * step });
    const back = App.screenOf('map').querySelector(`.mp-svg [data-mk="${CSS.escape(m.key)}"]`);
    if (back) back.focus({ preventScroll: true });
  });
  Object.assign(actions, {
    admUndo() {
      const last = undo.pop();
      if (!last) return;
      work = JSON.parse(last);
      keep(); A.dirty(); render();
    },
    admReset(node) { const k = node.dataset.value; change((w) => { delete w.moved[k]; }); },
    admHide(node) { const k = node.dataset.value, m = markBy(k); if (m) change((w) => { w.hidden[k] = m.scene; }); },
    admShow(node) { const k = node.dataset.value; change((w) => { delete w.hidden[k]; }); },
    admSave() { save(); },
    // A fix in the list: the view on it, its card open (its layer switched on first).
    admGo(node) { const k = node.dataset.value; if (markBy(k)) App.mapShow(k); },
  });
})();
