/* js/completion.js — your game's completion: the 100% the game counts, and what it's made of.
   Pure: no DOM and no language. The names come with the screen.

   The rules are the wiki's ("Completion (Silksong)"): ten categories that add up to 100. The
   way the game counts them was found on real saves, not taken from a tracker: set against
   playerData.completionPercentage in 92 saves of the author's (three Classic games and one
   Steel Soul, 0% to 100%, patches 1.0.28891 to 1.0.30000, restore points included), this
   matches all 92 (npm run check-pack). Two things the trackers count otherwise:
     · masks and spools count WHOLE: maxHealthBase − 5 and silkMax − 9. Two loose Mask Shards
       and one Spool Fragment are 0%, not 0.5 + 0.5.
     · the Silk Skills count by their has* flag (js/savefile.js), which a restore point already
       has when the Tools list doesn't yet.
   And one the game's text says and a tracker could miss: a Tool and its upgrade (Curveclaw and
   Curvesickle, Druid's Eye and Eyes, Claw Mirror and Mirrors, Dead Bug's Purse and Shell
   Satchel) are one point (js/collectibles.js, COUNTED).

   The input is js/savefile.js's game(): { tools, crests, skills, arts, masks, spools, hearts,
   needle, kit, pouch, everbloom }. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const CO = SS.collectibles || require('./collectibles.js');

  // The Crests that count: every one but the Hunter's, which Hornet starts with.
  const CRESTS = Object.freeze(['reaper', 'wanderer', 'beast', 'witch', 'architect', 'shaman']);
  const SKILLS = Object.freeze(['silkspear', 'thread-storm', 'cross-stitch', 'sharpdart', 'rune-rage', 'pale-nails']);
  // The seven abilities of the 100% (the cloaks aren't among them: Drifter's and Faydown).
  const ARTS = Object.freeze(['needolin', 'swift-step', 'cling-grip', 'clawline', 'silk-soar', 'sylphsong', 'needle-strike']);

  const upTo = (v, max) => Math.max(0, Math.min(max, Number(v) || 0));
  /* The categories in the wiki's order: id, what it's out of, and what the game counts. */
  const CATEGORIES = Object.freeze([
    { id: 'tools', max: 51, got: (g) => CO.COUNTED.filter((ids) => ids.some((id) => g.tools.includes(id))).length },
    { id: 'spools', max: 9, got: (g) => upTo(g.spools, 9) },
    { id: 'upgrades', max: 8, got: (g) => upTo(g.kit, 4) + upTo(g.pouch, 4) },
    { id: 'arts', max: 7, got: (g) => ARTS.filter((id) => g.arts.includes(id)).length },
    { id: 'skills', max: 6, got: (g) => SKILLS.filter((id) => g.skills.includes(id)).length },
    { id: 'crests', max: 6, got: (g) => CRESTS.filter((id) => g.crests.includes(id)).length },
    { id: 'masks', max: 5, got: (g) => upTo(g.masks, 5) },
    { id: 'needle', max: 4, got: (g) => upTo(g.needle, 4) },
    { id: 'hearts', max: 3, got: (g) => upTo(g.hearts, 3) },
    { id: 'items', max: 1, got: (g) => (g.everbloom ? 1 : 0) },
  ]);

  const EMPTY = { tools: [], crests: [], skills: [], arts: [], masks: 0, spools: 0, hearts: 0, needle: 0, kit: 0, pouch: 0, everbloom: false };

  /* A game → { total, max, categories: [{ id, got, max }] }. */
  function count(game) {
    const g = { ...EMPTY, ...(game || {}) };
    const categories = CATEGORIES.map((c) => ({ id: c.id, got: c.got(g), max: c.max }));
    return { total: categories.reduce((a, c) => a + c.got, 0), max: 100, categories };
  }

  SS.completion = { CATEGORIES, CRESTS, SKILLS, ARTS, count };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.completion;
})();
