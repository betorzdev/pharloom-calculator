/* tools/emit.js — writes a generated data file: a header comment, then the values as readable
   JavaScript (short objects and number lists on one line, the rest one key per line), assigned
   inside the file's IIFE. Shared by the tools/gen-*.js generators. */
'use strict';
const fs = require('fs');

const KEY = /^[A-Za-z_$][\w$]*$/;
const WIDTH = 100;
const str = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";

function lit(v, indent) {
  if (v === undefined) return 'undefined';
  if (v === null || typeof v !== 'object') return typeof v === 'string' ? str(v) : String(v);
  const pad = '  '.repeat(indent + 1), end = '  '.repeat(indent);
  const inner = Array.isArray(v)
    ? v.map((x) => lit(x, indent + 1))
    : Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => (KEY.test(k) ? k : str(k)) + ': ' + lit(x, indent + 1));
  const [open, close] = Array.isArray(v) ? ['[', ']'] : ['{ ', ' }'];
  const flat = Array.isArray(v) ? '[' + inner.join(', ') + ']' : (inner.length ? open + inner.join(', ') + close : '{}');
  if (!flat.includes('\n') && flat.length + indent * 2 <= WIDTH) return flat;
  return open.trim() + '\n' + inner.map((s) => pad + s).join(',\n') + ',\n' + end + close.trim();
}

/* file: where; header: the comment's text (without the delimiters); ns: the SS key;
   parts: [[NAME, value], …] in order. */
function write(file, header, ns, parts) {
  const body = parts.map(([name, v]) => `  const ${name} = ${lit(v, 1)};`).join('\n\n');
  const names = parts.map(([n]) => n).join(', ');
  const src = `/* ${header.trim()} */
(() => {
  'use strict';
  const SS = globalThis.SS || (globalThis.SS = {});

${body}

  SS.${ns} = { ${names} };
  if (typeof module !== 'undefined' && module.exports) module.exports = SS.${ns};
})();
`;
  fs.writeFileSync(file, src);
  return src.length;
}

module.exports = { lit, write };
