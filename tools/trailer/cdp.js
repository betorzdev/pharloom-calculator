/* tools/trailer/cdp.js: a small headless Chrome driver over the DevTools protocol (Node 22, no
   dependencies): launch() starts Chrome with a throwaway profile; goto, eval, shot, close. */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch({ width = 1920, height = 1080, port = 9471, args = [] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-chrome-'));
  const proc = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    `--window-size=${width},${height}`, '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required', ...args, 'about:blank'],
    { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const pg = list.find((t) => t.type === 'page');
      if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; }
    } catch (e) {}
    await sleep(100);
  }
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(), handlers = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method) handlers.forEach((h) => h(m));
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const errors = [];
  handlers.push((m) => {
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('error: ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const api = {
    send, errors, on: (h) => handlers.push(h),
    async goto(url, waitMs = 0) {
      const loaded = new Promise((r) => { const h = (m) => { if (m.method === 'Page.loadEventFired') r(); }; handlers.push(h); });
      await send('Page.navigate', { url }); await loaded; if (waitMs) await sleep(waitMs);
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async shot(file, o = {}) {
      const r = await send('Page.captureScreenshot', { format: o.format || 'png', quality: o.quality, optimizeForSpeed: !!o.fast, captureBeyondViewport: false });
      const buf = Buffer.from(r.data, 'base64'); if (file) fs.writeFileSync(file, buf); return buf;
    },
    async close() { try { await send('Browser.close'); } catch (e) {} const gone = new Promise((r) => proc.once('exit', r)); proc.kill('SIGKILL'); await Promise.race([gone, sleep(3000)]); try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }); } catch (e) {} },
    proc,
  };
  return api;
}
module.exports = { launch, sleep };
