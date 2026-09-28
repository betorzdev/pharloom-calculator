/* test/pages.test.js — the site's pages (tools/pages.js): one per search intent and language,
   each index.html with its own head and About block, never behind it. Whoever edits index.html
   or tools/pages-text.js runs `npm run pages`; otherwise a page would load an old copy. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const P = require('../tools/pages.js');
const { BRAND } = require('../tools/pages-text.js');
const { PAGES } = P;   // the intents' pages and the bosses'
const I = require('../js/i18n.js');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const EVERY = PAGES.flatMap((page) => P.LANGS.map((lang) => ({ page, lang })));

test('every page and the sitemap are up to date with index.html (npm run pages)', () => {
  for (const [file, text] of Object.entries(P.all(read('index.html')))) assert.strictEqual(read(file), text, file);
});

test('each page points at itself and at its other language, both ways', () => {
  for (const { page, lang } of EVERY) {
    const html = read(P.file(page, lang));
    assert.match(html, new RegExp(`<link rel="canonical" href="${P.url(page, lang)}">`), P.file(page, lang));
    for (const l of P.LANGS) assert.match(html, new RegExp(`hreflang="${l}" href="${P.url(page, l)}"`), P.file(page, lang));
    assert.match(html, new RegExp(`<html lang="${lang}"`), P.file(page, lang));
  }
});

test('each page opens on a real screen, and its base reaches the root', () => {
  const VIEWS = ['home', 'game', 'progress', 'map', 'journal', 'tools', 'fight', 'saves'];
  for (const { page, lang } of EVERY) {
    const html = read(P.file(page, lang));
    const view = (html.match(/<html [^>]*data-view="([a-z]+)"/) || [])[1] || null;
    assert.strictEqual(view, page.view, P.file(page, lang));
    if (page.view) assert.ok(VIEWS.includes(page.view), page.id);
    const depth = P.rel(page, lang).split('/').length - 1;
    const base = (html.match(/<base href="([^"]*)">/) || [])[1] || '';
    assert.strictEqual(base, '../'.repeat(depth), P.file(page, lang));
  }
});

test('titles lead with the search, fit, and each page has one h1 of its own', () => {
  const seen = new Set();
  for (const { page, lang } of EVERY) {
    assert.ok(page.title[lang].length <= 70, `${page.id}/${lang}: title of ${page.title[lang].length} characters`);
    assert.ok(/Silksong/.test(page.title[lang]), `${page.id}/${lang}: the title doesn't say Silksong`);
    assert.ok(page.description[lang].length <= 200, `${page.id}/${lang}: description of ${page.description[lang].length}`);
    assert.ok(!seen.has(page.title[lang]), `${page.id}/${lang}: title repeated`);
    seen.add(page.title[lang]);
    const html = read(P.file(page, lang));
    assert.strictEqual((html.match(/<h1[ >]/g) || []).length, 1, `${P.file(page, lang)}: one h1`);
    assert.ok(page.faq.length > 0 && page.body.length > 0, page.id);
  }
});

test("the home's title is the one the site puts on the tab in the other language", () => {
  const home = PAGES.find((p) => !p.view);
  for (const lang of P.LANGS) {
    assert.strictEqual(I.UI.docTitle[lang], home.title[lang] + ' · ' + BRAND[lang], lang);
    assert.strictEqual(I.UI.metaDescription[lang], home.description[lang], lang);
  }
});

test('the texts carry only the tags they may, and their links go to real pages', () => {
  const all = JSON.stringify(PAGES);
  for (const tag of all.match(/<\/?([a-z]+)/g) || []) assert.ok(/^<\/?(code|strong|em)$/.test(tag), `tag ${tag} in pages-text.js`);
  for (const { page, lang } of EVERY) {
    const html = read(P.file(page, lang));
    for (const [, href] of html.matchAll(/<a href="([^"]*)" data-page>/g)) {
      const target = href === './' ? 'index.html' : href + 'index.html';
      assert.ok(fs.existsSync(path.join(ROOT, target)), `${P.file(page, lang)} links to ${href}`);
    }
  }
});

test('the sitemap lists every page', () => {
  const xml = read('sitemap.xml');
  for (const { page, lang } of EVERY) assert.ok(xml.includes(`<loc>${P.url(page, lang)}</loc>`), P.url(page, lang));
});

test('a page per boss, in each language: it opens Combat on that boss, and the calculator lists them all', () => {
  const EN = require('../js/enemies.js');
  const bosses = PAGES.filter((p) => p.boss);
  assert.strictEqual(bosses.length, Object.keys(EN.ATTACKS).length, 'one page per boss page of the wiki');
  const damage = PAGES.find((p) => p.id === 'damage');
  for (const lang of P.LANGS) {
    const calc = read(P.file(damage, lang));
    for (const b of bosses) {
      const html = read(P.file(b, lang));
      const foe = (html.match(/<html [^>]*data-foe="([a-z0-9-]+)"/) || [])[1];
      assert.ok(foe && EN.FOES.some((f) => f.id === foe && f.boss), `${P.file(b, lang)}: data-foe ${foe}`);
      assert.match(html, /data-view="fight"/, P.file(b, lang));
      assert.ok(calc.includes(`href="${P.rel(b, lang)}" data-page`), `the calculator (${lang}) links to ${b.id}`);
    }
  }
  // The figures are the engine's: Lace's 250 health takes 50 bare slashes, 12 with the last Needle.
  const lace = bosses.find((p) => p.id === 'boss-lace');
  assert.match(lace.body.map((x) => x.en).join(' '), /Lace: 50, 28, 20, 15 and 12 slashes/);
  assert.match(lace.faq[1].a.es, /de 50 tajos con la Aguja a 12 con la Aguja de acero pálido/);
  // No Spanish in the English: accents and «» only in the Spanish.
  for (const b of bosses) for (const x of [b.title, b.description, b.h1, ...b.body, ...b.faq.flatMap((f) => [f.q, f.a])]) {
    assert.ok(!/[áéíóúñ¿¡«»]/i.test(x.en.replace(/Hunter's Journal says: "[^"]*"/, '')), `${b.id}: ${x.en}`);
  }
});
