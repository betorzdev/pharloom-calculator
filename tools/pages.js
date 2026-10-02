#!/usr/bin/env node
/* tools/pages.js — the site's pages: one per search intent, in each language (design/00-study.md §7, §9 phase 8).
   Search engines ignore the hash, so #view=map is the same page to them as the root: to be
   found for "hollow knight map" the map needs an address of its own, and the site can't use
   the History API for it (it has to work over file://). So each page is index.html again, with
   its own <head> (title, description, canonical, hreflang, Open Graph, JSON-LD), the screen it
   opens on (<html data-view>, which app.js reads), and its own About block under the screens:
   the text a search engine reads, in the page's language. <base href> points every relative
   path (css/, js/, assets/, including the ones app.js writes) at the site's root.

   index.html is the source and is edited by hand, except what this writes in it too: its <head>
   fields and the regions between <!-- about --> / <!-- /about --> and <!-- page-ld --> /
   <!-- /page-ld -->. Every other page is generated, never edited by hand; so is sitemap.xml.
   test/pages.test.js fails if any of them falls behind. The texts are tools/pages-text.js's, and
   the bosses' pages (one per boss, opened on Combat with it picked: <html data-foe>) are written
   from the data by tools/pages-bosses.js; the damage calculator and each boss page list them all.
   Usage: node tools/pages.js          (npm run pages) */
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('./pages-text.js');
const { BRAND, LABELS, OG_ALT } = T;
const { BOSS_PAGES } = require('./pages-bosses.js');
/* The screens hidden for now (js/app.js, OFF): Combat's pages, the damage calculator and each
   boss's, aren't written, nor listed in the sitemap or under "More on the site". */
const OFF = ['fight'];
const PAGES = [...T.PAGES, ...BOSS_PAGES].filter((p) => !OFF.includes(p.view));

const ROOT = path.join(__dirname, '..');
const SITE = 'https://betorzdev.github.io/pharloom-calculator/';
const LANGS = ['en', 'es'];

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const plain = (s) => s.replace(/<[^>]+>/g, '');
/* A page's path from the site's root: '' for the English home, 'es/' for the Spanish one. */
const rel = (page, lang) => (lang === 'es' ? 'es/' : '') + (page.slug[lang] ? page.slug[lang] + '/' : '');
const url = (page, lang) => SITE + rel(page, lang);
const file = (page, lang) => rel(page, lang) + 'index.html';
const fullTitle = (page, lang) => page.title[lang] + ' · ' + BRAND[lang];

/* The About block, as a guide page on the main menu's red (design/23-static-pages-round2.html,
   D): at the top the page's art on the Journal's light, the heading (the name large, the rest of
   the query under it), the Journal's words on a boss's page, the first paragraph and a button up
   to the screen; a boss's figures in a row, its attacks with their masks and its phases on a
   bar; the rest of the text (folded on a boss's page, whose figures say it); the questions,
   folded; on Combat's pages every boss as a portrait; the other pages with their icon. The text
   is all there for search engines; only how it shows changed. */
const HALF = '<path d="M93 14 C84 14 78 7 69 7 C61 7 58 13 62 16.5 C65 19 69.5 16.5 68 13.5"/><path d="M62 16.5 C50 22 30 21 10 14"/><path d="M10 14 C6 12 5.5 8.5 9 8 C11.5 7.8 12 10.5 10.5 11.5"/><path d="M78 9 C74 3 66 1.5 58 3.5"/>';
const CROWN = `<svg class="about-crown" width="200" height="28" viewBox="0 0 200 28" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" aria-hidden="true">${HALF}<g transform="translate(200 0) scale(-1 1)">${HALF}</g><path d="M100 5 L105 14 L100 23 L95 14 Z"/><path d="M100 1 V5 M100 23 V27"/></svg>`;
const MASKS = { es: '{n} máscaras', en: '{n} masks' };
const PHASE = { es: 'fase {n}', en: 'phase {n}' };
function about(page, lang) {
  const g = page.guide || {};
  const art = g.art || page.art;
  const h1 = (page.h1 || page.title)[lang];
  // Not inside the game's own name, «Hollow Knight: Silksong».
  const cut = /Hollow Knight$/.test(h1.slice(0, h1.indexOf(': '))) ? -1 : h1.indexOf(': ');
  // The name large and the rest of the query under it; the colon stays in the heading's text.
  const heading = cut < 0 ? `<span class="about-name${h1.length > 24 ? ' is-long' : ''}">${h1}</span>`
    : `<span class="about-name">${h1.slice(0, cut)}</span><span class="about-sub"><span class="about-colon">: </span>${h1.slice(cut + 2)}</span>`;
  const [lead, ...rest] = page.body;
  const cta = (page.boss ? LABELS.bossCta : page.cta || LABELS.bossCta)[lang];
  const hero = `  <header class="about-hero">
    ${art ? `<div class="about-art"><img src="${art}" alt="" loading="lazy"></div>` : ''}
    <div class="about-head">
      <h1 id="about-h">${heading}</h1>
      ${g.quote ? `<p class="about-quote">${g.quote[lang]}</p>` : ''}
      <p>${lead[lang]}</p>
      <a class="about-cta" href="#" data-act="aboutUp">${cta} ›</a>
    </div>
  </header>`;
  const figs = g.figs && g.figs.length ? `
  <dl class="about-figs">${g.figs.map((f) => `<div><dt>${f.k[lang]}</dt><dd>${f.v[lang]}</dd></div>`).join('')}</dl>` : '';
  const mask = (n) => `<span class="about-masks" role="img" aria-label="${attr(MASKS[lang].replace('{n}', n))}">${'<img src="assets/hud/mask.png" alt="">'.repeat(n)}</span>`;
  const attacks = g.attacks && g.attacks.length ? `<section><h2>${LABELS.attacks[lang]}</h2><ul class="about-attacks">${g.attacks.map((x) => `<li><span>${x.name}</span>${mask(x.masks)}</li>`).join('')}</ul></section>` : '';
  const phases = g.phases && g.phases.length ? `<section><h2>${LABELS.phases[lang]}</h2>${g.phases.map((ph) => `
      ${g.phases.length > 1 ? `<p class="about-fight">${ph.name[lang]}</p>` : ''}<div class="about-bar">${ph.marks.map((m) => `<i style="left:${(m.at / ph.hp * 100).toFixed(1)}%"><span>${PHASE[lang].replace('{n}', m.n)} · ${new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB').format(m.at)}</span></i>`).join('')}</div>`).join('')}
      ${g.reward ? `<h2>${LABELS.reward[lang]}</h2><p class="about-reward">${g.reward[lang]}</p>` : ''}</section>`
    : g.reward ? `<section><h2>${LABELS.reward[lang]}</h2><p class="about-reward">${g.reward[lang]}</p></section>` : '';
  const two = attacks || phases ? `
  <div class="about-two">${attacks}${phases}</div>` : '';
  const text = rest.length ? (page.boss ? `
  <details class="about-details"><summary>${LABELS.details[lang]}</summary>
${rest.map((p) => `    <p>${p[lang]}</p>`).join('\n')}
  </details>` : `
  <div class="about-text">
${rest.map((p) => `    <p>${p[lang]}</p>`).join('\n')}
  </div>`) : '';
  const faq = page.faq.map((f, i) => `    <details${i ? '' : ' open'}><summary><h3>${f.q[lang]}</h3></summary><p>${f.a[lang]}</p></details>`).join('\n');
  const li = (p) => `      <li><a href="${rel(p, lang) || './'}" data-page>${p.icon ? `<img src="${p.icon}" alt="" loading="lazy">` : ''}<span>${p.link[lang]}</span></a></li>`;
  const face = (p) => `      <li><a href="${rel(p, lang)}" data-page title="${attr(p.link[lang])}"><span class="hj-ring is-done" style="--f:1"><img src="${p.guide.icon}" alt="" loading="lazy"></span><span>${p.link[lang]}</span></a></li>`;
  const more = T.PAGES.filter((p) => p !== page && PAGES.includes(p)).map(li).join('\n');
  // Combat's pages, the calculator's and each boss's, show every boss.
  const bosses = page.view === 'fight' ? `
  ${CROWN}
  <nav class="about-bosses" aria-label="${attr(LABELS.bosses[lang])}">
    <h2>${LABELS.bosses[lang]}</h2>
    <ul>
${BOSS_PAGES.filter((p) => p !== page).map(face).join('\n')}
    </ul>
  </nav>` : '';
  // Indented to sit in index.html's .shell, where the region's markers are.
  return `<!-- about -->
<section class="about" id="about" lang="${lang}" aria-labelledby="about-h">
${hero}${figs}${two}${text}
  ${CROWN}
  <div class="about-faq">
    <h2>${LABELS.faq[lang]}</h2>
${faq}
  </div>${bosses}
  <nav class="about-more" aria-label="${attr(LABELS.more[lang])}">
    <h2>${LABELS.more[lang]}</h2>
    <ul>
${more}
    </ul>
  </nav>
</section>
<!-- /about -->`.replace(/\n/g, '\n    ');
}

/* The page's own structured data: its questions and, below the home, where it sits. */
function pageLd(page, lang) {
  const blocks = [{
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang,
    mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: plain(f.q[lang]),
      acceptedAnswer: { '@type': 'Answer', text: plain(f.a[lang]) } })),
  }];
  // Where it sits: the home, then (for a boss) the damage calculator, then the page.
  const trail = [PAGES[0], ...(page.boss ? [PAGES.find((p) => p.id === 'damage')] : []), page];
  if (page.view) blocks.push({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: i ? p.link[lang] : BRAND[lang], item: url(p, lang) })),
  });
  return `<!-- page-ld -->\n${blocks.map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`).join('\n')}\n<!-- /page-ld -->`;
}

/* index.html turned into one page. Each change has to find its place exactly once: if
   index.html changes shape, this stops instead of writing a page with the wrong head. */
function build(html, page, lang) {
  const depth = rel(page, lang).split('/').length - 1;
  const other = lang === 'en' ? 'es' : 'en';
  const swaps = [
    [/<html lang="[a-z]+"( data-view="[a-z]+")?( data-foe="[a-z0-9-]+")?>/,
      `<html lang="${lang}"${page.view ? ` data-view="${page.view}"` : ''}${page.foe ? ` data-foe="${page.foe}"` : ''}>`],
    [/(<meta charset="utf-8">\n)(<base href="[^"]*">\n)?/, (m, meta) => meta + (depth ? `<base href="${'../'.repeat(depth)}">\n` : '')],
    [/<title>[^<]*<\/title>/, `<title>${attr(fullTitle(page, lang))}</title>`],
    [/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(page.description[lang])}">`],
    [/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url(page, lang)}">`],
    [/<link rel="alternate" hreflang="en" href="[^"]*">/, `<link rel="alternate" hreflang="en" href="${url(page, 'en')}">`],
    [/<link rel="alternate" hreflang="es" href="[^"]*">/, `<link rel="alternate" hreflang="es" href="${url(page, 'es')}">`],
    [/<link rel="alternate" hreflang="x-default" href="[^"]*">/, `<link rel="alternate" hreflang="x-default" href="${url(page, 'en')}">`],
    [/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(fullTitle(page, lang))}">`],
    [/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(page.description[lang])}">`],
    [/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url(page, lang)}">`],
    [/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${attr(OG_ALT[lang])}">`],
    [/<meta property="og:locale" content="[a-z_A-Z]+">\n<meta property="og:locale:alternate" content="[a-z_A-Z]+">/,
      `<meta property="og:locale" content="${lang === 'es' ? 'es_ES' : 'en_US'}">\n<meta property="og:locale:alternate" content="${other === 'es' ? 'es_ES' : 'en_US'}">`],
    [/<!-- page-ld -->[\s\S]*?<!-- \/page-ld -->/, pageLd(page, lang)],
    [/<!-- about -->[\s\S]*?<!-- \/about -->/, about(page, lang)],
    [/^(<!DOCTYPE html>\n)(<!-- Generated [^\n]*\n)?/, (m, doctype) => doctype + (page.view || lang !== 'en' ? '<!-- Generated from index.html by tools/pages.js (npm run pages): do not edit by hand. -->\n' : '')],
  ];
  let out = html;
  for (const [re, to] of swaps) {
    const hits = out.match(new RegExp(re.source, 'g'));
    if (!hits || hits.length !== 1) throw new Error(`index.html: expected ${re} once, found ${hits ? hits.length : 0}`);
    out = out.replace(re, typeof to === 'function' ? to : () => to);
  }
  return out;
}

function sitemap() {
  const alt = (page) => LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(page, l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(page, 'en')}"/>`).join('\n');
  const urls = PAGES.flatMap((page) => LANGS.map((l) => `  <url>\n    <loc>${url(page, l)}</loc>\n${alt(page)}\n  </url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by tools/pages.js (npm run pages): do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/* Every file this writes, as { file: contents }, from index.html as it is on disk. */
function all(html) {
  const out = {};
  for (const page of PAGES) for (const lang of LANGS) out[file(page, lang)] = build(html, page, lang);
  out['sitemap.xml'] = sitemap();
  return out;
}

if (require.main === module) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const [f, text] of Object.entries(all(html))) {
    fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, f), text);
  }
  console.log(`${PAGES.length * LANGS.length} pages and sitemap.xml written`);
}

module.exports = { build, all, sitemap, rel, url, file, fullTitle, SITE, LANGS, PAGES, OFF };
