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
    /* The beta notice (js/app.js): above the screens until it's closed, and the tag by the title. */
    betaTag:        { es: 'Beta', en: 'Beta' },
    betaText:       { es: 'La web aún está en construcción: puede haber algún número mal, textos sin traducir o pantallas a medias. Si ves algo raro, {report}.',
                      en: 'The site is still being built: some numbers may be off, some text untranslated and some screens unfinished. If something looks wrong, {report}.' },
    betaReport:     { es: 'avísame', en: 'let me know' },
    betaClose:      { es: 'Cerrar el aviso', en: 'Close the notice' },
    docTitle:       { es: 'Tu partida de Silksong: el 100 %, el mapa y las herramientas · Calculadora de Telalejana', en: 'Silksong save tracker, 100% checklist, map and Tools · Pharloom Calculator' },
    metaDescription:{ es: 'Importa tu partida de Hollow Knight: Silksong y mira qué te falta para el 100 %, en el mapa del propio juego, y cómo cambia Hornet con cada herramienta y blasón.',
                      en: 'Import your Hollow Knight: Silksong save and see what\'s missing for 100%, on the game\'s own map, and how each Tool and Crest changes Hornet.' },

    /* The screen bar: the pages of the game's pause menu, with the game's own names where it has them. */
    navLabel:       { es: 'Pantallas', en: 'Screens' },
    navHome:        { es: 'Tu partida', en: 'Your game' },
    navGame:        { es: 'Inventario', en: 'Inventory' },   // PANE_INVENTORY
    navProgress:    { es: 'Progreso', en: 'Progress' },
    navMap:         { es: 'Mapa', en: 'Map' },   // PANE_MAP
    navJournal:     { es: 'Diario', en: 'Journal' },   // PANE_JOURNAL
    navTools:       { es: 'Blasón', en: 'Crest' },   // PANE_TOOLS
    navFight:       { es: 'Combate', en: 'Combat' },
    /* On a phone the Crest screen and Combat fold into one tab. «Tools» would be the game's Tools,
       so it's named after what the two share, the build (the site says «build» in both languages). */
    navBuild:       { es: 'Build', en: 'Build' },
    savesTitle:     { es: 'Partidas', en: 'Saves' },

    /* A screen that isn't built yet (design/00-study.md §9). */
    soon:           { es: 'Aún no está: llega en la fase {n} del plan.', en: 'Not built yet: it comes in phase {n} of the plan.' },
    soonStudy:      { es: 'El estudio y el plan', en: 'The study and the plan' },

    /* Saves: four, as the game's profile screen, and free mode (js/app-saves.js) */
    saveSlot:       { es: 'Partida {n}', en: 'Save {n}' },
    saveSelect:     { es: 'Selecciona partida', en: 'Select save' },
    saveBtnHint:    { es: 'Elegir partida: cuatro, como en el juego, o el Modo libre', en: 'Choose a save: four, as in the game, or Free mode' },
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
    homeInviteBtn:  { es: 'Importar del juego', en: 'Import from the game' },
    homeCompletion: { es: 'Tu 100 %', en: 'Your 100%' },
    homeMatches:    { es: 'Coincide con el {pct} que muestra el juego.', en: 'It matches the {pct} the game shows.' },
    homeDiffers:    { es: 'El juego muestra {pct}: tu archivo es de una versión que cuenta distinto, o hay un fallo. Escríbenos.',
                      en: 'The game shows {pct}: your file is from a version that counts differently, or there\'s a bug. Write to us.' },
    homeJournal:    { es: 'Diario', en: 'Journal' },   // PANE_JOURNAL
    /* The bench card (design/03-redesign.md, step 3): the game has no «Resting at» of its own. */
    homeRest:       { es: 'Descansando en', en: 'Resting at' },
    homeKingdom:    { es: 'Telalejana', en: 'Pharloom' },   // MQ_BELLSHRINES_LOC
    homeGhost:      { es: 'Aquí irá tu partida', en: 'Your game goes here' },
    homeNearMap:    { es: 'En el mapa', en: 'On the map' },
    homeParts:      { es: 'Tu 100 %, por partes', en: 'Your 100%, by part' },
    homeAllParts:   { es: 'Todo en Progreso', en: 'Everything in Progress' },
    homeGoLabel:    { es: 'Sigue por', en: 'Where next' },
    homeGoProgress: { es: 'Lo que te falta para el 100 %', en: 'What\'s missing for 100%' },
    homeGoMap:      { es: 'Dónde está, en el mapa del juego', en: 'Where it is, on the game\'s map' },
    homeGoJournal:  { es: 'Te quedan {n} entradas', en: '{n} entries to go' },
    homeGoJournal1: { es: 'Te queda {n} entrada', en: '{n} entry to go' },
    homeGoJournal0: { es: 'Completo para Nuu', en: 'Complete for Nuu' },
    homeGoCrest:    { es: 'Tu build, cifra a cifra', en: 'Your build, figure by figure' },
    aboutFold:      { es: 'Sobre esta web', en: 'About this site' },
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
    ct_red:         { es: 'Rojas', en: 'Red' },
    ct_blue:        { es: 'Azules', en: 'Blue' },
    ct_yellow:      { es: 'Amarillas', en: 'Yellow' },
    ctEvery:        { es: 'un tajo cada {s} s', en: 'a slash every {s} s' },
    ctBrew:         { es: 'con {name}, {d} (cada {s} s, durante {l} s)', en: 'with {name}, {d} (every {s} s, for {l} s)' },
    ftSeconds:      { es: '{s} s sin parar', en: '{s} s nonstop' },
    ctSummary:      { es: 'Resumen de tus cifras', en: 'Your figures at a glance' },
    ctFull:         { es: 'No quedan huecos para herramientas {c}', en: 'No {c} slots left' },
    ctStage:        { es: 'evolución {n}', en: 'evolution {n}' },
    ctEvolution:    { es: 'Evolución', en: 'Evolution' },
    ctFocus:        { es: 'Concentración de la Cazadora', en: 'Hunter\'s focus' },
    ctFocusFull:    { es: 'Concentración plena', en: 'Full focus' },
    ctFury:         { es: 'Furia de la Bestia', en: 'Beast\'s fury' },
    ctFlint:        { es: 'Pedernal activo', en: 'Flintslate active' },
    ctChallenge:    { es: 'Tras desafiar (primer golpe)', en: 'After a Challenge (first hit)' },
    ctSlash:        { es: 'Tajo', en: 'Slash' },
    ctAtt_slash:    { es: 'Tajo', en: 'Slash' },
    ctAtt_down:     { es: 'Tajo hacia abajo', en: 'Down-slash' },
    ctAtt_run:      { es: 'Tajo en carrera', en: 'Run-slash' },
    ctBracket:      { es: '{base} × {x}', en: '{base} × {x}' },
    ctCrit:         { es: 'Golpe crítico', en: 'Critical hit' },
    ctCritChance:   { es: '{p} % de los golpes', en: '{p}% of hits' },
    ctStrike:       { es: 'Golpe concentrado', en: 'Needle Strike' },   // INV_NAME_SKILL_CHARGESLASH
    ctDpsShort:     { es: 'Daño por segundo', en: 'Damage a second' },
    ctBindHeals:    { es: 'Enlazar cura {n}', en: 'a Bind heals {n}' },
    ctPrev:         { es: 'Blasón anterior', en: 'Previous Crest' },
    ctNext:         { es: 'Blasón siguiente', en: 'Next Crest' },
    ctPoint:        { es: 'Señala una herramienta para ver qué hace.', en: 'Point at a Tool to see what it does.' },
    ctSilkCost:     { es: '{n} de seda', en: '{n} silk' },
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
    mapBench:       { es: 'Tu banco', en: 'Your bench' },
    mapZoom:        { es: 'Tamaño del mapa', en: 'Map size' },
    mapCloser:      { es: 'Acercar', en: 'Closer' },
    mapFurther:     { es: 'Alejar', en: 'Further' },
    mapFull:        { es: 'Mapa grande', en: 'Large map' },
    mapSmall:       { es: 'Mapa normal', en: 'Normal map' },
    mapFind:        { es: 'Busca en el mapa: una zona, una pieza, un jefe', en: 'Search the map: an area, a piece, a boss' },
    mapFindNone:    { es: 'Nada con ese nombre en el mapa.', en: 'Nothing by that name on the map.' },
    mapMark:        { es: 'Marcar como conseguido', en: 'Mark as had' },
    mapUnmark:      { es: 'Desmarcar', en: 'Unmark' },
    mapFight:       { es: 'Luchar en Combate', en: 'Fight it in Combat' },
    mapCardClose:   { es: 'Cerrar', en: 'Close' },
    mapMissing:     { es: 'Lo que falta', en: 'Missing' },
    mapPlaces:      { es: 'Lugares', en: 'Places' },
    mapNames:       { es: 'Nombres de zona', en: 'Area names' },
    mapFit:         { es: 'Entero', en: 'Whole' },
    mapAlt:         { es: 'El mapa de Telalejana', en: 'The map of Pharloom' },
    mapPlace_bench: { es: 'Bancos', en: 'Benches' },
    mapPlace_bench1:{ es: 'Banco', en: 'Bench' },
    mapPlace_bellway:{ es: 'Vías campana', en: 'Bellways' },
    mapPlace_ventrica:{ es: 'Ventrica', en: 'Ventrica' },   // KEY_TUBE
    mapNear:        { es: 'Lo más cerca de tu banco', en: 'Closest to your bench' },
    mapFrom:        { es: 'Tu banco anterior', en: 'Your previous bench' },
    mapClosed:      { es: 'sin abrir', en: 'not open yet' },
    mapToll:        { es: 'sin pagar el peaje', en: 'toll not paid' },
    mapNote:        { es: 'Cada cosa, en la sala donde se consigue: tirada en el suelo, en la tienda que la vende, en el muro de deseos o con quien da el deseo, en la arena de su jefe. Varias en la misma sala se ven en fila. Con una partida, solo lo que te falta; en el modo libre, todo. Los bancos y las estaciones están donde el juego pone sus alfileres; atenuadas, las que tu partida aún no ha abierto.', en: 'Each thing in the room where it\'s had: lying there, at the shop that sells it, at the Wishwall or with whoever gives the wish, in its boss\'s arena. Several in one room show in a row. With a save, only what you\'re missing; in Free mode, everything. The benches and stations are where the game puts its pins; dimmed, the ones your game hasn\'t opened yet.' },
    mapGroup_hundred: { es: 'Falta para el 100 %', en: 'Missing for 100%' },
    mapGroup_places:  { es: 'Lugares', en: 'Places' },
    mapGroup_people:  { es: 'Gente', en: 'People' },
    mapGroup_extras:  { es: 'Otros coleccionables', en: 'Other collectibles' },
    mapGroup_game:    { es: 'Tu partida', en: 'Your game' },
    mapAll:         { es: 'Todo', en: 'All' },
    mapNone:        { es: 'Nada', en: 'None' },
    mapActs:        { es: 'Por acto', en: 'By Act' },
    mapActAll:      { es: 'Todos', en: 'All' },
    mapReachNow:    { es: 'Solo lo que puedo coger ya', en: 'Only what I can reach now' },
    // The Map shows the whole map, faint where your game's doesn't yet; this leaves that out. No game source: written for context.
    mapGame:        { es: 'Solo lo que enseña el juego', en: 'Only what the game shows' },
    mapGameTip:     { es: 'Como el mapa de tu partida: sin las zonas cuyo mapa no has comprado ni las salas sin cartografiar.',
                      en: 'As your game\'s map: without the areas whose map you haven\'t bought or the rooms not mapped.' },
    mapArea:        { es: 'Zona', en: 'Area' },
    mapOnMap:       { es: 'Ver en el mapa', en: 'See on the map' },
    mapMore:        { es: 'y {n} más', en: 'and {n} more' },
    mapLayer_boss:  { es: 'Jefes', en: 'Bosses' },
    mapLayer_bells: { es: 'Santuarios de campana', en: 'Bellshrines' },
    mapLayer_locks: { es: 'Puertas con llave', en: 'Locked doors' },
    mapLayer_shops: { es: 'Tiendas', en: 'Shops' },
    mapLayer_shakra:{ es: 'Shakra', en: 'Shakra' },   // MAPPER_MAIN
    mapLayer_wishwalls: { es: 'Muros de deseos', en: 'Wishwalls' },
    mapLayer_wishwall1: { es: 'Muro de deseos', en: 'Wishwall' },   // QUESTBOARD_TITLE
    mapLayer_givers:{ es: 'Quien pide un deseo', en: 'Who asks for a wish' },
    mapLayer_giver1:{ es: 'Pide un deseo', en: 'Asks for a wish' },
    mapLayer_people:{ es: 'Quien da algo del 100 %', en: 'Who gives a 100% thing' },
    mapLayer_cocoon:{ es: 'Tu capullo', en: 'Your cocoon' },
    mapLayer_journal: { es: 'Diario: lo que falta', en: 'Journal: what\'s missing' },
    'mapExtra_bone-scroll':        { es: 'Pergamino óseo', en: 'Bone Scroll' },   // INV_NAME_R_BONE_RECORD
    'mapExtra_weaver-effigy':      { es: 'Efigie de Tejedora', en: 'Weaver Effigy' },   // INV_NAME_R_WEAVER_TOTEM
    'mapExtra_choral-commandment': { es: 'Mandamiento coral', en: 'Choral Commandment' },   // INV_NAME_R_SEAL_CHIT
    'mapExtra_rune-harp':          { es: 'Arpa rúnica', en: 'Rune Harp' },   // INV_NAME_R_WEAVER_RECORD
    'mapExtra_psalm-cylinder':     { es: 'Cilindro de salmo', en: 'Psalm Cylinder' },   // INV_NAME_R_PSALM_CYL
    'mapExtra_arcane-egg':         { es: 'Huevo arcano', en: 'Arcane Egg' },   // INV_NAME_R_ANCIENT_EGG
    mapExtra_mossberry: { es: 'Baya musgosa', en: 'Mossberry' },   // INV_NAME_MOSSBERRY
    mapExtra_silkeater: { es: 'Devoraseda', en: 'Silkeater' },   // INV_NAME_SILK_GRUB
    mapExtra_memento:   { es: 'Recuerdos', en: 'Mementos' },   // COLLECTION_HEADING_MOMENTOS
    mapExtra_bellhome:  { es: 'Hogar campana', en: 'Bellhome' },   // BELLHOME
    mapExtra_spawn:     { es: 'Enemigos únicos', en: 'Unique enemies' },
    mapExtra_rosary:    { es: 'Alijos de rosarios', en: 'Rosary caches' },
    mapExtra_shard:     { es: 'Alijos de fragmentos', en: 'Shell shard caches' },
    mapExtra_wall:      { es: 'Paredes rompibles', en: 'Breakable walls' },
    mapBell:        { es: 'Santuario de Campana de {area}', en: '{area} Bellshrine' },
    mapLock:        { es: 'Puerta cerrada', en: 'Locked door' },
    mapLockKey:     { es: 'Se abre con: {key}', en: 'Opened with: {key}' },
    mapScrounge:    { es: 'Scrounge', en: 'Scrounge' },   // BELLHART_RELICDEALER_MAIN
    mapScroungeNote:{ es: 'Compra las reliquias.', en: 'Buys the relics.' },
    mapCocoonNote:  { es: 'Donde caíste por última vez: tus rosarios te esperan ahí.', en: 'Where you last fell: your rosaries wait there.' },
    mapUnmapped:    { es: 'Aún no tienes su mapa', en: 'You don\'t have its map yet' },
    mapAreaRooms:   { es: '{n} de {m} salas visitadas', en: '{n} of {m} rooms visited' },
    mapAreaRoomsAll:{ es: '{m} salas', en: '{m} rooms' },
    mapAreaHundred: { es: 'Del 100 %: {n}', en: 'For 100%: {n}' },
    mapAreaJournal: { es: 'Del Diario: {n}', en: 'Journal: {n}' },
    mapAreaGauntlets: { es: 'Desafíos: {n}', en: 'Gauntlets: {n}' },
    mapBeaten:      { es: 'Derrotado', en: 'Defeated' },
    mapNotBeaten:   { es: 'Sin derrotar', en: 'Not defeated yet' },
    mapToJournal:   { es: 'Ver en el Diario', en: 'See in the Journal' },
    mapRung:        { es: 'Ya suena', en: 'Rung' },
    mapNotRung:     { es: 'Aún sin tocar', en: 'Not rung yet' },
    mapShakraNote:  { es: 'Vende los mapas de cada zona, y se mueve por Telalejana.', en: 'Sells each area\'s map, and moves around Pharloom.' },
    mapShakraLeft:  { es: 'Te faltan los mapas de: {list}', en: 'Maps you don\'t have: {list}' },
    mapShakraAll:   { es: 'Tienes todos sus mapas.', en: 'You have all her maps.' },
    mapSells:       { es: 'Del 100 %: {list}', en: 'For 100%: {list}' },
    mapSellsLeft:   { es: 'Te falta de aquí: {list}', en: 'Still here for you: {list}' },
    mapSellsNone:   { es: 'Ya tienes todo lo que da del 100 %.', en: 'You have everything of the 100% it gives.' },
    mapWishes:      { es: 'Deseos: {list}', en: 'Wishes: {list}' },
    mapWishesLeft:  { es: 'Deseos sin cumplir: {list}', en: 'Wishes still open: {list}' },
    mapWishesNone:  { es: 'No quedan deseos por cumplir.', en: 'No wishes left open.' },
    mapKills:       { es: '{n} de {m} derrotados', en: '{n} of {m} defeated' },

    /* Combat: your build against one enemy (js/app-fight.js) */
    ftToWin:        { es: 'tajos para ganar', en: 'slashes to win' },
    ftToFall:       { es: 'golpes suyos te tumban', en: 'of its hits take you down' },
    ftHpN:          { es: '{n} de vida', en: '{n} health' },
    ftMasksN:       { es: '{n} máscaras', en: '{n} masks' },
    ftTheirsShort:  { es: 'Lo que te hace', en: 'What it does to you' },
    ftHow:          { es: 'Cómo se calcula', en: 'How it\'s worked out' },
    ftLeft:         { es: 'quedan {n}/{m}', en: '{n}/{m} left' },
    ftHpLeft:       { es: '{n} / {m} de vida', en: '{n} / {m} health' },
    ftBindBtn:      { es: 'Enlazar: +{n} ({c} de seda)', en: 'Bind: +{n} ({c} silk)' },   // Bind as BUTTON_CAST says it
    ftUndo:         { es: 'Deshacer', en: 'Undo' },
    ftReset:        { es: 'Reiniciar', en: 'Start over' },
    ftLogStart:     { es: 'Contra {name}: {hp} de vida. Toca un movimiento para jugar la pelea.', en: 'Against {name}: {hp} health. Tap a move to play the fight out.' },
    ftUndoHint:     { es: 'Deshace el último movimiento (Ctrl+Z)', en: 'Undoes the last move (Ctrl+Z)' },
    ftClock:        { es: '{s} s de pelea', en: '{s} s of fighting' },
    ftGNeedle:      { es: 'Aguja', en: 'Needle' },
    ftGSilk:        { es: 'Seda', en: 'Silk' },
    ftGTools:       { es: 'Herramientas', en: 'Tools' },
    ftGTime:        { es: 'Tiempo', en: 'Time' },
    ftTauntNote:    { es: 'el próximo tajo, +50 %', en: 'the next slash, +50%' },
    ftEff_brew:     { es: 'tajos más rápidos {s} s', en: 'faster slashes for {s} s' },
    ftEff_flint:    { es: '+50 % a la aguja {s} s', en: '+50% to the Needle for {s} s' },
    ftEff_plasm:    { es: '+1 máscara de plasmio', en: '+1 Plasmium mask' },
    ftPiece:        { es: 'Farol {n}', en: 'Lantern {n}' },
    ftCore:         { es: 'Núcleo', en: 'Core' },
    ftCrit:         { es: 'Crítico', en: 'Critical' },
    ftCritHint:     { es: 'el {p} % de los tajos', en: '{p}% of slashes' },
    ftCritTitle:    { es: 'Un golpe crítico triplica el tajo: decides tú cuándo sale, con su probabilidad a la vista.', en: 'A critical hit triples the slash: you decide when it comes, with its chance in view.' },
    ftWait:         { es: 'Esperar', en: 'Wait' },
    ftWaitFor_hearts: { es: 'hasta el próximo hilo de tus corazones de seda', en: 'until your Silk Hearts\' next strand' },
    ftWaitFor_stagger: { es: 'hasta que se levante', en: 'until it gets up' },
    ftWaitFor_fury: { es: 'hasta que acabe la furia', en: 'until the fury ends' },
    ftWaitFor_reaper: { es: 'hasta que acabe la seda de los tajos', en: 'until the slashes\' silk ends' },
    ftWaitFor_brew: { es: 'hasta que acabe el brebaje', en: 'until the brew wears off' },
    ftWaitFor_flint: { es: 'hasta que se apague la aguja', en: 'until the Needle cools' },
    ftWaitFor_wisp: { es: 'hasta el próximo fuego fatuo', en: 'until the next wisp' },
    ftWhy_silk:     { es: 'Te falta seda', en: 'Not enough silk' },
    ftWhy_ammo:     { es: 'Sin usos', en: 'No uses left' },
    ftWhy_full:     { es: 'Ya tienes todas las máscaras', en: 'Already at full masks' },
    ftWhy_target:   { es: 'No hay a quién golpear', en: 'Nothing to hit' },
    ftWhy_nothing:  { es: 'Nada que hacer', en: 'Nothing to do' },
    ftWhy_over:     { es: 'La pelea ha acabado', en: 'The fight is over' },
    ftBindFury:     { es: 'Enlazar: furia, hasta +{n} ({c} de seda)', en: 'Bind: fury, up to +{n} ({c} silk)' },   // Bind as BUTTON_CAST says it
    ftBinding:      { es: 'Enlazando: un golpe ahora te quita la curación y toda la seda.', en: 'Binding: a hit now takes the heal and all your silk.' },
    ftBindingBell:  { es: 'Enlazando: {name} para un golpe, pero te quita la curación.', en: 'Binding: {name} stops a hit, but the heal is lost.' },
    ftDone:         { es: 'Hecho', en: 'Done' },
    ftChipFocus:    { es: 'Concentración ×{x}', en: 'Focus ×{x}' },
    ftChipFocusBuild: { es: 'Concentración: {n}/{m} golpes', en: 'Focus: {n}/{m} hits' },
    ftChipFury:     { es: 'Furia {s} s · +{n}', en: 'Fury {s} s · +{n}' },
    ftChipTimed:    { es: '{name} {s} s', en: '{name} {s} s' },
    ftChipChallenge:{ es: 'Próximo tajo +50 %', en: 'Next slash +50%' },
    ftChipMask:     { es: '{name} entera', en: '{name} whole' },
    ftChipMaskBroken: { es: '{name} rota', en: '{name} broken' },
    ftChipReserve:  { es: '{name}: 1', en: '{name}: 1' },
    ftChipReserveUsed: { es: '{name}: gastado', en: '{name}: used' },
    ftFury:         { es: 'La furia', en: 'The fury' },
    ftStaggerCount: { es: 'Aturdimiento {n}/{max} · combo {c}/{k}', en: 'Stagger {n}/{max} · combo {c}/{k}' },
    ftStaggered:    { es: 'Aturdido · {s} s', en: 'Staggered · {s} s' },
    ftStaggeredWait:{ es: 'Aturdido hasta que esperes', en: 'Staggered until you wait' },
    ftStaggeredNote:{ es: 'Aturdido, no ataca: es tu momento para enlazar o para lo más fuerte.', en: 'Staggered, it doesn\'t attack: your window to Bind or to hit hardest.' },
    ftStaggerGame:  { es: 'al golpe {n}, o con {c} seguidos a menos de {w} s; {s} s en el suelo, {x} s menos por golpe', en: 'at hit {n}, or {c} in a row under {w} s apart; {s} s down, {x} s less a hit' },
    ftStaggerGameNoTime: { es: 'al golpe {n}, o con {c} seguidos a menos de {w} s', en: 'at hit {n}, or {c} in a row under {w} s apart' },
    ftPhaseN:       { es: 'Fase {n} de {m}', en: 'Phase {n} of {m}' },
    ftWaveN:        { es: 'Oleada {n} de {m}', en: 'Wave {n} of {m}' },
    ftTarget:       { es: 'A quién golpeas', en: 'Who you hit' },
    ftWon:          { es: 'Victoria', en: 'Victory' },
    ftDeadNote:     { es: 'Le quitaste {n} de {m}.', en: 'You took {n} of {m}.' },
    ftAgain:        { es: 'Otra vez', en: 'Again' },
    ftSumTime:      { es: 'Tiempo', en: 'Time' },
    ftSumDps:       { es: 'Daño por segundo', en: 'Damage per second' },
    ftSumHits:      { es: 'Movimientos', en: 'Moves' },
    ftSumTaken:     { es: 'Máscaras perdidas', en: 'Masks lost' },
    ftSumSilk:      { es: 'Seda gastada', en: 'Silk spent' },
    ftSumBinds:     { es: 'Enlaces', en: 'Binds' },
    ftLogCrit:      { es: '{name}, crítico: −{n} · le quedan {hp}', en: '{name}, critical: −{n} · {hp} left' },
    ftLogStagger:   { es: '{name} se aturde ({s} s)', en: '{name} staggers ({s} s)' },
    ftLogStaggerCombo: { es: '{name} se aturde con el combo ({s} s)', en: '{name} staggers from the combo ({s} s)' },
    ftLogStaggerNoTime: { es: '{name} se aturde', en: '{name} staggers' },
    ftLogStaggerEnd:{ es: 'Se levanta', en: 'It gets up' },
    ftLogHearts:    { es: '+1 de seda de tus corazones de seda (tienes {n})', en: '+1 silk from your Silk Hearts ({n})' },
    ftLogOver:      { es: 'Se acaba: {name}', en: 'Wears off: {name}' },
    ftLogBindLost:  { es: 'El golpe corta el enlace: sin curación, y pierdes tus {s} de seda', en: 'The hit breaks the Bind: no heal, and your {s} silk lost' },
    ftLogBindLostKept: { es: 'El golpe corta el enlace: sin curación', en: 'The hit breaks the Bind: no heal' },
    ftLogWarded:    { es: '{name} para el golpe: {move}', en: '{name} stops the hit: {move}' },
    ftLogFractured: { es: '{name} se rompe y te deja con 1 máscara', en: '{name} breaks and leaves you 1 mask' },
    ftLogEye:       { es: '{name}: +{n} de seda', en: '{name}: +{n} silk' },
    ftLogFocus:     { es: 'Concentración: la aguja, ×{x}', en: 'Focus: the Needle, ×{x}' },
    ftLogFocusLost: { es: 'Pierdes la concentración', en: 'Focus lost' },
    ftLogLifesteal: { es: 'La furia te devuelve una máscara (tienes {m})', en: 'The fury gives a mask back ({m})' },
    ftLogReaperSilk:{ es: '+1 de seda de los fragmentos', en: '+1 silk from the fragments' },
    ftLogBrew:      { es: '{name}: tajos más rápidos durante {s} s', en: '{name}: faster slashes for {s} s' },
    ftLogFlint:     { es: '{name}: la aguja, +50 % durante {s} s', en: '{name}: the Needle, +50% for {s} s' },
    ftLogPlasm:     { es: '{name}: +1 máscara (tienes {m})', en: '{name}: +1 mask ({m})' },
    ftLogChallenge: { es: 'El próximo tajo, +50 %', en: 'The next slash, +50%' },
    ftLogBindFree:  { es: '{name} te enlaza: +{n} máscaras', en: '{name} Binds you: +{n} masks' },
    ftLogFury:      { es: 'Furia {s} s: cada tajo que acierta te devuelve una máscara, hasta {n}', en: 'Fury for {s} s: each slash that lands gives a mask back, up to {n}' },
    ftLogReaper:    { es: '{name}: {s} s en que tus tajos sueltan seda', en: '{name}: {s} s of your slashes releasing silk' },
    ftLogWait:      { es: 'Esperas {s} s', en: 'You wait {s} s' },
    ftLogPartDown:  { es: '{name} cae', en: '{name} falls' },
    ftLogHeal:      { es: '{name} recupera {n} (queda con {hp})', en: '{name} heals {n} ({hp} now)' },
    ftSimNote:      { es: 'La pelea: el reloj solo cuenta lo que tardan tus movimientos (el tajo al ritmo de tu blasón, el golpe concentrado su carga, enlazar su tiempo); las habilidades, las herramientas y el desafío cuentan 0 s, porque ni los archivos del juego leídos ni la wiki dan su tiempo. El aturdimiento sale de los archivos del juego: cuánto suma cada golpe (un tajo 1, uno con {wanderer} 0,8…; lo que no se encontró, 1), cuándo cae y cuánto dura. {flint} dura 8 s y {wisp} gasta un hilo cada 4 s, según la wiki. Un golpe mientras enlazas te quita la curación y la seda, como en el juego.', en: 'The fight: the clock only counts what your moves take (a slash at your Crest\'s pace, the Needle Strike its charge, a Bind its time); Skills, Tools and the Challenge count 0 s, as neither the game\'s files read here nor the wiki give their time. The stagger comes from the game\'s files: what each hit adds (a slash 1, one with {wanderer} 0.8…; what wasn\'t found, 1), when it drops and how long for. {flint} lasts 8 s and {wisp} spends a strand every 4 s, as the wiki says. A hit while you Bind takes the heal and the silk, as in the game.' },
    ftLogYou:       { es: '{name}: −{n} · le quedan {hp}', en: '{name}: −{n} · {hp} left' },
    ftLogHit:       { es: '{name}: −{n} máscaras · te quedan {m}', en: '{name}: −{n} masks · {m} left' },
    ftLogHit1:      { es: '{name}: −1 máscara · te quedan {m}', en: '{name}: −1 mask · {m} left' },
    ftLogBind:      { es: 'Enlazas: +{n} máscaras', en: 'You Bind: +{n} masks' },
    ftLogPhase:     { es: 'Fase {n}', en: 'Phase {n}' },
    ftLogWin:       { es: '{name} cae en {n} golpes', en: '{name} falls in {n} moves' },
    ftLogLose:      { es: 'Hornet cae', en: 'Hornet falls' },
    ftSearch:       { es: 'Buscar un enemigo', en: 'Find an enemy' },
    ftNone:         { es: 'Ningún enemigo se llama así.', en: 'No enemy by that name.' },
    ftBoss:         { es: 'jefe', en: 'boss' },
    ftHp:           { es: 'Vida', en: 'Health' },
    ftBlack:        { es: 'Con hilo negro (acto 3): {n}', en: 'Black-threaded (Act 3): {n}' },
    ftMods:         { es: 'Daño que recibe, por nivel', en: 'Damage it takes, by level' },
    ftModsNote:     { es: 'Tu aguja, tu golpe concentrado y tus habilidades usan el nivel {n}; tus herramientas, el {k}.', en: 'Your Needle, Needle Strike and Skills use level {n}; your Tools, level {k}.' },
    // An entry the wiki's tables lack, read from the game's files (js/enemies.js src).
    ftOneHit:       { es: 'En los archivos del juego no tiene vida ni modificadores: muere al primer golpe.', en: "In the game's files it has no health or modifiers: the first hit kills it." },
    ftStagger:      { es: 'Se aturde tras', en: 'Staggers after' },
    ftPhases:       { es: 'Fases', en: 'Phases' },
    ftPhaseAt:      { es: 'Fase {n}: con {x} de vida ({p} %)', en: 'Phase {n} at {x} health ({p}%)' },
    ftPhaseAtHp:    { es: 'Fase {n}: con {x} de vida', en: 'Phase {n} at {x} health' },
    ftPhaseAfter:   { es: 'Fase {n}: tras {x} de daño', en: 'Phase {n} after {x} damage' },
    // The shares of one of the fight's bars (Signis's 720 of the Forebrothers' 720 + 520).
    ftPhaseAtOf:    { es: 'Fase {n}: con {x} de vida de {o} ({p} %)', en: 'Phase {n} at {x} of {o} health ({p}%)' },
    ftPhasePieces:  { es: 'Fase {n}: {k} piezas de {x} de vida, cada una rota a 0 o tras {h} golpes contados', en: 'Phase {n}: {k} pieces of {x} health, each broken at 0 or after {h} counted hits' },
    ftPhasePiece:   { es: 'Fase {n}: una pieza de {x} de vida, rota a 0 o tras {h} golpes contados', en: 'Phase {n}: one piece of {x} health, broken at 0 or after {h} counted hits' },
    // Father of the Flame's pieces: a hit counts only after a cooldown run while still (js/engine.js, pieces).
    ftPieceCount:   { es: 'un golpe cuenta si la pieza lleva {c} s quieta tras los {r} s que tarda en recuperarse: uno cada {g} s como pronto', en: 'a hit counts once the piece has been still {c} s after its {r} s recovery: one every {g} s at the soonest' },
    ftPiecePaceFirst: { es: 'A tu ritmo ({t} s por tajo) solo cuenta el primero: nunca llega a estar quieta', en: 'At your pace ({t} s a slash) only the first counts: it is never still' },
    ftPiecePaceAll: { es: 'A tu ritmo ({t} s por tajo) cuentan todos', en: 'At your pace ({t} s a slash) every hit counts' },
    ftPiecePace:    { es: 'A tu ritmo ({t} s por tajo) cuenta uno de cada {e}', en: 'At your pace ({t} s a slash) one hit in {e} counts' },
    ftPieceDamage:  { es: 'se rompe por el daño: {u} por pieza', en: 'it breaks by damage: {u} a piece' },
    ftPieceHits:    { es: 'se rompe por la cuenta: {u} por pieza', en: 'it breaks by the count: {u} a piece' },
    ftPieceSpaced:  { es: 'con los golpes a {g} s, bastan {h}', en: 'with the hits {g} s apart, {h} will do' },
    ftPhaseHeal:    { es: 'Cuando cae uno, el otro, si tiene {x} de vida o menos, recupera {a}, hasta {m} como mucho', en: 'When one falls, the other, at {x} health or less, heals {a}, to {m} at most' },
    ftPhaseReset:   { es: 'A 0 de vida, si se falla el remate, vuelve a {x}', en: 'At 0 health, if the finishing prompt is missed, it goes back to {x}' },
    ftPhasesNote:   { es: 'Del propio juego: cambia de fase cuando su vida baja a esa cifra. Los tajos, con tu aguja desde la vida llena.', en: 'From the game itself: it moves on once its health drops to that. The slashes, with your Needle from full health.' },
    ftPhasesBelowNote: { es: 'Algunas el juego las compara con un «menor que» estricto: cambia por debajo de su cifra, no al llegar a ella, y la que se muestra ya es una menos.', en: 'Some the game compares with a strict "less than": it moves on below its number, not at it, and the figure shown is already one under.' },
    ftPhasesBarsNote: { es: 'Del propio juego: cada fase tiene su propia vida, y juntas suman la del combate. Los tajos, con tu aguja desde el principio.', en: 'From the game itself: each phase has a health of its own, and together they make the fight\'s. The slashes, with your Needle from the start.' },
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
    ftTheirsNote:   { es: 'Máscaras por golpe según la wiki (1 cuando no lo dice); los nombres de los ataques son de la wiki: el juego no los nombra.', en: 'Masks per hit as the wiki gives them (1 when it doesn\'t); the attacks\' names are the wiki\'s: the game doesn\'t name them.' },
    ftTheirsGameNote: { es: 'Máscaras por golpe sacadas de los archivos del juego: su cuerpo al tocarlo y el más fuerte de sus ataques, con lo que lanza (proyectiles, bombas, la explosión de su cadáver).', en: 'Masks per hit from the game\'s own files: its body on contact, and the strongest of its attacks, what it throws included (projectiles, bombs, its corpse\'s burst).' },
    ftTheirsBlackNote: { es: 'Con hilo negro, cada golpe quita 2 máscaras: el juego vuelve de vacío todos sus golpes (sacado de sus archivos).', en: 'Black-threaded, every hit takes 2 masks: the game makes all its hits void (read from its files).' },
    ftContact:      { es: 'Al tocarlo', en: 'On contact' },
    ftStrongest:    { es: 'Su ataque más fuerte', en: 'Its strongest attack' },
    ftMixed:        { es: '{a} o {b} según dónde esté', en: '{a} or {b} depending on where it is' },
    ftToDie:        { es: '{n} te matan', en: '{n} kill you' },
    ftToDie1:       { es: '{n} te mata', en: '{n} kills you' },
    ftIfBind:       { es: '{n} si enlazas', en: '{n} if you Bind' },
    ftBindNote:     { es: 'Si enlazas: los golpes llegan repartidos a lo largo de la pelea más rápida, que acaba con su último tajo. Tu carrete empieza lleno y guarda {s} de seda: cada tajo que acierta suma 1 hasta llenarlo, y con él lleno se pierde; tus habilidades gastan la suya en cuanto la tienen. Enlazar cuesta {c} y cura {h} máscaras, y enlazas en cuanto cura del todo o cuando el golpe siguiente te mataría.', en: 'If you Bind: the hits come spread over the quickest fight, which ends with its last slash. Your spool starts full and holds {s} silk: each slash that lands adds 1 until it\'s full, and past that it\'s lost; your Skills spend theirs as soon as it\'s there. A Bind costs {c} and heals {h} masks, and you Bind as soon as it heals in full or when the next hit would kill you.' },
    ftBindHearts:   { es: 'Regeneras seda hasta tener {n} (1 por corazón de seda que tengas): 1 cada {b} s ({a} s con el carrete vacío) en que no cambie. Contando con que la pelea dura los {t} s que tarda el tajo en matar, cada tajo que acierta (cada {i} s) reinicia la cuenta, así que suma {x}; y mientras enlazas se detiene.', en: 'You regenerate silk up to {n} (1 per Silk Heart you have): 1 every {b} s ({a} s from an empty spool) in which it doesn\'t change. Taking the fight to last the {t} s the slash takes to kill, each slash that lands (every {i} s) restarts the count, so it adds {x}; and while you Bind it stops.' },
    ftBindRing:     { es: '{name} ya cuenta: suma 1 a ese tope y multiplica los tiempos por {k}.', en: '{name} is in: it adds 1 to that cap and multiplies the times by {k}.' },
    ftBindNoHearts: { es: 'Sin corazones de seda no regeneras seda.', en: 'With no Silk Hearts, no silk regenerates.' },
    ftBindReserve:  { es: 'Y {name} da un enlace más.', en: 'And {name} gives one more Bind.' },
    ftBindEye:      { es: 'Y {name} da seda con los golpes que recibes sin el carrete lleno.', en: 'And {name} gives silk from the hits you take while your spool isn\'t full.' },
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
    hjNearest:      { es: 'Lo más cerca', en: 'Nearest' },
    hjNear:         { es: 'Lo más cerca de tu banco', en: 'Closest to your bench' },
    hjLeft:         { es: 'faltan {n}', en: '{n} to go' },
    hjLeft1:        { es: 'falta {n}', en: '{n} to go' },
    hjMemento:      { es: 'Para el Recuerdo de cazadora', en: 'For the Hunter\'s Memento' },   // as INV_NAME_HUNTER_MEMENTO names it
    hjMementoShort: { es: 'Recuerdo', en: 'Memento' },   // the Hunter's Memento, shortened under its ring
    hjSeen:         { es: '{n} de {m} vistas', en: '{n} of {m} seen' },
    hjOptional:     { es: 'Opcional: no cuenta para el Recuerdo', en: 'Optional: not needed for the Memento' },
    hjBy:           { es: 'También se completa al derrotar a: {names}', en: 'Also completed by defeating: {names}' },
    hjInspect:      { es: 'Se completa al leer su lápida.', en: 'Completed by reading its tablet.' },
    hjOrder:        { es: 'Orden', en: 'Order' },
    hjByArea:       { es: 'Por zonas', en: 'By area' },
    hjByBook:       { es: 'Como el Diario', en: 'Journal order' },
    hjNotesDefeat:  { es: 'Derrota {0} más para completar las notas de caza.', en: 'Defeat {0} more to complete the hunter\'s notes.' },   // NOTES_DEFEAT
    hjFind:         { es: 'Buscar en el Diario: un bicho, una zona', en: 'Search the Journal: a bug, an area' },
    hjNone:         { es: 'Nada con ese nombre en el Diario.', en: 'Nothing by that name in the Journal.' },
    hjElsewhere:    { es: 'En otros sitios', en: 'Elsewhere' },
    hjState_done:   { es: 'completa', en: 'complete' },
    hjState_seen:   { es: 'vista, sin completar', en: 'seen, not complete' },
    hjState_unseen: { es: 'aún no vista', en: 'not seen yet' },

    /* The Inventory (js/app-game.js) */
    invItems:       { es: 'Objetos', en: 'Items' },
    invMissing:     { es: 'Aún no lo tienes', en: 'You don\'t have it yet' },
    invAll:         { es: 'Todo', en: 'All' },
    invNone:        { es: 'Nada', en: 'None' },
    invLess:        { es: 'Uno menos: {what}', en: 'One less: {what}' },
    invMore:        { es: 'Uno más: {what}', en: 'One more: {what}' },
    invNeedle:      { es: 'La aguja', en: 'The Needle' },
    invFromTo:      { es: 'de {a} a {b}', en: 'from {a} to {b}' },
    invLearnt:      { es: 'Aprendida', en: 'Learnt' },
    invNotLearnt:   { es: 'Sin aprender', en: 'Not learnt' },
    invStart:       { es: 'Empezar desde', en: 'Start from' },
    invBase:        { es: 'Hornet al empezar', en: 'Base Hornet' },
    invMax:         { es: 'Todo al máximo', en: 'Everything maxed' },
    invSilk:        { es: 'Seda', en: 'Silk' },   // INV_NAME_THREAD

    /* Progress: what's missing, piece by piece (js/app-progress.js) */
    pgShow:         { es: 'Mostrar', en: 'Show' },
    pgCompletion:   { es: 'Finalización', en: 'Completion' },   // COMPLETION
    pgMissing:      { es: 'Lo que falta', en: 'What\'s missing' },
    pgAll:          { es: 'Todo', en: 'Everything' },
    pgOrder:        { es: 'Orden', en: 'Order' },
    pgByAct:        { es: 'Por acto', en: 'By Act' },
    pgNear:         { es: 'Más cerca', en: 'Nearest first' },
    pg100:          { es: 'Para el 100 %', en: 'For 100%' },
    pgBeyond:       { es: 'Otros coleccionables', en: 'Other collectibles' },
    pgBeyondNote:   { es: 'No cuentan para la finalización. Bajo cada grupo, para qué sirve.', en: 'They don\'t count for completion. Under each group, what it\'s for.' },
    pgDone:         { es: 'Completo', en: 'Complete' },
    pgGot:          { es: 'Conseguido', en: 'Got' },
    pgLater:        { es: 'Más adelante: acto {n}', en: 'Later: Act {n}' },
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

    /* Progress: the road to the next Act (js/acts.js, the game's own rules) */
    roadTitle:      { es: 'Camino al Acto {n}', en: 'The road to Act {n}' },
    /* The road at a glance (js/app-progress.js, journey): each step by a name of the game's. */
    roadBellshrine: { es: 'Santuario de Campana', en: 'Bellshrine' },   // BELLSHRINE
    roadCitadelName:{ es: 'CIUDADELA MELODIOSA', en: 'CITADEL OF SONG' },   // ACT_2_NAME
    roadSnare:      { es: 'Trampa anímica', en: 'Soul Snare' },   // MQ_SILK_SNARE_NAME
    roadWishwall:   { es: 'Muro de deseos', en: 'Wishwall' },   // the game says it in BB_FIXER_Q1_INTRO; no name of its own
    roadOf:         { es: '{n} de {of}', en: '{n} of {of}' },
    ending_A:       { es: 'Reina Tejedora', en: 'Weaver Queen' },   // ENDING_A_NAME
    ending_C:       { es: 'Atadura de seda', en: 'Snared Silk' },   // ENDING_C_NAME
    ending_D:       { es: 'Niña retorcida', en: 'Twisted Child' },   // ENDING_D_NAME
    ending_E:       { es: 'Hermana del vacío', en: 'Sister of the Void' },   // ENDING_E_NAME
    roadGame:       { es: 'Tu partida', en: 'Your game' },
    roadEndings:    { es: '{n} de {of} finales', en: '{n} of {of} endings' },
    roadWhole:      { es: 'El camino entero', en: 'The whole road' },
    roadLess:       { es: 'Cerrar el camino', en: 'Close the road' },
    roadBoth:       { es: 'Los caminos a los Actos 2 y 3', en: 'The roads to Acts 2 and 3' },
    roadNote2:      { es: 'Lo que pide el juego para entrar en la Ciudadela, paso a paso.', en: 'What the game asks before you walk into the Citadel, step by step.' },
    roadNote3:      { es: 'Lo que pide el juego para abrir el Acto 3, leído de sus propios archivos. Las guías suelen dar solo seis deseos: cuentan también los que van antes de ellos, un mínimo de puntos de deseos y cuatro condiciones más.',
                      en: 'What the game asks before Act 3 opens, read from its own files. Guides usually give six wishes: the ones before them count too, and so do a minimum of wish points and four more conditions.' },
    roadStale:      { es: 'Esta partida se guardó en la web antes de que leyera los deseos: vuelve a importarla para ver su camino.', en: 'This save was kept before the site read the wishes: import it again to see its road.' },
    roadBypassed:   { es: 'Ya no hace falta: la victoria sobre {phantom} abre otro camino.', en: 'No longer needed: beating {phantom} opens another way in.' },
    roadBells:      { es: 'Haz sonar los cinco Santuarios de Campana', en: 'Ring the five Bellshrines' },   // the game's word in it: BELLSHRINE
    roadGate:       { es: 'Abre: {gate}', en: 'Open: {gate}' },   // as the game titles the objective: MQ_TYPE_BELLSHRINES, then its name
    roadJudge:      { es: 'Vence en combate: {judge}, o {phantom} por otro camino', en: 'Defeat {judge}, or {phantom} for another way in' },
    roadCitadel:    { es: 'Entra en la Ciudadela', en: 'Walk into the Citadel' },
    roadUnlock:     { es: 'Desbloquea el deseo «{wish}»', en: 'Unlock the wish "{wish}"' },
    roadRequired:   { es: 'Deseos obligatorios', en: 'Required wishes' },
    roadPoints:     { es: 'Puntos de deseos: {n} de {max} posibles', en: 'Wish points: {n} of a possible {max}' },
    roadPointsNote: { es: 'Cualquiera de estos vale un punto; una entrega, medio, y solo la primera vez.', en: 'Any of these is worth a point; a delivery half of one, and only the first time.' },
    roadHalf:       { es: '½ punto', en: '½ point' },
    roadBefore:     { es: 'antes: {name}', en: 'first: {name}' },
    roadChecks:     { es: 'Y además', en: 'And also' },
    roadCaravan:    { es: 'La Caravana de las pulgas en Pulgatopía', en: 'The Flea Caravan at Fleatopia' },   // KEY_CARAVAN, FLEATOPIA
    roadLace:       { es: 'Derrota a Lace en la Cuna', en: 'Defeat Lace in the Cradle' },   // DEFEATED_LACE_2_DESC
    roadKey:        { es: 'Llave de hogar campana', en: 'Bellhome Key' },   // INV_NAME_BELL_HOUSE_KEY
    roadPavo:       { es: 'lista: habla con Pabo', en: 'ready: talk to Pavo' },   // his name: BELLHART_GREETER_MAIN
    roadKeyRule:    { es: 'Pabo la da tras «{glory}» y {n} deseos de su lista', en: 'Pavo gives it after {glory} and {n} wishes of his list' },
    roadKeyHead:    { es: '{key}: lo que pide Pabo', en: '{key}: what Pavo asks' },
    roadOffer:      { es: 'Acepta «{wish}» en el muro de deseos de {town} o con el {caretaker} en {clave}', en: 'Take "{wish}" from the wishwall in {town} or from the {caretaker} in {clave}' },
    roadCaretaker:  { es: 'Cuidador', en: 'Caretaker' },   // CARETAKER_MAIN
    roadPieces:     { es: 'Reúne las cuatro piezas de la trampa', en: 'Gather the snare\'s four pieces' },
    roadReady:      { es: 'Llévaselas al {caretaker}', en: 'Bring them to the {caretaker}' },
    roadSilk:       { es: 'Derrota a la Gran Madre Seda y atrápala con la trampa anímica', en: 'Defeat Grand Mother Silk and entrap her with the Soul Snare' },   // ENDING_C_DESC
    roadSilkNote:   { es: 'En el golpe final, toca el Agujolín en vez de enlazarla. Ese final cierra en esa partida los otros dos del Acto 2.', en: 'On the final blow, play the Needolin instead of binding her. That ending closes the other two Act 2 endings in that game.' },
    roadRunt:       { es: 'para el Acto 3 cuenta su versión principal, no la de la cría', en: 'for Act 3 its main version counts, not the runt\'s' },
    roadMelodies:   { es: 'para llegar a la Cuna, las tres melodías: {n} de 3', en: 'to reach the Cradle, the three melodies: {n} of 3' },

    /* Progress: how to get each thing of the 100% (js/how.js), the traps, what's left to buy */
    howShop:        { es: '{vendor}: {price} rosarios', en: '{vendor}: {price} rosaries' },
    howGift:        { es: 'Te lo da {npc}', en: 'Given by {npc}' },
    howWish:        { es: 'Deseo: {wish}', en: 'Wish: {wish}' },
    howBoss:        { es: 'Tras el combate: {foe}', en: 'After the fight: {foe}' },
    howCraft:       { es: 'Se fabrica', en: 'Crafted' },
    howChallenge:   { es: 'Reto de {npc}', en: '{npc}\'s challenge' },
    howFleas:       { es: '{npc}: {n} pulgas rescatadas', en: '{npc}: {n} fleas rescued' },
    howFleasAll:    { es: '{npc}: todas las pulgas', en: '{npc}: every flea' },
    howFromAct:     { es: 'desde el Acto {n}', en: 'from Act {n}' },
    howNeeds:       { es: 'Hace falta: {keys}', en: 'Needs: {keys}' },
    howNeedsOr:     { es: 'Hace falta: {keys} (o {alt})', en: 'Needs: {keys} (or {alt})' },
    pgToolsTrap:    { es: 'Si entregas la {curveclaw} a un skarr en el Acto 3, pierdes su punto hasta recuperarla como {curvesickle}. La {silkshot} tiene tres versiones según quién la repare y cuenta una sola: la primera reparación cierra las otras dos.',
                      en: 'Hand the {curveclaw} to a Skarr in Act 3 and its point is gone until you get it back as the {curvesickle}. The {silkshot} comes in three versions depending on who repairs it, and one counts: the first repair closes the other two.' },
    pgNote_memoryLocket: { es: 'Abren ranuras extra en los Blasones.', en: 'They open extra slots on the Crests.' },
    pgNote_craftmetal:   { es: 'Con él se fabrican herramientas; algunas cuentan para el 100 %.', en: 'Tools are crafted with it; some count for 100%.' },
    pgNote_paleOil:      { es: 'Plinney lo pide para mejorar la Aguja: sin él no hay mejoras de la 2 a la 4.', en: 'Plinney asks for it to upgrade the Needle: without it, no upgrades 2 to 4.' },
    pgNote_flea:         { es: 'Llevarlas a la caravana da premios, y una Bolsa de herramientas y un fragmento de carrete cuentan para el 100 %. La caravana en Pulgatopía es condición del Acto 3.',
                           en: 'Bringing them to the caravan gives rewards, and a Tool Pouch and a Spool Fragment count for 100%. The caravan at Fleatopia is a condition of Act 3.' },
    pgNote_oldHeart:     { es: 'Del Acto 3: llevan a su final.', en: 'Act 3\'s: they lead to its ending.' },
    pgNote_melody:       { es: 'Abren el camino a la Cuna en el Acto 2, y vencer allí a Lace es condición del Acto 3.', en: 'They open the way to the Cradle in Act 2, and beating Lace there is a condition of Act 3.' },
    pgNote_otherArts:    { es: 'No cuentan, pero abren caminos; la Capa de fayforno es condición del Acto 3.', en: 'They don\'t count, but they open the way; the Faydown Cloak is a condition of Act 3.' },
    pgNote_gauntlets:    { es: 'Arenas de oleadas; varias dan un objeto que sí cuenta.', en: 'Wave arenas; several give a thing that does count.' },
    homeRoad:       { es: 'Camino al Acto {n}: paso {k} de {total}', en: 'The road to Act {n}: step {k} of {total}' },
    homeRoadPart:   { es: 'Camino al Acto {n}: paso {k} de {total}, {done} de {of} hechos', en: 'The road to Act {n}: step {k} of {total}, {done} of {of} done' },

    /* Footer: the fan-project notice, the sources and the author (docs/guide.md, "Credits and licences") */
    footLabel:      { es: 'Aviso, fuentes y contacto', en: 'Notice, sources and contact' },
    footFan:        { es: 'Proyecto de fans no oficial, gratuito y sin ánimo de lucro, sin relación con {tc}. Hollow Knight: Silksong y su arte son © Team Cherry.',
                      en: 'Unofficial fan project, free and non-commercial, not affiliated with {tc}. Hollow Knight: Silksong and its artwork are © Team Cherry.' },
    footData:       { es: 'Datos de {wiki}, bajo {lic}; textos del juego, de su traducción oficial.',
                      en: 'Data from {wiki}, under {lic}; game texts from its official translation.' },
    footMade:       { es: 'Hecho por Albert. ¿Un número mal, una traducción rara o un fallo? Escribe a {mail}.',
                      en: 'Made by Albert. A wrong number, an odd translation or a bug? Write to {mail}.' },
    // The privacy notice under it, folded (docs/guide.md, "Privacy"). No game source: written for context.
    footPrivacy:    { es: 'Privacidad', en: 'Privacy' },
    footPrivNone:   { es: 'Esta web no usa cookies ni rastreadores.',
                      en: 'This site uses no cookies and no trackers.' },
    footPrivLocal:  { es: 'Lo que marcas (partidas, herramientas y blasones, diario, progreso, preferencias) se guarda solo en este navegador; si pones «Seguir al juego», también el acceso a tu archivo de guardado.',
                      en: 'What you mark (saves, Tools and Crests, journal, progress, preferences) is kept only in this browser; if you turn on "Follow the game", so is the access to your save file.' },
    footPrivSaves:  { es: 'Tus archivos de guardado se leen aquí mismo y no se suben a ningún sitio.',
                      en: 'Your save files are read right here and never uploaded anywhere.' },
    footPrivCount:  { es: 'Las visitas se cuentan con {gc}: páginas, desde dónde llegas, navegador y sistema, ancho de pantalla, idioma, país y qué pantallas abres. El dueño las ve como recuentos por día y, las de hoy, una a una con la hora al minuto. No guarda tu IP ni usa cookies.',
                      en: 'Visits are counted with {gc}: pages, where you came from, browser and system, screen width, language, country and which screens you open. The owner sees them as daily counts and, for today only, one by one with the time to the minute. It keeps no IP and uses no cookies.' },
    footPrivHost:   { es: 'La web está alojada en {gh}, que guarda registros técnicos de cada visita.',
                      en: 'The site is hosted on {gh}, which keeps technical logs of each visit.' },
    footPrivErase:  { es: 'Para borrarlo todo, borra los datos de este sitio en tu navegador.',
                      en: 'To erase it all, clear this site\'s data in your browser.' },
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
