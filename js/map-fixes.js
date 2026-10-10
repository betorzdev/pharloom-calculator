/* js/map-fixes.js: the Map's corrections by hand: WRITTEN by the Map's admin mode
   (#view=map&admin=1, saved through `npm run admin`, tools/admin.js), or pasted from its Copy.
   Not generated: `npm run data` never touches it, so a fix outlives a patch's regeneration.
   Points in the map image's pixels (js/map.js W × H, y downwards), one decimal.
     moved   a mark's key (as js/app-map.js things() names it: 'piece:3', 'extra:120', 'pin:7'…)
             → [x, y, scene]: where it really goes, over whatever the data says. The scene is
             the mark's when it was moved: a key that comes to name another thing (a list
             regenerated in another order) is left alone, and `npm test` says so.
     hidden  a mark's key → its scene: a mark the data has that shouldn't be on the map.
     added   { id: 'add:<n>', layer, x, y, scene, act?, check? }: a mark the data doesn't have,
             in one of the Map's layers (Places, People, Other collectibles), drawn as that
             layer's mark and named as it; scene the room under it; act 1-3 for the Act filter;
             check, in js/collectibles.js's form (['bool', scene, id]…), says when a save has it.
   The body of FIXES is rewritten whole by format() (keys sorted, one per line): keep its shape. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const FIXES = {
    moved: {
    },
    hidden: {
    },
    added: [
    ],
  };

  // FIXES as this file writes it, from `  const FIXES = {` to its `  };`.
  const n1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const q = (s) => JSON.stringify(s);
  const num = (id) => Number(String(id).split(':')[1]) || 0;
  const arr = (v) => (Array.isArray(v) ? `[${v.map(arr).join(', ')}]` : JSON.stringify(v));
  function format(f) {
    const moved = Object.keys(f.moved || {}).sort().map((k) => { const [x, y, s] = f.moved[k]; return `      ${q(k)}: [${n1(x)}, ${n1(y)}, ${q(s)}],`; });
    const hidden = Object.keys(f.hidden || {}).sort().map((k) => `      ${q(k)}: ${q(f.hidden[k])},`);
    const added = (f.added || []).slice().sort((a, b) => num(a.id) - num(b.id)).map((a) =>
      `      { id: ${q(a.id)}, layer: ${q(a.layer)}, x: ${n1(a.x)}, y: ${n1(a.y)}, scene: ${q(a.scene)}`
      + `${a.act ? `, act: ${a.act}` : ''}${a.check ? `, check: ${arr(a.check)}` : ''} },`);
    const block = (name, open, lines, close) => `    ${name}: ${open}\n${lines.map((l) => l + '\n').join('')}    ${close},\n`;
    return `  const FIXES = {\n${block('moved', '{', moved, '}')}${block('hidden', '{', hidden, '}')}${block('added', '[', added, ']')}  };`;
  }

  // The layers a mark can be added to (js/app-map.js LAYERS): the 100% is the game's whole list
  // already, and the save's own layers are the save's.
  const LAYERS = ['bench', 'bellway', 'ventrica', 'gauntlet', 'boss', 'bellshrine', 'lock', 'shop', 'shakra', 'wishwall', 'giver',
    'person', 'bone-scroll', 'weaver-effigy', 'choral-commandment', 'rune-harp', 'psalm-cylinder', 'arcane-egg', 'mossberry',
    'silkeater', 'memento', 'bellhome', 'spawn', 'rosary-cache', 'shard-cache', 'wall'];

  // A save check as js/collectibles.js writes them (js/savefile.js has() reads it).
  const KINDS = ['flag', 'min', 'quest', 'bool', 'visited', 'journal', 'relic', 'memento', 'int', 'geo', 'any', 'all', 'not'];
  const isCheck = (c) => Array.isArray(c) && KINDS.includes(c[0]) && c.length >= 2
    && (['any', 'all', 'not'].includes(c[0]) ? c.slice(1).every(isCheck)
      : c.slice(1).every((v) => typeof v === 'string' || Number.isFinite(v) || typeof v === 'boolean'));

  SS.mapFixes = { FIXES, LAYERS, format, isCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.mapFixes;
})();
