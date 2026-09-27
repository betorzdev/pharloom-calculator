/* js/i18n.js — Pharloom: the interface language (Spanish and English).
   Three pieces:
     t(key, vars)    interface strings; {x} is replaced by vars.x
     pick(v)         resolves any { es, en } from the data or the engine
     nf(decimals)    number formatter with the active locale
   The language lives in SS.i18n.lang; setLang() changes it and updates <html lang>.
   The game data (Tools, Crests, the Needle…) will carry its own { es, en } in js/data.js:
   only the texts the site writes are here. A string that copies the game carries its key in
   a comment (CLAUDE.md, "Translations"): tools/game-text.js --audit checks it says the same. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});

  const UI = {
    /* Header */
    title:          { es: 'Calculadora de Telalejana', en: 'Pharloom Calculator' },
    goHome:         { es: 'Ir a Tu partida, la pantalla de inicio', en: 'Go to Your game, the home screen' },
    langGroup:      { es: 'Idioma', en: 'Language' },
    docTitle:       { es: 'Calculadora de Telalejana · Hollow Knight: Silksong', en: 'Pharloom Calculator · Hollow Knight: Silksong' },
    metaDescription:{ es: 'Cómo cambia cada estadística de Hornet con cada herramienta, blasón y mejora en Hollow Knight: Silksong, y tu partida real seguida desde su archivo de guardado. En español e inglés. En construcción.',
                      en: 'How each of Hornet\'s stats changes with each Tool, Crest and upgrade in Hollow Knight: Silksong, and your real game followed from its save. In English and Spanish. In the making.' },

    /* The screen bar: the pages of the game's pause menu, with the game's own names where it has them. */
    navLabel:       { es: 'Pantallas', en: 'Screens' },
    navHome:        { es: 'Tu partida', en: 'Your game' },
    navGame:        { es: 'Inventario', en: 'Inventory' },   // PANE_INVENTORY
    navProgress:    { es: 'Progreso', en: 'Progress' },
    navMap:         { es: 'Mapa', en: 'Map' },   // PANE_MAP
    navJournal:     { es: 'Diario', en: 'Journal' },   // PANE_JOURNAL
    navTools:       { es: 'Blasón', en: 'Crest' },   // PANE_TOOLS
    navFight:       { es: 'Combate', en: 'Combat' },
    savesTitle:     { es: 'Partidas', en: 'Saves' },

    /* A screen that isn't built yet (design/00-study.md §9). */
    soon:           { es: 'Aún no está: llega en la fase {n} del plan.', en: 'Not built yet: it comes in phase {n} of the plan.' },
    soonStudy:      { es: 'El estudio y el plan', en: 'The study and the plan' },

    /* Footer: the fan-project notice, the sources and the author (docs/guide.md, "Credits and licences") */
    footLabel:      { es: 'Aviso, fuentes y contacto', en: 'Notice, sources and contact' },
    footFan:        { es: 'Proyecto de fans no oficial, gratuito y sin ánimo de lucro, sin relación con {tc}. Hollow Knight: Silksong y su arte son © Team Cherry.',
                      en: 'Unofficial fan project, free and non-commercial, not affiliated with {tc}. Hollow Knight: Silksong and its artwork are © Team Cherry.' },
    footData:       { es: 'Datos de {wiki}, bajo {lic}; textos del juego, de su traducción oficial.',
                      en: 'Data from {wiki}, under {lic}; game texts from its official translation.' },
    footMade:       { es: 'Hecho por Albert. ¿Un número mal, una traducción rara o un fallo? Escribe a {mail}.',
                      en: 'Made by Albert. A wrong number, an odd translation or a bug? Write to {mail}.' },
  };

  let lang = 'en';   // English by default

  const pick = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] !== undefined ? v[lang] : v.es) : v);

  function t(key, vars) {
    const entry = UI[key];
    let s = entry ? pick(entry) : key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  const locale = () => (lang === 'en' ? 'en-GB' : 'es-ES');
  const nf = (max, min = 0) => new Intl.NumberFormat(locale(), { minimumFractionDigits: min, maximumFractionDigits: max });

  function setLang(next) {
    lang = next === 'es' ? 'es' : 'en';
    SS.i18n.lang = lang;
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    return lang;
  }

  SS.i18n = { UI, lang, t, pick, nf, setLang, get current() { return lang; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.i18n;
})();
