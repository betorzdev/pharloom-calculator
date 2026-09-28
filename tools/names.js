/* tools/names.js — the game's names for the generators (tools/gen-*.js): a key's text in both
   languages, the key for an English name, and the Journal key for a wiki page. Built on the dump
   that tools/game-text.js downloads (CLAUDE.md, "Translations"). */
'use strict';
const W = require('./wiki.js');
const { load, norm } = require('./game-text.js');

async function names() {
  const { EN, ES } = await load();

  /* English (lower case) → keys, plus the titles the game splits into <X>_SUPER + <X>_MAIN
     ("Chapel of" + "the Beast"), as "X_SUPER+X_MAIN", or "X_SUPER+X_MAIN+X_SUB" when a language
     puts a half under X_SUB (the Spanish, often: text() below). */
  const BY_EN = new Map();
  const add = (en, k) => { en = norm(en).toLowerCase(); if (!en) return; if (!BY_EN.has(en)) BY_EN.set(en, []); BY_EN.get(en).push(k); };
  for (const k of Object.keys(EN)) add(EN[k], k);
  for (const k of Object.keys(EN)) {
    const m = /^(.*)_MAIN$/.exec(k);
    const sub = m && (EN[m[1] + '_SUB'] != null || ES[m[1] + '_SUB'] != null) ? '+' + m[1] + '_SUB' : '';
    if (m && EN[m[1] + '_SUPER'] != null) add(EN[m[1] + '_SUPER'] + ' ' + EN[k], m[1] + '_SUPER+' + k + sub);
  }

  /* A key's { es, en, key }; keys joined with "+" are one title, X_SUPER+X_MAIN+X_SUB. A single
     key the Spanish dump lacks keeps the English. A title's halves go where each language puts
     them: the 50 _SUPER keys the Spanish lacks are its _SUB ("Forge" + "Daughter" is «Hija» +
     «de la Forja»), so each language joins the parts it has. */
  function text(key, optional) {
    const ks = key.split('+');
    const split = ks.length > 1;
    if (ks.some((k) => !(k in EN) && !(split && k in ES))) { if (optional) return null; throw new Error(`the key ${key} isn't in the dump`); }
    const say = (L) => (split ? ks.filter((k) => L[k] != null).map((k) => norm(L[k])) : [norm(L[key] != null ? L[key] : EN[key])]).join(' ');
    return { es: say(ES), en: say(EN), key };
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
