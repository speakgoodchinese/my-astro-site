export type StructureType = 'first' | 'last' | 'equal';
export type StrokeType = '一' | '丨' | '丿' | '丶' | '𠃊' | '通配';

export interface CharacterData {
  char: string;
  pinyin: string;
  definition: string;
  strokes?: number;
  strokeSequence?: StrokeType[];
  radical?: string;
  level?: '一级' | '二级' | '三级';
  traditional?: string;
  relatedChars?: string[];
  date?: string;
}

export interface WordData {
  word: string;
  pinyin: string;
  definition: string;
  structureType: StructureType;
  examples?: string[];
  relatedWords?: string[];
  date?: string;
}

export interface CollectionEntryLike<T> {
  id: string;
  data: T;
  collection?: string;
  body?: string;
  slug?: string;
}

export interface SerializableWordIndexEntry {
  id: string;
  word: string;
  pinyin: string;
  definition: string;
  structureType: StructureType;
  firstChar: string;
  lastChar: string;
}

export interface SerializableCharIndexEntry {
  id: string;
  char: string;
  pinyin: string;
  definition: string;
  level?: string;
  strokeSequence?: StrokeType[];
}

export interface SerializableDualIndex {
  allChars: SerializableCharIndexEntry[];
  allWords: SerializableWordIndexEntry[];
  byFirstCharEntries: Array<[string, string[]]>;
  byLastCharEntries: Array<[string, string[]]>;
  byEqualFirstCharEntries: Array<[string, string[]]>;
  byEqualLastCharEntries: Array<[string, string[]]>;
}

export interface DualIndex {
  byFirstChar: Map<string, CollectionEntryLike<WordData>[]>;
  byLastChar: Map<string, CollectionEntryLike<WordData>[]>;
  byEqualFirstChar: Map<string, CollectionEntryLike<WordData>[]>;
  byEqualLastChar: Map<string, CollectionEntryLike<WordData>[]>;
  allChars: CollectionEntryLike<CharacterData>[];
  allWords: CollectionEntryLike<WordData>[];
}

export function buildDualIndex(
  characters: CollectionEntryLike<CharacterData>[],
  words: CollectionEntryLike<WordData>[],
): DualIndex {
  const byFirstChar = new Map<string, CollectionEntryLike<WordData>[]>();
  const byLastChar = new Map<string, CollectionEntryLike<WordData>[]>();
  const byEqualFirstChar = new Map<string, CollectionEntryLike<WordData>[]>();
  const byEqualLastChar = new Map<string, CollectionEntryLike<WordData>[]>();

  for (const w of words) {
    const text = w.data.word;
    if (!text) continue;
    const first = text.charAt(0);
    const last = text.charAt(text.length - 1);
    if (w.data.structureType === 'first') {
      if (!byFirstChar.has(first)) byFirstChar.set(first, []);
      byFirstChar.get(first)!.push(w);
    } else if (w.data.structureType === 'last') {
      if (!byLastChar.has(last)) byLastChar.set(last, []);
      byLastChar.get(last)!.push(w);
    } else if (w.data.structureType === 'equal') {
      if (!byEqualFirstChar.has(first)) byEqualFirstChar.set(first, []);
      byEqualFirstChar.get(first)!.push(w);
      if (!byEqualLastChar.has(last)) byEqualLastChar.set(last, []);
      byEqualLastChar.get(last)!.push(w);
    }
  }

  for (const [, arr] of byFirstChar) {
    arr.sort((a, b) => a.data.word.localeCompare(b.data.word, 'zh-Hans-CN'));
  }
  for (const [, arr] of byLastChar) {
    arr.sort((a, b) => a.data.word.localeCompare(b.data.word, 'zh-Hans-CN'));
  }
  for (const [, arr] of byEqualFirstChar) {
    arr.sort((a, b) => a.data.word.localeCompare(b.data.word, 'zh-Hans-CN'));
  }
  for (const [, arr] of byEqualLastChar) {
    arr.sort((a, b) => a.data.word.localeCompare(b.data.word, 'zh-Hans-CN'));
  }

  return {
    byFirstChar,
    byLastChar,
    byEqualFirstChar,
    byEqualLastChar,
    allChars: [...characters].sort((a, b) => a.data.char.localeCompare(b.data.char, 'zh-Hans-CN')),
    allWords: [...words].sort((a, b) => a.data.word.localeCompare(b.data.word, 'zh-Hans-CN')),
  };
}

export function getWordsForChar(
  char: string,
  dualIndex: DualIndex,
): { firstLeaners: CollectionEntryLike<WordData>[]; lastLeaners: CollectionEntryLike<WordData>[]; equalWords: CollectionEntryLike<WordData>[] } {
  const equalFirst = dualIndex.byEqualFirstChar.get(char) ?? [];
  const equalLast = dualIndex.byEqualLastChar.get(char) ?? [];
  const seen = new Set<string>();
  const equalWords: CollectionEntryLike<WordData>[] = [];
  for (const w of [...equalFirst, ...equalLast]) {
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    equalWords.push(w);
  }
  equalWords.sort((a, b) => a.data.word.localeCompare(b.data.word, 'zh-Hans-CN'));
  return {
    firstLeaners: dualIndex.byFirstChar.get(char) ?? [],
    lastLeaners: dualIndex.byLastChar.get(char) ?? [],
    equalWords,
  };
}

export function toSerializableIndex(dualIndex: DualIndex): SerializableDualIndex {
  const byFirstCharEntries: Array<[string, string[]]> = [];
  const byLastCharEntries: Array<[string, string[]]> = [];
  const byEqualFirstCharEntries: Array<[string, string[]]> = [];
  const byEqualLastCharEntries: Array<[string, string[]]> = [];
  for (const [ch, arr] of dualIndex.byFirstChar) {
    byFirstCharEntries.push([ch, arr.map(w => w.id)]);
  }
  for (const [ch, arr] of dualIndex.byLastChar) {
    byLastCharEntries.push([ch, arr.map(w => w.id)]);
  }
  for (const [ch, arr] of dualIndex.byEqualFirstChar) {
    byEqualFirstCharEntries.push([ch, arr.map(w => w.id)]);
  }
  for (const [ch, arr] of dualIndex.byEqualLastChar) {
    byEqualLastCharEntries.push([ch, arr.map(w => w.id)]);
  }
  byFirstCharEntries.sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
  byLastCharEntries.sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
  byEqualFirstCharEntries.sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));
  byEqualLastCharEntries.sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'));

  return {
    allChars: dualIndex.allChars.map(c => ({
      id: c.id,
      char: c.data.char,
      pinyin: c.data.pinyin,
      definition: c.data.definition,
      level: c.data.level,
      strokeSequence: c.data.strokeSequence,
    })),
    allWords: dualIndex.allWords.map(w => ({
      id: w.id,
      word: w.data.word,
      pinyin: w.data.pinyin,
      definition: w.data.definition,
      structureType: w.data.structureType,
      firstChar: w.data.word.charAt(0),
      lastChar: w.data.word.charAt(w.data.word.length - 1),
    })),
    byFirstCharEntries,
    byLastCharEntries,
    byEqualFirstCharEntries,
    byEqualLastCharEntries,
  };
}

export function fromSerializableIndex(
  serial: SerializableDualIndex,
): {
  serial: SerializableDualIndex;
  byFirstCharIds: Map<string, string[]>;
  byLastCharIds: Map<string, string[]>;
  byEqualFirstCharIds: Map<string, string[]>;
  byEqualLastCharIds: Map<string, string[]>;
  charsById: Map<string, SerializableCharIndexEntry>;
  wordsById: Map<string, SerializableWordIndexEntry>;
} {
  const byFirstCharIds = new Map(serial.byFirstCharEntries);
  const byLastCharIds = new Map(serial.byLastCharEntries);
  const byEqualFirstCharIds = new Map(serial.byEqualFirstCharEntries ?? []);
  const byEqualLastCharIds = new Map(serial.byEqualLastCharEntries ?? []);
  const charsById = new Map(serial.allChars.map(c => [c.id, c]));
  const wordsById = new Map(serial.allWords.map(w => [w.id, w]));
  return { serial, byFirstCharIds, byLastCharIds, byEqualFirstCharIds, byEqualLastCharIds, charsById, wordsById };
}

export const STROKE_META: Record<Exclude<StrokeType, '通配'>, { symbol: string; label: string; color: string; qwertyZone: string }> = {
  一: { symbol: '一', label: '一 Héng Horizontal', color: 'jade', qwertyZone: 'QWERT' },
  丨: { symbol: '丨', label: '丨 Shù Vertical', color: 'sky', qwertyZone: 'YUIOP' },
  丿: { symbol: '丿', label: '丿 Piě Left-falling', color: 'violet', qwertyZone: 'HJKL' },
  丶: { symbol: '丶', label: '丶 Diǎn Dot / Right-falling', color: 'cinnabar', qwertyZone: 'ASDFG' },
  𠃊: { symbol: '𠃊', label: '𠃊 Zhé Turn / Bend', color: 'amber', qwertyZone: 'ZXCVBNM' },
};

export function charToStroke(ch: string): StrokeType | null {
  const upper = ch.toUpperCase();
  if ('QWERT'.includes(upper)) return '一';
  if ('YUIOP'.includes(upper)) return '丨';
  if ('ASDFG'.includes(upper)) return '丿';
  if ('HJKL'.includes(upper)) return '丶';
  if ('ZXCVBNM'.includes(upper)) return '𠃊';
  if ('*?'.includes(upper)) return '通配';
  return null;
}

export function filterCharsByStrokePrefix(
  chars: Array<SerializableCharIndexEntry | { id: string; char: string; strokeSequence?: StrokeType[] }>,
  prefix: StrokeType[],
): { id: string; char: string; strokeSequence?: StrokeType[] }[] {
  if (prefix.length === 0) {
    return chars.map((c) => ({ id: (c as any).id, char: (c as any).char, strokeSequence: (c as any).strokeSequence }));
  }
  const result: { id: string; char: string; strokeSequence?: StrokeType[] }[] = [];
  for (const c of chars) {
    const seq = (c as any).strokeSequence;
    if (!seq || !Array.isArray(seq) || seq.length < prefix.length) continue;
    let ok = true;
    for (let i = 0; i < prefix.length; i++) {
      const s = prefix[i];
      if (s === '通配') continue;
      if (seq[i] !== s) { ok = false; break; }
    }
    if (ok) result.push({ id: (c as any).id, char: (c as any).char, strokeSequence: seq });
  }
  return result;
}
