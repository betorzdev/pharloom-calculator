/* test/i18n.test.js — no stray Spanish left when the site switches to English: the dictionary
   has both keys with the same placeholders, and its English carries neither a Spanish accented
   letter nor a Spanish word. The data modules join this net as their phases land. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');

const i18n = require('../js/i18n.js');

/* Characters that only appear in this site's Spanish. */
const SPANISH_CHARS = /[áéíóúüñ¿¡]/i;
/* Frequent words that would give away an untranslated string even without an accent. */
const SPANISH_WORDS = /\b(de|del|con|sin|por|para|los|las|una|un|el|la|que|más|cada|desde|hasta|tras|todas|todos|seda|golpe|golpes|daño|herramienta|herramientas|blasón|blasones|máscara|máscaras|aguja|carrete|rosarios|partida|Requiere)\b/i;

test('the interface dictionary covers both languages, with the same placeholders', () => {
  assert.ok(Object.keys(i18n.UI).length > 10);
  for (const [key, value] of Object.entries(i18n.UI)) {
    assert.equal(typeof value.es, 'string', `UI.${key} has no Spanish`);
    assert.equal(typeof value.en, 'string', `UI.${key} has no English`);
    const slots = (s) => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
    assert.equal(slots(value.en), slots(value.es), `UI.${key}: different placeholders`);
  }
});

test('the interface English leaves no stray Spanish', () => {
  for (const [key, value] of Object.entries(i18n.UI)) {
    assert.ok(!SPANISH_CHARS.test(value.en), `UI.${key}: Spanish accent in the English "${value.en}"`);
    assert.ok(!SPANISH_WORDS.test(value.en), `UI.${key}: Spanish word in the English "${value.en}"`);
  }
});

test('i18n: t() fills the placeholders and pick() chooses the language', () => {
  i18n.setLang('es');
  assert.equal(i18n.t('soon', { n: 3 }), 'Aún no está: llega en la fase 3 del plan.');
  assert.equal(i18n.pick({ es: 'hola', en: 'hi' }), 'hola');
  i18n.setLang('en');
  assert.equal(i18n.t('soon', { n: 3 }), 'Not built yet: it comes in phase 3 of the plan.');
  assert.equal(i18n.pick({ es: 'hola', en: 'hi' }), 'hi');
  assert.equal(i18n.pick({ es: 'solo español' }), 'solo español');   // with no en, it falls back to es
  assert.equal(i18n.pick('texto plano'), 'texto plano');
  assert.equal(i18n.t('missingKey'), 'missingKey');
  // A count of one takes the singular where the key has one, and only then.
  assert.equal(i18n.t('ftWaves', { n: '1' }), '1 wave');
  assert.equal(i18n.t('ftWaves', { n: '12' }), '12 waves');
  assert.equal(i18n.t('ftUses', { n: '1' }), '1 to kill it');
  i18n.setLang('es');
  assert.equal(i18n.t('ftToDie', { n: 1 }), '1 te mata');
});

/* The game's own names in the dictionary: the strings that carry their key (// KEY) are checked
   against the dump by tools/game-text.js --audit, which needs the network once; here, that
   the comment is well formed so the audit can find it. */
test('the strings that copy the game carry their key in the audit\'s format', () => {
  const fs = require('fs');
  const src = fs.readFileSync(require.resolve('../js/i18n.js'), 'utf8');
  const keyed = src.match(/^\s*\w+:\s*\{ es: '(?:[^'\\]|\\.)*',\s*en: '(?:[^'\\]|\\.)*' \},[ \t]*\/\/[ \t]*[A-Z][A-Z0-9_]+[ \t]*$/gm) || [];
  assert.ok(keyed.length >= 4, `expected the pause menu's names to carry their PANE_ keys, found ${keyed.length}`);
  assert.ok(keyed.some((l) => /PANE_TOOLS/.test(l)), 'the Crest screen carries PANE_TOOLS');
});
