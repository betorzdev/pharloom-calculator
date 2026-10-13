/* tools/promo/cdp.js: a minimal Chrome DevTools Protocol driver for tools/promo/make.js. Launches
   headless Chrome (CHROME, or google-chrome), opens one page and talks to it over the WebSocket
   Node 22 ships. No dependencies. */
'use strict';
const { spawn } = require('child_process');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch({ width = 1920, height = 1080, scale = 1, profile }) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb',
    '--font-render-hinting=none', '--mute-audio', `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  let page = null;
  for (let i = 0; i < 100 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch (e) { /* not up yet */ }
    if (!page) await sleep(100);
  }
  if (!page) { proc.kill(); throw new Error('Chrome did not start (is another one using the profile?)'); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const waiting = new Map(), listeners = [];
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && waiting.has(msg.id)) {
      const { ok, ko } = waiting.get(msg.id); waiting.delete(msg.id);
      if (msg.error) ko(new Error(JSON.stringify(msg.error))); else ok(msg.result);
    } else if (msg.method) for (const l of [...listeners]) l(msg);
  });
  const send = (method, params = {}) => new Promise((ok, ko) => { const i = ++id; waiting.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); });
  const once = (method) => new Promise((r) => {
    const l = (m) => { if (m.method === method) { listeners.splice(listeners.indexOf(l), 1); r(m.params); } };
    listeners.push(l);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
  return {
    send,
    async evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    // A full load. Two URLs that differ only in the hash are one document (no load event), so
    // every call should change the path or the query.
    async go(url) { const loaded = once('Page.loadEventFired'); await send('Page.navigate', { url }); await loaded; },
    async shot(opts = {}) { return Buffer.from((await send('Page.captureScreenshot', { format: 'png', ...opts })).data, 'base64'); },
    // Asks Chrome to quit (killing the google-chrome wrapper would leave its children writing to
    // the profile) and resolves once it has, or after 5 s, killed.
    async close() {
      const gone = proc.exitCode != null ? Promise.resolve() : new Promise((r) => proc.once('exit', r));
      try { await Promise.race([send('Browser.close'), sleep(2000)]); } catch (e) { /* already going */ }
      try { ws.close(); } catch (e) { /* gone */ }
      await Promise.race([gone, sleep(5000)]);
      proc.kill();
    },
  };
}

module.exports = { launch, sleep };
