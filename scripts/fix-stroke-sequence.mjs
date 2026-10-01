import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const charsDir = path.join(root, 'src/content/characters');

const VALID = new Set(['一', '丨', '丿', '丶', '𠃊']);
// Stroke class lookup for 5-type model — cover common multi-character stroke names.
// 横→横 | 提→横 | 竖→竖 | 竖钩→竖 | 撇→撇 | 点→点 | 捺→点 | 其它含折/钩→折
const CLASS_MAP = {
  '一': '一', '㇀': '一',
  '丨': '丨', '亅': '丨',
  '丿': '丿',
  '丶': '丶', '㇏': '丶',
};

function classify(s) {
  if (!s) return '折';
  if (CLASS_MAP[s]) return CLASS_MAP[s];
  // Any compound stroke with 折/钩 → 折; otherwise default → 折
  return '𠃊';
}

let fixed = 0, dropped = 0;
for (const f of fs.readdirSync(charsDir).filter(x => x.endsWith('.md'))) {
  const p = path.join(charsDir, f);
  const txt = fs.readFileSync(p, 'utf8');
  const m = txt.match(/^strokeSequence:\s*(\[[^\]]*\])\s*$/m);
  if (!m) continue;
  let seq;
  try { seq = JSON.parse(m[1]); } catch { continue; }
  if (!Array.isArray(seq)) continue;
  let ok = true, mapped = [];
  for (const s of seq) {
    if (VALID.has(s)) { mapped.push(s); continue; }
    ok = false;
    const c = classify(s);
    mapped.push(c);
  }
  const allValid = mapped.every(s => VALID.has(s));
  if (!ok && allValid) {
    const replacement = 'strokeSequence: ' + JSON.stringify(mapped);
    const newTxt = txt.replace(m[0], replacement);
    fs.writeFileSync(p, newTxt, 'utf8');
    fixed++;
  } else if (!ok) {
    // drop the field entirely if any mapping went wrong
    const newTxt = txt.replace(/^strokeSequence:\s*(\[[^\]]*\])\s*$\r?\n?/m, '');
    fs.writeFileSync(p, newTxt, 'utf8');
    dropped++;
  }
}
console.log(`fixed=${fixed} dropped=${dropped}`);
