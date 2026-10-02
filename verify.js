// Dev-only verification script: ensures every $('#id') referenced in app.js exists in index.html.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

const ids = [...new Set([...js.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map((m) => m[1]))];
const missing = ids.filter((id) => !html.includes(`id="${id}"`));

console.log(`referenced ids: ${ids.length}`);
console.log(missing.length ? `MISSING: ${missing.join(', ')}` : 'ALL IDS PRESENT');

const classSel = [...new Set([...js.matchAll(/\$\$?\('\.([A-Za-z0-9_-]+)/g)].map((m) => m[1]))];
const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
const missingCss = classSel.filter((c) => !html.includes(`class="${c}`) && !css.includes(`.${c}`));
console.log(missingCss.length ? `CSS/HTML classes not found: ${missingCss.join(', ')}` : 'ALL CLASS TARGETS OK');

process.exit(missing.length ? 1 : 0);
