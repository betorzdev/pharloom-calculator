/* tools/wiki.js — reading the raw wikitext in kb/data/raw/ (kb/data/fetch-wiki.py downloads it).
   Shared by the generators (tools/gen-*.js): a page by title, a template's fields, the
   {{Localisation}} blocks, and the rows of a wikitable. It reads, it doesn't interpret: what a
   field means is each generator's business. No dependencies. */
'use strict';
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, '..', 'kb', 'data', 'raw');

/* A page's file is its title with `/` and spaces as `_` (fetch-wiki.py's safe()). */
function page(title) {
  const f = path.join(RAW, title.replace(/[/ ]/g, '_') + '.wiki');
  if (!fs.existsSync(f)) throw new Error(`no raw page for "${title}": add it to kb/data/pages.txt and run npm run kb`);
  return fs.readFileSync(f, 'utf8');
}

/* Every page, as [title-ish file stem, text]. */
function pages() {
  return fs.readdirSync(RAW).filter((f) => f.endsWith('.wiki')).sort()
    .map((f) => [f.slice(0, -5).replace(/_/g, ' '), fs.readFileSync(path.join(RAW, f), 'utf8')]);
}

/* The body of each {{Name …}} on the page, braces balanced. */
function templates(text, name) {
  const out = [];
  const re = new RegExp('\\{\\{\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[|\\n}]', 'g');
  let m;
  while ((m = re.exec(text))) {
    let depth = 0, i = m.index;
    for (; i < text.length - 1; i++) {
      if (text[i] === '{' && text[i + 1] === '{') { depth++; i++; }
      else if (text[i] === '}' && text[i + 1] === '}') { depth--; i++; if (!depth) break; }
    }
    // From after the name to before the closing braces.
    out.push(text.slice(m.index + 2, i - 1).replace(/^\s*[^|\n}]+/, ''));
  }
  return out;
}

/* A template's named fields, `| key = value`, over several lines; nested templates, links and
   galleries are kept whole. */
function fields(body) {
  const out = {};
  let depth = 0, cur = '', parts = [];
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{' || two === '[[') { depth++; cur += two; i++; continue; }
    if (two === '}}' || two === ']]') { depth--; cur += two; i++; continue; }
    if (body[i] === '|' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += body[i];
  }
  parts.push(cur);
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq < 0) continue;
    out[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
  }
  return out;
}

/* Wikitext to plain text: links to their label, templates the site knows to their words,
   tags and bold/italics out. */
function plain(s) {
  return String(s || '')
    .replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\{\{CrestSlot\|(\w+)(?:\|[^}]*)?\}\}/g, '$1')
    .replace(/\{\{[Ss]\|([^}|]*)\}\}/g, '$1 shards')
    .replace(/\{\{[Rr]\|([^}|]*)\}\}/g, '$1 rosaries')
    .replace(/\{\{BT\|([^}|]*)\}\}/g, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[File:[^\]]*\]\]/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '').replace(/'''?/g, '')
    .replace(/\s+/g, ' ').trim();
}

/* The first link's target in a cell, or its plain text. */
function linkTarget(s) {
  const m = /\[\[([^\]|#]+)/.exec(s || '');
  return m ? m[1].trim() : plain(s);
}

/* Each {{Localisation}} block's ESname and CODEname, in page order. */
function localisations(text) {
  return templates(text, 'Localisation').map((b) => {
    const f = fields(b);
    // CODEname can carry two keys, "CREST_PILGRIM<br>WANDERER": the first is the game's.
    return { es: plain(f.ESname || ''), code: plain(f.CODEname || '').split(/\s+/)[0] };
  });
}

/* A wikitable's rows, each a list of its cells' raw text (header `!` and data `|` cells alike,
   one per line or `||`/`!!` on one line). A cell with rowspan="n" is repeated, at its column, in
   the n − 1 rows below it. `from` is a heading or any text before the table. */
function table(text, from) {
  const at = from ? text.indexOf(from) : 0;
  if (at < 0) throw new Error(`no "${from}" on the page`);
  const start = text.indexOf('{|', at);
  const end = text.indexOf('\n|}', start);
  const body = text.slice(start, end < 0 ? undefined : end);
  const rows = body.split(/\n\|-[^\n]*/).slice(1);
  const carry = [];   // per column: { text, left } from a rowspan above
  return rows.map((r) => {
    const own = [];
    for (const line of r.split('\n')) {
      if (!line.length) continue;
      if (line[0] === '!' || line[0] === '|') {
        for (let c of line.slice(1).split(/\s*(?:\|\||!!)\s*/)) {
          // `style="…" | value`: the attributes go, but a rowspan is kept for the rows below.
          let span = 1;
          const bar = c.search(/\|(?!\|)/);
          if (bar > -1 && /^\s*[a-z-]+\s*=/.test(c.slice(0, bar)) && !/\[\[|\{\{/.test(c.slice(0, bar))) {
            const m = /rowspan\s*=\s*"?(\d+)/.exec(c.slice(0, bar));
            if (m) span = Number(m[1]);
            c = c.slice(bar + 1);
          }
          own.push({ text: c.trim(), span });
        }
      } else if (own.length) own[own.length - 1].text += '\n' + line;
    }
    if (!own.length) return own;
    const cells = [];
    for (let col = 0; own.length || (carry[col] && carry[col].left > 0); col++) {
      if (carry[col] && carry[col].left > 0) { cells.push(carry[col].text); carry[col].left--; continue; }
      const c = own.shift();
      if (c.span > 1) carry[col] = { text: c.text, left: c.span - 1 };
      cells.push(c.text);
    }
    return cells;
  }).filter((c) => c.length);
}

/* The wikitable that contains this text. */
function tableWith(text, needle) {
  const at = text.indexOf(needle);
  if (at < 0) throw new Error(`no "${needle}" on the page`);
  return table(text.slice(text.lastIndexOf('{|', at)));
}

/* Kebab-case id from an English name: "Delver's Drill" → "delvers-drill". */
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/['’]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

module.exports = { RAW, page, pages, templates, fields, plain, linkTarget, localisations, table, tableWith, slug };
