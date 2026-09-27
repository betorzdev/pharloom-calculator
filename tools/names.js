/* tools/names.js — the game's names for the generators (tools/gen-*.js): a key's text in both
   languages, the key for an English name, and the Journal key for a wiki page. Built on the dump
   that tools/game-text.js downloads (CLAUDE.md, "Translations"). */
'use strict';
const W = require('./wiki.js');
const { load, norm } = require('./game-text.js');

async function names() {
  const { EN, ES } = await load();

  /* English (lower case) → keys, plus the titles the game splits into <X>_SUPER + <X>_MAIN
     ("Chapel of" + "the Beast"), as "X_SUPER+X_MAIN". */
  const BY_EN = new Map();
  const add = (en, k) => { en = norm(en).toLowerCase(); if (!en) return; if (!BY_EN.has(en)) BY_EN.set(en, []); BY_EN.get(en).push(k); };
  for (const k of Object.keys(EN)) add(EN[k], k);
  for (const k of Object.keys(EN)) {
    const m = /^(.*)_MAIN$/.exec(k);
    if (m && EN[m[1] + '_SUPER'] != null) add(EN[m[1] + '_SUPER'] + ' ' + EN[k], m[1] + '_SUPER+' + k);
  }

  /* A key's { es, en, key }; two keys joined with "+" are one title. A key the Spanish dump
     lacks keeps the English (the dump's Spanish misses 50 keys). */
  function text(key, optional) {
    const ks = key.split('+');
    if (ks.some((k) => !(k in EN))) { if (optional) return null; throw new Error(`the key ${key} isn't in the dump`); }
    const one = (L, k) => norm(L[k] != null ? L[k] : EN[k]);
    return { es: ks.map((k) => one(ES, k)).join(' '), en: ks.map((k) => one(EN, k)).join(' '), key };
  }

  /* By the English as the wiki writes it: the key whose English is exactly that, preferring a
     Journal name, then a map title, then a single key, then a split title. */
  function gameName(en) {
    const keys = BY_EN.get(norm(en).toLowerCase()) || [];
    const rank = (k) => (k.includes('+') ? 3 : /^NAME_/.test(k) ? 0 : /_MAIN$/.test(k) ? 1 : 2);
    const k = keys.slice().sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))[0];
    return k ? text(k) : null;
  }

  /* A creature's Journal key (NAME_<CODE>) from its wiki page's CODEname. Six pages carry a
     CODEname that isn't the Journal's (CORAL_GOOMBA for NAME_CORAL_GOOMBAS, MAPPER for Shakra),
     and Great Conchfly's has none: then the NAME_ key whose English is the page's title. */
  const journal = new Map();
  function journalKey(page) {
    if (journal.has(page)) return journal.get(page);
    const loc = W.localisations(W.page(page))[0];
    let key = loc && loc.code ? 'NAME_' + loc.code : null;
    if (!key || !(key in EN)) key = (BY_EN.get(norm(page.replace(/ \(Silksong\)$/, '')).toLowerCase()) || []).find((k) => /^NAME_/.test(k));
    if (!key) throw new Error(`${page}: no Journal key (NAME_) for its CODEname or its title`);
    journal.set(page, key);
    return key;
  }

  return { EN, ES, text, gameName, journalKey };
}

module.exports = { names };
