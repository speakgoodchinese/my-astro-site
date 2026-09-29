import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const charsDir = path.join(root, 'src/content/characters');

function readBlock(txt) {
  const m = txt.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(\r?\n?)/);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length, inner: m[1], trailing: m[2] ?? '' };
}

function cleanupInner(inner) {
  const lines = inner.split('\n');
  const out = [];
  let inObject = false;
  let parentIndent = -1;
  for (const raw of lines) {
    const indentMatch = raw.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const trimmed = raw.trim();
    if (indent === 0) {
      if (/^\S+:\s*$/.test(trimmed) || /^\S+:\s*#/.test(trimmed)) {
        inObject = true;
        parentIndent = 0;
      } else if (/^\S+:/.test(trimmed)) {
        inObject = false;
        parentIndent = -1;
      } else if (trimmed === '') {
      }
      out.push(raw);
    } else if (indent > 0) {
      if (inObject && indent > parentIndent) {
        out.push(raw);
      } else {
        if (inObject && indent <= parentIndent) {
          inObject = false;
          parentIndent = -1;
        }
      }
    } else {
      out.push(raw);
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}

const files = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
let changed = 0, skipped = 0;
for (const f of files) {
  const p = path.join(charsDir, f);
  const txt = fs.readFileSync(p, 'utf8');
  const block = readBlock(txt);
  if (!block) { skipped++; continue; }
  const newInner = cleanupInner(block.inner);
  if (newInner === block.inner) { skipped++; continue; }
  const newBlock = '---\n' + newInner + (newInner.endsWith('\n') ? '' : '\n') + '---' + (block.trailing || '\n');
  const newTxt = txt.slice(0, block.start) + newBlock + txt.slice(block.end);
  fs.writeFileSync(p, newTxt, 'utf8');
  changed++;
}
console.log(`files=${files.length} changed=${changed} skipped=${skipped}`);
