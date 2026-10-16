#!/usr/bin/env node
/* tools/admin.js: the site served locally, with the Map's admin mode able to save (ported from
   hallownest-calculator's). `npm run admin` serves the repo on http://localhost:8788 (the site
   itself needs no server: this one is only so the admin mode can write) and answers two calls of
   js/app-map-admin.js's:
     GET  /__admin/ping       → { ok: true }: the page knows it can save, not just copy
     POST /__admin/map-fixes  { moved, hidden } → checked (check()), written into
                              js/map-fixes.js (its FIXES, by its own format(); the header kept)
                              → { ok: true, n }
   Nothing else: no listing, no paths outside the repo, no other writes. No dependencies.
   js/map-fixes.js is also rewritten by tools/follow-fixes.js (called by the generators) when a list
   a fix is keyed by shifts; it shares withFixes() with this server.
   Also, for the tests: places(), every mark's key on the map → its scene, as js/app-map.js
   things() names them with no save; check() and withFixes(). */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const M = require('../js/map.js');
const R = require('../js/rooms.js');
const CO = require('../js/collectibles.js');
const GA = require('../js/gauntlets.js');
const QU = require('../js/quests.js');
const SP = require('../js/spots.js');
const PE = require('../js/people.js');
const MF = require('../js/map-fixes.js');
const FF = require('./follow-fixes.js');
const D = require('../js/data.js');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8788);   // the sibling's takes 8787
const FIXES_FILE = path.join(ROOT, 'js', 'map-fixes.js');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json' };

/* Every mark's key → its scene, as js/app-map.js things() builds them with no save (the pins all
   there, the save's own layers left out). Keep it in step with things(): a key it doesn't know
   is a stale fix to `npm test`. */
function places() {
  const out = new Map();
  const add = (key, scene) => { if (scene && R.roomOf(scene)) out.set(key, scene); };
  CO.PIECES.forEach((p, i) => add('piece:' + i, SP.AT.pieces[i]));
  for (const ids of CO.COUNTED) add('tools:' + ids[0], SP.AT.tools[ids[0]]);
  // The six outside the 100% (js/app-map.js OTHER_TOOLS).
  for (const id of Object.keys(CO.TOOLS)) if (!CO.COUNTED.some((ids) => ids[0] === id)) add('tools:' + id, SP.AT.tools[id]);
  // The abilities outside the 100% (js/app-map.js, the Needolin melodies).
  for (const x of D.ARTS) if (!CO.WHERE.arts[x.id]) add('arts:' + x.id, SP.AT.arts[x.id]);
  for (const cat of ['crests', 'skills', 'arts']) for (const id of Object.keys(CO.WHERE[cat])) add(cat + ':' + id, SP.AT[cat][id]);
  add('everbloom', SP.AT.everbloom);
  M.PINS.forEach((p, i) => out.set('pin:' + i, p[3]));
  for (const x of GA.GAUNTLETS) add('gaunt:' + x.id, x.scene);
  for (const [foe, scene] of SP.BOSSES) add('boss:' + foe, scene);
  for (const [field, scene] of SP.BELLS) add('bell:' + field, scene);
  for (const [v, scenes] of Object.entries(SP.VENDORS)) scenes.forEach((scene, i) => add((v === 'shakra' ? 'shakra:' : 'shop:' + v + ':') + i, scene));
  for (const x of PE.TRADE) x.spots.forEach(([scene], i) => add('shop:' + x.id + ':' + i, scene));
  const isWish = (quest) => CO.WISHES.some((w) => w[2][0] === 'quest' && w[2][1] === quest);
  for (const [quest, f] of Object.entries(QU.FROM)) {
    if (!isWish(quest)) continue;
    if (f.board) add('board:' + f.board.toLowerCase(), f.board);
    for (const n of f.npc || []) add('giver:' + n.toLowerCase(), n);
  }
  SP.TASKS.forEach((x, i) => add('task:' + i, x[3]));
  for (const [id, scene] of Object.entries(SP.PEOPLE)) add('person:' + id, scene);
  for (const x of PE.PEOPLE) for (const [scene] of x.spots) add('npc:' + x.id + ':' + scene.toLowerCase(), scene);
  SP.EXTRAS.forEach((x, i) => { if (!(x[0] === 'map' && x[5] && x[5].shop === 'shakra')) add('extra:' + i, x[3]); });
  return out;
}

/* The fixes checked: their shape, each point on the map (a margin of 40 px: a mark may sit a
   little off the drawn rooms). → the error, or '' */
function check(f) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) return 'not an object';
  const { moved = {}, hidden = {}, ...rest } = f;
  if (typeof moved !== 'object' || Array.isArray(moved) || typeof hidden !== 'object' || Array.isArray(hidden)) return 'moved or hidden: wrong shape';
  if (Object.keys(rest).length) return 'only moved and hidden: ' + Object.keys(rest).join(', ');
  const PAD = 40;
  const onMap = (x, y) => Number.isFinite(x) && Number.isFinite(y) && x >= -PAD && x <= M.W + PAD && y >= -PAD && y <= M.H + PAD;
  const scene = (s) => typeof s === 'string' && /^[\w ()-]{1,64}$/.test(s);
  for (const [k, p] of Object.entries(moved)) {
    if (!k) return 'an empty key';
    if (!Array.isArray(p) || p.length !== 3 || !onMap(p[0], p[1]) || !scene(p[2])) return `moved ${k}: not [x, y, scene] on the map`;
  }
  for (const [k, s] of Object.entries(hidden)) if (!k || !scene(s)) return `hidden ${k}: not a scene`;
  return '';
}
// The file's new text: FIXES as format() writes it, the rest (the header, format itself) as it is
// (tools/follow-fixes.js writes it the same way when a generator shifts a list).
const withFixes = (text, fixes) => FF.withFixes(text, fixes, MF);

const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
function serveFile(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) || file.includes(path.sep + '.git' + path.sep)) return json(res, 403, { error: 'outside the repo' });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return json(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/__admin/ping') return json(res, 200, { ok: true });
  if (req.method === 'POST' && req.url === '/__admin/map-fixes') {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 2e6) req.destroy(); });
    req.on('end', () => {
      let fixes;
      try { fixes = JSON.parse(data); } catch { return json(res, 400, { error: 'not JSON' }); }
      const err = check(fixes);
      if (err) return json(res, 400, { error: err });
      try {
        fs.writeFileSync(FIXES_FILE, withFixes(fs.readFileSync(FIXES_FILE, 'utf8'), fixes));
      } catch (e) { return json(res, 500, { error: e.message }); }
      const n = Object.keys(fixes.moved || {}).length + Object.keys(fixes.hidden || {}).length;
      console.log(`js/map-fixes.js written: ${n} fix${n === 1 ? '' : 'es'}`);
      return json(res, 200, { ok: true, n });
    });
    return;
  }
  if (req.method !== 'GET') return json(res, 405, { error: 'method' });
  serveFile(req, res);
});
if (require.main === module) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Admin: open http://localhost:${PORT}/#view=map&admin=1`);
    console.log('Move or hide marks and press Save: it writes js/map-fixes.js. Ctrl+C to stop.');
  });
}

module.exports = { places, check, withFixes };
