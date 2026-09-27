/* js/app-boot.js — startup, once every screen's script is loaded: preferences, the link's
   language and screen, and the first render. Shares SS.app with js/app.js (see there). */
(() => {
  'use strict';
  const SS = globalThis.SS;
  const I = SS.i18n;
  const App = SS.app;
  const { PAGE_LANG, PAGE_VIEW, prefs, loadPrefs, splitHash, rebuildNF, persist, render } = App;

  loadPrefs();
  // The link's language; without one, the Spanish page speaks Spanish (and that counts as choosing it).
  const urlHash = splitHash(location.hash);
  const fromUrl = urlHash.lang || (PAGE_LANG === 'en' ? null : PAGE_LANG);
  // The screen: the link's; without it, the page's own; and with no link, wherever you left it.
  prefs.view = urlHash.view || PAGE_VIEW || prefs.view;
  I.setLang(fromUrl || prefs.lang);
  prefs.lang = I.current;
  if (fromUrl) prefs.langChosen = true;   // a link with a language counts as choosing it
  rebuildNF();
  persist();
  render();
  // The save you're in, if it follows the game's file, starts watching it (js/app-saves.js).
  if (App.liveStart) App.liveStart();
})();
