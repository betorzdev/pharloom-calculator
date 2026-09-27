/* js/codec.js — a build in the URL: readable, and only what differs from the base (js/engine.js's
   normalize({}): the Hunter, every ladder at 0, nothing equipped), as the Hollow Knight site does:
     #v=1&crest=architect&needle=4&kit=3&pouch=2&masks=5&spools=9&hearts=3
      &tools=straight-pin,compass&skill=silkspear&vest=yb&stage=3
   The Tools and Skills go by their ids, which are the wiki's names made slugs: a link keeps
   working after a patch reorders the lists. A link from a later version, or damaged, gives what
   it can read and the base for the rest. The moment of a fight (focus, fury…) isn't written:
   it isn't the build. Pure: no DOM. */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});
  const E = SS.engine || require('./engine.js');

  const VERSION = 1;
  const BASE = E.normalize({});
  const NUMS = ['needle', 'kit', 'pouch', 'masks', 'spools', 'hearts'];

  function encode(state) {
    const st = E.normalize(state);
    const out = ['v=' + VERSION];
    if (st.crest !== BASE.crest) out.push('crest=' + st.crest);
    if (st.crest === 'hunter' && st.hunterStage !== 1) out.push('stage=' + st.hunterStage);
    for (const k of NUMS) if (st[k] !== BASE[k]) out.push(k + '=' + st[k]);
    if (st.tools.length) out.push('tools=' + st.tools.join(','));
    if (st.skill) out.push('skill=' + st.skill);
    const vest = (st.vest.yellow ? 'y' : '') + (st.vest.blue ? 'b' : '');
    if (vest) out.push('vest=' + vest);
    return out.join('&');
  }

  /* The hash's build part ("v=1&crest=…", no leading #) → a build, or null if it has none. */
  function decode(text) {
    const pairs = String(text || '').replace(/^#/, '').split('&').map((p) => p.split('=')).filter((p) => p.length === 2);
    const m = new Map(pairs.map(([k, v]) => [k, decodeURIComponent(v)]));
    if (!m.has('v')) return null;
    const x = { crest: m.get('crest'), hunterStage: m.get('stage'), skill: m.get('skill'),
      tools: (m.get('tools') || '').split(',').filter(Boolean), vest: { yellow: /y/.test(m.get('vest') || ''), blue: /b/.test(m.get('vest') || '') } };
    for (const k of NUMS) if (m.has(k)) x[k] = Number(m.get(k));
    return E.normalize(x);
  }

  SS.codec = { VERSION, encode, decode };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.codec;
})();
