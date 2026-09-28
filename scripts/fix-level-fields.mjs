import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const charsDir = path.join(root, 'src/content/characters');

const LEVEL_MAP = {
  '一': '一级',
  '二': '二级',
  '三': '三级',
  '1': '一级',
  '2': '二级',
  '3': '三级',
};

let n = 0;
for (const f of fs.readdirSync(charsDir).filter(x => x.endsWith('.md'))) {
  const p = path.join(charsDir, f);
  const txt = fs.readFileSync(p, 'utf8');
  const repl = txt.replace(/^level:\s*"([^"]*)"\s*$/m, (_m, l) => {
    const normalized = LEVEL_MAP[l] || l;
    const valid = new Set(['一级', '二级', '三级']);
    const v = valid.has(normalized) ? normalized : '一级';
    if (v !== l) n++;
    return `level: "${v}"`;
  });
  if (repl !== txt) fs.writeFileSync(p, repl);
}
console.log(`fixed ${n} char files with bad level field`);
