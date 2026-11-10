const { execFileSync } = require('node:child_process');
const { readdirSync, statSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const roots = [join(__dirname, '..', 'public', 'assets', 'js')];
const files = [];

function collect(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) collect(path);
    else if (/\.(?:js|mjs|cjs)$/.test(entry)) files.push(path);
  }
}

roots.forEach(collect);
for (const file of files) {
  // Parsing all browser assets as modules accepts both classic IIFEs and ESM
  // scene files without executing them or needing a DOM.
  execFileSync(process.execPath, ['--input-type=module', '--check'], {
    input: readFileSync(file),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
console.log(`JavaScript syntax OK: ${files.length} files`);
