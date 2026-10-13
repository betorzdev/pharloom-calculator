#!/usr/bin/env node
/* tools/drive.js — the site's screens in headless Chrome, with a real save loaded.
     npm run drive -- --save <user#.dat> [--prev <older .dat>] --view journal,home,progress,map \
                      --width 1440,390 --lang es,en --out <dir>
   For each view x width x language it opens index.html over file:// (as a double click does),
   waits for the screen to settle, counts the console errors (uncaught exceptions, console.error,
   failed loads) and takes a full-height screenshot. One line per screen:
     view  width  lang  errors  screenshot
   and exit code 1 if any screen had console errors, didn't load or didn't show the view asked
   for (2 on a usage mistake).
   Options (comma lists where it says so):
     --save <file>   a Silksong save (user#.dat, restoreData#.dat…); with none, Free mode, which
                     is how the site starts. The saves stay where they are, never copied to the repo.
     --prev <file>   an older save of the same game, so "Since last time" has something to show
     --view <list>   home, game, progress, map, journal, tools, fight, saves (default home)
     --width <list>  viewport widths in px; under 700 emulates a phone (default 1440,390)
     --lang <list>   en, es (default en,es)
     --out <dir>     where the PNGs go (default a new temp dir, printed; never the repo)
     --port <n>      Chrome's private debug port (default 9446; 9333 is refused, it's Albert's)
     --wait <ms>     how long a screen settles before it's shot (default 1500; the Map 3500)
     --eval <js>     an expression run in the page before the shot (a click, say); its value is printed
     --verbose       also print each console error
   The save is seeded through the site's own code, never a copy of its storage format:
   js/savefile.js reads the file and writes the snapshot (toSnapshot), js/saves.js puts it in slot 1
   and selects it (importTo, select, and sync for --prev, which leaves pharloom.prev), just as the
   Saves screen's import does; the resulting keys go into localStorage before the page's scripts run.
   Needs Node 22 (the global WebSocket and fetch, no dependencies) and google-chrome or chromium
   on the PATH. It starts Chrome headless with a throwaway profile and kills it at the end.
   No --allow-file-access-from-files: the page doesn't need it (the data travels in .js files).
   On Linux the game's folder is ~/.config/unity3d/Team Cherry/Hollow Knight Silksong/<id>/. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const F = require('../js/savefile.js');
const S = require('../js/saves.js');

const ROOT = path.resolve(__dirname, '..');
const VIEWS = ['home', 'game', 'progress', 'map', 'journal', 'tools', 'fight', 'saves'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usage(msg) {
  if (msg) console.error(msg);
  console.error('usage: npm run drive -- [--save <.dat>] [--prev <.dat>] [--view home,map] [--width 1440,390] [--lang en,es] [--out <dir>] [--port 9446] [--wait ms] [--eval <js>] [--verbose]');
  process.exit(2);
}

const opt = { view: 'home', width: '1440,390', lang: 'en,es', port: '9446', wait: '' };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const m = /^--([a-z]+)$/.exec(args[i]);
  if (!m) usage('unknown argument: ' + args[i]);
  if (m[1] === 'verbose') { opt.verbose = true; continue; }
  if (!['save', 'prev', 'view', 'width', 'lang', 'out', 'port', 'wait', 'eval'].includes(m[1])) usage('unknown option: ' + args[i]);
  if (i + 1 >= args.length) usage('missing value for ' + args[i]);
  opt[m[1]] = args[++i];
}
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
const views = list(opt.view);
const widths = list(opt.width).map(Number);
const langs = list(opt.lang);
const port = Number(opt.port);
if (!views.length || views.some((v) => !VIEWS.includes(v))) usage('--view takes: ' + VIEWS.join(', '));
if (!widths.length || widths.some((w) => !(w >= 200 && w <= 4000))) usage('--width takes pixel widths, 200 to 4000');
if (!langs.length || langs.some((l) => !['en', 'es'].includes(l))) usage('--lang takes: en, es');
if (!Number.isInteger(port) || port < 1024 || port > 65535) usage('--port takes a port from 1024 to 65535');
if (port === 9333) usage('port 9333 is Albert\'s other sessions: pick another one');
if (opt.wait && !(Number(opt.wait) >= 0)) usage('--wait takes milliseconds');

// The seed: the keys the site's own import leaves in localStorage.
function readSave(file) {
  if (!fs.existsSync(file)) usage('no such file: ' + file);
  const r = F.read(fs.readFileSync(file));
  if (!r || !r.ok) usage('not a Silksong save the site can read: ' + file);
  return F.toSnapshot(r.pd, r.sd, fs.statSync(file).mtimeMs);
}
function seedFor() {
  const mem = {};
  const store = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
  if (!opt.save) {
    if (opt.prev) usage('--prev needs --save');
    return mem;
  }
  const snap = readSave(opt.save);
  if (opt.prev) {
    S.importTo(store, 1, readSave(opt.prev));
    S.select(store, 1);
    if (!S.sync(store, 1, snap)) console.error('note: --prev and --save are the same game, so there is nothing since last time');
  } else {
    S.importTo(store, 1, snap);
    S.select(store, 1);
  }
  return mem;
}

function findChrome() {
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    if (spawnSync(bin, ['--version'], { stdio: 'ignore' }).status === 0) return bin;
  }
  return null;
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('cannot open ' + wsUrl)); });
  let id = 0;
  const pending = new Map();
  const handlers = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const { res, rej } = pending.get(d.id);
      pending.delete(d.id);
      if (d.error) rej(new Error(d.error.message)); else res(d.result);
    } else if (d.method) for (const h of handlers) h(d);
  };
  return {
    send: (method, params = {}, sessionId) => new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    }),
    on: (h) => handlers.push(h),
    close: () => ws.close(),
  };
}

const text = (a) => (a.value !== undefined ? String(a.value) : a.description || a.type);

async function main() {
  const seed = seedFor();
  const bin = findChrome();
  if (!bin) { console.error('no google-chrome or chromium on the PATH'); process.exit(2); }
  const out = opt.out ? path.resolve(opt.out) : fs.mkdtempSync(path.join(os.tmpdir(), 'pharloom-drive-'));
  if (path.relative(ROOT, out) === '' || (!path.relative(ROOT, out).startsWith('..') && !path.isAbsolute(path.relative(ROOT, out)))) {
    usage('--out must be outside the repo: ' + out);
  }
  fs.mkdirSync(out, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pharloom-chrome-'));
  const chrome = spawn(bin, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore', detached: true });
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    // Chrome's helper processes live in its group: all of them go, then the profile.
    try { process.kill(-chrome.pid, 'SIGKILL'); } catch (e) { /* gone already */ }
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }); } catch (e) { /* the profile is in tmp anyway */ }
  };
  process.on('exit', cleanup);
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(130); });

  let ver = null;
  for (let i = 0; i < 60 && !ver; i++) {
    try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (e) { await sleep(250); }
  }
  if (!ver) { console.error(`Chrome did not answer on port ${port} (is it taken?)`); cleanup(); process.exit(1); }
  const c = await connect(ver.webSocketDebuggerUrl);

  const tag = opt.save ? path.basename(opt.save).replace(/\.dat$/, '') : 'free';
  const seedJs = `try { localStorage.clear(); const s = ${JSON.stringify(seed)}; for (const k in s) localStorage.setItem(k, s[k]); } catch (e) {}`;
  console.log(`# ${opt.save ? 'save ' + opt.save + (opt.prev ? ' (prev ' + opt.prev + ')' : '') : 'Free mode'}, screenshots in ${out}`);
  console.log('view\twidth\tlang\terrors\tscreenshot');
  let failed = 0;

  for (const w of widths) {
    for (const lang of langs) {
      for (const view of views) {
        const errs = [];
        let shot = '-';
        const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
        let loaded = false;
        c.on((d) => {
          if (d.sessionId !== sessionId) return;
          if (d.method === 'Page.loadEventFired') loaded = true;
          if (d.method === 'Runtime.exceptionThrown') {
            const x = d.params.exceptionDetails;
            errs.push('exception: ' + ((x.exception && x.exception.description) || x.text));
          }
          if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push('console.error: ' + d.params.args.map(text).join(' '));
          if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errs.push('log: ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
        });
        try {
          for (const dom of ['Runtime', 'Log', 'Page']) await c.send(dom + '.enable', {}, sessionId);
          await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 700 }, sessionId);
          await c.send('Page.addScriptToEvaluateOnNewDocument', { source: seedJs }, sessionId);
          const nav = await c.send('Page.navigate', { url: `file://${ROOT}/index.html#lang=${lang}&view=${view}` }, sessionId);
          if (nav.errorText) throw new Error('navigation failed: ' + nav.errorText);
          for (let i = 0; i < 100 && !loaded; i++) await sleep(100);
          if (!loaded) throw new Error('page did not finish loading in 10 s');
          await sleep(opt.wait ? Number(opt.wait) : view === 'map' ? 3500 : 1500);
          const q = async (expression) => (await c.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)).result;
          const shown = (await q(`(() => { const s = document.querySelector('section.screen:not([hidden])'); return s ? s.id : null; })()`)).value;
          if (shown !== view) errs.push(`the screen shown is ${shown}, not ${view}`);
          if (opt.eval) {
            const r = await c.send('Runtime.evaluate', { expression: opt.eval, returnByValue: true, awaitPromise: true }, sessionId);
            if (r.exceptionDetails) errs.push('--eval: ' + ((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text));
            else console.log(`  eval ${view} ${w} ${lang}: ${JSON.stringify(r.result.value)}`);
            await sleep(600);
          }
          const h = Math.min(8000, Math.max(900, Math.ceil((await q('document.documentElement.scrollHeight')).value || 900)));
          await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }, sessionId);
          await sleep(300);
          const png = await c.send('Page.captureScreenshot', { format: 'png' }, sessionId);
          shot = path.join(out, `${tag}-${view}-${w}-${lang}.png`);
          fs.writeFileSync(shot, Buffer.from(png.data, 'base64'));
        } catch (e) {
          errs.push('driver: ' + e.message);
        }
        try { await c.send('Target.closeTarget', { targetId }); } catch (e) { /* closed already */ }
        if (errs.length) failed++;
        console.log(`${view}\t${w}\t${lang}\t${errs.length}\t${shot}`);
        if (opt.verbose || errs.some((x) => x.startsWith('driver:'))) for (const e of errs) console.log('  ' + e);
      }
    }
  }
  c.close();
  cleanup();
  if (failed) console.error(`${failed} screen(s) with console errors or not loaded (run with --verbose for the messages)`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
