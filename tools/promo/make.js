#!/usr/bin/env node
/* tools/promo/make.js: the site's announcement trailer (about 55 s, 1920×1080, 60 fps, English), from
   the real site and a real save, cut to the game's music. `npm run promo -- --before <save> --after <save>`:
     1. serves the repo (and the work folder, under /__promo/) on 127.0.0.1;
     2. shoots the site in headless Chrome at 2x (tools/promo/cdp.js): Free mode's unlit card (and lit for a file dragged over it),
        then <before> imported into save 1 and <after> synced over it, as the game saving again
        would (js/saves.js sync), so "Since the previous save" has something; every screen whole,
        and the Map twice closer, without its way to the next goal;
     3. renders tools/promo/compose.html frame by frame (its render(t)) into ffmpeg;
     4. lays its music under it (compose.html's MUSIC: the track, where the film starts in it, the
        fades), at −16 LUFS.
   First, once per patch: tools/promo/extract-game.py, the music and Hornet's clips into <out>.
   Needs Chrome (CHROME, or google-chrome) and ffmpeg (FFMPEG, or ffmpeg). No ffmpeg on the
   author's machine: imageio-ffmpeg's, in the env tools/extract-map.py's header makes, with
       uv pip install --python /tmp/unitypy/bin/python imageio-ffmpeg
       FFMPEG=$(/tmp/unitypy/bin/python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
   The saves: any two of the same game, a few hours apart, mid-game, so the map, the Journal and
   "Closest to your bench" have things missing (the first cut used Restore_Points1/restoreData21
   and 22: 59% → 61%, Act 2).
   Options: --out <dir> (default: the system's temp/pharloom-promo), --fps <n> (60),
   --stills 2.6,13,40 (only those moments, as PNGs in <out>/stills/, to check a change in
   seconds instead of the 8 minutes a render takes), --no-capture (reuse <out>/shots/).
   The camera's rects in compose.html are page coordinates of today's layout: when a screen
   moves, check them with --stills. */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { launch, sleep } = require('./cdp.js');

const ROOT = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

function args(argv) {
  const a = { out: path.join(os.tmpdir(), 'pharloom-promo'), fps: 60, stills: null, capture: true };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--before') a.before = argv[++i];
    else if (k === '--after') a.after = argv[++i];
    else if (k === '--out') a.out = path.resolve(argv[++i]);
    else if (k === '--fps') a.fps = Number(argv[++i]);
    else if (k === '--stills') a.stills = argv[++i].split(',').map(Number);
    else if (k === '--no-capture') a.capture = false;
    else throw new Error('unknown option ' + k);
  }
  if (a.capture && (!a.before || !a.after)) throw new Error('usage: npm run promo -- --before <save.dat> --after <save.dat> [--out dir] [--fps 60] [--stills t,t] [--no-capture]');
  return a;
}

// The repo, and the work folder under /__promo/. Only files under the two; nothing is written.
function serve(out) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const [base, rel] = url.startsWith('/__promo/') ? [out, url.slice(9)] : [ROOT, url.slice(1)];
    const file = path.resolve(base, rel || 'index.html');
    if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

async function capture(site, a) {
  const dir = path.join(a.out, 'shots');
  fs.mkdirSync(dir, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-chrome-'));
  const c = await launch({ scale: 2, profile });
  let hop = 0;
  // The Map's way to the next goal (.mp-way) is the reader's route, not the film's: hidden.
  const visit = async (v) => {
    await c.go(`${site}/index.html?promo=${++hop}#lang=en&view=${v}`);
    await sleep(2500);
    await c.evaluate(`(() => { const s = document.createElement('style'); s.textContent = '.mp-way { display: none !important; }'; document.head.append(s); })()`);
  };
  const whole = async (name) => {
    const h = await c.evaluate('document.documentElement.scrollHeight');
    fs.writeFileSync(path.join(dir, name + '.png'), await c.shot({ captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1920, height: h, scale: 1 } }));
    console.log('  shot', name);
  };
  try {
    await c.go(site + '/index.html#lang=en');
    await c.evaluate(`(() => { try { localStorage.setItem('pharloom.betaSeen', '1'); } catch (e) {} })()`);
    await visit('home');
    await whole('free');
    // The same card as a file is dragged over it (the site's own .is-drag).
    await c.evaluate(`document.querySelector('.hm-invite').classList.add('is-drag')`);
    await sleep(400);
    await whole('free-drag');
    const b64 = (f) => fs.readFileSync(f).toString('base64');
    await c.evaluate(`(() => {
      const S = SS.saves, F = SS.savefile;
      const snap = (b, name) => {
        const r = F.read(Uint8Array.from(atob(b), (ch) => ch.charCodeAt(0)));
        if (!r.ok) throw new Error(name + " isn't a save the site can read");
        return F.toSnapshot(r.pd, r.sd, Date.now());
      };
      S.importTo(localStorage, 1, snap('${b64(a.before)}', '--before'));
      S.select(localStorage, 1);
      S.sync(localStorage, 1, snap('${b64(a.after)}', '--after'));
    })()`);
    for (const v of ['home', 'game', 'progress', 'map', 'journal', 'tools']) { await visit(v); await whole(v); }
    // Progress on its other tab, the 100%.
    await visit('progress');
    await c.evaluate(`document.querySelector('[data-act="pgTab"][data-value="100"]').click()`);
    await sleep(1500);
    await whole('progress-100');
    // The Map twice closer, for the montage's close-ups.
    await visit('map');
    await c.evaluate(`(async () => { for (let i = 0; i < 2; i++) { document.querySelector('[data-act="mapZoom"]').click(); await new Promise((r) => setTimeout(r, 600)); } })()`);
    await sleep(2500);
    await whole('map-zoom');
  } finally { await c.close(); drop(profile); }
}

async function compose(site, a, each) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-chrome-'));
  const c = await launch({ profile });
  try {
    await c.go(site + '/tools/promo/compose.html?w=/__promo/');
    await c.evaluate('window.ready');
    await each(c, await c.evaluate('DUR'), await c.evaluate('window.MUSIC'));
  } finally { await c.close(); drop(profile); }
}

// Chrome's throwaway profile; one it still holds is left to the system's temp.
function drop(dir) { try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { /* left */ } }

function ffmpeg(argv, opts) {
  return spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', ...argv], opts);
}

async function main() {
  const a = args(process.argv.slice(2));
  fs.mkdirSync(a.out, { recursive: true });
  const server = await serve(a.out);
  const site = `http://127.0.0.1:${server.address().port}`;
  try {
    if (a.capture) { console.log('shooting the site'); await capture(site, a); }
    if (a.stills) {
      const dir = path.join(a.out, 'stills');
      fs.mkdirSync(dir, { recursive: true });
      await compose(site, a, async (c) => {
        for (const t of a.stills) {
          await c.evaluate(`render(${t})`);
          fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`), await c.shot());
        }
      });
      console.log('stills in', dir);
      return;
    }
    const silent = path.join(a.out, 'pharloom-promo-silent.mp4');
    let music = null;
    await compose(site, a, async (c, dur, m) => {
      music = m;
      const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(a.fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow',
        '-crf', '14', '-tune', 'film', '-pix_fmt', 'yuv420p', '-r', String(a.fps), '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
      const done = new Promise((r, j) => ff.on('close', (code) => (code ? j(new Error('ffmpeg failed: ' + code)) : r())));
      const n = Math.round(dur * a.fps);
      for (let i = 0; i < n; i++) {
        await c.evaluate(`render(${i / a.fps})`);
        if (!ff.stdin.write(await c.shot({ optimizeForSpeed: true }))) await new Promise((r) => ff.stdin.once('drain', r));
        if (i % (a.fps * 5) === 0) console.log(`  frame ${i}/${n}`);
      }
      ff.stdin.end();
      await done;
    });
    console.log('video', silent);
    const wav = path.join(a.out, 'music', music.track + '.wav');
    if (!fs.existsSync(wav)) { console.log(`no ${wav}: run tools/promo/extract-game.py for the music`); return; }
    const out = path.join(a.out, 'pharloom-promo.mp4');
    const r = spawnSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-ss', String(music.from), '-i', wav,
      '-af', `afade=t=in:d=${music.fadeIn},afade=t=out:st=${music.fadeOutAt}:d=${music.fadeOut},loudnorm=I=-16:TP=-1.5:LRA=11`,
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', out], { stdio: 'inherit' });
    if (r.status) throw new Error('ffmpeg failed laying the music');
    console.log('video', out);
  } finally { server.close(); }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
