#!/usr/bin/env node
/* tools/trailer/make.js: the announcement video, 36 s at 1920 × 1080 and 60 fps, made from the site
   itself. One command:
     npm run trailer -- --before <save> --after <save> [--out <file.mp4>]
   The video: Hornet falls in on the first hit of Lace's battle theme and the title slams in; a save
   is dropped on Your game and the site is that game; Hornet rests at a bench in the game and the
   site catches up with the next save («Since the previous save»); the Map with every pin, and
   everything the save has leaves it, pin by pin; Progress (the road to the next Act, the 100%, the
   tasks); the Journal, the Inventory, the 100% the game counts, the Crest screen, the site in
   Spanish; the address. Every cut is on the music's beats (stage/beats.js). In English, for Reddit
   (Albert, 15-Oct-2026: the 16:9 cut, the theme's loud section, an Act 2 game so as to show no Act 3).

   --before, --after   two saves of one game, the older and the newer (the video was made with
                       Restore_Points1/restoreData18.dat and restoreData19.dat of Albert's first game:
                       Act 2, 45% to 55%, 36 things new). The saves are read, never copied to the repo.
   --out <file>        the video (default <cache>/trailer.mp4)
   --stills <t,t…>     instead of the video, PNGs of those moments (seconds) in <cache>/stills/
   --thumb <file>      also a PNG of the title (3.3 s), for the post's thumbnail
   --from, --to        only part of it, in seconds (the frames before --from still run, uncaptured)
   --game <dir>        the installed game (default Steam's on Linux)

   How: a page (stage/composer.html) holds the site in a frame and draws over it (Hornet from the
   game's own frames, the captions, the transitions, the Map's pins leaving). Headless Chrome runs
   it frame by frame: stage/timeshim.js replaces the clocks and timers of the page and the site and
   holds their CSS animations, so every frame is the exact moment, whatever capture takes. The site
   is served with the stage on one origin (the stage drives it: loads a save, clicks a tab, drops
   the file); each state of a save is the localStorage the site's own import leaves (as
   tools/drive.js seeds it). What comes from the game (Hornet's clips, the music) is extracted once
   into the cache by extract-game.py, run with $PYTHON or else uvx (UnityPy, Pillow). ffmpeg is
   $FFMPEG, or on the PATH, or imageio-ffmpeg's through uvx.
   Needs Node 22 and google-chrome. Starts its own server and Chrome, and stops both. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { spawn, spawnSync } = require('child_process');
const { launch } = require('./cdp.js');

const HERE = __dirname, SITE = path.resolve(HERE, '../..'), STAGE = path.join(HERE, 'stage');
const CACHE = path.join(os.tmpdir(), 'pharloom-trailer');
const F = require(path.join(SITE, 'js/savefile.js')), S = require(path.join(SITE, 'js/saves.js'));

function usage(msg) {
  if (msg) console.error(msg);
  console.error('usage: npm run trailer -- --before <save> --after <save> [--out <file.mp4>] [--stills t,t] [--thumb <png>] [--from s] [--to s] [--game <dir>]');
  process.exit(2);
}
const opt = { fps: 60, port: 8772, chrome: 9476, game: path.join(os.homedir(), '.local/share/Steam/steamapps/common/Hollow Knight Silksong') };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  const k = (/^--([a-z]+)$/.exec(argv[i]) || [])[1];
  if (!k || !['before', 'after', 'out', 'stills', 'thumb', 'from', 'to', 'game', 'fps', 'port'].includes(k)) usage('unknown option: ' + argv[i]);
  if (i + 1 >= argv.length) usage('missing value for ' + argv[i]);
  opt[k] = argv[i + 1];
}
if (!opt.before || !opt.after) usage('--before and --after are needed');
for (const f of [opt.before, opt.after]) if (!fs.existsSync(f)) usage('no such file: ' + f);

/* ── What the game gives: Hornet's clips and the music ───────────────── */
function extract() {
  if (fs.existsSync(path.join(CACHE, 'clips.js')) && fs.existsSync(path.join(CACHE, 'lace.wav'))) return;
  console.log('extracting from the game into ' + CACHE);
  const script = path.join(HERE, 'extract-game.py');
  const r = process.env.PYTHON
    ? spawnSync(process.env.PYTHON, [script, opt.game, CACHE], { stdio: 'inherit' })
    : spawnSync('uvx', ['--with', 'UnityPy', '--with', 'pillow', 'python', '-I', script, opt.game, CACHE], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('extract-game.py failed (set $PYTHON to a Python with UnityPy and Pillow)'); process.exit(1); }
}
function ffmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const r = spawnSync('uvx', ['--from', 'imageio-ffmpeg', 'python', '-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())'], { encoding: 'utf8' });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  console.error('no ffmpeg: set $FFMPEG'); process.exit(1);
}

/* ── The saves, as the site's import leaves them ───────────────────────── */
function seeds() {
  const snap = (f) => { const r = F.read(fs.readFileSync(f)); if (!r || !r.ok) usage('not a save the site reads: ' + f); return F.toSnapshot(r.pd, r.sd, fs.statSync(f).mtimeMs); };
  const seed = (prev, now) => {
    const mem = {}, store = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
    S.importTo(store, 1, snap(prev)); S.select(store, 1);
    if (now && !S.sync(store, 1, snap(now))) usage('--before and --after are the same game at the same moment');
    return mem;
  };
  const all = { free: {}, before: seed(opt.before), after: seed(opt.before, opt.after) };
  fs.writeFileSync(path.join(CACHE, 'seeds.js'), 'window.SEEDS=' + JSON.stringify(all) + ';\n');
}

/* ── One origin: the site at /, the stage at /trailer/, the cache at /cache/ ── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon' };
function serve() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const [root, rest] = u.startsWith('/trailer/') ? [STAGE, u.slice(9)] : u.startsWith('/cache/') ? [CACHE, u.slice(7)] : [SITE, u];
    let file = path.join(root, rest);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise((r) => server.listen(+opt.port, '127.0.0.1', () => r(server)));
}

/* ── Frame by frame ────────────────────────────────────────────────────── */
async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  extract();
  seeds();
  const server = await serve();
  const c = await launch({ width: 1920, height: 1080, port: +opt.chrome });
  const fps = +opt.fps;
  let ff = null;
  try {
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: fs.readFileSync(path.join(STAGE, 'timeshim.js'), 'utf8') });
    await c.send('Network.enable');
    await c.send('Network.setBlockedURLs', { urls: ['https://*'] });   // the visit counter, and anything else outside
    // The Map's capture with every pin: the stage asks, the page is shot as it stands, the picture goes back.
    await c.send('Runtime.addBinding', { name: '__snapReq' });
    c.on(async (m) => {
      if (m.method !== 'Runtime.bindingCalled' || m.params.name !== '__snapReq') return;
      const r = await c.send('Page.captureScreenshot', { format: 'png' });
      await c.send('Runtime.evaluate', { expression: `__snapShow('data:image/png;base64,${r.data}').then((im) => __snapDone(im))` });
    });
    await c.goto(`http://127.0.0.1:${opt.port}/trailer/composer.html`);
    await c.eval('window.ready');
    const total = await c.eval('window.__TOTAL');
    let t = 0;
    const runTo = async (to) => { for (; t < to - 1e-9; t = Math.min(to, t + 1 / fps)) await c.eval(`__frame(${t})`); await c.eval(`__frame(${to})`); t = to; };
    const stills = opt.stills ? String(opt.stills).split(',').map(Number).sort((a, b) => a - b) : [];
    if (opt.thumb) stills.push(3.3), stills.sort((a, b) => a - b);
    if (opt.stills) {
      const dir = path.join(CACHE, 'stills');
      fs.mkdirSync(dir, { recursive: true });
      for (const s of stills) {
        await runTo(s);
        const f = s === 3.3 && opt.thumb ? path.resolve(opt.thumb) : path.join(dir, `t${s.toFixed(2)}.png`);
        await c.shot(f);
        console.log(f);
      }
    } else {
      const from = +(opt.from || 0), to = opt.to != null ? +opt.to : total;
      const out = path.resolve(opt.out || path.join(CACHE, 'trailer.mp4'));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const audioStart = await c.eval('window.AUDIO_START');
      ff = spawn(ffmpeg(), ['-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        '-ss', String(audioStart + from), '-t', String(to - from), '-i', path.join(CACHE, 'lace.wav'),
        '-filter_complex', `[1:a]afade=t=in:st=0:d=0.02,afade=t=out:st=${Math.max(0, total - 1.6 - from)}:d=1.5[a]`,
        '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p',
        '-profile:v', 'high', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '320k', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
      const n = Math.round((to - from) * fps), t0 = Date.now();
      for (; t < from - 1e-9; t += 1 / fps) await c.eval(`__frame(${t})`);
      for (let i = 0; i < n; i++) {
        const ft = from + i / fps;
        await c.eval(`__frame(${ft})`);
        if (opt.thumb && Math.abs(ft - 3.3) < 0.5 / fps) await c.shot(path.resolve(opt.thumb));
        const buf = await c.shot(null, { format: 'jpeg', quality: 96 });
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        if (i % 60 === 0) process.stdout.write(`\r${ft.toFixed(0)} s of ${to.toFixed(0)}, ${((Date.now() - t0) / 1000).toFixed(0)} s so far   `);
      }
      ff.stdin.end();
      await new Promise((r) => ff.on('exit', r));
      console.log('\n' + out + (opt.thumb ? '\n' + path.resolve(opt.thumb) : ''));
    }
    if (c.errors.length) { console.log('the page said:\n' + c.errors.slice(0, 30).join('\n')); process.exitCode = 1; }
  } catch (e) {
    console.error('ERROR ' + e.message);
    if (c.errors.length) console.error(c.errors.slice(0, 30).join('\n'));
    if (ff) ff.kill('SIGKILL');
    process.exitCode = 1;
  } finally {
    await c.close();
    server.close();
  }
}
main();
