/* tools/pages-text.js — what each of the site's pages says to search engines and to whoever lands
   on it: one page per search intent (design/00-study.md §7), each in both languages. tools/pages.js
   builds the pages from index.html and this; the site itself never loads it.

   Every page is the whole site, opened on one screen (`view`, index.html's data-view); the root
   has no view and opens where you left it. `title` leads with what people search and gets the
   brand after it; `h1` is the About block's heading (the title, unless it says otherwise);
   `body` are its paragraphs and `faq` its questions (also FAQPage in the JSON-LD); `link` is the
   page's name in the other pages' links. The text may carry <code> and <strong>, nothing else.
   Game names as the game says them (npm run text): Pharloom is «Telalejana», the Journal the
   «Diario de caza» (INV_NAME_JOURNAL), the Tools screen «Blasón» (PANE_TOOLS), completion
   «Finalización» (COMPLETION), Mask Shards «fragmentos de máscara» (INV_NAME_HEART_PIECE_1),
   Spool Fragments «fragmentos de carrete» (INV_NAME_SPOOL_PIECE_HALF), rosaries «rosarios»,
   the Hunter's Memento the «Recuerdo de cazadora» (INV_NAME_HUNTER_MEMENTO). */
'use strict';

const BRAND = { es: 'Calculadora de Telalejana', en: 'Pharloom Calculator' };

/* The About block's fixed labels. */
const LABELS = {
  faq:   { es: 'Preguntas frecuentes', en: 'Questions' },
  more:  { es: 'Más en el sitio', en: 'More on the site' },
  bosses: { es: 'Jefes', en: 'Bosses' },
  // The guide page's (tools/pages.js, about; design/23-static-pages-round2.html, D).
  attacks: { es: 'Sus ataques', en: 'Its attacks' },
  phases: { es: 'Fases', en: 'Phases' },
  reward: { es: 'Recompensa', en: 'Reward' },
  details: { es: 'Todos los detalles', en: 'Every detail' },
  bossCta: { es: 'Pruébalo con tu build', en: 'Try it with your build' },
};

/* The preview card's image (assets/site/og.jpg) is the same on every page; its description. */
const OG_ALT = {
  es: 'La pantalla Tu partida: un 63 % repartido por categorías, que coincide con el que muestra el juego',
  en: 'The Your game screen: a 63% split by category, matching the one the game shows',
};

const FREE = {
  q: { es: '¿Es gratis? ¿Hace falta cuenta?', en: 'Is it free? Do I need an account?' },
  a: { es: 'Es gratis, sin cuenta y sin anuncios. Tu partida no sale de tu navegador: se lee ahí y se guarda ahí.', en: 'Free, no account and no ads. Your save never leaves your browser: it\'s read there and kept there.' },
};
const WHERE = {
  q: { es: '¿Dónde está el archivo de mi partida?', en: 'Where is my save file?' },
  a: { es: 'En Windows, en <code>%USERPROFILE%\\AppData\\LocalLow\\Team Cherry\\Hollow Knight Silksong</code>; en macOS, en <code>~/Library/Application Support/unity.Team-Cherry.Silksong</code>; en Linux y Steam Deck, en <code>~/.config/unity3d/Team Cherry/Hollow Knight Silksong</code>. Dentro, una carpeta con un número y los archivos <code>user1.dat</code> a <code>user4.dat</code>. La propia web te guía al importar.',
       en: 'On Windows, in <code>%USERPROFILE%\\AppData\\LocalLow\\Team Cherry\\Hollow Knight Silksong</code>; on macOS, in <code>~/Library/Application Support/unity.Team-Cherry.Silksong</code>; on Linux and Steam Deck, in <code>~/.config/unity3d/Team Cherry/Hollow Knight Silksong</code>. Inside, a folder named with a number and the files <code>user1.dat</code> to <code>user4.dat</code>. The site walks you through it when importing.' },
};

const PAGES = [
  {
    id: 'home', view: null, slug: { es: '', en: '' },
    link: { es: 'Inicio', en: 'Home' },
    title: { es: 'Tu partida de Silksong: el 100 %, el mapa y las herramientas', en: 'Silksong save tracker, 100% checklist, map and Tools' },
    description: {
      es: 'Importa tu partida de Hollow Knight: Silksong y mira qué te falta para el 100 %, en el mapa del propio juego, y cómo cambia Hornet con cada herramienta y blasón.',
      en: 'Import your Hollow Knight: Silksong save and see what\'s missing for 100%, on the game\'s own map, and how each Tool and Crest changes Hornet.',
    },
    h1: { es: 'Tu partida de Hollow Knight: Silksong, en vivo', en: 'Your Hollow Knight: Silksong game, live' },
    body: [
      { es: 'La Calculadora de Telalejana lee el archivo de tu partida de Silksong y te enseña lo que el juego no te dice: qué te falta para el 100 %, pieza a pieza, dónde está cada fragmento de máscara, fragmento de carrete y herramienta que no tienes, en el mapa del propio juego, y cuántas entradas del Diario de caza te quedan. Su 100 % es el mismo que el del juego: comprobado en 92 partidas reales. En Chrome y Edge sigue el archivo mientras juegas.',
        en: 'Pharloom Calculator reads your Silksong save file and shows what the game doesn\'t tell you: what\'s missing for 100%, piece by piece, where every Mask Shard, Spool Fragment and Tool you don\'t have yet is, on the game\'s own map, and how many Hunter\'s Journal entries are left. Its 100% is the game\'s own: checked on 92 real saves. In Chrome and Edge it follows the file while you play.' },
      { es: 'Y sin partida también sirve: la pantalla del Blasón te dice cómo cambia cada estadística de Hornet con cada herramienta, blasón y mejora. Todos los números salen de la wiki, con el redondeo del juego, y todos los nombres, de su traducción oficial.',
        en: 'It works without a save too: the Crest screen tells you how each of Hornet\'s stats changes with each Tool, Crest and upgrade. Every number comes from the wiki, with the game\'s rounding, and every name from its official translation.' },
    ],
    faq: [FREE,
      { q: { es: '¿Funciona con la versión de consola?', en: 'Does it work with the console version?' },
        a: { es: 'Leer la partida necesita el archivo, y solo el juego de ordenador (Windows, macOS, Linux, Steam Deck) lo deja a mano. Sin partida, la calculadora, el mapa y el Diario funcionan igual.', en: 'Reading the save needs the file, and only the computer version (Windows, macOS, Linux, Steam Deck) keeps it where you can reach it. Without a save, the calculator, the map and the Journal work all the same.' } },
    ],
  },
  {
    id: 'analyzer', view: 'home', slug: { es: 'analizador-partida', en: 'save-analyzer' },
    link: { es: 'Analizador de partida', en: 'Save analyzer' },
    title: { es: 'Analizador de partidas de Silksong: tu 100 % y lo que falta', en: 'Silksong save analyzer: your 100% and what\'s missing' },
    description: {
      es: 'Suelta tu archivo de Hollow Knight: Silksong y mira tu 100 % por categorías, el mismo que muestra el juego, y lo que te falta. En español, y siguiendo tu partida en vivo.',
      en: 'Drop your Hollow Knight: Silksong save file and see your 100% by category, the same the game shows, and what\'s missing. Following your game live.',
    },
    body: [
      { es: 'Importa el archivo de tu partida y la web te dice tu finalización repartida en las diez categorías del juego (herramientas, carretes de seda, mejoras, habilidades, blasones, máscaras, la aguja…), y cada cosa que te falta, con su acto y su zona. Cuenta como el juego: máscaras y carretes enteros, no fragmentos sueltos, y una herramienta y su mejora como un solo punto.',
        en: 'Import your save file and the site tells you your completion split into the game\'s ten categories (Tools, Silk Spools, upgrades, abilities, Crests, masks, the Needle…), and each thing you\'re missing, with its Act and its area. It counts as the game does: whole masks and spools, not loose shards, and a Tool and its upgrade as one point.' },
      { es: 'Cuatro partidas, como en el juego, y también sus puntos de restauración. En Chrome y Edge puede seguir el archivo: cuando el juego guarda, la web se pone al día y te dice qué has conseguido desde el guardado anterior.',
        en: 'Four saves, as in the game, and their restore points too. In Chrome and Edge it can follow the file: when the game saves, the site catches up and tells you what you got since the previous save.' },
    ],
    faq: [WHERE, FREE],
  },
  {
    id: 'completion', view: 'progress', slug: { es: 'guia-100', en: '100-percent-checklist' },
    link: { es: 'Lista del 100 %', en: '100% checklist' },
    title: { es: 'Silksong al 100 %: lista de todo lo que cuenta', en: 'Silksong 100% checklist: everything that counts' },
    description: {
      es: 'Todo lo que cuenta para el 100 % de Hollow Knight: Silksong, pieza a pieza: herramientas, blasones, fragmentos de máscara y de carrete, mejoras, con su acto y su zona. Y los deseos.',
      en: 'Everything that counts for Hollow Knight: Silksong\'s 100%, piece by piece: Tools, Crests, Mask Shards and Spool Fragments, upgrades, with their Act and area. And the wishes.',
    },
    body: [
      { es: 'El 100 % de Silksong son diez categorías: 51 herramientas, 9 carretes de seda, 8 mejoras del kit de fabricación y la bolsa de herramientas, 7 habilidades, 6 habilidades de seda, 6 blasones, 5 máscaras, 4 mejoras de la aguja, 3 corazones de seda y la Siempreviva. La lista las da una a una, con su acto y la zona donde están, y más allá del 100 %, los relicarios de memorias, el metal artesano, el aceite pálido, las pulgas y las tareas del juego.',
        en: 'Silksong\'s 100% is ten categories: 51 Tools, 9 Silk Spools, 8 Crafting Kit and Tool Pouch upgrades, 7 abilities, 6 Silk Skills, 6 Crests, 5 masks, 4 Needle upgrades, 3 Silk Hearts and the Everbloom. The list gives them one by one, with their Act and the area they\'re in, and beyond the 100%, the Memory Lockets, Craftmetal, Pale Oil, the fleas and the game\'s tasks.' },
      { es: 'Con tu partida importada, solo lo que te falta. Siete puntos son del acto 3: antes de él, el máximo que se ve es un 93 %.',
        en: 'With your save imported, only what you\'re missing. Seven points are Act 3\'s: before it, the most a game shows is 93%.' },
    ],
    faq: [
      { q: { es: '¿Cuentan el Diario de caza y los jefes?', en: 'Do the Journal and the bosses count?' },
        a: { es: 'No: el 100 % de Silksong no cuenta el Diario de caza, ni los jefes, ni los deseos. La mitad son herramientas.', en: 'No: Silksong\'s 100% doesn\'t count the Hunter\'s Journal, the bosses or the wishes. Half of it is Tools.' } },
      FREE,
    ],
  },
  {
    id: 'map', view: 'map', slug: { es: 'mapa', en: 'map' },
    link: { es: 'Mapa', en: 'Map' },
    title: { es: 'Mapa de Silksong: el del juego, con lo que te falta', en: 'Silksong map: the game\'s own, with what you\'re missing' },
    description: {
      es: 'El mapa de Telalejana tal como lo dibuja el juego, sacado de sus archivos, con Hornet en tu banco y cada fragmento de máscara, de carrete y relicario que te falta, en su sala.',
      en: 'Pharloom\'s map as the game draws it, taken from its own files, with Hornet at your bench and each Mask Shard, Spool Fragment and Memory Locket you\'re missing, in its room.',
    },
    body: [
      { es: 'No es un mapa dibujado de nuevo: son las salas del mapa del propio juego, cada una en el color de su zona, sacadas de sus archivos. Encima, Hornet en el banco donde descansas y un punto por cada pieza que te falta en su sala: fragmentos de máscara, de carrete, relicarios de memorias, metal artesano, aceite pálido y pulgas. Sin partida, todas, como guía.',
        en: 'It isn\'t a map drawn again: it\'s the rooms of the game\'s own map, each in its area\'s colour, taken from its files. On it, Hornet at the bench you rest at and a dot for each piece you\'re missing in its room: Mask Shards, Spool Fragments, Memory Lockets, Craftmetal, Pale Oil and fleas. Without a save, all of them, as a guide.' },
    ],
    faq: [WHERE, FREE],
  },
  {
    id: 'journal', view: 'journal', slug: { es: 'diario-de-caza', en: 'hunters-journal' },
    link: { es: 'Diario de caza', en: 'Hunter\'s Journal' },
    title: { es: 'Diario de caza de Silksong: las 236 entradas y qué te falta', en: 'Silksong Hunter\'s Journal: all 236 entries and what\'s left' },
    description: {
      es: 'Las 236 entradas del Diario de caza de Hollow Knight: Silksong, con los textos y las notas del juego, cuántos enemigos te faltan para cada una y para el Recuerdo de cazadora.',
      en: 'The 236 entries of Hollow Knight: Silksong\'s Hunter\'s Journal, with the game\'s texts and notes, how many kills each one still needs, and how far you are from the Hunter\'s Memento.',
    },
    body: [
      { es: 'El Diario de caza como el del juego: cada entrada con su retrato, su descripción y, cuando la completas, la nota de la cazadora, y cuántos enemigos te faltan para cada una. Nuu da el Recuerdo de cazadora al completar las 230 necesarias (231 en Alma de acero): seis son opcionales.',
        en: 'The Hunter\'s Journal as the game\'s: each entry with its portrait, its description and, once you complete it, the Hunter\'s note, and how many kills each one still needs. Nuu gives the Hunter\'s Memento for the 230 required ones (231 in Steel Soul): six are optional.' },
    ],
    faq: [
      { q: { es: '¿Cuántas entradas tiene el Diario de caza?', en: 'How many entries does the Hunter\'s Journal have?' },
        a: { es: '236 en el modo clásico y 237 en Alma de acero. Para el Recuerdo de cazadora hacen falta 230 (231): seis son opcionales.', en: '236 in Classic and 237 in Steel Soul. The Hunter\'s Memento needs 230 (231): six are optional.' } },
      FREE,
    ],
  },
  {
    id: 'crest', view: 'tools', slug: { es: 'herramientas-y-blasones', en: 'tools-and-crests' },
    link: { es: 'Herramientas y blasones', en: 'Tools and Crests' },
    title: { es: 'Calculadora de herramientas y blasones de Silksong', en: 'Silksong Tools and Crests calculator' },
    description: {
      es: 'Cómo cambia cada estadística de Hornet con cada herramienta, blasón y mejora de Hollow Knight: Silksong: el daño de la aguja, del golpe concentrado, de cada habilidad y herramienta.',
      en: 'How each of Hornet\'s stats changes with each Tool, Crest and upgrade in Hollow Knight: Silksong: the damage of the Needle, the Needle Strike, each Silk Skill and each Tool.',
    },
    body: [
      { es: 'Elige un blasón, sus herramientas y su habilidad de seda, y los niveles de la aguja, del kit de fabricación y de la bolsa de herramientas, y la web te da cada cifra con la fórmula de la wiki y el redondeo del juego: el tajo de la aguja con sus modificadores (que se suman, no se multiplican), el golpe concentrado de cada blasón, las seis habilidades de seda, el daño, los usos y el coste de cada herramienta, la seda y enlazar.',
        en: 'Pick a Crest, its Tools and its Silk Skill, and the Needle, Crafting Kit and Tool Pouch levels, and the site gives you each figure with the wiki\'s formula and the game\'s rounding: the Needle\'s slash with its modifiers (which add, not multiply), each Crest\'s Needle Strike, the six Silk Skills, each Tool\'s damage, uses and cost, silk and the Bind.' },
      { es: 'Con tu partida, la build que llevas en el juego. Y cada build se comparte con un enlace.',
        en: 'With your save, the build you wear in the game. And every build can be shared with a link.' },
    ],
    faq: [
      { q: { es: '¿Las herramientas mejoran con la aguja?', en: 'Do Tools get stronger with the Needle?' },
        a: { es: 'No: las herramientas suben con el kit de fabricación (un 60 % por nivel), y su munición, con la bolsa de herramientas. La aguja sube la aguja, el golpe concentrado y las habilidades de seda.', en: 'No: Tools grow with the Crafting Kit (60% per level), and their ammo with the Tool Pouch. The Needle raises the Needle, the Needle Strike and the Silk Skills.' } },
      FREE,
    ],
  },
  {
    id: 'damage', view: 'fight', slug: { es: 'calculadora-de-danio', en: 'damage-calculator' },
    link: { es: 'Calculadora de daño', en: 'Damage calculator' },
    title: { es: 'Calculadora de daño de Silksong: golpes para cada jefe', en: 'Silksong damage calculator: hits to kill every boss' },
    description: {
      es: 'Cuántos golpes necesita cada enemigo y jefe de Hollow Knight: Silksong con tu build, con sus propios modificadores a tu nivel, el hilo negro del acto 3 y los desafíos de enemigos.',
      en: 'How many hits each enemy and boss of Hollow Knight: Silksong takes with your build, through its own modifiers at your level, black-threaded in Act 3, and the enemy gauntlets.',
    },
    body: [
      { es: 'En Silksong cada enemigo recibe distinto daño según el nivel de lo que le golpea: por eso los golpes para matarlo son una pregunta por enemigo. Elige uno de los 262 de la wiki, o uno de los 49 desafíos de enemigos, y la web te da el daño de cada uno de tus ataques contra él, cuántos hacen falta y la forma más rápida de acabar, con tus herramientas y tu seda. Y al revés: cuántos golpes de cada ataque suyo te matan.',
        en: 'In Silksong each enemy takes different damage depending on the level of what hits it: so hits to kill it is a question per enemy. Pick one of the wiki\'s 262, or one of the 49 enemy gauntlets, and the site gives you each of your attacks\' damage against it, how many it takes and the quickest way through, with your Tools and your silk. And the other way: how many hits of each of its attacks kill you.' },
    ],
    faq: [
      { q: { es: '¿Por qué el mismo tajo hace distinto daño a cada enemigo?', en: 'Why does the same slash deal different damage to each enemy?' },
        a: { es: 'Porque cada enemigo lleva cinco modificadores, uno por nivel de la aguja o del kit: los del principio reciben más daño de una aguja mejorada. El daño es arma × modificador del enemigo × (1 + tus modificadores), redondeado al par más cercano.', en: 'Because each enemy carries five modifiers, one per Needle or Kit level: the early ones take more from an upgraded Needle. Damage is weapon × the enemy\'s modifier × (1 + your modifiers), rounded half to even.' } },
      FREE,
    ],
  },
];

/* Each page's guide (tools/pages.js, about): the art at the top of its block, the button up to
   its screen, and the icon it carries in the other pages' links. */
const GUIDE = {
  home: { art: 'assets/hornet/idle.png', icon: 'assets/hornet/stand.png', cta: { es: 'Importa tu partida', en: 'Import your save' } },
  analyzer: { art: 'assets/hornet/resting.png', icon: 'assets/hornet/sit.png', cta: { es: 'Importa tu partida', en: 'Import your save' } },
  completion: { art: 'assets/icons/items/mask-shard.webp', icon: 'assets/icons/items/mask-shard.webp', cta: { es: 'Mira lo que te falta', en: 'See what\'s missing' } },
  map: { art: 'assets/icons/items/farsight.webp', icon: 'assets/icons/items/farsight.webp', cta: { es: 'Abre el mapa', en: 'Open the map' } },
  journal: { art: 'assets/journal/art/name_mossbone_crawler.webp', icon: 'assets/icons/items/hunters-journal.webp', cta: { es: 'Abre el Diario', en: 'Open the Journal' } },
  crest: { art: 'assets/crests/hunter-3.webp', icon: 'assets/icons/crests/hunter.webp', cta: { es: 'Prueba builds', en: 'Try builds' } },
  damage: { art: 'assets/hornet/idle.png', icon: 'assets/icons/tools/straight-pin.webp', cta: { es: 'Calcula con tu build', en: 'Work it out with your build' } },
};
for (const page of PAGES) Object.assign(page, GUIDE[page.id]);

module.exports = { BRAND, LABELS, OG_ALT, PAGES };
