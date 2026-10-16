/* js/acts.js: the road to the next Act: what's done and what's left, from a save.
   Pure: no DOM and no language. The names come with the data ({ es, en, key }, the game's text).

   The input is js/savefile.js's game(). The rules are the game's own (js/quests.js, extracted
   from its files), checked on the author's 92 saves (npm run check-pack): every Act 3 save meets
   all of Act 3's road, and no earlier save does.

   Act 1 → 2 (the wiki's Acts page and the main objective Grand Gate): ring the five Bellshrines,
   open the Grand Gate and walk into the Citadel (act2Started). The Gate is one step with the Last
   Judge: the Needolin played before the great door calls her, and the objective is complete only
   once she's beaten and the door opens (the scene's Gate Quest Ender, on SeenLastJudgeGateOpen).
   Defeating the Phantom is the other way in, open from the start once Hornet has the Needolin (to
   cross the Mist) and the Cling Grip (to reach Sinner's Road): it takes the place of the
   Bellshrines and the Gate.
   Act 2 → 3:
     1. unlock    the game's group 'Soul Snare': its 10 required wishes, 17 of its 25 points (a
                  delivery is worth ½), and four checks on the save: the flea caravan at Fleatopia,
                  the Faydown Cloak, Lace beaten atop the Cradle's tower, and the Bellhome's key.
                  Pavo gives that key when Bellhart's Glory is done and 2 of the group 'Belltown
                  House Key''s wishes are (read from his FSM: the Belltown Greeter's). The
                  caravan settles in Fleatopia when Mooshka, at the Blasted Steps, has 22 fleas
                  and Hornet has seen the empty Pale Lake (his FSM there: Caravan Troupe Leader
                  Judge NPC, Fleas Saved and SeenFleatopiaEmpty), and once time has passed since
                  she met him there (CaravanTroupeLeaderCanLeaveJudge: GameManager.TimePasses sets
                  it after MetCaravanTroupeLeaderJudge, away from Coral_Judge_Arena; a bench's rest,
                  its Bench Control FSM's Save Game state, is where time passes).
                  While Hornet wears the Cursed Crest (PlayerData.IsAnyCursed: CurrentCrestID is
                  it), Pavo gives only his cursed talk, never the key (his FSM's Convo state:
                  IsAnyCursed and not soulSnareReady), and Grand Mother Silk's Death Type state
                  (cradle_03, Silk Boss) sends a cursed Hornet to Twisted Child, never the snare:
                  the road says so (cursed, from savefile's build).
     2. offer     the wish Silk and Soul accepted from the Caretaker (his FSM: Enclave Caretaker).
                  He offers it once the group holds (CaretakerOfferedSnareQuest, set as he offers
                  it, before the answer); taken from Bellhart's board, it still sends you to him.
                  Accepting begins Soul Snare, which completes its first stage, Soul Snare Pre
                  (a step begun completes the one before it, on every save read).
     3. pieces    the Soul Snare's four pieces: three souls and the Snare Setter.
     4. ready     the pieces given, the snare built (soulSnareReady).
     5. silk      Grand Mother Silk, snared with the Needolin: the world turns black-threaded.
   The last step of each road is the change of Act itself, so it's never done while the road shows. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const QU = SS.quests || require('./quests.js');
  const CO = SS.collectibles || require('./collectibles.js');

  /* The playerData fields the groups' tests read, as game() keeps them: field → [id, value]. A
     field the site doesn't read yet (after a patch) makes its test fail, and test/acts.test.js. */
  const FIELDS = {
    CaravanTroupeLocation: ['caravan', (g) => g.caravan],
    hasDoubleJump: ['doubleJump', (g) => g.doubleJump],
    defeatedLaceTower: ['laceTower', (g) => g.laceTower],
    BelltownGreeterHouseFullDlg: ['bellhomeKey', (g) => g.bellhomeKey],
  };
  const OPS = { '==': (a, b) => a === b, '!=': (a, b) => a !== b, '<': (a, b) => a < b, '>': (a, b) => a > b };
  const holds = (t, g) => !!FIELDS[t.field] && OPS[t.op](FIELDS[t.field][1](g), t.value);

  // The wish of the pane «Tareas» (js/collectibles.js WISHES) that a quest completes, or -1.
  const names = (c) => (c[0] === 'quest' ? [c[1]] : c[0] === 'any' || c[0] === 'all' ? c.slice(1).flatMap(names) : []);
  const WISH = new Map();
  CO.WISHES.forEach((w, i) => { for (const n of names(w[2])) if (!WISH.has(n)) WISH.set(n, i); });

  /* A quest not done → { quest, name, value?, wish, before }: its save name, its title, the
     index of its wish in js/collectibles.js WISHES (-1 if the pane doesn't list it), and the
     quests it waits for that aren't done, the first to do first (its previous steps and the
     quests it needs, walked back). A previous step with its own title is the same wish's first
     stage (taken from a board), and isn't listed. */
  function missing(quest, done, value) {
    const before = [], seen = new Set();
    const walk = (n) => {
      const e = QU.CHAIN[n];
      if (!e || seen.has(n)) return;
      seen.add(n);
      for (const p of [...(e.prev ? [e.prev] : []), ...(e.needs || [])]) {
        if (done.has(p)) continue;
        walk(p);
        const pe = QU.CHAIN[p];
        if (pe && !(p === e.prev && pe.name && e.name && pe.name.key === e.name.key)) before.push(p);
      }
    };
    walk(quest);
    const e = QU.CHAIN[quest] || {};
    return { quest, name: e.name || null, ...(value !== undefined ? { value } : {}), wish: WISH.has(quest) ? WISH.get(quest) : -1,
      before: [...new Set(before)] };
  }

  /* One of the game's groups (js/quests.js GROUPS) against a game → { ok, required: { done,
     total, missing }, points: { got, need, max, missing }, tests: [{ field, id, ok }] }. ok as
     the game's IsFulfilled: the tests, every required quest, and the points. Only the first
     group of tests is listed (the game's groups have one). */
  function group(name, g) {
    const G = QU.GROUPS[name];
    const done = new Set(g.quests || []);
    const req = G.quests.filter((q) => q.required);
    const pts = G.quests.filter((q) => !q.required);
    const got = G.quests.filter((q) => done.has(q.quest)).reduce((a, q) => a + q.value, 0);
    const tests = (G.tests[0] || []).map((t) => ({ field: t.field, id: FIELDS[t.field] ? FIELDS[t.field][0] : null, ok: holds(t, g) }));
    const required = { done: req.filter((q) => done.has(q.quest)).length, total: req.length,
      missing: req.filter((q) => !done.has(q.quest)).map((q) => missing(q.quest, done)) };
    const points = { got, need: G.target, max: G.quests.reduce((a, q) => a + q.value, 0),
      missing: pts.filter((q) => !done.has(q.quest)).map((q) => missing(q.quest, done, q.value)) };
    const testsOk = !G.tests.length || G.tests.some((grp) => grp.every((t) => holds(t, g)));
    return { ok: testsOk && required.missing.length === 0 && got >= G.target, required, points, tests };
  }

  const EMPTY = { quests: [], arts: [], bellshrines: [], lastJudge: false, phantom: false, caravan: 0, doubleJump: false,
    laceTower: false, bellhomeKey: false, snareOffered: false, snarePieces: [], snareReady: false, act: 1, pieces: [] };
  /* The Flea Caravan: CaravanTroupeLocation 0 the Marrow, 1 Greymoor, 2 the Blasted Steps, 3
     Fleatopia; it moves when Mooshka is spoken to. Its last move asks for 22 Lost Fleas (the
     game's Fleas Saved: the site's flea pieces, Kratt and Vog among them). */
  const FLEATOPIA = 3, FLEAS = 22;
  const FLEA_AT = CO.PIECES.map((p, i) => (p[0] === 'flea' ? i : -1)).filter((i) => i >= 0);
  const step = (id, done, total, extra) => ({ id, ok: done >= total, done, total, ...extra });

  // The abilities the Phantom's way asks: the Needolin for the Mist, the Cling Grip for Sinner's Road.
  const PHANTOM_NEEDS = ['needolin', 'cling-grip'];
  function toAct2(g) {
    const done = new Set(g.quests);
    const rung = QU.BELLSHRINES.map((b) => ({ field: b.field, name: b.name, area: b.field.replace(/^bellShrine/, '').toUpperCase(),
      ok: g.bellshrines.includes(b.field) }));
    const bypassed = g.phantom;
    return [
      step('bellshrines', rung.filter((b) => b.ok).length, rung.length, { bypassed, shrines: rung }),
      step('grand-gate', done.has('Grand Gate Bellshrines') || g.lastJudge ? 1 : 0, 1, { bypassed, quest: 'Grand Gate Bellshrines' }),
      step('citadel', 0, 1),
    ];
  }
  // The other way in: the Phantom, in place of the steps it skips.
  function altAct2(g) {
    const needs = PHANTOM_NEEDS.map((id) => ({ id, ok: (g.arts || []).includes(id) }));
    return [{ id: 'phantom', ok: g.phantom, open: needs.every((x) => x.ok), needs, skips: ['bellshrines', 'grand-gate'], joins: 'citadel' }];
  }

  // The Cursed Crest worn (js/savefile.js build.cursed: CurrentCrestID "Cursed").
  const cursed = (g) => !!(g.build && g.build.cursed);

  function toAct3(g) {
    const done = new Set(g.quests);
    const rule = group('Soul Snare', g);
    const key = group('Belltown House Key', g);
    const glory = missing('Belltown House Mid', done);
    // The Bellhome's key, under its check: Bellhart's Glory and 2 of the group's wishes.
    const tests = rule.tests.map((t) => (t.id === 'bellhomeKey' ? { ...t, key: {
      glory: done.has('Belltown House Mid'), gloryQuest: glory, got: key.points.got, need: key.points.need,
      missing: key.points.missing, ready: done.has('Belltown House Mid') && key.points.got >= key.points.need, cursed: cursed(g) } }
      // The caravan, while it isn't there: where it stands and the fleas rescued, of the 22.
      : t.id === 'caravan' ? { ...t, caravan: { at: Math.max(0, Math.min(FLEATOPIA, g.caravan | 0)),
        fleas: FLEA_AT.filter((i) => g.pieces.includes(i)).length, need: FLEAS } } : t));
    const unlockTotal = rule.required.total + 1 + tests.length;
    const unlockDone = rule.required.done + (rule.points.got >= rule.points.need ? 1 : 0) + tests.filter((t) => t.ok).length;
    const wished = g.snareOffered || done.has('Soul Snare Pre');
    // Accepted: Soul Snare begun (its Pre done), done, or the snare built. Offered and turned down isn't.
    const taken = done.has('Soul Snare Pre') || done.has('Soul Snare') || g.snareReady;
    const given = done.has('Soul Snare') || g.snareReady;
    const pieces = QU.SNARE.map((x) => ({ kind: x.kind, save: x.save, name: x.name, ok: given || g.snarePieces.includes(x.save) }));
    return [
      // unlock is done once the Caretaker offers the wish, whatever the save says now.
      step('unlock', wished ? unlockTotal : unlockDone, unlockTotal,
        { required: rule.required, points: rule.points, tests }),
      step('offer', taken ? 1 : 0, 1, { quest: 'Soul Snare Pre', declined: g.snareOffered && !taken }),
      step('pieces', pieces.filter((p) => p.ok).length, pieces.length, { pieces }),
      step('ready', g.snareReady ? 1 : 0, 1, { quest: 'Soul Snare' }),
      step('silk', 0, 1),
    ];
  }

  /* A game → the road to the next Act, or null in Act 3:
       { act: 2 or 3 (the Act it leads to), done, total (steps ok, of all), steps: [step], alt: [way],
         cursed (the road to Act 3 only: the Cursed Crest worn, which blocks it) }
     Each step is { id, ok, done, total } with its own parts:
       bellshrines  shrines: [{ field, name, area (an AREAS id), ok }], bypassed (the Phantom's way)
       grand-gate   quest ('Grand Gate Bellshrines', the main objective; done with the Last
                    Judge beaten), bypassed
       citadel      (the change of Act)
       unlock       required: { done, total, missing: [wish] }, points: { got, need, max,
                    missing: [wish with its value] }, tests: [{ field, id, ok }] (id: 'caravan',
                    'doubleJump', 'laceTower', 'bellhomeKey'); the bellhomeKey test carries key:
                    { glory, gloryQuest (a wish: Bellhart's Glory), got, need, missing: [wish],
                    ready (go and talk to Pavo), cursed (he won't, while she's cursed) }; the
                    caravan test carries caravan: { at (its
                    stop, 0 to 3), fleas (rescued), need (22) }
       offer        quest ('Soul Snare Pre': the wish Silk and Soul), declined (offered, and
                    turned down: talk to the Caretaker again)
       pieces       pieces: [{ kind, save, name, ok }]
       ready        quest ('Soul Snare')
       silk         (the change of Act)
     A wish is missing()'s { quest, name, value?, wish, before }.
     alt is the other ways in, beside the steps (none on the road to Act 3): { id ('phantom'), ok
     (taken), open (what it asks is held), needs: [{ id (an Ability), ok }], skips: [step id], joins
     (the step it leads back to) }. A step it skips is bypassed once it's taken. */
  function next(game) {
    const g = { ...EMPTY, ...(game || {}) };
    if (g.act >= 3) return null;
    const steps = g.act === 2 ? toAct3(g) : toAct2(g);
    const ok = steps.filter((s) => s.ok || s.bypassed).length;
    return { act: g.act + 1, done: ok, total: steps.length, steps, alt: g.act === 2 ? [] : altAct2(g), ...(g.act === 2 ? { cursed: cursed(g) } : {}) };
  }

  SS.acts = { FIELDS, FLEAS, group, missing, next };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.acts;
})();
