import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const charsDir = path.join(root, 'src/content/characters');
const wordsDir = path.join(root, 'src/content/words');

function frontmatterMatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { data: {}, body: text };
  const raw = match[1];
  const data = {};
  const lines = raw.split(/\r?\n/);
  let i = 0;
  let currentKey = null;
  let arrayCollect = false;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    if (arrayCollect && /^\s*-\s+/.test(line)) {
      const m = line.match(/^\s*-\s+(.*)$/);
      let val = m ? m[1].trim() : '';
      if (/^["'].*["']$/.test(val)) val = val.slice(1, -1);
      if (currentKey != null) {
        if (!Array.isArray(data[currentKey])) data[currentKey] = [];
        data[currentKey].push(val);
      }
      i++;
      continue;
    } else if (arrayCollect) {
      arrayCollect = false;
      currentKey = null;
    }
    const m = line.match(/^([A-Za-z\u4e00-\u9fa5_][\w]*)\s*:\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    let val = m[2].trim();
    if (val === '') { data[key] = []; currentKey = key; arrayCollect = true; i++; continue; }
    if (/^\d+$/.test(val) && !['pinyin','char','word','definition','traditional','radical','level','structureType','date'].includes(key)) {
      data[key] = Number(val);
    } else if (/^(true|false)$/.test(val)) {
      data[key] = val === 'true';
    } else if (/^["'].*["']$/.test(val)) {
      data[key] = val.slice(1, -1);
    } else if (/^\[.*\]$/.test(val)) {
      try { data[key] = JSON.parse(val); } catch { data[key] = val; }
    } else {
      data[key] = val;
    }
    i++;
  }
  return { data };
}

const charSchema = z.object({
  char: z.string().min(1).max(2),
  pinyin: z.string(),
  definition: z.string(),
  strokes: z.number().int().positive().optional(),
  strokeSequence: z.array(z.enum(['横','竖','撇','点','折'])).optional(),
  radical: z.string().optional(),
  level: z.enum(['一级','二级','三级']).optional(),
  traditional: z.string().optional(),
  relatedChars: z.array(z.string()).default([]),
  date: z.string().optional(),
});
const wordSchema = z.object({
  word: z.string().min(2),
  pinyin: z.string(),
  definition: z.string(),
  structureType: z.enum(['first','last','equal']),
  examples: z.array(z.string()).default([]),
  relatedWords: z.array(z.string()).default([]),
  date: z.string().optional(),
});

let errors = 0;
for (const f of fs.readdirSync(charsDir).filter(x=>x.endsWith('.md'))) {
  const p = path.join(charsDir, f);
  const { data } = frontmatterMatter(fs.readFileSync(p, 'utf8'));
  const r = charSchema.safeParse(data);
  if (!r.success) {
    errors++;
    console.error('CHAR_ERR', f, r.error.issues);
  }
}
for (const f of fs.readdirSync(wordsDir).filter(x=>x.endsWith('.md'))) {
  const p = path.join(wordsDir, f);
  const { data } = frontmatterMatter(fs.readFileSync(p, 'utf8'));
  const r = wordSchema.safeParse(data);
  if (!r.success) {
    errors++;
    console.error('WORD_ERR', f, r.error.issues);
  }
}
const charsTotal = fs.readdirSync(charsDir).filter(x=>x.endsWith('.md')).length;
const wordsTotal = fs.readdirSync(wordsDir).filter(x=>x.endsWith('.md')).length;
console.log(`chars=${charsTotal} words=${wordsTotal} errors=${errors}`);
process.exit(errors ? 1 : 0);
