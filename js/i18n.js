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
    docTitle:       { es: 'Tu partida de Silksong: el 100 %, el mapa y las herramientas · Calculadora de Telalejana', en: 'Silksong save tracker, 100% checklist, map and Tools · Pharloom Calculator' },
    metaDescription:{ es: 'Importa tu partida de Hollow Knight: Silksong y mira qué te falta para el 100 %, en el mapa del propio juego, y cuántos golpes necesita cada enemigo con tus herramientas y blasones.',
                      en: 'Import your Hollow Knight: Silksong save and see what\'s missing for 100%, on the game\'s own map, and how many hits each enemy takes with your Tools and Crests.' },

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

    /* Saves: four, as the game's profile screen, and free mode (js/app-saves.js) */
    saveSlot:       { es: 'Partida {n}', en: 'Save {n}' },
    saveSelect:     { es: 'Selecciona partida', en: 'Select save' },
    saveBtnHint:    { es: 'Elegir partida: cuatro, como en el juego, o el Modo libre', en: 'Choose a save: four, as in the game, or Free mode' },
    savesNote:      { es: 'Cada partida viene del archivo del juego: tus herramientas y blasones, las mejoras, el Diario y lo que falta para el 100 %. Se ve tal como la guardó el juego: aquí no se cambia. Mientras no eliges una, estás en el Modo libre.',
                      en: 'Each save comes from the game\'s file: your Tools and Crests, the upgrades, the Journal and what\'s missing for 100%. It shows as the game saved it: nothing is changed here. Until you pick one, you\'re in Free mode.' },
    savesNoStorage: { es: 'Este navegador no deja guardar datos: solo hay una partida', en: 'This browser doesn\'t let the site save data: there\'s only one save' },
    freeMode:       { es: 'Modo libre', en: 'Free mode' },
    freeModeNote:   { es: 'Todo desbloqueado, para probar builds: no es ninguna de tus partidas', en: 'Everything unlocked, to try builds: it isn\'t one of your saves' },
    saveCurrent:    { es: 'Estás aquí', en: 'You\'re here' },
    saveContinue:   { es: 'Seguir con esta partida', en: 'Continue with this save' },
    saveLoad:       { es: 'Cargar esta partida', en: 'Load this save' },
    saveImport:     { es: 'Importar del juego', en: 'Import from the game' },
    saveImportShort:{ es: 'Importar', en: 'Import' },   // the same, on a phone
    saveImportBad:  { es: 'No se pueden leer los datos: busca user1.dat, user2.dat…', en: 'Save cannot be read: look for user1.dat, user2.dat…' },   // PROFILE_CORRUPTED, and where to look
    saveClear:      { es: 'Borrar', en: 'Clear' },
    saveClearAsk:   { es: '¿Borrar el perfil?', en: 'Clear Profile?' },   // PROFILE_CLEAR_PROMPT
    saveClearNote:  { es: 'Solo aquí: tu partida del juego no cambia.', en: 'Only here: your game\'s own save doesn\'t change.' },
    saveAct:        { es: 'Acto {n}', en: 'Act {n}' },   // ACT_1_SUPER…, in the game's capitals there
    saveDefeated:   { es: 'Derrota', en: 'Defeated' },   // PROFILE_DEFEATED
    yes:            { es: 'Sí', en: 'Yes' },   // YES
    no:             { es: 'No', en: 'No' },   // NO
    steelSoul:      { es: 'Alma de acero', en: 'Steel Soul' },   // MODE_STEEL
    completion:     { es: 'Finalización', en: 'Completion' },   // COMPLETION
    rosaries:       { es: 'Rosarios', en: 'Rosaries' },   // INV_NAME_COIN

    /* Importing a save from the game's file */
    impTitle:       { es: 'Importar a la Partida {n}', en: 'Import into Save {n}' },
    impLead:        { es: 'Trae tu partida real: la web lee el archivo que guarda el juego y rellena esta partida con lo que llevas: herramientas, blasones, mejoras, el Diario y el 100 %.',
                      en: 'Bring your real game: the site reads the file the game saves and fills this save with what you carry: Tools, Crests, upgrades, the Journal and the 100%.' },
    impMobile:      { es: 'Tus partidas están en el ordenador donde juegas: abre esta web allí, o pásate el archivo a este dispositivo.',
                      en: 'Your saves are on the computer you play on: open this site there, or move the file to this device.' },
    impOs:          { es: 'Tu sistema', en: 'Your system' },
    impStep1:       { es: 'Copia la carpeta de las partidas', en: 'Copy the saves folder' },
    impStep2:       { es: 'Abre el selector y pega la carpeta', en: 'Open the picker and paste the folder' },
    impStep3:       { es: 'Entra en la carpeta de tu cuenta y elige el archivo', en: 'Go into your account\'s folder and pick the file' },
    impHowWin:      { es: 'Pulsa «Seleccionar archivo», pega la ruta en la casilla del nombre y pulsa {k1}.',
                      en: 'Press "Choose file", paste the path into the file name box and press {k1}.' },
    impHowMac:      { es: 'Pulsa «Seleccionar archivo», luego {k1}, pega la ruta y pulsa {k2}.',
                      en: 'Press "Choose file", then {k1}, paste the path and press {k2}.' },
    impHowLinux:    { es: 'Pulsa «Seleccionar archivo», luego {k1}, pega la ruta y pulsa {k2}.',
                      en: 'Press "Choose file", then {k1}, paste the path and press {k2}.' },
    impFiles:       { es: 'Dentro hay una carpeta con un número (tu cuenta de Steam) o «default». Cada perfil del juego es un archivo: el primero es user1.dat, el segundo user2.dat, y así. En Restore_Points hay copias de momentos anteriores (restoreData): también se pueden importar.',
                      en: 'Inside there\'s a folder named with a number (your Steam account) or "default". Each of the game\'s profiles is a file: the first is user1.dat, the second user2.dat, and so on. Restore_Points holds copies of earlier moments (restoreData): those can be imported too.' },
    impCopy:        { es: 'Copiar', en: 'Copy' },
    impCopied:      { es: 'Copiada', en: 'Copied' },
    impEnter:       { es: 'Intro', en: 'Enter' },
    impDrop:        { es: 'Arrastra aquí el archivo de tu partida', en: 'Drag your save\'s file here' },
    impDropping:    { es: 'Suéltalo', en: 'Let go' },
    impReading:     { es: 'Leyendo…', en: 'Reading…' },
    impOr:          { es: 'o', en: 'or' },
    impChoose:      { es: 'Seleccionar archivo', en: 'Choose file' },
    impOther:       { es: 'Elegir otro archivo', en: 'Choose another file' },
    impPrivate:     { es: 'Se lee aquí, en tu navegador: no se envía a ningún sitio y tu partida del juego no cambia.',
                      en: 'It\'s read here, in your browser: it isn\'t sent anywhere and your game\'s save doesn\'t change.' },
    impTime:        { es: '{h} h {m} min', en: '{h} h {m} min' },
    impVersion:     { es: 'Guardada con la versión {v}', en: 'Saved with version {v}' },
    impRestore:     { es: 'Punto de restauración del {date}', en: 'Restore point of {date}' },
    impReplace:     { es: 'Sustituirá lo que tiene ahora la Partida {n}.', en: 'It will replace what Save {n} holds now.' },
    impSync:        { es: 'Mantener sincronizada con el juego', en: 'Keep in sync with the game' },
    impSyncOn:      { es: 'Activado', en: 'On' },
    impSyncOff:     { es: 'Desactivado', en: 'Off' },
    impSyncNote:    { es: 'Se pone al día cada vez que el juego guarda, mientras la web esté abierta en este navegador.',
                      en: 'It catches up every time the game saves, while the site is open in this browser.' },

    /* Following the game's file (js/live.js) */
    liveFollow:     { es: 'Seguir al juego', en: 'Follow the game' },
    liveFollowShort:{ es: 'Seguir', en: 'Follow' },   // the same, on a phone
    liveFollowHint: { es: 'Elige el archivo de esta partida: se pone al día con él ahora y cada vez que el juego guarde',
                      en: 'Pick this save\'s file: it catches up with it now and every time the game saves' },
    liveFollowing:  { es: 'La Partida {n} sigue ahora a {file}', en: 'Save {n} now follows {file}' },
    liveFollowNo:   { es: 'Este navegador no deja guardar el vínculo con el archivo', en: 'This browser doesn\'t let the site keep the link to the file' },
    liveFollows:    { es: 'Sigue a {file}', en: 'Follows {file}' },
    liveUnlink:     { es: 'Dejar de seguir', en: 'Stop following' },
    liveState_live: { es: 'en vivo', en: 'live' },
    liveState_paused: { es: 'en pausa', en: 'paused' },
    liveState_lost: { es: 'sin archivo', en: 'file missing' },
    livePaused:     { es: 'Esta partida sigue a {file}, pero el navegador pide permiso otra vez para leerlo.',
                      en: 'This save follows {file}, but the browser asks for permission to read it again.' },
    liveLost:       { es: 'No se encuentra {file}: la partida conserva lo que tenía, pero ya no sigue al juego.',
                      en: '{file} can\'t be found: the save keeps what it had, but no longer follows the game.' },
    liveResume:     { es: 'Seguir', en: 'Resume' },
    liveRelink:     { es: 'Buscar el archivo', en: 'Find the file' },
    liveResumeNo:   { es: 'Sin permiso, la partida no sigue al juego', en: 'Without permission, the save doesn\'t follow the game' },
    liveUpdated:    { es: 'Tu partida se ha puesto al día con el juego', en: 'Your save caught up with the game' },
    liveTag:        { es: 'Tu partida real', en: 'Your real game' },

    /* Your game: the start screen (js/app-home.js) */
    homeInvite:     { es: 'Trae tu partida', en: 'Bring your game' },
    homeInviteLead: { es: 'Arrastra aquí el archivo de tu partida, o elige una de las cuatro: la web te dice qué te falta para el 100 %, pieza a pieza.',
                      en: 'Drag your save\'s file here, or pick one of the four: the site tells you what\'s missing for 100%, piece by piece.' },
    homeInviteBtn:  { es: 'Importar del juego', en: 'Import from the game' },
    homeCompletion: { es: 'Tu 100 %', en: 'Your 100%' },
    homeMatches:    { es: 'Coincide con el {pct} que muestra el juego.', en: 'It matches the {pct} the game shows.' },
    homeDiffers:    { es: 'El juego muestra {pct}: tu archivo es de una versión que cuenta distinto, o hay un fallo. Escríbenos.',
                      en: 'The game shows {pct}: your file is from a version that counts differently, or there\'s a bug. Write to us.' },
    homeJournal:    { es: 'Diario', en: 'Journal' },   // PANE_JOURNAL
    cat_tools:      { es: 'Herramientas', en: 'Tools' },
    cat_spools:     { es: 'Carretes de seda', en: 'Silk Spools' },
    cat_upgrades:   { es: 'Kit de fabricación y bolsa de herramientas', en: 'Crafting Kit and Tool Pouch' },
    cat_arts:       { es: 'Habilidades', en: 'Abilities' },
    cat_skills:     { es: 'Habilidades de seda', en: 'Silk Skills' },
    cat_crests:     { es: 'Blasones', en: 'Crests' },
    cat_masks:      { es: 'Máscaras', en: 'Masks' },
    cat_needle:     { es: 'Mejoras de la aguja', en: 'Needle upgrades' },
    cat_hearts:     { es: 'Corazones de seda', en: 'Silk Hearts' },   // INV_DESC_SPOOL_SILKHEARTS
    cat_items:      { es: 'Siempreviva', en: 'Everbloom' },   // INV_NAME_WHITE_FLOWER

    /* Since the previous save (js/changes.js): Your game and the notice when the game saves */
    homeSince:      { es: 'Desde el guardado anterior', en: 'Since the previous save' },
    homeSinceAt:    { es: 'guardado {ago}', en: 'saved {ago}' },
    chMasks:        { es: 'Máscaras: {n}', en: 'Masks: {n}' },
    chSpools:       { es: 'Carretes de seda: {n}', en: 'Silk Spools: {n}' },
    chHearts:       { es: 'Corazones de seda: {n}', en: 'Silk Hearts: {n}' },
    chKit:          { es: 'Kit de fabricación, mejora {n}', en: 'Crafting Kit, upgrade {n}' },
    chPouch:        { es: 'Bolsa de herramientas, mejora {n}', en: 'Tool Pouch, upgrade {n}' },
    chJournal:      { es: 'Diario: {n} entradas nuevas o completadas', en: 'Journal: {n} entries new or completed' },
    chJournalOne:   { es: 'Diario: una entrada nueva o completada', en: 'Journal: one entry new or completed' },
    chMore:         { es: 'y {n} más', en: 'and {n} more' },
    chWish:         { es: 'tarea cumplida', en: 'task done' },
    chGauntlet:     { es: 'desafío superado', en: 'gauntlet cleared' },
    chToast:        { es: 'Tu partida: {list}', en: 'Your game: {list}' },

    /* The Crest screen (js/app-tools.js, js/engine.js) */
    ctLocked:       { es: 'Lo que llevas en la Partida {n}, tal como lo guardó el juego: aquí se ve, no se cambia. Para probar builds:', en: 'What you wear in Save {n}, as the game saved it: it shows here, it isn\'t changed. To try builds:' },
    ct_red:         { es: 'Rojas', en: 'Red' },
    ct_blue:        { es: 'Azules', en: 'Blue' },
    ct_yellow:      { es: 'Amarillas', en: 'Yellow' },
    ctDps:          { es: 'Daño por segundo', en: 'Damage per second' },
    ctEvery:        { es: 'un tajo cada {s} s', en: 'a slash every {s} s' },
    ctBrew:         { es: 'con {name}, {d} (cada {s} s, durante {l} s)', en: 'with {name}, {d} (every {s} s, for {l} s)' },
    ftSeconds:      { es: '{s} s sin parar', en: '{s} s nonstop' },
    ctSummary:      { es: 'Resumen de tus cifras', en: 'Your figures at a glance' },
    ctOver:         { es: '{n} de más', en: '{n} too many' },
    ctFull:         { es: 'No quedan huecos para herramientas {c}', en: 'No {c} slots left' },
    ctStage:        { es: 'evolución {n}', en: 'evolution {n}' },
    ctEvolution:    { es: 'Evolución', en: 'Evolution' },
    ctSituation:    { es: 'En este momento', en: 'Right now' },
    ctFocus:        { es: 'Concentración de la Cazadora', en: 'Hunter\'s focus' },
    ctFocusFull:    { es: 'Concentración plena', en: 'Full focus' },
    ctFury:         { es: 'Furia de la Bestia', en: 'Beast\'s fury' },
    ctFlint:        { es: 'Pedernal activo', en: 'Flintslate active' },
    ctChallenge:    { es: 'Tras desafiar (primer golpe)', en: 'After a Challenge (first hit)' },
    ctNeedle:       { es: 'La aguja', en: 'The Needle' },
    ctSlash:        { es: 'Tajo', en: 'Slash' },
    ctAtt_slash:    { es: 'Tajo', en: 'Slash' },
    ctAtt_down:     { es: 'Tajo hacia abajo', en: 'Down-slash' },
    ctAtt_run:      { es: 'Tajo en carrera', en: 'Run-slash' },
    ctCharged:      { es: 'cargado, {n} más', en: 'held, {n} more' },
    ctOnHit:        { es: 'si acierta, {n} más', en: 'on a hit, {n} more' },
    ctBracket:      { es: '{base} × {x}', en: '{base} × {x}' },
    ctCrit:         { es: 'Golpe crítico', en: 'Critical hit' },
    ctCritChance:   { es: '{p} % de los golpes', en: '{p}% of hits' },
    ctStrike:       { es: 'Golpe concentrado', en: 'Needle Strike' },   // INV_NAME_SKILL_CHARGESLASH
    ctToolsDmg:     { es: 'Herramientas que dañan', en: 'Tools that deal damage' },
    ctEffects:      { es: 'Lo que hacen las demás', en: 'What the others do' },
    ctShare:        { es: 'Compartir', en: 'Share' },
    ctShared:       { es: 'Enlace copiado: abre esta build tal cual', en: 'Link copied: it opens this build as it is' },
    ctLinkFree:     { es: 'El enlace traía una build: está en el Modo libre', en: 'The link had a build: it\'s in Free mode' },
    ctAmmo:         { es: '{n} usos', en: '{n} uses' },
    ctAmmo1:        { es: '{n} uso', en: '{n} use' },
    ctLoad:         { es: '{n} por carga', en: '{n} a load' },
    ctRefill:       { es: '{n} fragmentos de coraza', en: '{n} shell shards' },   // as INV_NAME_SHARD says them
    ctBody:         { es: 'Hornet', en: 'Hornet' },
    ctCasts:        { es: '{n} habilidades de {c} de seda', en: '{n} Skills of {c} silk' },
    ctCasts1:       { es: '{n} habilidad de {c} de seda', en: '{n} Skill of {c} silk' },
    ctBind:         { es: 'Enlazar', en: 'Bind' },   // BUTTON_CAST
    ctBindSub:      { es: 'cura {parts} máscaras en {s} s', en: 'heals {parts} masks in {s} s' },

    /* The Map (js/app-map.js) */
    mapLead:        { es: 'El mapa del juego, con Hornet en tu banco y lo que te falta en su sala.', en: 'The game\'s map, with Hornet at your bench and what you\'re missing in its room.' },
    mapFree:        { es: 'Modo libre: el mapa con todas las piezas. Elige una partida para ver solo las que te faltan.', en: 'Free mode: the map with every piece. Pick a save to see only the ones you\'re missing.' },
    mapBench:       { es: 'Tu banco', en: 'Your bench' },
    mapZoom:        { es: 'Tamaño del mapa', en: 'Map size' },
    mapFit:         { es: 'Entero', en: 'Whole' },
    mapAlt:         { es: 'El mapa de Telalejana', en: 'The map of Pharloom' },
    mapPlace_bench: { es: 'Bancos', en: 'Benches' },
    mapPlace_bench1:{ es: 'Banco', en: 'Bench' },
    mapPlace_bellway:{ es: 'Vías campana', en: 'Bellways' },
    mapPlace_ventrica:{ es: 'Ventrica', en: 'Ventrica' },   // KEY_TUBE
    mapClosed:      { es: 'sin abrir', en: 'not open yet' },
    mapToll:        { es: 'sin pagar el peaje', en: 'toll not paid' },
    mapNote:        { es: 'Cada pieza, en su sala; varias en la misma sala se ven en fila. Las que dan un deseo o una compra no tienen sala en la partida y no se marcan: están en Progreso. Los bancos y las estaciones están donde el juego pone sus alfileres; atenuadas, las que tu partida aún no ha abierto. Los desafíos, los que te faltan.', en: 'Each piece in its room; several in one room show in a row. The ones a wish or a purchase gives have no room in the save and aren\'t marked: they\'re in Progress. The benches and stations are where the game puts its pins; dimmed, the ones your game hasn\'t opened yet. The gauntlets, the ones you haven\'t cleared.' },

    /* Combat: your build against one enemy (js/app-fight.js) */
    ftBuild:        { es: 'Tu build: {crest}, {needle}, kit de fabricación {kit}. Se cambia en', en: 'Your build: {crest}, {needle}, Crafting Kit {kit}. It\'s changed in' },
    ftSearch:       { es: 'Buscar un enemigo', en: 'Find an enemy' },
    ftNone:         { es: 'Ningún enemigo se llama así.', en: 'No enemy by that name.' },
    ftBoss:         { es: 'jefe', en: 'boss' },
    ftHp:           { es: 'Vida', en: 'Health' },
    ftBlack:        { es: 'Con hilo negro (acto 3): {n}', en: 'Black-threaded (Act 3): {n}' },
    ftMods:         { es: 'Daño que recibe, por nivel', en: 'Damage it takes, by level' },
    ftModsNote:     { es: 'Tu aguja, tu golpe concentrado y tus habilidades usan el nivel {n}; tus herramientas, el {k}.', en: 'Your Needle, Needle Strike and Skills use level {n}; your Tools, level {k}.' },
    ftStagger:      { es: 'Se aturde tras', en: 'Staggers after' },
    ftHits:         { es: '{n} golpes', en: '{n} hits' },
    ftHits1:        { es: '{n} golpe', en: '{n} hit' },
    ftYours:        { es: 'Lo que le haces', en: 'What you do to it' },
    ftYoursNote:    { es: 'Cada golpe ya lleva su modificador a tu nivel; los usos, contando con que todos aciertan.', en: 'Each hit already carries its modifier at your level; the uses, counting every hit landing.' },
    ftUses:         { es: '{n} para matarlo', en: '{n} to kill it' },
    ftFormula:      { es: '{base} × {x} × {m}', en: '{base} × {x} × {m}' },
    ftPlan:         { es: 'Lo más rápido', en: 'The quickest way' },
    ftPlanThrows:   { es: '{n} × {name}', en: '{n} × {name}' },
    ftPlanSlash:    { es: 'un tajo', en: 'one slash' },
    ftPlanSlashes:  { es: '{n} tajos', en: '{n} slashes' },
    ftPlanCasts:    { es: '{n} × {name}', en: '{n} × {name}' },
    ftAnd:          { es: 'y', en: 'and' },
    ftPlanNote:     { es: 'Primero las cargas de tus herramientas rojas; luego los menos tajos posibles, con las habilidades que paga su seda (1 por tajo, empezando con tus {s} llenos, sin enlazar).', en: 'Your red Tools\' loads first; then the fewest slashes, with the Skills their silk pays for (1 a slash, starting with your {s} full, no Bind).' },
    ftLoad:         { es: 'una carga, {p} % de su vida', en: 'a full load, {p}% of its health' },
    ftTheirs:       { es: 'Lo que te hace, con tus {n} máscaras', en: 'What it does to you, with your {n} masks' },
    ftTheirsNote:   { es: 'Máscaras por golpe según la wiki (1 cuando no lo dice); los nombres de los ataques son de la wiki: el juego no los nombra.', en: 'Masks per hit as the wiki gives them (1 when it doesn\'t); the attacks\' names are the wiki\'s: the game doesn\'t name them.' },
    ftToDie:        { es: '{n} te matan', en: '{n} kill you' },
    ftToDie1:       { es: '{n} te mata', en: '{n} kills you' },
    ftModes:        { es: 'Contra qué', en: 'Against what' },
    ftModeFoe:      { es: 'Un enemigo', en: 'One enemy' },
    ftModeGauntlets:{ es: 'Desafíos de enemigos', en: 'Enemy gauntlets' },
    ftWaves:        { es: '{n} oleadas', en: '{n} waves' },
    ftWaves1:       { es: '{n} oleada', en: '{n} wave' },
    ftWave:         { es: 'Oleada {n}', en: 'Wave {n}' },
    ftReward:       { es: 'Recompensa', en: 'Reward' },
    ftCleared:      { es: 'Superado', en: 'Cleared' },
    ftNotCleared:   { es: 'Sin superar en esta partida', en: 'Not cleared in this game' },
    ftClearedCount: { es: 'Has superado {n} de {of} en esta partida.', en: 'You\'ve cleared {n} of {of} in this game.' },
    ftGauntletNote: { es: 'La vida de todas sus oleadas. Lo más rápido es una estimación: cuenta la seda y las cargas de una oleada a otra, con el daño de cada enemigo a tu nivel de aguja. Con hilo negro (acto 3) algunas cambian.', en: 'The health of all its waves. The quickest way is an estimate: it carries silk and loads from one wave to the next, with each enemy\'s damage at your Needle\'s level. Black-threaded (Act 3), some change.' },
    ftType_fire:    { es: 'fuego', en: 'fire' },
    ftType_void:    { es: 'vacío', en: 'void' },

    /* The Hunter's Journal (js/app-journal.js) */
    hjMemento:      { es: 'Para el Recuerdo de cazadora', en: 'For the Hunter\'s Memento' },   // as INV_NAME_HUNTER_MEMENTO names it
    hjSeen:         { es: '{n} de {m} vistas', en: '{n} of {m} seen' },
    hjKills:        { es: 'Derrotados', en: 'Defeated' },
    hjOptional:     { es: 'Opcional: no cuenta para el Recuerdo', en: 'Optional: not needed for the Memento' },
    hjBy:           { es: 'También se completa al derrotar a: {names}', en: 'Also completed by defeating: {names}' },
    hjInspect:      { es: 'Se completa al leer su lápida.', en: 'Completed by reading its tablet.' },
    hjHint:         { es: 'Señala una entrada para leerla.', en: 'Point at an entry to read it.' },
    hjFree:         { es: 'Modo libre: el Diario entero. Elige una partida para ver lo que te falta.', en: 'Free mode: the whole Journal. Pick a save to see what you\'re missing.' },
    hjState_done:   { es: 'completa', en: 'complete' },
    hjState_seen:   { es: 'vista, sin completar', en: 'seen, not complete' },
    hjState_unseen: { es: 'aún no vista', en: 'not seen yet' },

    /* The Inventory (js/app-game.js) */
    invFree:        { es: 'Modo libre: todo desbloqueado. Elige una partida para ver lo que llevas.', en: 'Free mode: everything unlocked. Pick a save to see what you carry.' },
    invItems:       { es: 'Objetos', en: 'Items' },
    invMissing:     { es: 'Aún no lo tienes', en: 'You don\'t have it yet' },
    invHint:        { es: 'Señala algo para leer su descripción.', en: 'Point at something to read its description.' },
    invDamage:      { es: 'Daño', en: 'Damage' },
    invSilk:        { es: 'Seda', en: 'Silk' },   // INV_NAME_THREAD

    /* Progress: what's missing, piece by piece (js/app-progress.js) */
    pgShow:         { es: 'Mostrar', en: 'Show' },
    pgMissing:      { es: 'Lo que falta', en: 'What\'s missing' },
    pgAll:          { es: 'Todo', en: 'Everything' },
    pg100:          { es: 'Para el 100 %', en: 'For 100%' },
    pgBeyond:       { es: 'Más allá del 100 %', en: 'Beyond 100%' },
    pgBeyondNote:   { es: 'No cuentan para la finalización, pero abren huecos, mejoras y deseos.', en: 'They don\'t count for completion, but they open slots, upgrades and wishes.' },
    pgDone:         { es: 'Completo', en: 'Complete' },
    pgGot:          { es: 'Conseguido', en: 'Got' },
    pgLater:        { es: 'Más adelante: acto {n}', en: 'Later: Act {n}' },
    pgFree:         { es: 'Sin partida, esta es la lista entera. Importa la tuya y verás solo lo que te falta, marcado donde lo tienes.',
                      en: 'Without a save, this is the whole list. Import yours and you\'ll see only what you\'re missing, ticked where you have it.' },
    pgWholeNote:    { es: 'Cuentan las máscaras enteras: cada cuatro fragmentos, un 1 %.', en: 'Whole masks count: every four shards, 1%.' },
    pgSpoolNote:    { es: 'Cuentan los carretes enteros: cada dos fragmentos, un 1 %.', en: 'Whole spools count: every two fragments, 1%.' },
    kind_flea:      { es: 'Pulga perdida', en: 'Lost Flea' },   // KEY_FLEA
    kind_silkHeart: { es: 'Corazón de seda', en: 'Silk Heart' },   // MEMORY_MSG_TITLE_SILKHEART
    kind_fleas:     { es: 'Pulgas perdidas', en: 'Lost Fleas' },
    kind_oldHearts: { es: 'Viejos corazones', en: 'Old Hearts' },   // as the wish MQ_BLACKTHREAD_5_NAME says them
    kind_melodies:  { es: 'Melodías', en: 'Melodies' },
    pgOtherArts:    { es: 'Otras habilidades', en: 'Other abilities' },
    pgTasks:        { es: 'Tareas', en: 'Tasks' },   // PANE_QUESTS
    pgTasksNote:    { es: 'Los objetivos del juego y los deseos de los tablones, con el nombre que les da el juego. No cuentan para la finalización.', en: 'The game\'s objectives and the wishes on the boards, with the game\'s names for them. They don\'t count for completion.' },
    pgTasksMain:    { es: 'Objetivos principales', en: 'Main objectives' },
    pgTasksCollect: { es: 'Colección', en: 'Collect' },

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

  /* A count of one takes the key's singular when it has one (ftWaves1 for ftWaves): the
     figures come formatted, and 1 is "1" in both languages. */
  function t(key, vars) {
    const entry = (vars && String(vars.n) === '1' && UI[key + '1']) || UI[key];
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
