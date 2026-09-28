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
  const R = SS.rooms;
  /* How far a missing piece is from your bench, in rooms (js/rooms.js: the game's doors and the
     stations you've opened), for the pieces the save keeps in a room; set per render. */
  let away = () => null;
  /* Nearest first, when chosen: the missing rows by rooms from the bench, the ones with no room
     (a wish, an ability) after them in their own order. */
  const dist = (x) => (!x.got && x.scene ? away(x.scene) : null);
  const nearFirst = (rows) => (!prefs.pgNear ? rows
    : rows.map((x, i) => ({ x, i, d: dist(x) })).sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.i - b.i).map((e) => e.x));

  /* How to get a thing (js/how.js): its first way, in a few words, with the game's names; a thing
     lying in a room says nothing more than its area already does. */
  const HW = SS.how;
  const itemName = (id) => pick(item(id).name);
  function howText(ways) {
    const w = ways && ways[0];
    if (!w) return '';
    const npc = (id) => (HW.NPCS[id] ? pick(HW.NPCS[id]) : id);
    const cost = [w.craftmetal ? `${num(w.craftmetal)} ${itemName('craftmetal')}` : '', w.paleOil ? `${num(w.paleOil)} ${itemName('pale-oil')}` : ''];
    const main = {
      shop: () => (w.price ? t('howShop', { vendor: npc(w.vendor), price: num(w.price) }) : npc(w.vendor)),
      npc: () => t('howGift', { npc: npc(w.npc) }),
      wish: () => t('howWish', { wish: pick(CO.WISHES[w.wish][4]) }),
      boss: () => t('howBoss', { foe: pick(SS.enemies.FOES.find((f) => f.id === w.foe).name) }),
      craft: () => t('howCraft'),
      challenge: () => t('howChallenge', { npc: npc(w.npc) }),
      fleas: () => (w.fleas === 'all' ? t('howFleasAll', { npc: npc(w.npc) }) : t('howFleas', { npc: npc(w.npc), n: num(w.fleas) })),
    }[w.kind];
    if (!main) return '';
    return [main(), ...cost, w.act ? t('howFromAct', { n: num(w.act) }) : ''].filter(Boolean).join(' · ');
  }

  /* One row: its name, whether you have it, its Act and its area; how to get it, when it's missing. */
  function row({ name, got, act, area, color, scene, sub = [], how }, g) {
    const later = g && !got && act > g.act;
    const n = !got && scene ? away(scene) : null;
    const steps = n == null ? '' : n === 0 ? t('mapHere') : t(n === 1 ? 'mapSteps1' : 'mapSteps', { n: num(n) });
    const where = [act ? t('saveAct', { n: act }) : '', areaName(area), steps, ...sub].filter(Boolean);
    return `<li class="pg-item${got ? ' is-got' : ''}${later ? ' is-later' : ''}"${later ? ` title="${esc(t('pgLater', { n: act }))}"` : ''}>
        <span class="pg-mark" aria-hidden="true">${got ? App.tick : ''}</span>
        ${color ? `<span class="pg-slot is-${color}" aria-hidden="true"></span>` : ''}
        <span class="pg-name"${NT}>${esc(name)}</span>
        ${got ? `<span class="sr-only">${esc(t('pgGot'))}</span>` : ''}
        <span class="pg-where">${where.map((w, i) => `<span${i ? NT : ''}>${esc(w)}</span>`).join('')}</span>
        ${!got && how ? `<span class="pg-how">${esc(how)}</span>` : ''}
      </li>`;
  }

  /* The things of a category: [{ name, got, act, area, color }] in the order to show them. */
  const byAct = (a, b) => (a.act || 9) - (b.act || 9) || areaName(a.area).localeCompare(areaName(b.area));
  function things(g) {
    const has = (list, id) => !!g && list.includes(id);
    const where = (map, id) => { const w = map[id] || []; return { act: w[0] || 0, area: w[1] || null }; };
    const pieces = (kind, name) => CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
      .map(({ p, i }, k) => ({ name: name ? name(k) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3], scene: R.sceneOf(p[2]),
        how: howText(HW.HOW.pieces[i]), ways: HW.HOW.pieces[i] }));
    const tools = CO.COUNTED.map((ids) => {
      const tool = D.TOOLS.find((x) => x.id === ids[0]);
      const got = !!g && ids.some((id) => g.tools.includes(id));
      return { name: pick(tool.name), got, color: tool.color, ...where(CO.WHERE.tools, ids[0]), how: howText(HW.HOW.tools[ids[0]]), ways: HW.HOW.tools[ids[0]] };
    });
    const named = (list, ids, map, key) => ids.map((id) => ({ name: pick(list.find((x) => x.id === id).name), got: has(g ? g[key] : [], id), ...where(map, id),
      how: howText(HW.HOW[key][id]), ways: HW.HOW[key][id] }));
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
      items: [{ name: pick(item('everbloom').name), got: !!g && g.everbloom, act: ev[0] || 3, area: ev[1] || null, how: howText(HW.HOW.everbloom), ways: HW.HOW.everbloom }],
    };
  }
  /* A group's own note: masks and spools count whole, not by piece; the Tools' traps (js/how.js
     TRAPS: the Curveclaw handed over, the Silkshot's repairs); and what each of the other
     collectibles is for. */
  const toolName = (id) => pick(D.TOOLS.find((x) => x.id === id).name);
  const NOTE = { masks: () => t('pgWholeNote'), spools: () => t('pgSpoolNote'),
    tools: () => t('pgToolsTrap', { curveclaw: toolName('curveclaw'), curvesickle: toolName('curvesickle'), silkshot: toolName('silkshot') }),
    'memory-locket': () => t('pgNote_memoryLocket'), craftmetal: () => t('pgNote_craftmetal'), 'pale-oil': () => t('pgNote_paleOil'),
    flea: () => t('pgNote_flea'), 'old-heart': () => t('pgNote_oldHeart'), melody: () => t('pgNote_melody'),
    'other-arts': () => t('pgNote_otherArts'), gauntlets: () => t('pgNote_gauntlets') };
  const BEYOND = [['memory-locket'], ['craftmetal'], ['pale-oil'], ['flea', 'kind_fleas'], ['old-heart', 'kind_oldHearts'], ['melody', 'kind_melodies']];
  // The abilities that aren't in the 100%: the two cloaks, Beastling Call and Elegy of the Deep.
  const OTHER_ARTS = ['drifters-cloak', 'faydown-cloak', 'beastling-call', 'elegy-of-the-deep'];

  function group(id, title, list, g, got, max) {
    const all = prefs.pgAll || !g;
    const shown = nearFirst(all ? list : list.filter((x) => !x.got));
    const done = g && got >= max;
    const body = shown.length ? `<ul class="pg-list">${shown.map((x) => row(x, g)).join('')}</ul>`
      : `<p class="pg-done">${App.tick}${esc(t('pgDone'))}</p>`;
    return `<section class="pg-group${done ? ' is-done' : ''}" aria-labelledby="pg-${id}">
        <h3 class="pg-head" id="pg-${id}"><span class="pg-title">${esc(title)}</span>
          ${g ? `<span class="pg-count"><b>${num(got)}</b><i class="u">/${num(max)}</i></span>` : `<span class="pg-count"><i class="u">${num(max)}</i></span>`}</h3>
        ${NOTE[id] ? `<p class="pg-note">${esc(NOTE[id]())}</p>` : ''}
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

  /* The road to the next Act (js/acts.js, the game's own rules in js/quests.js): its steps in
     order, each with what's left. In a save, the road from its Act (none in Act 3); without one,
     both roads, as a guide. A slot saved before the site read the wishes' quests has none of
     them: it says to import the save again. */
  const A = SS.acts, QU = SS.quests, EN = SS.enemies;
  const foeName = (id) => pick(EN.FOES.find((f) => f.id === id).name);
  const artName = (id) => pick(D.ARTS.find((x) => x.id === id).name);
  // Where the Soul Snare's pieces are (the wiki's pages for each: Maiden's Soul, Hermit's Soul,
  // Seeker's Soul, Snare Setter), as areas of js/collectibles.js.
  const SNARE_AREA = { 'Snare Soul Churchkeeper': 'BONEBOTTOM', 'Snare Soul Bell Hermit': 'BELLHART',
    'Snare Soul Swamp Bug': 'SHADOW', 'Silk Snare': 'WEAVE_PRIME' };
  const wishName = (q) => pick(QU.CHAIN[q].name);
  // The three melodies the Cradle's way asks for (the pieces of kind 'melody').
  const melodies = (g) => (g ? CO.PIECES.filter((p, i) => p[0] === 'melody' && g.pieces.includes(i)).length : 0);

  /* A wish of a group as a row: its Act and area (the pane's, js/collectibles.js WISHES), half a
     point when it's worth that, and the wishes to do before it. */
  function wishRow(x, got) {
    const w = x.wish >= 0 ? CO.WISHES[x.wish] : null;
    const runt = HW.TRAPS.find((r) => r.id === 'broodfeast-runt');
    const sub = [x.value === 0.5 ? t('roadHalf') : '', !got && x.before.length ? t('roadBefore', { name: x.before.map(wishName).join(', ') }) : '',
      !got && runt && x.quest === runt.counts ? t('roadRunt') : ''];
    return { name: x.name ? pick(x.name) : w ? pick(w[4]) : x.quest, got, act: w ? w[1] : 0, area: w ? w[3] : null, sub };
  }
  function groupRows(name, g, required) {
    const done = new Set(g ? g.quests : []);
    return QU.GROUPS[name].quests.filter((q) => q.required === required)
      .map((q) => wishRow(A.missing(q.quest, done, required ? undefined : q.value), done.has(q.quest))).sort(byAct);
  }
  // met: a part already fulfilled (enough points) shows its rows only with Everything.
  const list = (rows, g, met) => {
    if (met && g && !prefs.pgAll) return '';
    const shown = nearFirst(prefs.pgAll || !g ? rows : rows.filter((x) => !x.got));
    return shown.length ? `<ul class="pg-list">${shown.map((x) => row(x, g)).join('')}</ul>` : '';
  };
  const count = (got, max) => `<span class="pg-count"><b>${num(got)}</b><i class="u">/${num(max)}</i></span>`;
  // A count past its target (21 points of 17) shows the target met, with a tick.
  const subHead = (title, got, max, g) => `<p class="pg-sub"><span>${esc(title)}</span>${!g ? `<span class="pg-count"><i class="u">${num(max)}</i></span>`
    : got >= max ? `<span class="pg-count"><span class="pg-mark">${App.tick}</span> <b>${num(max)}</b><i class="u">/${num(max)}</i></span>` : count(got, max)}</p>`;

  function step(n, s, title, body, g) {
    const state = !g ? '' : s.ok ? ' is-ok' : s.bypassed ? ' is-bypassed' : '';
    const mark = !g ? '' : s.total > 1 && !s.ok && !s.bypassed ? count(s.done, s.total) : s.ok || s.bypassed ? `<span class="pg-mark">${App.tick}</span>` : '';
    return `<li class="pg-step${state}"><h4 class="pg-step-h"><span class="pg-step-n">${num(n)}</span>
        <span class="pg-step-t">${esc(title)}</span>${mark}</h4>${s.bypassed && !s.ok ? `<p class="pg-note">${esc(t('roadBypassed', { phantom: foeName('phantom') }))}</p>` : ''}${body || ''}</li>`;
  }

  function toAct2(r, g) {
    const [bells, gate, judge] = r.steps;
    const shrines = bells.shrines.map((b) => ({ name: pick(b.name), got: b.ok, act: 1 }));   // named by their area already
    const gateName = pick(QU.CHAIN[gate.quest].name);
    return [
      step(1, bells, t('roadBells'), list(shrines, g), g),
      step(2, gate, t('roadGate', { gate: gateName }), '', g),
      step(3, judge, t('roadJudge', { judge: foeName('last-judge'), phantom: foeName('phantom') }), '', g),
      step(4, r.steps[3], t('roadCitadel'), '', g),
    ];
  }

  function toAct3(r, g) {
    const [unlock, offer, pieces, ready, silk] = r.steps;
    const wish = wishName(offer.quest);
    const rule = QU.GROUPS['Soul Snare'];
    const required = groupRows('Soul Snare', g, true), points = groupRows('Soul Snare', g, false);
    const test = (id) => unlock.tests.find((x) => x.id === id);
    const key = test('bellhomeKey').key;
    const checks = [
      { name: t('roadCaravan'), got: test('caravan').ok },
      { name: artName('faydown-cloak'), got: test('doubleJump').ok, ...(() => { const w = CO.WHERE.arts['faydown-cloak'] || []; return { act: w[0], area: w[1] }; })() },
      { name: t('roadLace'), got: test('laceTower').ok, act: 2, area: 'CRADLE', sub: [test('laceTower').ok ? '' : t('roadMelodies', { n: num(melodies(g)) })] },
      { name: t('roadKey'), got: test('bellhomeKey').ok, act: 2, area: 'BELLHART',
        sub: [test('bellhomeKey').ok ? '' : key.ready ? t('roadPavo') : t('roadKeyRule', { glory: wishName('Belltown House Mid'), n: num(key.need) })] },
    ].map((x) => ({ act: 0, area: null, ...x }));
    // The key's own rule, while it isn't there: Bellhart's Glory, then 2 of the group's wishes.
    const keyRows = [wishRow(key.gloryQuest, key.glory), ...groupRows('Belltown House Key', g, false)];
    const keyPart = g && !test('bellhomeKey').ok && !key.ready
      ? subHead(t('roadKeyHead', { key: t('roadKey') }), (key.glory ? 1 : 0) + Math.min(key.got, key.need), 1 + key.need, g) + list(keyRows, g) : '';
    const unlockBody = subHead(t('roadRequired'), unlock.required.done, unlock.required.total, g) + list(required, g, !unlock.required.missing.length)
      + subHead(t('roadPoints', { n: num(rule.target), max: num(unlock.points.max) }), unlock.points.got, unlock.points.need, g)
      + `<p class="pg-note">${esc(t('roadPointsNote'))}</p>` + list(points, g, unlock.points.got >= unlock.points.need)
      + subHead(t('roadChecks'), unlock.tests.filter((x) => x.ok).length, unlock.tests.length, g) + list(checks, g) + keyPart;
    const snare = pieces.pieces.map((x) => ({ name: pick(x.name), got: x.ok, act: 2, area: SNARE_AREA[x.save] || null }));
    return [
      step(1, unlock, t('roadUnlock', { wish }), unlockBody, g),
      step(2, offer, t('roadOffer', { wish, caretaker: t('roadCaretaker'), town: areaName('BELLHART'), clave: areaName('ENCLAVE') }), '', g),
      step(3, pieces, t('roadPieces'), list(snare, g), g),
      step(4, ready, t('roadReady', { caretaker: t('roadCaretaker') }), '', g),
      step(5, silk, t('roadSilk'), `<p class="pg-note">${esc(t('roadSilkNote'))}</p>`, g),
    ];
  }

  function roadHtml(g) {
    const roads = g ? [A.next(g)].filter(Boolean) : [A.next({ act: 1 }), A.next({ act: 2 })];
    if (!roads.length) return '';
    // A slot kept before the site read the quests: its wishes are there, its quests aren't.
    const stale = g && !g.quests.length && g.wishes.length;
    return roads.map((r) => `<section class="pg-road" id="pg-road-${r.act}" aria-labelledby="pg-road-${r.act}-h">
        <h3 class="pg-part" id="pg-road-${r.act}-h">${esc(t('roadTitle', { n: num(r.act) }))}${g ? ` <b>${num(r.done)}/${num(r.total)}</b>` : ''}</h3>
        <p class="pg-note">${esc(t(r.act === 3 ? 'roadNote3' : 'roadNote2'))}</p>
        ${stale ? `<p class="pg-note is-warn">${esc(t('roadStale'))}</p>` : ''}
        <ol class="pg-steps">${(r.act === 3 ? toAct3 : toAct2)(r, g).join('')}</ol>
      </section>`).join('');
  }

  /* What the missing things of the 100% cost where the first way is a shop or crafting: rosaries,
     Pale Oil and Craftmetal, against the rosaries the save carries. */
  function buyHtml(all) {
    let price = 0, oil = 0, metal = 0;
    for (const x of Object.values(all).flat()) {
      const w = !x.got && x.ways && x.ways[0];
      if (!w || (w.kind !== 'shop' && w.kind !== 'craft')) continue;
      price += w.price || 0; oil += w.paleOil || 0; metal += w.craftmetal || 0;
    }
    if (!price && !oil && !metal) return '';
    const m = App.gameMeta() || {};
    const extra = [oil ? t('pgBuyExtra', { n: num(oil), name: itemName('pale-oil') }) : '', metal ? t('pgBuyExtra', { n: num(metal), name: itemName('craftmetal') }) : ''].join('');
    return `<p class="pg-note pg-buy">${esc(t('pgBuy', { price: num(price), have: num(m.rosaries || 0), extra }))}</p>`;
  }

  App.screens.progress = (sec) => {
    const g = App.game();
    const w = g && g.bench ? R.walk(g.bench, g.lit) : null;
    away = (scene) => (w ? R.steps(g.bench, scene, g.lit, w) : null);
    const all = things(g);
    const c = g ? CP.count(g) : null;
    const seg = g ? `<div class="seg pg-seg" role="group" aria-label="${esc(t('pgShow'))}">
        <button type="button" data-act="pgShow" data-value="missing" aria-pressed="${!prefs.pgAll}">${esc(t('pgMissing'))}</button>
        <button type="button" data-act="pgShow" data-value="all" aria-pressed="${!!prefs.pgAll}">${esc(t('pgAll'))}</button>
      </div>${w ? `<div class="seg pg-seg" role="group" aria-label="${esc(t('pgOrder'))}">
        <button type="button" data-act="pgSort" data-value="act" aria-pressed="${!prefs.pgNear}">${esc(t('pgByAct'))}</button>
        <button type="button" data-act="pgSort" data-value="near" aria-pressed="${!!prefs.pgNear}">${esc(t('pgNear'))}</button>
      </div>` : ''}` : `<p class="saves-note">${esc(t('pgFree'))}</p>`;
    const hundred = CP.CATEGORIES.map((k, i) => {
      const cat = c ? c.categories[i] : { got: 0, max: k.max };
      return group(k.id, t('cat_' + k.id), all[k.id], g, cat.got, cat.max);
    }).join('');
    const beyond = BEYOND.map(([kind, key]) => {
      const list = CO.PIECES.map((p, i) => ({ p, i })).filter(({ p }) => p[0] === kind)
        .map(({ p, i }) => ({ name: p[4] ? pick(p[4]) : KIND_NAME[kind](), got: !!g && g.pieces.includes(i), act: p[1], area: p[3], scene: R.sceneOf(p[2]) })).sort(byAct);
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
        ${roadHtml(g)}
        <h3 class="pg-part">${esc(t('pg100'))}${c ? ` <b>${num(c.total)}${App.pctSpace()}</b>` : ''}</h3>
        ${g ? buyHtml(all) : ''}
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
    pgSort(node) {
      prefs.pgNear = node.dataset.value === 'near';
      savePrefs();
      render();
    },
    pgShow(node) {
      prefs.pgAll = node.dataset.value === 'all';
      savePrefs();
      render();
    },
  });
})();
