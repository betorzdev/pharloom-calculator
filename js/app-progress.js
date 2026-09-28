/* js/app-progress.js — Progress: what's missing for 100%, piece by piece, and what lies beyond it.
   The wiki's ten categories in its order (js/completion.js), each with its things by name —the
   Tools, Crests, Silk Skills and abilities— or one by one —which Mask Shard, which Crafting Kit—,
   each with its Act and the area it's in (js/collectibles.js: the area its entry is filed
   under, named as the game names it). Then the collectibles that don't count but open things:
   Memory Lockets, Craftmetal, Pale Oil and the Lost Fleas, and the enemy gauntlets. In a save, only what's missing by
   default (or everything, ticked where you have it), and what belongs to a later Act than
   yours dimmed; without one, the whole list, as a guide. The exact spot (which room) comes with
   the map. Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const D = SS.data, CO = SS.collectibles, CP = SS.completion;
  const App = SS.app;
  const { t, pick, esc, NT, brackets, screenHead, prefs, savePrefs, render, actions } = App;

  const num = (n) => App.NF[0].format(n);
  const item = (id) => D.ITEMS.find((x) => x.id === id);
  const KIND_NAME = {
    'mask-shard': () => pick(item('mask-shard').name), 'spool-fragment': () => pick(item('spool-fragment').name),
    'memory-locket': () => pick(item('memory-locket').name), craftmetal: () => pick(item('craftmetal').name),
    'pale-oil': () => pick(item('pale-oil').name), 'tool-pouch': () => pick(item('tool-pouch').name),
    'crafting-kit': () => pick(item('crafting-kit').name), flea: () => t('kind_flea'), 'silk-heart': () => t('kind_silkHeart'),
  };
  const areaName = (a) => (a && CO.AREAS[a] ? pick(CO.AREAS[a]) : '');

  /* One row: its name, whether you have it, its Act and its area. */
  function row({ name, got, act, area, color }, g) {
    const later = g && !got && act > g.act;
    const where = [act ? t('saveAct', { n: act }) : '', areaName(area)].filter(Boolean);
    return `<li class="pg-item${got ? ' is-got' : ''}${later ? ' is-later' : ''}"${later ? ` title="${esc(t('pgLater', { n: act }))}"` : ''}>
        <span class="pg-mark" aria-hidden="true">${got ? App.tick : ''}</span>
        ${color ? `<span class="pg-slot is-${color}" aria-hidden="true"></span>` : ''}
        <span class="pg-name"${NT}>${esc(name)}</span>
        ${got ? `<span class="sr-only">${esc(t('pgGot'))}</span>` : ''}
        <span class="pg-where">${where.map((w, i) => `<span${i ? NT : ''}>${esc(w)}</span>`).join('')}</span>
      </li>`;
  }

  /* The things of a category: [{ name, got, act, area, color }] in the order to show them. */
  const byAct = (a, b) => (a.act || 9) - (b.act || 9) || areaName(a.area).localeCompare(areaName(b.area));
  function things(g) {
    const has = (list, id) => !!g && list.includes(id);
    const where = (map, id) => { const w = map[id] || []; return { act: w[0] || 0, area: w[1] || null }; };
    const pieces = (kind, name) => CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
      .map(({ p, i }, k) => ({ name: name ? name(k) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3] }));
    const tools = CO.COUNTED.map((ids) => {
      const tool = D.TOOLS.find((x) => x.id === ids[0]);
      const got = !!g && ids.some((id) => g.tools.includes(id));
      return { name: pick(tool.name), got, color: tool.color, ...where(CO.WHERE.tools, ids[0]) };
    });
    const named = (list, ids, map, key) => ids.map((id) => ({ name: pick(list.find((x) => x.id === id).name), got: has(g ? g[key] : [], id), ...where(map, id) }));
    const ev = CO.WHERE.everbloom || [];
    return {
      tools: tools.sort(byAct),
      spools: pieces('spool-fragment').sort(byAct),
      upgrades: [...pieces('crafting-kit'), ...pieces('tool-pouch')].sort(byAct),
      arts: named(D.ARTS, CP.ARTS, CO.WHERE.arts, 'arts').sort(byAct),
      skills: named(D.SKILLS, CP.SKILLS, CO.WHERE.skills, 'skills').sort(byAct),
      crests: named(D.CRESTS, CP.CRESTS, CO.WHERE.crests, 'crests').sort(byAct),
      masks: pieces('mask-shard').sort(byAct),
      needle: pieces('needle', (k) => pick(D.NEEDLES[k + 1].name)),
      hearts: pieces('silk-heart').sort(byAct),
      items: [{ name: pick(item('everbloom').name), got: !!g && g.everbloom, act: ev[0] || 3, area: ev[1] || null }],
    };
  }
  // A category's own note: masks and spools count whole, not by piece.
  const NOTE = { masks: 'pgWholeNote', spools: 'pgSpoolNote' };
  const BEYOND = [['memory-locket'], ['craftmetal'], ['pale-oil'], ['flea', 'kind_fleas'], ['old-heart', 'kind_oldHearts'], ['melody', 'kind_melodies']];
  // The abilities that aren't in the 100%: the two cloaks, Beastling Call and Elegy of the Deep.
  const OTHER_ARTS = ['drifters-cloak', 'faydown-cloak', 'beastling-call', 'elegy-of-the-deep'];

  function group(id, title, list, g, got, max) {
    const all = prefs.pgAll || !g;
    const shown = all ? list : list.filter((x) => !x.got);
    const done = g && got >= max;
    const body = shown.length ? `<ul class="pg-list">${shown.map((x) => row(x, g)).join('')}</ul>`
      : `<p class="pg-done">${App.tick}${esc(t('pgDone'))}</p>`;
    return `<section class="pg-group${done ? ' is-done' : ''}" aria-labelledby="pg-${id}">
        <h3 class="pg-head" id="pg-${id}"><span class="pg-title">${esc(title)}</span>
          ${g ? `<span class="pg-count"><b>${num(got)}</b><i class="u">/${num(max)}</i></span>` : `<span class="pg-count"><i class="u">${num(max)}</i></span>`}</h3>
        ${NOTE[id] ? `<p class="pg-note">${esc(t(NOTE[id]))}</p>` : ''}
        ${body}
      </section>`;
  }

  /* The pane «Tareas»: the main objectives, then the wishes by type, each with the game's name. */
  const TYPE_NAME = { 'main-objectives': () => t('pgTasksMain'), collect: () => t('pgTasksCollect') };
  function tasks(g) {
    // A wish only one mode has (the Steel Soul's, a Classic one) shows in a game of that mode.
    const m = App.gameMeta();
    const mode = !g ? null : m && m.steel ? 'steel' : 'classic';
    return CO.WISH_TYPES.map((ty) => {
      const list = CO.WISHES.map((w, i) => ({ w, i })).filter(({ w }) => w[0] === ty.id && (!mode || !w[5] || w[5] === mode))
        .map(({ w, i }) => ({ name: pick(w[4]), got: !!g && g.wishes.includes(i), act: w[1], area: w[3] })).sort(byAct);
      const title = ty.name ? pick(ty.name) : TYPE_NAME[ty.id]();
      return list.length ? group('wish-' + ty.id, title, list, g, list.filter((x) => x.got).length, list.length) : '';
    }).join('');
  }

  App.screens.progress = (sec) => {
    const g = App.game();
    const all = things(g);
    const c = g ? CP.count(g) : null;
    const seg = g ? `<div class="seg pg-seg" role="group" aria-label="${esc(t('pgShow'))}">
        <button type="button" data-act="pgShow" data-value="missing" aria-pressed="${!prefs.pgAll}">${esc(t('pgMissing'))}</button>
        <button type="button" data-act="pgShow" data-value="all" aria-pressed="${!!prefs.pgAll}">${esc(t('pgAll'))}</button>
      </div>` : `<p class="saves-note">${esc(t('pgFree'))}</p>`;
    const hundred = CP.CATEGORIES.map((k, i) => {
      const cat = c ? c.categories[i] : { got: 0, max: k.max };
      return group(k.id, t('cat_' + k.id), all[k.id], g, cat.got, cat.max);
    }).join('');
    const beyond = BEYOND.map(([kind, key]) => {
      const list = CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
        .map(({ p, i }) => ({ name: p[4] ? pick(p[4]) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3] })).sort(byAct);
      return group(kind, key ? t(key) : KIND_NAME[kind](), list, g, list.filter((x) => x.got).length, list.length);
    }).join('') + (() => {
      const list = OTHER_ARTS.map((id) => { const w = CO.WHERE.arts[id] || [];
        return { name: pick(D.ARTS.find((x) => x.id === id).name), got: !!g && g.arts.includes(id), act: w[0] || 0, area: w[1] || null }; });
      return group('other-arts', t('pgOtherArts'), list, g, list.filter((x) => x.got).length, list.length);
    })() + (() => {
      // The enemy gauntlets, in the wiki's order (by area), named as Combat names them.
      const list = SS.gauntlets.GAUNTLETS.map((x) => ({ name: App.gauntletName(x.id), got: !!g && g.gauntlets.includes(x.id), act: 0, area: x.area }));
      return group('gauntlets', t('ftModeGauntlets'), list, g, list.filter((x) => x.got).length, list.length);
    })();
    sec.innerHTML = `<div class="pg">${brackets}${screenHead(esc(t('navProgress')), seg)}
        <h3 class="pg-part">${esc(t('pg100'))}${c ? ` <b>${num(c.total)}${App.pctSpace()}</b>` : ''}</h3>
        <div class="pg-groups">${hundred}</div>
        <h3 class="pg-part">${esc(t('pgBeyond'))}</h3>
        <p class="pg-note">${esc(t('pgBeyondNote'))}</p>
        <div class="pg-groups">${beyond}</div>
        <h3 class="pg-part">${esc(t('pgTasks'))}</h3>
        <p class="pg-note">${esc(t('pgTasksNote'))}</p>
        <div class="pg-groups">${tasks(g)}</div>
      </div>`;
  };

  Object.assign(actions, {
    pgShow(node) {
      prefs.pgAll = node.dataset.value === 'all';
      savePrefs();
      render();
    },
  });
})();
