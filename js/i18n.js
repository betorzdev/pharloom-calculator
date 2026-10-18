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
    langGroup:      { es: 'Idioma', en: 'Language' },   // GAME_LANGUAGE
    share:          { es: 'Compartir', en: 'Share' },
    shareHint:      { es: 'Copia el enlace a la web', en: 'Copy the link to the site' },
    // The donation link after Share (design/94b): the full label on a wide screen, Ko-fi alone on a phone.
    support:        { es: 'Apoya la web', en: 'Support the site' },
    supportHint:    { es: 'Donar en Ko-fi', en: 'Donate on Ko-fi' },
    // The sister site's link (js/app-sister.js): the game's title, as it's sold in both languages; its
    // hint names the sister in each, as that site calls itself (its own title; «Amuletos» is Hollow
    // Knight's Spanish for Charms, PANE_CHARMS there).
    sister:         { es: 'Hollow Knight', en: 'Hollow Knight' },
    sisterHint:     { es: 'Calculadora de Hallownest: tu partida de Hollow Knight, el 112 %, el mapa y los amuletos', en: 'Hallownest Calculator: your Hollow Knight save, the 112%, the map and the Charms' },
    linkCopied:     { es: 'Enlace copiado', en: 'Link copied' },
    copyThis:       { es: 'Copia este enlace:', en: 'Copy this link:' },
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
    savesTitle:     { es: 'Perfiles', en: 'Profiles' },   // the noun of PROFILE_CLEAR_PROMPT, in the plural (no game text for the screen's own title)

    /* A screen that isn't built yet (design/00-study.md §9). */
    soon:           { es: 'Aún no está: llega en la fase {n} del plan.', en: 'Not built yet: it comes in phase {n} of the plan.' },
    soonStudy:      { es: 'El estudio y el plan', en: 'The study and the plan' },

    /* Profiles: four, as the game's profile screen (SCREEN_SAVE_PROFILES), and free mode (js/app-saves.js).
       In the game's words: a slot is a profile («perfil», PROFILE_CLEAR_PROMPT), a playthrough a game
       («partida», PROFILE_NEW_GAME), the file a save file («archivo guardado», SAVE_CORRUPTED_TITLE).
       What carries no key here has no game text: written for context in those words. */
    saveSlot:       { es: 'Perfil {n}', en: 'Profile {n}' },   // a slot is a profile, as PROFILE_CLEAR_PROMPT says; the game numbers none
    saveSelect:     { es: 'Seleccionar perfil', en: 'Select Profile' },   // SCREEN_SAVE_PROFILES
    saveBtnHint:    { es: 'Elegir perfil: cuatro, como en el juego, o el Modo libre', en: 'Choose a profile: four, as in the game, or Free mode' },
    savesNoStorage: { es: 'Este navegador no deja guardar datos: solo hay un perfil', en: 'This browser doesn\'t let the site save data: there\'s only one profile' },
    freeMode:       { es: 'Modo libre', en: 'Free mode' },
    freeModeNote:   { es: 'Tu partida marcada a mano, y builds para probar: no es ninguno de tus perfiles', en: 'Your game marked by hand, and builds to try: it isn\'t one of your profiles' },
    saveCurrent:    { es: 'Estás aquí', en: 'You\'re here' },
    saveContinue:   { es: 'Continuar', en: 'Continue' },   // PAUSE_CONTINUE
    saveLoad:       { es: 'Cargar este perfil', en: 'Load this profile' },   // no game text
    saveImport:     { es: 'Importar datos de guardado', en: 'Import Save Data' },   // PS4_SAVE_IMPORT_LABEL without its «PS4™»
    saveImportShort:{ es: 'Importar', en: 'Import' },   // the same, on a phone
    saveImportBad:  { es: 'No se pueden leer los datos: busca user1.dat, user2.dat…', en: 'Save cannot be read: look for user1.dat, user2.dat…' },   // PROFILE_CORRUPTED, and where to look
    saveClear:      { es: 'Borrar', en: 'Clear' },
    saveClearAsk:   { es: '¿Borrar el perfil?', en: 'Clear Profile?' },   // PROFILE_CLEAR_PROMPT
    saveClearNote:  { es: 'Solo aquí: tu archivo guardado del juego no cambia.', en: 'Only here: your game\'s save file doesn\'t change.' },   // the file as SAVE_CORRUPTED_TITLE calls it
    saveAct:        { es: 'Acto {n}', en: 'Act {n}' },   // ACT_1_SUPER…, in the game's capitals there
    saveDefeated:   { es: 'Derrota', en: 'Defeated' },   // PROFILE_DEFEATED
    yes:            { es: 'Sí', en: 'Yes' },   // YES
    no:             { es: 'No', en: 'No' },   // NO
    steelSoul:      { es: 'Alma de acero', en: 'Steel Soul' },   // MODE_STEEL
    completion:     { es: 'Finalización', en: 'Completion' },   // COMPLETION
    rosaries:       { es: 'Rosarios', en: 'Rosaries' },   // INV_NAME_COIN

    /* Importing a profile from the game's save file; its restore points are the game's auto saves
       (RESTORE_SAVE_SELECTION_TITLE). No game text for the rest: written for context. */
    impTitle:       { es: 'Importar al Perfil {n}', en: 'Import into Profile {n}' },
    impLead:        { es: 'Trae tu partida real: la web lee el archivo guardado del juego y rellena este perfil con lo que llevas: herramientas, blasones, mejoras, el Diario y el 100 %.',
                      en: 'Bring your real game: the site reads the game\'s save file and fills this profile with what you carry: Tools, Crests, upgrades, the Journal and the 100%.' },
    impMobile:      { es: 'Tus archivos guardados están en el ordenador donde juegas: abre esta web allí, o pásate el archivo a este dispositivo.',
                      en: 'Your save files are on the computer you play on: open this site there, or move the file to this device.' },
    impOs:          { es: 'Tu sistema', en: 'Your system' },
    impStep1:       { es: 'Copia la carpeta de los archivos guardados', en: 'Copy the save files folder' },
    impStep2:       { es: 'Abre el selector y pega la carpeta', en: 'Open the picker and paste the folder' },
    impStep3:       { es: 'Entra en la carpeta de tu cuenta y elige el archivo', en: 'Go into your account\'s folder and pick the file' },
    impHowWin:      { es: 'Pulsa «Seleccionar archivo», pega la ruta en la casilla del nombre y pulsa {k1}.',
                      en: 'Press "Choose file", paste the path into the file name box and press {k1}.' },
    impHowMac:      { es: 'Pulsa «Seleccionar archivo», luego {k1}, pega la ruta y pulsa {k2}.',
                      en: 'Press "Choose file", then {k1}, paste the path and press {k2}.' },
    impHowLinux:    { es: 'Pulsa «Seleccionar archivo», luego {k1}, pega la ruta y pulsa {k2}.',
                      en: 'Press "Choose file", then {k1}, paste the path and press {k2}.' },
    impFiles:       { es: 'Dentro hay una carpeta con un número (tu cuenta de Steam) o «default». Cada perfil del juego es un archivo: el primero es user1.dat, el segundo user2.dat, y así. En Restore_Points están sus guardados automáticos (restoreData): también se pueden importar.',
                      en: 'Inside there\'s a folder named with a number (your Steam account) or "default". Each of the game\'s profiles is a file: the first is user1.dat, the second user2.dat, and so on. Restore_Points holds their auto saves (restoreData): those can be imported too.' },
    impCopy:        { es: 'Copiar', en: 'Copy' },
    impCopied:      { es: 'Copiada', en: 'Copied' },
    impEnter:       { es: 'Intro', en: 'Enter' },
    impDrop:        { es: 'Arrastra aquí tu archivo guardado', en: 'Drag your save file here' },
    impDropping:    { es: 'Suéltalo', en: 'Let go' },
    impReading:     { es: 'Leyendo…', en: 'Reading…' },
    impOr:          { es: 'o', en: 'or' },
    impChoose:      { es: 'Seleccionar archivo', en: 'Choose file' },
    impOther:       { es: 'Elegir otro archivo', en: 'Choose another file' },
    impPrivate:     { es: 'Se lee aquí, en tu navegador: no se envía a ningún sitio y tu archivo guardado del juego no cambia.',
                      en: 'It\'s read here, in your browser: it isn\'t sent anywhere and your game\'s save file doesn\'t change.' },
    impTime:        { es: '{h} h {m} min', en: '{h} h {m} min' },
    impVersion:     { es: 'Guardada con la versión {v}', en: 'Saved with version {v}' },
    impRestore:     { es: 'Guardado automático del {date}', en: 'Auto save of {date}' },   // RESTORE_SAVE_SELECTION_TITLE, in the singular
    impReplace:     { es: 'Sustituirá lo que tiene ahora el Perfil {n}.', en: 'It will replace what Profile {n} holds now.' },
    impSync:        { es: 'Mantener sincronizada con el juego', en: 'Keep in sync with the game' },
    impSyncOn:      { es: 'Activado', en: 'On' },
    impSyncOff:     { es: 'Desactivado', en: 'Off' },
    impSyncNote:    { es: 'Se pone al día cada vez que el juego guarda, mientras la web esté abierta en este navegador.',
                      en: 'It catches up every time the game saves, while the site is open in this browser.' },

    /* Following the game's file (js/live.js). No game text: written for context. */
    liveFollow:     { es: 'Seguir al juego', en: 'Follow the game' },
    liveFollowShort:{ es: 'Seguir', en: 'Follow' },   // the same, on a phone
    liveFollowHint: { es: 'Elige el archivo de este perfil: se pone al día con él ahora y cada vez que el juego guarde',
                      en: 'Pick this profile\'s file: it catches up with it now and every time the game saves' },
    liveFollowing:  { es: 'El Perfil {n} sigue ahora a {file}', en: 'Profile {n} now follows {file}' },
    liveFollowNo:   { es: 'Este navegador no deja guardar el vínculo con el archivo', en: 'This browser doesn\'t let the site keep the link to the file' },
    liveFollows:    { es: 'Sigue a {file}', en: 'Follows {file}' },
    liveUnlink:     { es: 'Dejar de seguir', en: 'Stop following' },
    liveState_live: { es: 'en vivo', en: 'live' },
    liveState_paused: { es: 'en pausa', en: 'paused' },
    liveState_lost: { es: 'sin archivo', en: 'file missing' },
    livePaused:     { es: 'Este perfil sigue a {file}, pero el navegador pide permiso otra vez para leerlo.',
                      en: 'This profile follows {file}, but the browser asks for permission to read it again.' },
    liveLost:       { es: 'No se encuentra {file}: el perfil conserva lo que tenía, pero ya no sigue al juego.',
                      en: '{file} can\'t be found: the profile keeps what it had, but no longer follows the game.' },
    liveResume:     { es: 'Seguir', en: 'Resume' },
    liveRelink:     { es: 'Buscar el archivo', en: 'Find the file' },
    liveResumeNo:   { es: 'Sin permiso, el perfil no sigue al juego', en: 'Without permission, the profile doesn\'t follow the game' },
    liveUpdated:    { es: 'Tu perfil se ha puesto al día con el juego', en: 'Your profile caught up with the game' },
    liveTag:        { es: 'Tu partida real', en: 'Your real game' },

    /* Your game: the start screen (js/app-home.js) */
    homeInviteBtn:  { es: 'Importar datos de guardado', en: 'Import Save Data' },   // PS4_SAVE_IMPORT_LABEL without its «PS4™»
    homeCompletion: { es: 'Tu 100 %', en: 'Your 100%' },
    homeDiffers:    { es: 'El juego muestra {pct}: tu archivo es de una versión que cuenta distinto, o hay un fallo. Escríbenos.',
                      en: 'The game shows {pct}: your file is from a version that counts differently, or there\'s a bug. Write to us.' },
    homeJournal:    { es: 'Diario', en: 'Journal' },   // PANE_JOURNAL
    /* The bench card (design/03-redesign.md, step 3): the game has no «Resting at» of its own. */
    homeRest:       { es: 'Descansando en', en: 'Resting at' },
    homeKingdom:    { es: 'Telalejana', en: 'Pharloom' },   // MQ_BELLSHRINES_LOC
    homeGhost:      { es: 'Aquí irá tu partida', en: 'Your game goes here' },
    homeAllParts:   { es: 'Todo en Progreso', en: 'Everything in Progress' },
    homeGoProgress: { es: 'Lo que te falta para el 100 %', en: 'What\'s missing for 100%' },
    aboutFold:      { es: 'Sobre esta web', en: 'About this site' },
    cat_tools:      { es: 'Herramientas', en: 'Tools' },
    cat_spools:     { es: 'Carretes de seda', en: 'Silk Spools' },
    cat_upgrades:   { es: 'Bolsa de herramientas y kit de fabricación', en: 'Tool Pouch & Crafting Kit' },   // INV_NAME_POUCHANDTOOLKIT
    cat_arts:       { es: 'Habilidades', en: 'Abilities' },   // es: PANE_SKILLS; en: the wiki's "Skills and Abilities" (the 100%'s Abilities), the game's Skills pane being the same
    cat_skills:     { es: 'Habilidades de seda', en: 'Silk Skills' },   // as the game says it in «Bind all Silk Skills»
    cat_crests:     { es: 'Blasones', en: 'Crests' },   // as the game says it in «Claim all Crests»
    cat_masks:      { es: 'Máscaras', en: 'Masks' },
    cat_needle:     { es: 'Mejoras de la aguja', en: 'Needle upgrades' },
    cat_hearts:     { es: 'Corazones de seda', en: 'Silk Hearts' },   // INV_DESC_SPOOL_SILKHEARTS
    cat_items:      { es: 'Siempreviva', en: 'Everbloom' },   // INV_NAME_WHITE_FLOWER

    /* Since the previous save (js/changes.js): Your game and the notice when the game saves */
    homeSince:      { es: 'Desde el guardado anterior', en: 'Since the previous save' },
    homeSinceAt:    { es: 'guardado {ago}', en: 'saved {ago}' },
    homeSinceAll:   { es: 'Ver las {n}', en: 'Show all {n}' },
    homeSinceFewer: { es: 'Ver menos', en: 'Show fewer' },
    /* Its groups' heads that the game doesn't name (the rest are the 100%'s categories, the
       Tasks pane and the Journal) */
    homeKindUpgrades: { es: 'Mejoras', en: 'Upgrades' },
    homeKindPieces: { es: 'Piezas', en: 'Pieces' },
    chMasks:        { es: 'Máscaras: {n}', en: 'Masks: {n}' },
    chSpools:       { es: 'Carretes de seda: {n}', en: 'Silk Spools: {n}' },
    chHearts:       { es: 'Corazones de seda: {n}', en: 'Silk Hearts: {n}' },
    chKit:          { es: 'Kit de fabricación, mejora {n}', en: 'Crafting Kit, upgrade {n}' },
    chPouch:        { es: 'Bolsa de herramientas, mejora {n}', en: 'Tool Pouch, upgrade {n}' },
    chJournal:      { es: 'Diario: {n} entradas nuevas o completadas', en: 'Journal: {n} entries new or completed' },
    chJournalOne:   { es: 'Diario: una entrada nueva o completada', en: 'Journal: one entry new or completed' },
    chMore:         { es: 'y {n} más', en: 'and {n} more' },
    chWish:         { es: 'tarea completada', en: 'task completed' },   // a PANE_QUESTS task, COMPLETED as the game says it
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
    ctFlint:        { es: '{name} activa', en: '{name} active' },   // {name}: the Tool's, as the game names it
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
    ctBindFails:    { es: 'Enlazar falla', en: 'Bind fails' },   // the curse's; Bind as the game's button says it
    // The curse's Crest (a save made while cursed): the game names it nowhere and the wiki's page has no
    // ESname, so its wiki title stays in English in both (no source).
    ctCursed:       { es: 'Cursed Crest', en: 'Cursed Crest' },
    ctCurse:        { es: 'La maldición: sin herramientas ni habilidades, Enlazar falla y la seda no pasa de 3.', en: 'The curse: no Tools or Skills, Bind fails and silk stops at 3.' },   // BUTTON_CAST, INV_NAME_THREAD; the wiki's Cursed Crest page
    ctPrev:         { es: 'Blasón anterior', en: 'Previous Crest' },
    ctNext:         { es: 'Blasón siguiente', en: 'Next Crest' },
    ctPoint:        { es: 'Señala una herramienta para ver qué hace.', en: 'Point at a Tool to see what it does.' },
    ctSilkCost:     { es: '{n} de seda', en: '{n} silk' },
    ctLinkFree:     { es: 'El enlace traía una build: está en el Modo libre', en: 'The link had a build: it\'s in Free mode' },
    /* Free mode's «Try with» (design/42, 2 A): everything, or your game marked in the Inventory. */
    ctTry:          { es: 'Probar con', en: 'Try with' },
    ctTryAll:       { es: 'Todo', en: 'Everything' },
    ctTryMine:      { es: 'Lo que tengo', en: 'What I have' },
    ctNoTools:      { es: 'Aún no has marcado ninguna herramienta: se marcan en el', en: 'No Tool marked yet: they\'re marked in the' },
    ctAmmo:         { es: '{n} usos', en: '{n} uses' },
    ctAmmo1:        { es: '{n} uso', en: '{n} use' },
    ctLoad:         { es: '{n} por carga', en: '{n} a load' },
    ctRefill:       { es: '{n} fragmentos de coraza', en: '{n} shell shards' },   // as INV_NAME_SHARD says them
    ctBody:         { es: 'Hornet', en: 'Hornet' },   // HORNET_NAME
    ctCasts:        { es: '{n} habilidades de {c} de seda', en: '{n} Skills of {c} silk' },
    ctCasts1:       { es: '{n} habilidad de {c} de seda', en: '{n} Skill of {c} silk' },
    ctBind:         { es: 'Enlazar', en: 'Bind' },   // BUTTON_CAST
    ctBindSub:      { es: 'cura {parts} máscaras en {s} s', en: 'heals {parts} masks in {s} s' },

    /* The Map (js/app-map.js) */
    mapBench:       { es: 'Tu banco', en: 'Your bench' },
    mapZoom:        { es: 'Tamaño del mapa', en: 'Map size' },
    mapCloser:      { es: 'Acercar', en: 'Zoom In' },   // CTRL_ZOOM_IN
    mapFurther:     { es: 'Alejar', en: 'Zoom Out' },   // CTRL_ZOOM_OUT
    mapFull:        { es: 'Mapa grande', en: 'Large map' },
    mapFullScreen:  { es: 'Pantalla completa', en: 'Full Screen' },   // VIDEO_FULLSCREEN
    mapFullExit:    { es: 'Salir de pantalla completa', en: 'Exit full screen' },
    mapSmall:       { es: 'Mapa normal', en: 'Normal map' },
    mapFind:        { es: 'Busca en el mapa: una zona, una pieza, un jefe', en: 'Search the map: an area, a piece, a boss' },
    mapFindShort:   { es: 'Busca en el mapa', en: 'Search the map' },   // the same, where the field is narrow (a phone)
    mapFindNone:    { es: 'Nada con ese nombre en el mapa.', en: 'Nothing by that name on the map.' },
    mapMark:        { es: 'Marcar como conseguido', en: 'Mark as had' },
    mapUnmark:      { es: 'Desmarcar', en: 'Unmark' },
    mapFight:       { es: 'Luchar en Combate', en: 'Fight it in Combat' },
    mapCardClose:   { es: 'Cerrar', en: 'Close' },
    /* The Map's admin mode (js/app-map-admin.js, #…&admin=1): for the maintainer, not a visitor's screen. */
    admTitle:       { es: 'Admin · Mapa', en: 'Admin · Map' },
    admCount:       { es: '{m} movidas · {h} ocultas', en: '{m} moved · {h} hidden' },
    admPending:     { es: '{n} sin guardar', en: '{n} unsaved' },
    admHint:        { es: 'Elige una marca para moverla: arrástrala, o usa las flechas (Mayús: pasos grandes).', en: 'Pick a mark to move it: drag it, or use the arrow keys (Shift: big steps).' },
    admData:        { es: 'Datos', en: 'Data' },
    admNow:         { es: 'Ahora', en: 'Now' },
    admReset:       { es: 'Restablecer', en: 'Restore' },
    admHide:        { es: 'Ocultar', en: 'Hide' },
    admShow:        { es: 'Mostrar', en: 'Show' },
    admIsHidden:    { es: 'Oculta: no sale en el mapa.', en: "Hidden: it isn't on the map." },
    admUndo:        { es: 'Deshacer', en: 'Undo' },
    admSave:        { es: 'Guardar', en: 'Save' },
    admCopy:        { es: 'Copiar', en: 'Copy' },
    admSaved:       { es: 'Guardado en js/map-fixes.js', en: 'Saved to js/map-fixes.js' },
    admFail:        { es: 'No se pudo guardar: {e}', en: "Couldn't save: {e}" },
    admCopied:      { es: 'Copiado: sustituye FIXES en js/map-fixes.js', en: 'Copied: replace FIXES in js/map-fixes.js' },
    admServer:      { es: 'Guarda npm run admin', en: 'npm run admin saves' },
    admNoServer:    { es: 'Sin servidor (npm run admin): solo copiar', en: 'No server (npm run admin): copy only' },
    admMoved:       { es: 'Movidas', en: 'Moved' },
    admHidden:      { es: 'Ocultas', en: 'Hidden' },
    mapMissing:     { es: 'Lo que falta', en: 'Missing' },
    mapPlaces:      { es: 'Lugares', en: 'Places' },
    mapNames:       { es: 'Nombres de zona', en: 'Area names' },
    mapHad:         { es: 'Mostrar completados', en: 'Show Completed' },   // INV_TOGGLE_COMPLETED_ON
    mapFit:         { es: 'Entero', en: 'Whole' },
    mapAlt:         { es: 'El mapa de Telalejana', en: 'The map of Pharloom' },
    mapPlace_bench1:{ es: 'Banco', en: 'Bench' },   // KEY_BENCH
    mapPlace_bellway:{ es: 'Vía Campana', en: 'Bellway' },   // KEY_BELLWAY
    mapPlace_ventrica:{ es: 'Ventrica', en: 'Ventrica' },   // KEY_TUBE
    // A Ventrica station by its name in the game, by its scene (js/app-map.js TUBE).
    mapTube_arborium: { es: 'Memorium', en: 'Memorium' },   // TUBE_NAME_ARBORIUM
    mapTube_city:     { es: 'Gran Vía Campana', en: 'Grand Bellway' },   // TUBE_NAME_CITYBELLWAY
    mapTube_hang:     { es: 'Altos Salones', en: 'High Halls' },   // TUBE_NAME_HANG
    mapTube_song:     { es: 'Cámaras Corales', en: 'Choral Chambers' },   // TUBE_NAME_SONG
    mapTube_enclave:  { es: 'Primer Santuario', en: 'First Shrine' },   // TUBE_NAME_ENCLAVE
    mapTube_hub:      { es: 'Terminus', en: 'Terminus' },   // TUBE_NAME_HUB
    mapTube_under:    { es: 'Talleres Inferiores', en: 'Underworks' },   // TUBE_NAME_UNDER
    // No game text for a respawn point (searched: respawn, reaparecer, wake): written for the context.
    mapRespawn:     { es: 'Tu punto de reaparición', en: 'Your respawn point' },
    mapClosed:      { es: 'sin abrir', en: 'not open yet' },
    mapToll:        { es: 'sin pagar el peaje', en: 'toll not paid' },
    mapGroup_upgrades: { es: 'Mejoras', en: 'Upgrades' },
    mapGroup_crest:   { es: 'Blasón', en: 'Crest' },   // PANE_TOOLS
    mapGroup_items:   { es: 'Objetos', en: 'Items' },
    mapGroup_places:  { es: 'Lugares', en: 'Places' },
    mapGroup_fights:  { es: 'Combates', en: 'Fights' },
    mapGroup_people:  { es: 'Gente', en: 'People' },
    mapGroup_quests:  { es: 'Tareas', en: 'Tasks' },   // PANE_QUESTS
    mapGroup_extras:  { es: 'Coleccionables', en: 'Collectibles' },
    mapGroup_secrets: { es: 'Secretos', en: 'Secrets' },
    mapGroup_game:    { es: 'Tu partida', en: 'Your game' },
    mapShows:       { es: 'Qué se ve en el mapa', en: 'What the map shows' },
    mapShowAll:     { es: 'Mostrar todo', en: 'Show all' },
    mapHideAll:     { es: 'Esconder todo', en: 'Hide all' },
    mapOnlyHundred: { es: 'Solo el 100 %', en: 'Only the 100%' },
    mapToolsOut:    { es: 'Fuera del 100 %', en: 'Outside the 100%' },
    mapToolUpgrade: { es: 'Mejora de {tool}: no suma aparte al 100 %', en: 'Upgrades {tool}: it doesn\'t add to the 100% on its own' },
    mapArtOut:      { es: 'No cuenta para el 100 %', en: 'It doesn\'t count for the 100%' },
    mapArtsIn:      { es: 'Del 100 %', en: 'Of the 100%' },
    mapToolLent:    { es: 'Te la presta un deseo y te la quita al cumplirlo: no cuenta para el 100 %', en: 'A wish lends it and takes it back once done: it doesn\'t count for the 100%' },
    /* A Tool sold that lies in another room once its seller is gone (js/spots.js ALSO): that room's
       mark, with no save and with one that has it there. */
    mapAlsoIf:      { es: 'Aquí si {npc} muere antes de que se lo compres', en: 'Here if {npc} dies before you buy it' },
    mapAlsoNow:     { es: '{npc} murió antes de que se lo compraras: está aquí', en: '{npc} died before you bought it: it lies here' },
    mapGroupShow:   { es: 'Mostrar todo el grupo', en: 'Show the whole group' },
    mapGroupHide:   { es: 'Esconder todo el grupo', en: 'Hide the whole group' },
    mapFoldOpen:    { es: 'Abrir {g}', en: 'Open {g}' },
    mapFoldClose:   { es: 'Plegar {g}', en: 'Fold {g}' },
    mapSetChoose:   { es: 'Elegir cuáles', en: 'Choose which' },
    mapSet_relics:  { es: 'Reliquias', en: 'Relics' },   // COLLECTION_HEADING_RELICDEALER
    // The Map shows the whole map, faint where your game's doesn't yet; this leaves that out. No game source: written for context.
    mapWhole:       { es: 'Mapa completo', en: 'Whole map' },   // no game text: the site's own switch
    mapWholeTip:    { es: 'Con lo que tu partida aún no ha dibujado, en tenue. En color, solo lo que ya dibuja el mapa de tu partida, parte a parte: la parte de una sala en la que aún no has entrado sale en tenue aunque el resto de la sala esté en color. Apágalo para verlo exactamente como el mapa de tu partida: sin las zonas cuyo mapa no has comprado ni lo que está sin cartografiar.',
                      en: 'With what your game hasn\'t drawn yet, faint. In colour, only what your game\'s map already draws, part by part: a part of a room you haven\'t been in yet stays faint even when the rest of the room is in colour. Turn it off to see it exactly as your game\'s map: without the areas whose map you haven\'t bought or what isn\'t mapped yet.' },
    mapArea:        { es: 'Zona', en: 'Area' },
    mapOnMap:       { es: 'Ver en el mapa', en: 'See on the map' },
    mapMore:        { es: 'y {n} más', en: 'and {n} more' },
    mapLayer_boss:  { es: 'Jefes', en: 'Bosses' },   // no game text for them together
    mapLayer_bells: { es: 'Santuario de Campana', en: 'Bellshrine' },   // BELLSHRINE
    mapLayer_locks: { es: 'Puertas cerradas', en: 'Locked doors' },   // BELLTOWN_HOUSE_LOCKED says «cerrado con llave»; no game text for the layer
    mapLayer_shops: { es: 'Vendedor', en: 'Vendor' },   // KEY_SHOP (the game's map key)
    mapLayer_shakra:{ es: 'Shakra', en: 'Shakra' },   // MAPPER_MAIN
    mapLayer_wishwall1: { es: 'Muro de deseos', en: 'Wishwall' },   // QUESTBOARD_TITLE
    mapLayer_givers:{ es: 'Quien pide un deseo', en: 'Who makes a wish' },
    mapLayer_giver1:{ es: 'Pide un deseo', en: 'Makes a wish' },
    mapLayer_people:{ es: 'Quien da algo del 100 %', en: 'Who gives a 100% thing' },
    // The wishes and the main objectives (js/spots.js TASKS). No game source: written for context.
    mapLayer_wspots:{ es: 'Dónde se concede un deseo', en: 'Where a wish is granted' },   // WISH_GRANTED, FIRST_WISH_DESC: the game grants wishes
    mapLayer_qitems:{ es: 'Lo que pide un deseo', en: 'What a wish asks for' },
    mapLayer_goals: { es: 'Objetivos', en: 'Objectives' },   // TASKLIST_INTRO_PREFIX, TASKLIST_INTRO_2
    mapLayer_cocoon:{ es: 'Tu capullo', en: 'Your cocoon' },
    mapLayer_journal: { es: 'Diario', en: 'Journal' },   // PANE_JOURNAL
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
    mapExtra_voidMass:  { es: 'Masa de vacío', en: 'Void Mass' },   // NAME_BLACK_THREAD_CORE
    mapExtra_rosary:    { es: 'Alijos de rosarios', en: 'Rosary caches' },
    mapExtra_shard:     { es: 'Alijos de fragmentos de coraza', en: 'Shell Shard caches' },   // Shell Shards as the game's item says it, then the site's «caches»
    mapExtra_wall:      { es: 'Paredes rompibles', en: 'Breakable walls' },
    mapBell:        { es: 'Santuario de Campana de {area}', en: '{area} Bellshrine' },
    mapLock:        { es: 'Puerta cerrada', en: 'Locked door' },
    mapLockKey:     { es: 'Se abre con: {key}', en: 'Opened with: {key}' },
    // What opens a way (the Map's Passages): the game names none of these, so written for context.
    mapGroup_passage:   { es: 'Accesos', en: 'Passages' },   // no game text for them together
    mapLayer_levers:    { es: 'Palancas', en: 'Levers' },
    mapLayer_gates:     { es: 'Rejas', en: 'Gates' },
    mapLayer_shortcuts: { es: 'Atajos', en: 'Shortcuts' },
    mapLayer_silkwalls: { es: 'Muros de seda', en: 'Silk walls' },
    mapLever:       { es: 'Palanca', en: 'Lever' },
    mapPlate:       { es: 'Placa de presión', en: 'Pressure plate' },
    mapGate:        { es: 'Reja', en: 'Gate' },
    mapShortcut:    { es: 'Atajo', en: 'Shortcut' },
    mapSilkwall:    { es: 'Muro de seda', en: 'Silk wall' },
    mapSilkwallNote:{ es: 'Se corta con la {skill}.', en: 'Cut with {skill}.' },   // {skill}: Silkspear's name, the game's
    // The area maps (each mark carries its own name, the game's), and the rosaries and shell shards
    // lying in a room (each its item's name).
    mapExtra_map:      { es: 'Mapa', en: 'Map' },   // INV_NAME_MAP
    mapExtra_rosaries: { es: 'Rosarios', en: 'Rosaries' },   // INV_NAME_COIN
    mapExtra_shards:   { es: 'Fragmentos de coraza', en: 'Shell Shards' },   // INV_NAME_SHARD
    mapMapFound:    { es: 'Se consigue en esta sala.', en: 'Had in this room.' },
    mapMapShakra:   { es: '{npc} lo vende por {price} rosarios desde que la ves en esta zona.', en: '{npc} sells it for {price} rosaries once you\'ve seen her in this area.' },   // {npc}: MAPPER_MAIN
    mapMapMachine:  { es: 'Una máquina que muestra una maqueta de la Ciudadela lo vende por {price} rosarios.', en: 'A machine displaying a model of the Citadel sells it for {price} rosaries.' },   // the machine's words: CITADEL_MAP_PROMPT
    // The keys, key items, lifts, loose rosaries, small cocoons and hidden corners: the game names
    // none of these groups, so written for context (each key and item carries its own game name).
    mapLayer_keys:     { es: 'Llaves', en: 'Keys' },
    mapLayer_lifts:    { es: 'Ascensores', en: 'Lifts' },
    mapExtra_keyitems: { es: 'Objetos clave', en: 'Key items' },   // no game text for them together
    mapExtra_cocoons:  { es: 'Capullos de seda', en: 'Silk cocoons' },   // no game text: the small «Silk Grub Small Cocoon» objects
    mapExtra_beads:    { es: 'Rosarios sueltos', en: 'Loose rosaries' },
    mapExtra_hidden:   { es: 'Rincones ocultos', en: 'Hidden corners' },
    mapLift:        { es: 'Ascensor', en: 'Lift' },
    mapCocoon:      { es: 'Capullo de seda', en: 'Silk cocoon' },
    mapBead:        { es: 'Rosarios sueltos', en: 'Loose rosaries' },
    mapHidden:      { es: 'Rincón oculto', en: 'Hidden corner' },
    mapHiddenNote:  { es: 'Lo que tapa partes de esta sala hasta que entras: {n}.', en: 'What covers parts of this room until you walk in: {n}.' },
    // Eva's rewards: {npc} CREST_UPG_SHRINE_MAIN, {crest} CREST_HUNTER_NAME, {vest} UI_MSG_TITLE_EXTRASLOT_NAME.
    mapExtra_eva:   { es: 'Lo que da {npc}', en: 'What {npc} gives' },
    mapEvaHunter:   { es: '{crest}, evolución {n}', en: '{crest}, evolution {n}' },
    mapEvaYellow:   { es: '{vest}: ranura amarilla', en: '{vest}: yellow slot' },
    mapEvaBlue:     { es: '{vest}: ranura azul', en: '{vest}: blue slot' },
    mapEvaMeet:     { es: '{npc} la da al conocerla.', en: '{npc} gives it on meeting her.' },
    mapEvaSlots:    { es: '{npc} lo da con {n} ranuras abiertas en tus blasones, sin contar el de {crest}.', en: '{npc} gives it at {n} slots open across your Crests, the {crest} Crest aside.' },
    mapEvaHave:     { es: 'Tienes {n}.', en: 'You have {n}.' },
    mapScrounge:    { es: 'Scrounge', en: 'Scrounge' },   // BELLHART_RELICDEALER_MAIN
    mapScroungeNote:{ es: 'Compra las reliquias.', en: 'Buys the relics.' },
    mapLayer_npc:   { es: 'El resto de la gente', en: 'Everyone else' },
    mapMet:         { es: 'Ya os habéis visto', en: 'You\'ve met' },
    mapNotMet:      { es: 'Aún no os habéis visto', en: 'Not met yet' },
    mapNpcSpots:    { es: 'Aparece en {n} sitios, según el acto y lo que hayas hecho.', en: 'Turns up in {n} places, by act and by what you\'ve done.' },
    mapNpcUnsure:   { es: 'Va y viene por Telalejana: tu archivo guardado no dice dónde está ahora.', en: 'Comes and goes around Pharloom: your save file doesn\'t say where now.' },
    mapTrade_couriers: { es: 'Ofrecen deseos de entrega.', en: 'Offer delivery wishes.' },   // the wish type: TYPE_COURIER_TITLE
    mapTrade_druid:    { es: 'Cambia bayas musgosas por rosarios.', en: 'Trades Mossberries for rosaries.' },
    mapTrade_creige:   { es: 'Vende bebidas.', en: 'Sells drinks.' },
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
    mapShakraNote:  { es: 'Vende {n} mapas de zona y se mueve por Telalejana; los otros {m} se encuentran.', en: 'Sells {n} area maps and moves around Pharloom; the other {m} are found.' },
    mapShakraLeft:  { es: 'Te faltan los mapas de: {list}', en: 'Maps you don\'t have: {list}' },
    mapShakraAll:   { es: 'Tienes todos sus mapas.', en: 'You have all her maps.' },
    mapSells:       { es: 'Del 100 %: {list}', en: 'For 100%: {list}' },
    mapSellsLeft:   { es: 'Te falta de aquí: {list}', en: 'Still here for you: {list}' },
    mapSellsNone:   { es: 'Ya tienes todo lo que da del 100 %.', en: 'You have everything of the 100% it gives.' },
    mapWishes:      { es: 'Deseos: {list}', en: 'Wishes: {list}' },
    mapWishesLeft:  { es: 'Deseos sin cumplir: {list}', en: 'Wishes still open: {list}' },
    mapWishesNone:  { es: 'No quedan deseos por cumplir.', en: 'No wishes left open.' },
    mapKills:       { es: '{n} de {m} derrotados', en: '{n} of {m} defeated' },
    mapBeastHere:   { es: '{n} en esta sala', en: '{n} in this room' },
    mapTaskFor:     { es: 'Lo pide el deseo «{wish}».', en: 'The wish "{wish}" asks for it.' },
    // One enemy, two places (js/spots.js TASKS alt, by the shortcut): the Flintbeetle's.
    mapAltShortcutShut: { es: 'Este {foe} cambia de sitio: está aquí hasta que se abre el atajo de la trampilla, y luego en otra sala.', en: 'This {foe} moves: it\'s here until the trapdoor shortcut is opened, then in another room.' },
    mapAltShortcutOpen: { es: 'Este {foe} cambia de sitio: está aquí una vez abierto el atajo de la trampilla; hasta entonces, en otra sala.', en: 'This {foe} moves: it\'s here once the trapdoor shortcut is opened; until then, in another room.' },
    mapWishGranted: { es: 'Deseo concedido', en: 'Wish Granted' },   // WISH_GRANTED
    mapDone:        { es: 'Completado', en: 'Completed' },   // COMPLETED
    mapNotDone:     { es: 'Sin cumplir', en: 'Not done yet' },
    // A mark the game has taken away (design/86, 2 A): the site's words, the game has none for it.
    mapLost:        { es: 'Ya no está', en: 'No longer there' },
    mapLostAct3:    { es: 'El juego lo retira al empezar el Acto 3.', en: 'The game takes it away when Act 3 begins.' },
    mapLostArena:   { es: 'Solo se lucha en una de las dos arenas, y luchaste en {name}.', en: 'Only one of the two arenas is fought, and you fought {name}.' },
    // Grindle's cell door, gone with him (design/89-map-leftovers, 3 A): {npc} GRINDLE_MAIN, {a} SHELLWOOD_MAIN, {b} WILDS, {boss} NAME_SPINNER_BOSS.
    mapLostCell:    { es: 'La celda de {npc} se va cuando llegas a {a} o {b}, o vences a {boss}: él sale por su cuenta.', en: '{npc}\'s cell goes once you reach {a} or {b}, or beat {boss}: he gets out on his own.' },
    // A pickup an arena drops once won (design/89-map-leftovers, 2 A): {fight} the gauntlet's name (App.gauntletName).
    mapRewardOf:    { es: 'Lo suelta {fight} al ganarlo.', en: 'Dropped by {fight} once won.' },
    mapToWall:      { es: 'Ver el muro de deseos', en: 'See the Wishwall' },
    mapToGiver:     { es: 'Ver quién lo pide', en: 'See who asks for it' },

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
    ftGNeedle:      { es: 'Aguja', en: 'Needle' },   // INV_NAME_NAIL1
    ftGSilk:        { es: 'Seda', en: 'Silk' },   // INV_NAME_THREAD
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
    ftWaitFor_wisp: { es: 'hasta la próxima llama fatua', en: 'until the next wisp' },   // the wisps as WISP_LANTERN_DESC calls them
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
    ftBlack:        { es: 'Con hilo negro (Acto 3): {n}', en: 'Black-threaded (Act 3): {n}' },
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
    ftReward:       { es: 'Recompensa', en: 'Reward' },   // UI_BOARD_REWARD_TITLE
    ftCleared:      { es: 'Superado', en: 'Cleared' },
    ftNotCleared:   { es: 'Sin superar en esta partida', en: 'Not cleared in this game' },
    ftClearedCount: { es: 'Has superado {n} de {of} en esta partida.', en: 'You\'ve cleared {n} of {of} in this game.' },
    ftGauntletNote: { es: 'La vida de todas sus oleadas. Lo más rápido es una estimación: cuenta la seda y las cargas de una oleada a otra, con el daño de cada enemigo a tu nivel de aguja. Con hilo negro (Acto 3) algunas cambian.', en: 'The health of all its waves. The quickest way is an estimate: it carries silk and loads from one wave to the next, with each enemy\'s damage at your Needle\'s level. Black-threaded (Act 3), some change.' },
    ftType_fire:    { es: 'fuego', en: 'fire' },
    ftType_void:    { es: 'vacío', en: 'void' },

    /* The Hunter's Journal (js/app-journal.js) */
    hjNearest:      { es: 'Lo más cerca', en: 'Nearest' },
    hjNear:         { es: 'Lo más cerca de tu banco', en: 'Closest to your bench' },
    hjLeft:         { es: 'faltan {n}', en: '{n} to go' },
    hjLeft1:        { es: 'falta {n}', en: '{n} to go' },
    hjMemento:      { es: 'Para el Recuerdo de cazadora', en: 'For the Hunter\'s Memento' },   // as INV_NAME_HUNTER_MEMENTO names it
    hjMementoShort: { es: 'Recuerdo', en: 'Memento' },   // the Hunter's Memento, shortened under its ring
    hjSeen:         { es: '{n} de {m} encontradas', en: '{n} of {m} encountered' },   // the Journal's ENCOUNTERED
    hjOptional:     { es: 'Opcional: no cuenta para el Recuerdo', en: 'Optional: not needed for the Memento' },
    hjBy:           { es: 'También se completa al derrotar a: {names}', en: 'Also completed by defeating: {names}' },
    // Void Tendrils' entry: the game's prompt (INSPECT) and what it calls the thing (WEAVE_DARK, «Una runa de pergamino…»).
    hjInspect:      { es: 'Se completa al inspeccionar su runa de pergamino.', en: 'Completed by inspecting its rune-scroll.' },
    hjOrder:        { es: 'Orden', en: 'Order' },
    hjByArea:       { es: 'Por zonas', en: 'By area' },
    hjByBook:       { es: 'Como el Diario', en: 'Journal order' },
    hjNotesDefeat:  { es: 'Derrota {0} más para completar las notas de caza.', en: 'Defeat {0} more to complete the hunter\'s notes.' },   // NOTES_DEFEAT
    hjFind:         { es: 'Buscar en el Diario: un bicho, una zona', en: 'Search the Journal: a bug, an area' },
    hjNone:         { es: 'Nada con ese nombre en el Diario.', en: 'Nothing by that name in the Journal.' },
    hjElsewhere:    { es: 'En otros sitios', en: 'Elsewhere' },
    // In the Journal's own words, ENCOUNTERED and COMPLETED (an entry: «completada», «encontrada»).
    hjState_done:   { es: 'completada', en: 'completed' },
    hjState_seen:   { es: 'encontrada, sin completar', en: 'encountered, not completed' },
    hjState_unseen: { es: 'aún sin encontrar', en: 'not encountered yet' },

    /* The Inventory (js/app-game.js) */
    invItems:       { es: 'Objetos', en: 'Items' },
    invPurse:       { es: 'Monedero', en: 'Purse' },
    invRelics:      { es: 'Reliquias', en: 'Relics' },   // COLLECTION_HEADING_RELICDEALER
    invMementos:    { es: 'Recuerdos', en: 'Mementos' },   // COLLECTION_HEADING_MOMENTOS
    invBroken:      { es: 'Si lo rompieras todo: +{n}', en: 'If you broke them all: +{n}' },
    invFieldMax:    { es: '{what}, máximo {n}', en: '{what}, maximum {n}' },
    invMissing:     { es: 'Aún no lo tienes', en: 'You don\'t have it yet' },
    /* The third round (design/43): the plates' line for what you lack, what's loose under the masks
       and the silk, and the two Tools a wish lends. No game source: written for context. */
    invNotFound:    { es: 'Sin conseguir', en: 'Not found yet' },
    invLooseMask:   { es: 'cuatro forman una máscara', en: 'four make a mask' },
    invLooseSpool:  { es: 'dos forman un carrete', en: 'two make a spool' },
    invLentNote:    { es: 'Las de borde discontinuo te las presta un deseo: no cuentan para el 100 %.', en: 'The dashed ones are lent by a wish: they don\'t count for the 100%.' },
    invAll:         { es: 'Todo', en: 'All' },
    invNone:        { es: 'Nada', en: 'None' },
    invLess:        { es: 'Uno menos: {what}', en: 'One less: {what}' },
    invMore:        { es: 'Uno más: {what}', en: 'One more: {what}' },
    invNeedle:      { es: 'La aguja', en: 'The Needle' },
    invFromTo:      { es: 'de {a} a {b}', en: 'from {a} to {b}' },
    invLearnt:      { es: 'Aprendida', en: 'Learnt' },
    invNotLearnt:   { es: 'Sin aprender', en: 'Not learnt' },
    invStart:       { es: 'Empezar desde', en: 'Start from' },
    invBase:        { es: 'Partida nueva', en: 'New Game' },   // PROFILE_NEW_GAME
    invFreeLead:    { es: 'Modo libre: marca lo que tienes en tu partida y Progreso cuenta el 100 % con ello. Para probar builds con todo, el Blasón.',
      en: 'Free mode: mark what you have in your game and Progress counts the 100% from it. To try builds with everything, the Crest screen.' },
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
    pgDone:         { es: 'Completo', en: 'Complete' },
    pgGot:          { es: 'Conseguido', en: 'Got' },
    pgLater:        { es: 'Más adelante: Acto {n}', en: 'Later: Act {n}' },
    kind_flea:      { es: 'Pulga perdida', en: 'Lost Flea' },   // KEY_FLEA
    kind_silkHeart: { es: 'Corazón de seda', en: 'Silk Heart' },   // MEMORY_MSG_TITLE_SILKHEART
    kind_fleas:     { es: 'Las pulgas perdidas', en: 'The Lost Fleas' },   // QUEST_FLEAS_TITLE
    kind_oldHearts: { es: 'Viejos corazones', en: 'Old Hearts' },   // as the wish MQ_BLACKTHREAD_5_NAME says them
    kind_melodies:  { es: 'Melodías', en: 'Melodies' },
    pgOtherArts:    { es: 'Otras habilidades', en: 'Other abilities' },
    pgTasks:        { es: 'Tareas', en: 'Tasks' },   // PANE_QUESTS
    pgTasksMain:    { es: 'Objetivos principales', en: 'Main objectives' },
    pgTasksCollect: { es: 'Colección', en: 'Collect' },
    // A wish promised (design/81): its state as the game shows it, and the head the promised go first under.
    pgPromised:     { es: 'Deseo prometido', en: 'Wish Promised' },   // WISH_PROMISED
    pgPromisedHead: { es: 'Prometidos', en: 'Promised' },   // no word of the game's for them together
    pgRest:         { es: 'Los demás', en: 'The rest' },
    /* Progress's two tabs (design/27b-progress-variants.html): the road to the next Act and the 100% */
    pgStepOf:       { es: 'paso {n} de {of}', en: 'step {n} of {of}' },
    pgToGo:         { es: '{pct} por conseguir', en: '{pct} to go' },
    pgShrines:      { es: 'Santuarios de Campana', en: 'Bellshrines' },   // BELLSHRINE, in the plural
    pgPoints:       { es: 'Puntos de deseos', en: 'Wish points' },
    pgEndings:      { es: 'Finales', en: 'Endings' },   // no word of the game's for them
    /* An Act 2 ending closed in an Act 3 game (design/41, 1 A): the ring counts what's still within reach. */
    pgEndingsReach: { es: 'Finales a tu alcance', en: 'Endings within reach' },
    pgEndingsShut:  { es: 'Cerrado en esta partida: {name}', en: 'Closed in this game: {name}' },
    pgEndingsShutN: { es: 'Cerrados en esta partida: {name}', en: 'Closed in this game: {name}' },
    pgShut:         { es: 'cerrado', en: 'closed' },
    pgOnlyAct3:     { es: 'Solo en el Acto 3', en: 'Only in Act 3' },
    /* Progress at first sight (design/40-progress-clarity-variants.html): where you are, over the tabs */
    pgActName1:     { es: 'TELALEJANA', en: 'PHARLOOM' },   // ACT_1_NAME
    pgActName2:     { es: 'CIUDADELA MELODIOSA', en: 'CITADEL OF SONG' },   // ACT_2_NAME
    pgActName3:     { es: 'ABISMO', en: 'ABYSS' },   // ACT_3_NAME
    pgHere:         { es: 'Estás aquí', en: 'You are here' },
    pgHereAct:      { es: 'Estás en el Acto {n}.', en: 'You\'re in Act {n}.' },
    pgHereNext:     { es: 'Para abrir el Acto {m} hay {of} pasos: vas por el {i}, y en él te quedan {n} cosas.', en: 'Opening Act {m} takes {of} steps: you\'re on step {i}, with {n} things left in it.' },
    pgHereNext1:    { es: 'Para abrir el Acto {m} hay {of} pasos: vas por el {i}, y en él te queda {n} cosa.', en: 'Opening Act {m} takes {of} steps: you\'re on step {i}, with {n} thing left in it.' },
    pgHereStep:     { es: 'Para abrir el Acto {m} hay {of} pasos: vas por el {i}.', en: 'Opening Act {m} takes {of} steps: you\'re on step {i}.' },
    pgHere100:      { es: 'Para el 100 % te queda un {pct}.', en: '{pct} to go for 100%.' },
    pgHereFull:     { es: 'Acto 3 y el 100 %: lo tienes todo.', en: 'Act 3 and 100%: you have it all.' },
    pgHereNone:     { es: 'Silksong tiene tres actos. Sin un perfil cargado, esta pestaña es la guía: lo que pide el juego para pasar de uno a otro, y todo lo que cuenta para el 100 %.',
                      en: 'Silksong has three Acts. With no profile loaded, this tab is the guide: what the game asks to go from one to the next, and everything that counts for 100%.' },
    pgInviteTag:    { es: 'Sin perfil', en: 'No profile' },
    pgInvite:       { es: 'Importa tu partida y verás en qué acto estás, y qué te falta para el siguiente y para el 100 %, pieza a pieza.',
                      en: 'Import your game to see which Act you\'re in, and what\'s left for the next one and for 100%, piece by piece.' },
    /* The road's steps by what to do, on its thread (3 A); the titles stay the whole road's */
    pgStepBells:    { es: 'Haz sonar los Santuarios', en: 'Ring the Bellshrines' },   // the game's word in it: BELLSHRINE
    pgStepGate:     { es: 'Abre la {gate}', en: 'Open the {gate}' },
    pgStepUnlock:   { es: 'Desbloquea «{wish}»', en: 'Unlock "{wish}"' },
    pgStepOffer:    { es: 'Acepta el deseo', en: 'Accept the wish' },   // the game's verb: CTRL_ACCEPT
    pgStepSnare:    { es: 'Reúne la trampa', en: 'Gather the snare' },
    pgStepReady:    { es: 'Llévasela al {caretaker}', en: 'Bring it to the {caretaker}' },
    pgStepSilk:     { es: 'Atrapa a la {silk}', en: 'Snare {silk}' },
    /* What's next on the step you're on (2 A) */
    pgTodo:         { es: 'Lo siguiente', en: 'What\'s next' },
    pgTodoWish:     { es: 'Completa el deseo «{wish}»', en: 'Complete the wish "{wish}"' },
    pgTodoPoints:   { es: 'Consigue {n} puntos más de deseos', en: 'Get {n} more wish points' },
    pgTodoPoints1:  { es: 'Consigue {n} punto más de deseos', en: 'Get {n} more wish point' },
    pgTodoAny:      { es: 'Vale cualquiera de estos {n} deseos; por ejemplo:', en: 'Any of these {n} wishes will do; for example:' },
    pgTodoAnyNear:  { es: 'Vale cualquiera de estos {n} deseos; los más cercanos a tu banco:', en: 'Any of these {n} wishes will do; the nearest to your bench:' },
    pgTodoShrine:   { es: 'Haz sonar el Santuario de Campana de {area}', en: 'Ring the Bellshrine in {area}' },   // the game's word in it: BELLSHRINE
    pgTodoGet:      { es: 'Consigue: {name}', en: 'Get: {name}' },
    pgTodoPavo:     { es: 'Habla con Pabo: te da la {key}', en: 'Talk to Pavo: he gives you the {key}' },   // his name: BELLHART_GREETER_MAIN
    pgTodoMore:     { es: 'y {n} más', en: 'and {n} more' },
    /* A how line on a phone: its lead, and what it waits for behind a button (design/41, 2 B). */
    pgHowMore:      { es: '+{n} más', en: '+{n} more' },
    pgHowLess:      { es: 'menos', en: 'less' },
    /* A thing of the 100% lying in a room, which has no other way (design/41, 4 A). */
    pgFound:        { es: 'Se encuentra en la zona: el alfiler marca dónde', en: 'Found in the area: the pin shows where' },
    pgFoundNoPin:   { es: 'Se encuentra en la zona', en: 'Found in the area' },
    /* Free mode with the Inventory's marks (design/41, 6 A). */
    pgHereFreeK:    { es: 'Modo libre.', en: 'Free mode.' },
    pgHereFree:     { es: 'El 100 % cuenta lo que marcas aquí o en el Inventario, desde una partida nueva; el camino es la guía, como sin un perfil cargado.', en: 'The 100% counts what you mark here or in the Inventory, from a New Game; the road is the guide, as with no profile loaded.' },
    pgLadderNote:   { es: 'Esto se fija en el Inventario:', en: 'This is set in the Inventory:' },
    /* The 100% tab (4 A), and the guide without a save (5 A) */
    pgInCats:       { es: 'en {n} categorías', en: 'in {n} categories' },
    pgColHead:      { es: 'Tienes / vale (%)', en: 'Got / worth (%)' },
    pgColHeadNone:  { es: 'Vale (%)', en: 'Worth (%)' },

    /* Progress: the road to the next Act (js/acts.js, the game's own rules) */
    roadTitle:      { es: 'Camino al Acto {n}', en: 'The road to Act {n}' },
    roadSnare:      { es: 'Trampa anímica', en: 'Soul Snare' },   // MQ_SILK_SNARE_NAME
    ending_A:       { es: 'Reina Tejedora', en: 'Weaver Queen' },   // ENDING_A_NAME
    ending_C:       { es: 'Atadura de seda', en: 'Snared Silk' },   // ENDING_C_NAME
    ending_D:       { es: 'Niña retorcida', en: 'Twisted Child' },   // ENDING_D_NAME
    ending_E:       { es: 'Hermana del vacío', en: 'Sister of the Void' },   // ENDING_E_NAME
    roadGame:       { es: 'Tu partida', en: 'Your game' },
    roadEndings:    { es: '{n} de {of} finales', en: '{n} of {of} endings' },
    roadEndingsReach:{ es: '{n} de {of} finales a tu alcance', en: '{n} of {of} endings within reach' },
    roadBoth:       { es: 'Los caminos a los Actos 2 y 3', en: 'The roads to Acts 2 and 3' },
    roadNote2:      { es: 'Lo que pide el juego para entrar en la Ciudadela, paso a paso.', en: 'What the game asks before you walk into the Citadel, step by step.' },
    roadNote3:      { es: 'Lo que pide el juego para abrir el Acto 3, leído de sus propios archivos. Las guías suelen dar solo seis deseos: cuentan también los que van antes de ellos, un mínimo de puntos de deseos y cuatro condiciones más.',
                      en: 'What the game asks before Act 3 opens, read from its own files. Guides usually give six wishes: the ones before them count too, and so do a minimum of wish points and four more conditions.' },
    roadStale:      { es: 'Este perfil se guardó en la web antes de que leyera los deseos: vuelve a importarlo para ver su camino.', en: 'This profile was kept before the site read the wishes: import it again to see its road.' },
    // Defeating a foe as the game words it (MQ_TYPE_DEFEAT, DEFEATED_*_DESC: «Derrota a…», "Defeat…").
    roadBypassed:   { es: 'Ya no hace falta: derrotar a {phantom} abre otro camino.', en: 'No longer needed: defeating {phantom} opens another way in.' },
    roadBells:      { es: 'Haz sonar los cinco Santuarios de Campana', en: 'Ring the five Bellshrines' },   // the game's word in it: BELLSHRINE
    // The Gate opens only once its Judge is beaten (design/90c, 2 A): MQ_BELLSHRINES_NAME, NAME_LAST_JUDGE
    roadGate:       { es: 'Abre la {gate}: derrota a la {judge}', en: 'Open the {gate}: defeat the {judge}' },
    /* The other way in (design/90c, 1 A): the Phantom (NAME_PHANTOM), in place of the steps it skips */
    roadPhantom:    { es: 'Derrota a {phantom}', en: 'Defeat {phantom}' },
    roadInstead:    { es: 'En lugar de los pasos {a} y {b}', en: 'Instead of steps {a} and {b}' },
    roadAltOpen:    { es: 'Abierto ya: te ahorra los pasos {a} y {b}.', en: 'Open now: it skips steps {a} and {b}.' },
    roadAltShut:    { es: 'Se abre en cuanto tengas las dos: te ahorra los pasos {a} y {b}.', en: 'Opens once you have both: it skips steps {a} and {b}.' },
    roadAltGuide:   { es: 'Se abre desde el paso {a} con las dos: te ahorra los pasos {a} y {b}.', en: 'Open from step {a} with both: it skips steps {a} and {b}.' },
    roadAltDone:    { es: 'Hecho: la {gate} ya no hace falta.', en: 'Done: the {gate} is no longer needed.' },
    roadNeeds:      { es: 'Requiere', en: 'Needs' },
    roadOr:         { es: 'o', en: 'or' },
    roadTwoWays:    { es: 'Dos caminos', en: 'Two ways in' },
    roadFromTo:     { es: 'De {from} a la Ciudadela', en: 'From {from} to the Citadel' },
    roadCitadel:    { es: 'Entra en la Ciudadela', en: 'Walk into the Citadel' },
    roadUnlock:     { es: 'Desbloquea el deseo «{wish}»', en: 'Unlock the wish "{wish}"' },
    roadRequired:   { es: 'Deseos obligatorios', en: 'Required wishes' },
    roadHalf:       { es: '½ punto', en: '½ point' },
    roadBefore:     { es: 'antes: {name}', en: 'first: {name}' },
    roadFour:       { es: 'Cuatro condiciones', en: 'Four conditions' },
    roadAllThree:   { es: 'Para que el {caretaker} te ofrezca «{wish}» hacen falta las tres cosas:', en: 'For the {caretaker} to offer you "{wish}", all three are needed:' },
    roadLeft1:      { es: 'Te falta {n}.', en: '{n} to go.' },
    roadCaravan:    { es: 'La Caravana de las pulgas en Pulgatopía', en: 'The Flea Caravan at Fleatopia' },   // KEY_CARAVAN, FLEATOPIA
    roadLace:       { es: 'Derrota a Lace en la Cuna', en: 'Defeat Lace in the Cradle' },   // DEFEATED_LACE_2_DESC
    roadKey:        { es: 'Llave de hogar campana', en: 'Bellhome Key' },   // INV_NAME_BELL_HOUSE_KEY
    roadPavo:       { es: 'lista: habla con Pabo', en: 'ready: talk to Pavo' },   // his name: BELLHART_GREETER_MAIN
    roadKeyCursed:  { es: 'mientras estés maldita, {pavo} no te la da', en: 'while you\'re cursed, {pavo} won\'t give it' },   // the game's word: ENDING_D_DESC «mientras estás maldita»
    roadKeyRest:    { es: 'tras «{glory}», descansa en un banco fuera de {town} antes de hablar con {pavo}', en: 'after {glory}, rest at a bench outside {town} before talking to {pavo}' },
    roadCursed:     { es: 'Estás maldita: hasta que «{cure}» te cure, {pavo} no te da la llave, los {couriers} no te dan entregas y vencer a la {silk} da el final «{twisted}».', en: 'You\'re cursed: until {cure} cures you, {pavo} won\'t give you the key, {couriers} won\'t hand you deliveries and defeating {silk} gives the {twisted} ending.' },   // GAINED_CURSE, ENDING_D_DESC
    roadKeyRule:    { es: 'Pabo la da tras «{glory}» y {n} deseos de su lista', en: 'Pavo gives it after {glory} and {n} wishes of his list' },
    roadOffer:      { es: 'Acepta «{wish}»: habla con el {caretaker} en {clave}', en: 'Accept "{wish}": talk to the {caretaker} in {clave}' },
    roadOfferNote:  { es: 'Con todo cumplido, te llama con la mano. El deseo sale también en el muro de deseos de {town}, que te manda a él.', en: 'Once everything is met he waves you over. The wish also shows on the Wishwall in {town}, which sends you to him.' },
    roadDeclined:   { es: 'Ya te lo ofreció y lo rechazaste: vuelve a hablar con él y acéptalo.', en: 'He offered it and you turned it down: talk to him again and accept.' },
    roadCaretaker:  { es: 'Cuidador', en: 'Caretaker' },   // CARETAKER_MAIN
    roadPieces:     { es: 'Reúne las cuatro piezas de la trampa', en: 'Gather the snare\'s four pieces' },
    roadPieceGiven: { es: 'te la da al aceptar el deseo: {npc}', en: 'given once you accept the wish: {npc}' },
    roadPieceAfter: { es: 'tras derrotar a {foe}', en: 'after defeating {foe}' },
    roadPieceNeeds: { es: 'requiere: {art}', en: 'needs: {art}' },
    roadHermitMeet: { es: 'si nunca habías hablado con él, te la da la segunda vez', en: 'if you\'d never talked to him, he gives it the second time' },
    roadHermitWay:  { es: 'cruza la pared oculta a la derecha de la Vía Campana y baja: está a la izquierda', en: 'walk through the hidden wall right of the Bellway and drop down: he\'s to the left' },   // the game's word in it: KEY_BELLWAY
    roadReady:      { es: 'Llévaselas al {caretaker} en {clave}', en: 'Bring them to the {caretaker} in {clave}' },
    roadSilk:       { es: 'Derrota a la Gran Madre Seda y atrápala con la trampa anímica', en: 'Defeat Grand Mother Silk and entrap her with the Soul Snare' },   // ENDING_C_DESC
    roadSilkNote:   { es: 'En el golpe final, toca el Agujolín en vez de enlazarla. Ese final cierra en esa partida los otros dos del Acto 2; tras los créditos, la partida se abre ya en el Acto 3. Si estás maldita, vencerla da en cambio el final «{twisted}».', en: 'On the final blow, play the Needolin instead of binding her. That ending closes the other two Act 2 endings in that game; after the credits the game opens in Act 3. If you\'re cursed, defeating her gives the {twisted} ending instead.' },
    roadRunt:       { es: 'para el Acto 3 cuenta su versión principal, no la de la cría', en: 'for Act 3 its main version counts, not the runt\'s' },
    roadMelodies:   { es: 'para llegar a la Cuna, las tres melodías: {n} de 3', en: 'to reach the Cradle, the three melodies: {n} of 3' },
    // The caravan (js/acts.js: Mooshka's FSM): its stop now, the fleas, and what its last move asks.
    roadCaravanHow: { es: '{n} de {need} pulgas rescatadas; habla con {npc} en cada parada (ahora: {at})', en: '{n} of {need} fleas rescued; talk to {npc} at each stop (now: {at})' },
    roadCaravanRest:{ es: 'en cada parada, tras hablar con {npc}, descansa en un banco lejos de ella antes de que siga', en: 'at each stop, once you\'ve talked to {npc}, rest at a bench away from it before it moves on' },
    roadCaravanRule:{ es: 'rescata {need} pulgas y habla con {npc} en cada parada de la caravana', en: 'rescue {need} fleas and talk to {npc} at each of the Caravan\'s stops' },
    roadCaravanLake:{ es: 'antes, visita el {lake} vacío, en los {ducts}', en: 'first visit the empty {lake}, in the {ducts}' },
    roadCaravanJudge:{ es: 'antes de su parada en los {steps}, derrota a la {judge}', en: 'before its stop on the {steps}, defeat the {judge}' },
    roadPaleLake:   { es: 'Lago Pálido', en: 'Pale Lake' },   // WHITELAKE
    /* Each step and row in the game's own words (design/28, 1 A to 5 A): what the pane «Tareas»
       says of it, its Wishwall, the Inventory, the Journal or the Caretaker. */
    pgSays:         { es: 'Lo que dice el juego', en: 'What the game says' },
    pgSaysHide:     { es: 'Ocultar', en: 'Hide' },
    pgPeekStep:     { es: 'Paso {n}', en: 'Step {n}' },
    pgPeekDone:     { es: 'hecho', en: 'done' },
    pgMapN:         { es: 'Ver los {n} en el mapa', en: 'See the {n} on the map' },
    // The route's last station, over the Act it opens (design/83, 4 A).
    pgRouteEnd:     { es: 'Llegas al', en: 'You reach' },
    roadKeyDesc:    { es: 'Llave para acceder a una campana restaurada sobre Campanilla.', en: 'Key to a restored bell above Bellhart.' },   // INV_DESC_BELL_HOUSE_KEY
    roadSays_churchkeeper: { es: 'Abajo, en las tierras musgosas, aferrada aún a su capilla fallida, mi hermana se desprenderá de su poder, si se lo pides amablemente.',
                      en: 'Down in the mosslands, still clinging to her failed chapel, my sister\'ll part with her power, if asked kind enough.' },   // CARETAKER_SNARE_REPEAT_CHURCHKEEPER
    roadSays_hermit: { es: 'Enterrado en la madriguera de campanas, en el núcleo de Telalejana, busca a mi hosco tío. Tiene poder de sobra.',
                      en: 'Buried in the warren of bells, at Pharloom\'s core, seek my sullen uncle. That one has power to spare.' },   // CARETAKER_SNARE_REPEAT_BELLHERMIT
    roadSays_swamp: { es: 'Encuentra la cáscara de mi primo, reclamada por los furiosos bichos de los pantanos. Fue un necio descuidado por dejarse atrapar, y por muy muerto que esté, aún se intuye algún atisbo de su alma.',
                      en: 'Find the husk of my cousin, claimed by the scorned bugs of the swamps. A careless fool to let himself be taken, and dead they might be, but some glimmer of his soul can still be sensed.' },   // CARETAKER_SNARE_REPEAT_SWAMP
    roadSays_snare: { es: 'Y como base, necesitaremos un arma del pasado de las Tejedoras. Busca abajo, a un lado de los caminos de hueso, dentro de su nido más grande. Es un dispositivo de trampa, uno que pone una runa de seda abrasadora.',
                      en: 'For the base, we\'ll be needin\' a weapon of Weavers past. Search down low, aside the paths of bone, inside their largest nest. S\'a snare device, one to set a rune\'o searing Silk.' },   // CARETAKER_SNARE_REPEAT_SNARE
    /* The Map's focus (js/app-map.js App.mapFocus): a step's marks at once, one by one. */
    mapFocusOf:     { es: '{i} de {n}', en: '{i} of {n}' },
    mapFocusPrev:   { es: 'La anterior', en: 'Previous' },
    mapFocusNext:   { es: 'La siguiente', en: 'Next' },
    mapFocusOff:    { es: 'Volver al mapa entero', en: 'Back to the whole map' },
    /* What posts a required wish later than the rest (its playerData test in js/quests.js CHAIN when,
       and the wiki's prerequisites for what sets it; checked on the author's saves). */
    roadOpensShakra:{ es: 'sale al comprarle a {npc} todos sus mapas y tener la {art}, con dos de las tres melodías aprendidas o tras derrotar a {foe}', en: 'posted once you have bought all of {npc}\'s maps and have the {art}, with two of the three melodies learned or {foe} defeated' },
    roadOpensSherma:{ es: 'sale tras conocer a {npc} en {clave} y visitar el {ward}', en: 'posted after meeting {npc} in {clave} and visiting the {ward}' },
    roadOpensClave: { es: 'sale cuando {clave} crece: «{first}» y otros 3 deseos de su muro', en: 'posted once {clave} grows: "{first}" and 3 more wishes from its board' },
    roadOpensTown:  { es: 'sale tras la primera mejora de aguja, venderle una reliquia a {npc} y hablar con {pavo}', en: 'posted after your first Needle upgrade, selling a relic to {npc} and speaking with {pavo}' },
    roadOpensGlory: { es: 'sale tras derrotar a los {foe}, conseguir {art} o entrar en {clave}', en: 'posted after defeating the {foe}, getting the {art} or entering {clave}' },
    roadRestOut:    { es: 'aparece al descansar en un banco fuera de {area}', en: 'it shows up when you rest at a bench outside {area}' },
    roadRestAway:   { es: 'aparece al descansar en un banco de otra zona', en: 'it shows up when you rest at a bench in another area' },
    roadMapsBought: { es: '{n} de {of} comprados', en: '{n} of {of} bought' },
    roadPinOil:     { es: 'cuenta también con la segunda mejora de aguja de {npc}', en: 'also counts with {npc}\'s second Needle upgrade' },
    // What a wish asks to be brought (js/quests.js CHAIN asks): a donation's sum, the Journal's entries, its things.
    roadAskRosaries:{ es: 'pide {n} rosarios', en: 'asks for {n} rosaries' },   // the game's word in it: INV_NAME_COIN
    roadAskShards:  { es: 'pide {n} fragmentos de coraza', en: 'asks for {n} shell shards' },   // the game's word in it: INV_NAME_SHARD
    roadAskJournal: { es: 'pide {n} entradas en el {journal}', en: 'asks for {n} entries in the {journal}' },
    roadAskItems:   { es: 'pide: {items}', en: 'asks for: {items}' },
    roadAskN:       { es: '{n} × {item}', en: '{n} × {item}' },

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

    /* Footer: the fan-project notice, the sources and the author (docs/guide.md, "Credits and licences") */
    footLabel:      { es: 'Aviso, fuentes y contacto', en: 'Notice, sources and contact' },
    footFan:        { es: 'Proyecto de fans no oficial, gratuito y sin ánimo de lucro, sin relación con {tc}. Hollow Knight: Silksong y su arte son © Team Cherry.',
                      en: 'Unofficial fan project, free and non-commercial, not affiliated with {tc}. Hollow Knight: Silksong and its artwork are © Team Cherry.' },
    footData:       { es: 'Datos de {wiki}, bajo {lic}; textos del juego, de su traducción oficial.',
                      en: 'Data from {wiki}, under {lic}; game texts from its official translation.' },
    footMade:       { es: 'Hecho por Albert. ¿Un número mal, una traducción rara o un fallo? Escribe a {mail}.',
                      en: 'Made by Albert. A wrong number, an odd translation or a bug? Write to {mail}.' },
    footSupport:    { es: '¿Te es útil? Puedes apoyarla en {kofi}.', en: 'Is it useful to you? You can support it on {kofi}.' },
    // The privacy notice under it, folded (docs/guide.md, "Privacy"). No game source: written for context.
    footPrivacy:    { es: 'Privacidad', en: 'Privacy' },
    footPrivNone:   { es: 'Esta web no usa cookies ni rastreadores.',
                      en: 'This site uses no cookies and no trackers.' },
    footPrivLocal:  { es: 'Lo que marcas (perfiles, herramientas y blasones, diario, progreso, preferencias) se guarda solo en este navegador, con una copia de cada archivo guardado que importas; si pones «Seguir al juego», también el acceso a tu archivo guardado.',
                      en: 'What you mark (profiles, Tools and Crests, journal, progress, preferences) is kept only in this browser, with a copy of each save file you import; if you turn on "Follow the game", so is the access to your save file.' },
    footPrivSaves:  { es: 'Tus archivos guardados se leen aquí mismo y no se suben a ningún sitio.',
                      en: 'Your save files are read right here and never uploaded anywhere.' },   // the files as SAVE_CORRUPTED_TITLE and PS4_SAVE_IMPORT_RESULT_SUCCESS call them
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

  /* The languages the site speaks, in the selector's order (English first: it's the default).
     `tag` is the HTML language, `code` what a phone's header shows and `name` the language's own
     name, as the game writes it in its menu (its LANG_CURRENT): never translated. The selector
     (js/app.js, renderMasthead) lists them; a new language starts with a row here. */
  const LANGS = [
    { id: 'en', tag: 'en', code: 'EN', name: 'English' },   // EN: LANG_CURRENT
    { id: 'es', tag: 'es', code: 'ES', name: 'Español' },   // ES: LANG_CURRENT
  ];
  const speaks = (id) => LANGS.some((l) => l.id === id);

  function setLang(next) {
    lang = speaks(next) ? next : 'en';
    SS.i18n.lang = lang;
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    return lang;
  }

  SS.i18n = { UI, LANGS, speaks, lang, t, pick, nf, setLang, get current() { return lang; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.i18n;
})();
