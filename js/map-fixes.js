/* js/map-fixes.js: the Map's corrections by hand: WRITTEN by the Map's admin mode
   (#view=map&admin=1, saved through `npm run admin`, tools/admin.js), or pasted from its Copy.
   Not generated, but the generators keep its keys in step: a key that names a place in a list
   ('extra:120', 'task:16', 'piece:3', 'pin:7', 'shakra:2', 'shop:pebb:0') is rekeyed by
   tools/follow-fixes.js when `npm run data` shifts that list, and the run stops if a mark can't
   be followed (gone, ambiguous, in another room). So a fix outlives a patch's regeneration.
   Points in the map image's pixels (js/map.js W × H, y downwards), one decimal.
     moved   a mark's key (as js/app-map.js things() names it: 'piece:3', 'extra:120', 'pin:7'…)
             → [x, y, scene]: where it really goes, over whatever the data says. The scene is
             the mark's when it was moved: a key that comes to name another thing (a list
             regenerated in another order) is left alone, and `npm test` says so.
     hidden  a mark's key → its scene: a mark the data has that shouldn't be on the map.
   Nothing is added by hand: a mark the data doesn't have couldn't follow the save.
   The body of FIXES is rewritten whole by format() (keys sorted, one per line): keep its shape. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const FIXES = {
    moved: {
    },
    hidden: {
    },
  };

  // FIXES as this file writes it, from `  const FIXES = {` to its `  };`.
  const n1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const q = (s) => JSON.stringify(s);
  function format(f) {
    const moved = Object.keys(f.moved || {}).sort().map((k) => { const [x, y, s] = f.moved[k]; return `      ${q(k)}: [${n1(x)}, ${n1(y)}, ${q(s)}],`; });
    const hidden = Object.keys(f.hidden || {}).sort().map((k) => `      ${q(k)}: ${q(f.hidden[k])},`);
    const block = (name, open, lines, close) => `    ${name}: ${open}\n${lines.map((l) => l + '\n').join('')}    ${close},\n`;
    return `  const FIXES = {\n${block('moved', '{', moved, '}')}${block('hidden', '{', hidden, '}')}  };`;
  }

  SS.mapFixes = { FIXES, format };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.mapFixes;
})();
