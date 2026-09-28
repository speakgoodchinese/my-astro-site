import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contentDir = path.resolve(root, 'src/content');
const publicDir = path.resolve(root, 'public');

function frontmatterMatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { data: {}, body: text };
  const raw = match[1];
  const body = text.slice(match[0].length);
  const data = {};
  const lines = raw.split(/\r?\n/);
  let i = 0;
  let currentKey = null;
  let arrayCollect = false;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }
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
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    let val = m[2].trim();
    if (val === '') {
      data[key] = [];
      currentKey = key;
      arrayCollect = true;
      i++;
      continue;
    }
    if (/^\d+$/.test(val) && key !== 'pinyin' && key !== 'char' && key !== 'word' && key !== 'definition' && key !== 'traditional' && key !== 'radical' && key !== 'level' && key !== 'structureType' && key !== 'date') {
      data[key] = Number(val);
    } else if (/^(true|false)$/.test(val)) {
      data[key] = val === 'true';
    } else if (/^["'].*["']$/.test(val)) {
      data[key] = val.slice(1, -1);
    } else if (/^\[.*\]$/.test(val)) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = val;
      }
    } else {
      data[key] = val;
    }
    i++;
  }
  return { data, body };
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
  const allChars = chars.map(c => ({
    id: c.id,
    char: c.data.char,
    pinyin: c.data.pinyin,
    definition: c.data.definition,
    level: c.data.level,
    strokeSequence: c.data.strokeSequence,
  }));
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
