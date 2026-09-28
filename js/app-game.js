/* js/app-game.js — the Inventory, the sibling's sheet in Silksong's pieces (design/03-redesign.md,
   step 4): on the left what Hornet is (the five Needles, the masks, the silk as beads on a
   thread, the Silk Hearts, the Crafting Kit and the Tool Pouch, the Silk Skills with what they
   deal and the abilities), on the right what she carries (the Tools on their slots by colour, the
   Crests, the items). In Free mode all of it is set here: the left side sets the free build, as
   the Crest screen does, and a tap on the right marks a thing had or not (js/app-saves.js,
   App.freeGame), which the Crest screen then respects. In a save it shows what the game saved,
   and what you don't have yet is a dimmed silhouette. A tap opens the game's text under its
   shelf. The icons are the wiki's
   (tools/fetch-icons.js, npm run icons). Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, CO = SS.collectibles;
  const App = SS.app;
  const { t, pick, esc, NT, ART, brackets, screenHead, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const icon = (list, id) => `assets/icons/${list}/${id}.webp`;
  // The Old Hearts and melodies by their save flag → their icon (assets/icons/pieces/).
  const PIECE_ICON = { CollectedHeartFlower: 'heart-bloom', CollectedHeartCoral: 'heart-coral', CollectedHeartHunter: 'heart-hunter',
    CollectedHeartClover: 'heart-clover', HasMelodyArchitect: 'melody-architect', HasMelodyLibrarian: 'melody-librarian',
    HasMelodyConductor: 'melody-conductor' };

  // Free mode: everything, as the site's everything-unlocked sheet.
  function fullGame() {
    return { tools: D.TOOLS.map((x) => x.id), crests: D.CRESTS.map((x) => x.id), skills: D.SKILLS.map((x) => x.id),
      arts: D.ARTS.map((x) => x.id), masks: 5, spools: 9, hearts: 3, needle: 4, kit: 4, pouch: 4, everbloom: true,
      pieces: CO.PIECES.map((p, i) => i), journal: {}, act: 3 };
  }

  /* Every thing the pane can show, by a key "list/id": { list, id, name, desc, got, count, color }. */
  function things(g) {
    const found = (kind) => g.pieces.filter((i) => CO.PIECES[i][0] === kind).length;
    const total = (kind) => CO.PIECES.filter((p) => p[0] === kind).length;
    const item = (id) => D.ITEMS.find((x) => x.id === id);
    const out = [];
    for (const x of D.TOOLS) out.push({ list: 'tools', id: x.id, name: x.name, desc: x.desc, got: g.tools.includes(x.id), color: x.color });
    for (const x of D.CRESTS) out.push({ list: 'crests', id: x.id, name: x.name, desc: x.desc, got: g.crests.includes(x.id) });
    for (const x of D.SKILLS) out.push({ list: 'skills', id: x.id, name: x.name, desc: x.desc, got: g.skills.includes(x.id) });
    for (const x of D.ARTS) out.push({ list: 'arts', id: x.id, name: x.name, desc: x.desc, got: g.arts.includes(x.id) });
    // The items: the two upgrade ladders with their level, the materials with how many were found.
    const it = (id, got, count, n) => { const x = item(id); out.push({ list: 'items', id, name: x.name, desc: x.desc, got, count, n }); };
    it('crafting-kit', g.kit > 0, `${num(g.kit)}/4`);
    it('tool-pouch', g.pouch > 0, `${num(g.pouch)}/4`);
    const shards = found('mask-shard') - 4 * g.masks, frags = found('spool-fragment') - 2 * g.spools;
    it('mask-shard', shards > 0, `${num(Math.max(0, shards))}/4`, [Math.max(0, Math.min(3, shards)), 3]);
    it('spool-fragment', frags > 0, `${num(Math.max(0, frags))}/2`, [Math.max(0, Math.min(1, frags)), 1]);
    for (const id of ['memory-locket', 'craftmetal', 'pale-oil']) it(id, found(id) > 0, `${num(found(id))}/${num(total(id))}`, [found(id), total(id)]);
    it('everbloom', g.everbloom);
    // The Silk Hearts, the Old Hearts and the melodies, each with its own picture.
    out.push({ list: 'pieces', id: 'silk-heart', name: { es: t('kind_silkHeart'), en: t('kind_silkHeart') }, got: g.hearts > 0, count: `${num(g.hearts)}/3` });
    CO.PIECES.forEach((p, i) => {
      if (p[0] !== 'old-heart' && p[0] !== 'melody') return;
      out.push({ list: 'pieces', id: PIECE_ICON[p[2][1]], name: p[4], desc: p[5], got: g.pieces.includes(i), piece: i });
    });
    out.push({ list: 'pieces', id: 'flea', name: { es: t('kind_fleas'), en: t('kind_fleas') }, got: found('flea') > 0, count: `${num(found('flea'))}/${num(total('flea'))}`, n: [found('flea'), total('flea')] });
    return out;
  }

  // The thing whose description is open, under its own shelf (a click; a second one closes it).
  let picked = null;
  const keyOf = (x) => x.list + '/' + x.id;

  /* A cell of the grids: the Tools on their slot, the game's diamond in the slot's colour (the
     Crest screen's own drawing, design/02-silksong.md §3), dashed in the locked slot's grey when
     you lack it; the rest plain. One fixed square, so every row lines up. */
  function cell(x) {
    const cls = `inv-cell${x.got ? '' : ' is-missing'}${x.color ? ' is-slot' : ''}${picked === keyOf(x) ? ' is-picked' : ''}`;
    const label = pick(x.name) + (x.count ? ' ' + x.count : '') + (x.got ? '' : ' · ' + t('invMissing'));
    const mark = marking && markable(x);
    return `<li><button type="button" class="${cls}"${x.color ? ` style="--c: var(--slot-${x.color})"` : ''} data-act="${mark ? 'invOwn' : 'invPick'}" data-key="${esc(keyOf(x))}"
      ${mark ? `aria-pressed="${x.got}"` : `aria-expanded="${picked === keyOf(x)}"`} aria-label="${esc(label)}" title="${esc(pick(x.name))}"${NT}>
        <img src="${icon(x.list, x.id)}" alt="" loading="lazy"></button>${marking && x.n ? stepper(x) : x.count ? `<span class="inv-count">${esc(x.count)}</span>` : ''}</li>`;
  }
  /* Free mode marks (design/03-redesign.md, step 4): a tap on a Tool, Crest, Silk Skill,
     ability, the Everbloom, an Old Heart or a melody marks it had or not and opens its text; the
     counted ones (loose shards and fragments, lockets, Craftmetal, Pale Oil, fleas) go by − N +.
     The Hunter Crest is always had: Hornet starts with it. */
  let marking = false;
  const markable = (x) => !x.n && x.id !== 'silk-heart' && !(x.list === 'crests' && x.id === 'hunter') && (x.list !== 'items' || x.id === 'everbloom');
  const stepper = (x) => {
    const [v, max] = x.n, what = pick(x.name);
    return `<span class="inv-step"><button type="button" class="icon-btn" data-act="invCount" data-key="${esc(keyOf(x))}" data-value="${v - 1}" ${v > 0 ? '' : 'disabled'} aria-label="${esc(t('invLess', { what }))}" title="${esc(t('invLess', { what }))}">−</button>
      <b>${num(v)}</b><button type="button" class="icon-btn" data-act="invCount" data-key="${esc(keyOf(x))}" data-value="${v + 1}" ${v < max ? '' : 'disabled'} aria-label="${esc(t('invMore', { what }))}" title="${esc(t('invMore', { what }))}">+</button></span>`;
  };
  // What's open under a shelf: the picture, the name and the game's text.
  function open(list) {
    const x = shown.find((y) => keyOf(y) === picked);
    if (!x || !list.includes(x)) return '';
    return `<div class="inv-open" aria-live="polite"><img class="${x.got ? '' : 'is-missing'}" src="${icon(x.list, x.id)}" alt="">
      <h4 class="inv-name"${NT}>${esc(pick(x.name))}</h4>
      ${x.got ? '' : `<p class="inv-not">${esc(t('invMissing'))}</p>`}
      ${x.desc ? `<p class="inv-desc">${esc(pick(x.desc))}</p>` : ''}</div>`;
  }
  const count = (c) => (c ? ` <span class="inv-n">${num(c.got)}<i>/${num(c.max)}</i></span>` : '');
  const head = (title, c, list) => `<h3 class="ct-h inv-h">${esc(title)}${count(c)}${marking && list ? `<span class="inv-all">
      <button type="button" class="text-btn" data-act="invAll" data-list="${list}" data-value="1">${esc(t('invAll'))}</button><span aria-hidden="true">·</span>
      <button type="button" class="text-btn" data-act="invAll" data-list="${list}" data-value="0">${esc(t('invNone'))}</button></span>` : ''}</h3>`;

  /* ── What Hornet is, the sibling's way (hallownest-calculator's Inventory, design/03-redesign.md
     step 4): the Needle as the focal point, the body as rows of the game's own pieces, the Kit
     and the Pouch as pips. In Free mode each one sets the free build (the Crest screen's own
     ctLevel, js/app-tools.js), so the Crest screen and Combat follow; in a save they show what
     the game saved, at full light but still. ── */
  let before = null;   // the last build drawn: what changed since lights up
  const lit = (b, k, on) => (on && before && before[k] !== b[k] ? ' is-lit' : '');
  function needles(b, still) {
    const row = D.NEEDLES.map((n, i) => `<button type="button" class="inv-np${b.needle === i ? ' is-on' : ''}${lit(b, 'needle', b.needle === i)}"
        data-act="ctLevel" data-key="needle" data-value="${i}" aria-pressed="${b.needle === i}"${still} title="${esc(pick(n.name))}" aria-label="${esc(pick(n.name) + ', ' + n.damage)}"${NT}>
        <img src="${ART.needle(i)}" alt="" width="80" height="600"><b>${num(n.damage)}</b></button>`).join('');
    return `<section class="inv-sec">${head(t('invNeedle'))}<div class="inv-needles" role="group" aria-label="${esc(t('invNeedle'))}">${row}</div>
      <p class="inv-caption"${NT}>${esc(pick(D.NEEDLES[b.needle].name))}</p></section>`;
  }
  /* A row of pieces: the first `base` always there, then one per upgrade; a tap on one sets the
     count to it (on the last one lit, one less). */
  function pieces(b, key, name, base, max, piece, still) {
    const v = base + b[key];
    const btns = Array.from({ length: base + max }, (_, i) => {
      const fixed = i < base, on = i < v, n = i + 1 - base;
      const to = n === b[key] ? n - 1 : n;
      return `<button type="button" class="inv-pc${on ? ' is-on' : ''}${fixed ? ' is-base' : ''}${lit(b, key, i === v - 1)}"${fixed ? ' disabled' : ` data-act="ctLevel" data-key="${key}" data-value="${to}"${still}`}
        aria-label="${esc(name + ' ' + num(i + 1))}" aria-pressed="${on}">${piece}</button>`;
    }).join('');
    return `<div class="inv-field"><div class="inv-frow"><span><span class="inv-fname"${NT}>${esc(name)}</span><span class="inv-fnote">${esc(t('invFromTo', { a: num(base), b: num(base + max) }))}</span></span>
      <span class="inv-fnum">${num(v)}<i>/${num(base + max)}</i></span></div><div class="inv-pieces is-${key}" role="group" aria-label="${esc(name)}" style="--n:${base + max};--f:${(v / (base + max) * 100).toFixed(2)}%">${btns}</div></div>`;
  }
  function level(b, key, id, still) {
    const it = D.ITEMS.find((x) => x.id === id);
    const opts = [0, 1, 2, 3, 4].map((n) => `<button type="button" data-act="ctLevel" data-key="${key}" data-value="${n}" aria-pressed="${b[key] === n}"${still}>${num(n)}</button>`).join('');
    return `<div class="inv-level"><img class="${b[key] ? '' : 'is-missing'}" src="${icon('items', id)}" alt=""><span class="inv-fname"${NT}>${esc(pick(it.name))}</span>
      <div class="seg sm" role="group" aria-label="${esc(pick(it.name))}">${opts}</div></div>`;
  }
  function hornet(b, still) {
    return `<section class="inv-sec">${head(t('ctBody'))}
      ${pieces(b, 'masks', t('cat_masks'), 5, 5, `<img src="${ART.mask}" alt="">`, still)}
      ${pieces(b, 'spools', t('invSilk'), 9, 9, '<i class="inv-bead"></i>', still)}
      ${pieces(b, 'hearts', t('cat_hearts'), 0, 3, `<img src="${icon('pieces', 'silk-heart')}" alt="">`, still)}
      <div class="inv-levels">${level(b, 'kit', 'crafting-kit', still)}${level(b, 'pouch', 'tool-pouch', still)}</div></section>`;
  }
  /* Plates: the Silk Skills with what each deals at this build (js/engine.js), the abilities with
     Needle Strike's; the rest say whether they're learnt. A tap opens the game's text. */
  function plates(list, x2v) {
    return `<ul class="inv-plates">${list.map((x) => {
      const v = x.got ? x2v(x) : null;
      return `<li><button type="button" class="inv-plate${x.got ? '' : ' is-missing'}${picked === keyOf(x) ? ' is-picked' : ''}" data-act="${marking ? 'invOwn' : 'invPick'}" data-key="${esc(keyOf(x))}" ${marking ? `aria-pressed="${x.got}"` : `aria-expanded="${picked === keyOf(x)}"`}${NT}>
        <span class="inv-plate-art"><img src="${icon(x.list, x.id)}" alt="" loading="lazy"></span><span class="inv-plate-name">${esc(pick(x.name))}</span>
        <span class="inv-plate-v${v == null ? ' is-none' : ''}">${v == null ? esc(t(x.got ? 'invLearnt' : 'invNotLearnt')) : num(v)}</span></button></li>`;
    }).join('')}</ul>`;
  }

  let shown = [];   // what the last render drew, for the descriptions
  App.screens.game = (sec) => {
    const own = App.game();
    const b = App.currentBuild();
    // Free mode: its own marks over the free build's ladders, or with none yet, everything.
    const have = own ? null : App.freeGame();
    const g = own || (have ? { ...have, needle: b.needle, kit: b.kit, pouch: b.pouch, masks: b.masks, spools: b.spools, hearts: b.hearts } : fullGame());
    marking = !own;
    // In free mode with no marks everything is had, the loose pieces too (a full game has none left loose).
    const all = shown = things(g).map((x) => (own || have ? x : { ...x, got: true }));
    const by = (list) => all.filter((x) => x.list === list);
    const still = own ? ' disabled' : '';
    const cats = own || have ? Object.fromEntries(SS.completion.count(g).categories.map((c) => [c.id, c])) : {};
    const r = SS.engine.compute(b);
    const skillV = (x) => { const s = r.skills.find((y) => y.id === x.id); return s ? s.total : null; };
    const artV = (x) => (x.id === 'needle-strike' && r.strike ? r.strike.total : null);
    const tools = ['red', 'blue', 'yellow'].map((c) => {
      const l = by('tools').filter((x) => x.color === c);
      return `<p class="inv-sub" style="--c: var(--slot-${c})">${esc(t('ct_' + c))}${own || have ? ` <b>${num(l.filter((x) => x.got).length)}</b>` : ''}</p><ul class="inv-grid">${l.map(cell).join('')}</ul>`;
    }).join('');
    const items = [...by('items').filter((x) => x.id !== 'crafting-kit' && x.id !== 'tool-pouch'), ...by('pieces').filter((x) => x.id !== 'silk-heart')];
    const start = own ? `<p class="saves-note">${esc(t('invSave', { n: App.activeSlot() }))}</p>`
      : `<p class="inv-presets"><span class="lbl">${esc(t('invStart'))}</span><button type="button" class="text-btn" data-act="ctPreset" data-value="base">${esc(t('invBase'))}</button>
          <span class="lbl" aria-hidden="true">·</span><button type="button" class="text-btn" data-act="ctPreset" data-value="max">${esc(t('invMax'))}</button></p>`;
    sec.innerHTML = `<div class="inv">${brackets}${screenHead(esc(t('navGame')), start)}
      <div class="inv-body">
        <div class="inv-col">
          ${needles(b, still)}
          ${hornet(b, still)}
          <section class="inv-sec">${head(t('cat_skills'), cats.skills, 'skills')}${plates(by('skills'), skillV)}${open(by('skills'))}</section>
          <section class="inv-sec">${head(t('cat_arts'), cats.arts, 'arts')}${plates(by('arts'), artV)}${open(by('arts'))}</section>
        </div>
        <div class="inv-col">
          <section class="inv-sec is-tools">${head(t('cat_tools'), cats.tools, 'tools')}${tools}${open(by('tools'))}</section>
          <section class="inv-sec">${head(t('cat_crests'), cats.crests, 'crests')}<ul class="inv-grid">${by('crests').map(cell).join('')}</ul>${open(by('crests'))}</section>
          <section class="inv-sec">${head(t('invItems'), null, 'items')}<ul class="inv-grid is-items">${items.map(cell).join('')}</ul>${open(items)}</section>
        </div>
      </div>
    </div>`;
    before = { ...b };
  };

  /* Free mode's marks, changed: from what's marked (or, the first time, everything), then the
     free build loses what isn't had any more (js/app-tools.js, App.editFree). */
  function mark(f) {
    const cur = App.freeGame() || fullGame();
    const m = { tools: [...cur.tools], crests: [...cur.crests], skills: [...cur.skills], arts: [...cur.arts], everbloom: !!cur.everbloom, pieces: [...cur.pieces] };
    f(m);
    if (!m.crests.includes('hunter')) m.crests.unshift('hunter');
    App.setFreeGame(m);
    App.editFree((st) => {
      st.tools = st.tools.filter((id) => m.tools.includes(id));
      if (st.skill && !m.skills.includes(st.skill)) st.skill = null;
      if (!m.crests.includes(st.crest)) st.crest = 'hunter';
    });
  }
  const toggle = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  // The pieces of one kind, the first n in the list's order (and the rest of that kind off).
  const KIND = { 'mask-shard': 'mask-shard', 'spool-fragment': 'spool-fragment', 'memory-locket': 'memory-locket', craftmetal: 'craftmetal', 'pale-oil': 'pale-oil', flea: 'flea' };
  function setKind(m, kind, n) {
    const all = CO.PIECES.map((p, i) => (p[0] === kind ? i : -1)).filter((i) => i >= 0);
    m.pieces = [...m.pieces.filter((i) => CO.PIECES[i][0] !== kind), ...all.slice(0, Math.max(0, n))];
  }
  Object.assign(actions, {
    invOwn(node) {
      const x = shown.find((y) => keyOf(y) === node.dataset.key);
      if (!x) return;
      picked = keyOf(x);
      mark((m) => {
        if (['tools', 'crests', 'skills', 'arts'].includes(x.list)) m[x.list] = toggle(m[x.list], x.id);
        else if (x.id === 'everbloom') m.everbloom = !m.everbloom;
        else if (x.piece != null) m.pieces = toggle(m.pieces, x.piece);
      });
    },
    invAll(node) {
      const on = node.dataset.value === '1', list = node.dataset.list;
      mark((m) => {
        if (list === 'items') {
          m.everbloom = on;
          m.pieces = on ? CO.PIECES.map((p, i) => i) : [];
          return;
        }
        const ids = { tools: D.TOOLS, crests: D.CRESTS, skills: D.SKILLS, arts: D.ARTS }[list].map((y) => y.id);
        m[list] = on ? ids : [];
      });
    },
    invCount(node) {
      const x = shown.find((y) => keyOf(y) === node.dataset.key);
      if (!x || !x.n) return;
      const b = App.currentBuild(), v = Math.max(0, Math.min(x.n[1], Number(node.dataset.value)));
      // The loose shards and fragments come after those already in whole masks and spools.
      const over = x.id === 'mask-shard' ? 4 * b.masks : x.id === 'spool-fragment' ? 2 * b.spools : 0;
      mark((m) => setKind(m, KIND[x.id], over + v));
    },
    invPick(node) {
      picked = node.dataset.key === picked ? null : node.dataset.key;
      App.render();
      const b = document.querySelector(`[data-act="invPick"][data-key="${CSS.escape(node.dataset.key)}"]`);
      if (b) b.focus({ preventScroll: true });
    },
  });
})();
