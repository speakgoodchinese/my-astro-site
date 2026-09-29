import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contentDir = path.resolve(root, 'src/content');
const publicDir = path.resolve(root, 'public');

function frontmatterMatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { data: {}, body: text };
  const raw = match[1];
  const body = text.slice(match[0].length);
  try {
    const data = yaml.load(raw) ?? {};
    return { data: typeof data === 'object' && data !== null ? data : {}, body };
  } catch (e) {
    console.warn('[dict-index] YAML parse failed, falling back to empty object:', e.message);
    return { data: {}, body };
  }
}

function loadCollection(dir, colName) {
  const result = [];
  const colDir = path.join(contentDir, dir);
  if (!fs.existsSync(colDir)) return result;
  const files = fs.readdirSync(colDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  for (const file of files) {
    const full = path.join(colDir, file);
    const text = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
    const { data } = frontmatterMatter(text);
    const id = file.replace(/\.(md|mdx)$/, '');
    result.push({ id, data, collection: colName });
  }
  return result;
}

function buildSerialIndex(chars, words) {
  const byFirstChar = new Map();
  const byLastChar = new Map();
  const byEqualFirstChar = new Map();
  const byEqualLastChar = new Map();
  for (const w of words) {
    const text = w.data.word || '';
    if (!text) continue;
    const first = text.charAt(0);
    const last = text.charAt(text.length - 1);
    const s = w.data.structureType;
    if (s === 'first') {
      if (!byFirstChar.has(first)) byFirstChar.set(first, []);
      byFirstChar.get(first).push(w.id);
    } else if (s === 'last') {
      if (!byLastChar.has(last)) byLastChar.set(last, []);
      byLastChar.get(last).push(w.id);
    } else if (s === 'equal') {
      if (!byEqualFirstChar.has(first)) byEqualFirstChar.set(first, []);
      byEqualFirstChar.get(first).push(w.id);
      if (!byEqualLastChar.has(last)) byEqualLastChar.set(last, []);
      byEqualLastChar.get(last).push(w.id);
    }
  }
  const byFirstCharEntries = [...byFirstChar.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
  const byLastCharEntries = [...byLastChar.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
  const byEqualFirstCharEntries = [...byEqualFirstChar.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
  const byEqualLastCharEntries = [...byEqualLastChar.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
  chars.sort((a, b) => (a.data.char || '').localeCompare(b.data.char || '', 'zh-Hans-CN'));
  words.sort((a, b) => (a.data.word || '').localeCompare(b.data.word || '', 'zh-Hans-CN'));
  function coerceNull(v) { return v === 'null' || v === undefined ? null : v; }
  const allChars = chars.map(c => {
    const cd = c.data || {};
    const hf = cd.headingForm && typeof cd.headingForm === 'object' && !Array.isArray(cd.headingForm) ? cd.headingForm : null;
    const per = cd.peripherals && typeof cd.peripherals === 'object' && !Array.isArray(cd.peripherals) ? cd.peripherals : null;
    const hfStrokes = hf?.strokes ?? (hf?.strokeSequence?.length ?? null);
    const perStrokes = per?.strokes ?? (per?.strokeSequence?.length ?? null);
    return {
      id: c.id,
      char: cd.char,
      pinyin: cd.pinyin,
      definition: cd.definition,
      level: cd.level,
      strokes: cd.strokes ?? (cd.strokeSequence?.length ?? null),
      strokeSequence: Array.isArray(cd.strokeSequence) ? cd.strokeSequence : [],
      semanticCluster: coerceNull(cd.semanticCluster) ?? null,
      headingForm: hf ? {
        glyph: hf.glyph,
        position: hf.position,
        strokes: hfStrokes,
        strokeSequence: Array.isArray(hf.strokeSequence) ? hf.strokeSequence : [],
      } : null,
      peripherals: per ? {
        glyphs: Array.isArray(per.glyphs) ? per.glyphs : [],
        strokes: perStrokes,
        strokeSequence: Array.isArray(per.strokeSequence) ? per.strokeSequence : [],
      } : { glyphs: [], strokes: 0, strokeSequence: [] },
    };
  });
  const allWords = words.map(w => ({
    id: w.id,
    word: w.data.word,
    pinyin: w.data.pinyin,
    definition: w.data.definition,
    structureType: w.data.structureType,
    firstChar: (w.data.word || '').charAt(0),
    lastChar: (w.data.word || '').charAt((w.data.word || '').length - 1),
  }));
  return {
    allChars,
    allWords,
    byFirstCharEntries,
    byLastCharEntries,
    byEqualFirstCharEntries,
    byEqualLastCharEntries,
  };
}

async function main() {
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const chars = loadCollection('characters', 'characters');
  const words = loadCollection('words', 'words');
  const serial = buildSerialIndex(chars, words);
  const outPath = path.join(publicDir, 'dictionary-index.json');
  fs.writeFileSync(outPath, JSON.stringify(serial), 'utf8');
  console.log(`[dict-index] wrote ${outPath}`);
  console.log(`[dict-index] chars=${serial.allChars.length} words=${serial.allWords.length}`);
  console.log(`[dict-index] byFirstChar groups=${serial.byFirstCharEntries.length}`);
  console.log(`[dict-index] byLastChar groups=${serial.byLastCharEntries.length}`);
  console.log(`[dict-index] byEqualFirstChar groups=${serial.byEqualFirstCharEntries.length}`);
  console.log(`[dict-index] byEqualLastChar groups=${serial.byEqualLastCharEntries.length}`);
}

await main();
