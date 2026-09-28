/* tools/pages-bosses.js — one page per boss, in each language, for what people search about one:
   its health, its attacks and how many hits it takes. tools/pages.js builds them as it builds the
   others (tools/pages-text.js): the whole site, opened on Combat with the boss picked (`foe`,
   index.html's data-foe). Unlike those, their text is written here from the data, so a patch that
   changes a boss changes its page with `npm run data && npm run pages`:
     · the bosses       js/enemies.js's boss pages (the wiki's), each with its fights (FOES rows:
                        Lace's two, Moss Mother's three), its attacks and staggers (ATTACKS), and
                        where it's fought and what it gives (BOSSES)
     · the hits         js/engine.js: a bare Hunter's slash at each Needle level against the boss's
                        own modifiers, and how many kill it
     · the text         the Journal's description (js/journal.js), the game's names everywhere;
                        the attacks' names are the wiki's English (the game doesn't name them).
   The text may carry <strong>, as tools/pages-text.js's. */
'use strict';
require('../js/data.js');
require('../js/enemies.js');
require('../js/journal.js');
require('../js/engine.js');
const { data: D, enemies: EN, journal: J, engine: E } = globalThis.SS;

const nf = { es: new Intl.NumberFormat('es-ES'), en: new Intl.NumberFormat('en-GB') };
const num = (n, lang) => nf[lang].format(n);
// "a, b and c" / «a, b y c».
const list = (xs, lang) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + (lang === 'es' ? ' y ' : ' and ') + xs[xs.length - 1]);
const NEEDLES = D.NEEDLES.map((n) => n.name);

/* The words around the figures; {x} are filled in. What the site says and the game doesn't is
   written for the context in each language (CLAUDE.md). */
const W = {
  title: [
    { es: '{n} en Silksong: vida, ataques y golpes para vencer', en: '{n} in Silksong: health, attacks and hits to kill' },
    { es: '{n} en Silksong: vida y ataques', en: '{n} in Silksong: health and attacks' },
    { es: '{n} en Silksong', en: '{n} in Silksong' },
  ],
  h1: { es: '{n}: vida, ataques y golpes para vencer', en: '{n}: health, attacks and hits to kill' },
  link: { es: '{n}', en: '{n}' },
  desc: { es: '{n} en Hollow Knight: Silksong: {hp} de vida, sus ataques y cuántos tajos necesita con cada mejora de la aguja. Y con tu build, en la calculadora.',
    en: '{n} in Hollow Knight: Silksong: {hp} health, its attacks and how many slashes it takes at each Needle upgrade. And with your build, in the calculator.' },
  /* No pronoun and no verb on the boss's name: bosses are she, he, they (Lace, Khann, the
     Forebrothers), and the Spanish would have to agree with each. */
  intro: { es: 'Combate de jefe de Hollow Knight: Silksong contra <strong>{n}</strong>{where}. El Diario de caza dice: «{d}»',
    en: 'A boss fight in Hollow Knight: Silksong against <strong>{n}</strong>{where}. The Hunter\'s Journal says: "{d}"' },
  where: { es: ', en {x}', en: ', in {x}' },
  hp: { es: '{x} de vida', en: '{x} health' },
  bt: { es: '{x} con hilo negro, en el acto 3', en: '{x} black-threaded, in Act 3' },
  onlyBt: { es: 'solo con hilo negro: {x} de vida', en: 'only black-threaded: {x} health' },
  bars: { es: 'dos barras a la vez, {x}', en: 'two bars at once, {x}' },
  health: { es: '{x}.', en: '{x}.' },   // the figure alone, capitalised: «1650 de vida.»
  fights: { es: 'Se combate {k} veces: {x}.', en: 'Fought {k} times: {x}.' },
  hits: { es: 'Con la aguja sola (un blasón de cazadora sin herramientas ni modificadores), un tajo quita {dmg} de vida con la {needles}: hacen falta {uses} tajos. Los modificadores de daño son los de este jefe: cada enemigo recibe distinto daño de cada mejora.',
    en: 'With the Needle alone (a Hunter\'s Crest with no Tools or modifiers), a slash deals {dmg} with the {needles}: that\'s {uses} slashes. The damage modifiers are this boss\'s own: each enemy takes different damage from each upgrade.' },
  hitsFight: { es: '{f}: {uses} tajos', en: '{f}: {uses} slashes' },
  hitsMany: { es: 'Con la aguja sola (un blasón de cazadora sin herramientas ni modificadores), con la {needles}, hacen falta: {x}.',
    en: 'With the Needle alone (a Hunter\'s Crest with no Tools or modifiers), with the {needles}: {x}.' },
  attacks: { es: 'Ataques, con los nombres de la wiki (el juego no los nombra): {x}.', en: 'Attacks, as the wiki names them (the game doesn\'t): {x}.' },
  masks: { es: '{k} máscaras', en: '{k} masks' },
  stagger: { es: 'Aturdimiento tras {x} golpes.', en: 'Staggered after {x} hits.' },
  drops: { es: 'Recompensa: {x}.', en: 'Reward: {x}.' },
  more: { es: 'Esta página abre la calculadora de daño con este jefe elegido: con tu partida o tu build, el daño de cada uno de tus ataques, cuántos hacen falta y lo que te hace a ti cada uno de los suyos.',
    en: 'This page opens the damage calculator with this boss picked: with your save or your build, each of your attacks\' damage, how many it takes, and what each of its attacks does to you.' },
  qHp: { es: '{n} en Silksong: ¿cuánta vida?', en: 'What is {n}\'s health in Silksong?' },
  qHits: { es: '¿Cuántos golpes hacen falta para vencer a {n}?', en: 'How many hits does it take to beat {n}?' },
  aHits: { es: 'Depende de tu aguja y de tus herramientas: con la aguja sola, de {most} tajos con la {first} a {fewest} con la {last}. Con tu build exacta, abre la calculadora en esta página.',
    en: 'It depends on your Needle and your Tools: with the Needle alone, from {most} slashes with the {first} to {fewest} with the {last}. For your exact build, open the calculator on this page.' },
};
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const cap = (x) => ({ es: x.es[0].toUpperCase() + x.es.slice(1), en: x.en[0].toUpperCase() + x.en.slice(1) });
const both = (w, v) => ({ es: fill(w.es, typeof v === 'function' ? v('es') : v), en: fill(w.en, typeof v === 'function' ? v('en') : v) });

/* One fight's health, in words. */
function healthText(f, lang) {
  if (f.hp == null) return fill(W.onlyBt[lang], { x: num(f.bt, lang) });
  const parts = [fill(W.hp[lang], { x: f.bars ? f.bars.map((b) => num(b, lang)).join(' + ') : num(f.hp, lang) })];
  if (f.bars) parts[0] = fill(W.bars[lang], { x: parts[0] });
  if (f.bt) parts.push(fill(W.bt[lang], { x: num(f.bt, lang) }));
  return parts.join(lang === 'es' ? ' y ' : ' and ');
}
const fightName = (f, lang) => f.name[lang] + (f.variant ? ` (${f.variant[lang]})` : '');

/* The slashes that kill it at each Needle level: a bare Hunter, the boss's modifiers. */
function slashes(f) {
  return D.NEEDLES.map((n, level) => {
    const a = E.compute(E.normalize({ crest: 'hunter', needle: level }), { foe: f }).needle.attacks[0];
    return { dmg: a.total, uses: a.uses };
  });
}

function bossPage(page) {
  const rows = EN.FOES.filter((f) => f.boss && f.page === page);
  const main = rows[0];
  const entry = J.BOOK.find((e) => e.key === main.key);
  const info = EN.BOSSES[page] || {};
  const atk = EN.ATTACKS[page] || { attacks: [], staggers: [] };
  const name = main.name;
  const n = (lang) => name[lang];
  const fought = rows.filter((f) => f.hp != null);

  const body = [];
  body.push(both(W.intro, (lang) => ({ n: n(lang), d: entry ? entry.desc[lang] : '',
    where: info.where ? fill(W.where[lang], { x: list(info.where.map((w) => w[lang]), lang) }) : '' })));
  body.push(rows.length > 1
    ? both(W.fights, (lang) => ({ k: num(rows.length, lang), x: rows.map((f) => `${fightName(f, lang)}, ${healthText(f, lang)}`).join('; ') }))
    : cap(both(W.health, (lang) => ({ x: healthText(main, lang) }))));
  const needles = (lang) => list(NEEDLES.map((x) => x[lang]), lang);
  if (fought.length === 1) {
    const s = slashes(fought[0]);
    body.push(both(W.hits, (lang) => ({ needles: needles(lang), dmg: list(s.map((x) => num(x.dmg, lang)), lang), uses: list(s.map((x) => num(x.uses, lang)), lang) })));
  } else if (fought.length > 1) {
    body.push(both(W.hitsMany, (lang) => ({ needles: needles(lang),
      x: fought.map((f) => fill(W.hitsFight[lang], { f: fightName(f, lang), uses: list(slashes(f).map((x) => num(x.uses, lang)), lang) })).join('; ') })));
  }
  // The attacks once each, with the masks they take when more than one.
  const seen = new Set();
  const attacks = atk.attacks.filter((a) => !seen.has(a.name.en) && seen.add(a.name.en));
  if (attacks.length) body.push(both(W.attacks, (lang) => ({ x: attacks.map((a) => {
    const m = (a.masks || [1]).reduce((s, k) => s + k, 0);
    return a.name.en + (m > 1 ? ` (${fill(W.masks[lang], { k: num(m, lang) })})` : '');
  }).join(', ') })));
  if (atk.staggers.length) body.push(both(W.stagger, (lang) => ({ x: list([...new Set(atk.staggers)].map((k) => num(k, lang)), lang) })));
  if (info.drops) body.push(both(W.drops, (lang) => ({ x: list(info.drops.map((d) => d[lang]), lang) })));
  body.push(both(W.more, (lang) => ({ n: n(lang) })));

  const title = {};
  for (const lang of ['es', 'en']) title[lang] = W.title.map((w) => fill(w[lang], { n: n(lang) })).find((t) => t.length <= 70);
  const first = fought[0] || main;
  const hpShort = (lang) => (first.hp != null ? num(first.hp, lang) : num(first.bt, lang));
  const faq = [{ q: both(W.qHp, (lang) => ({ n: n(lang) })),
    a: { es: rows.length > 1 ? fill(W.fights.es, { k: num(rows.length, 'es'), x: rows.map((f) => `${fightName(f, 'es')}, ${healthText(f, 'es')}`).join('; ') })
      : cap(both(W.health, (lang) => ({ x: healthText(main, lang) }))).es,
    en: rows.length > 1 ? fill(W.fights.en, { k: num(rows.length, 'en'), x: rows.map((f) => `${fightName(f, 'en')}, ${healthText(f, 'en')}`).join('; ') })
      : cap(both(W.health, (lang) => ({ x: healthText(main, lang) }))).en } }];
  if (fought.length) {
    const s = slashes(fought[0]);
    faq.push({ q: both(W.qHits, (lang) => ({ n: n(lang) })), a: both(W.aHits, (lang) => ({ most: num(s[0].uses, lang), fewest: num(s[4].uses, lang),
      first: NEEDLES[0][lang], last: NEEDLES[4][lang] })) });
  }
  return {
    id: 'boss-' + page, view: 'fight', foe: main.id, boss: true,
    slug: { es: 'jefes/' + page, en: 'bosses/' + page },
    link: { es: name.es, en: name.en },
    title, h1: both(W.h1, (lang) => ({ n: n(lang) })),
    description: both(W.desc, (lang) => ({ n: n(lang), hp: hpShort(lang) })),
    body, faq,
  };
}

// In the Journal's order, as the game lists them.
const BOSS_PAGES = Object.keys(EN.ATTACKS)
  .filter((p) => EN.FOES.some((f) => f.boss && f.page === p))
  .map(bossPage)
  .sort((a, b) => EN.FOES.find((f) => f.id === a.foe).hj - EN.FOES.find((f) => f.id === b.foe).hj);

module.exports = { BOSS_PAGES };
