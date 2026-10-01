// Shared TypeScript definitions + sort engine for the 部首/偏旁 3-tier dictionary.
// Runs both during Astro SSG (imported directly) and on the client (via <script> blocks
// or type re-declared, same runtime semantics).

export const POSITION_ORDER = ['left', 'right', 'top', 'bottom', 'centre', 'surround'] as const;
export type RadicalPosition = (typeof POSITION_ORDER)[number];

export const POSITION_LABEL: Record<RadicalPosition, string> = {
  left: '左 · Left',
  right: '右 · Right',
  top: '上 · Top',
  bottom: '下 · Bottom',
  centre: '中 · Center',
  surround: '包围 · Surround',
};

export const POSITION_SHORT_CN: Record<RadicalPosition, string> = {
  left: '左边',
  right: '右边',
  top: '上面',
  bottom: '下面',
  centre: '中间',
  surround: '包围',
};

export const STROKE_ORDER: Record<'一' | '丨' | '丿' | '丶' | '𠃊', number> = {
  '一': 1, '丨': 2, '丿': 3, '丶': 4, '𠃊': 5,
};
export type StrokeType = keyof typeof STROKE_ORDER;

export interface HeadingForm {
  glyph: string;
  position: RadicalPosition;
  strokes?: number | null;
  strokeSequence?: StrokeType[];
}

export interface Peripherals {
  glyphs: string[];
  strokes?: number | null;
  strokeSequence?: StrokeType[];
}

export interface SortedCharEntry {
  id: string;
  char: string;
  pinyin: string;
  definition: string;
  level?: string;
  strokes: number | null;
  strokeSequence: StrokeType[];
  semanticCluster: string | null;
  headingForm: HeadingForm | null;
  peripherals: Peripherals;
}

// --- Comparison primitives -------------------------------------------------

export function cmpNum(a: number | null | undefined, b: number | null | undefined): number {
  const av = typeof a === 'number' ? a : Number.POSITIVE_INFINITY;
  const bv = typeof b === 'number' ? b : Number.POSITIVE_INFINITY;
  if (av === bv) return 0;
  return av < bv ? -1 : 1;
}

/** Compare two 5-type stroke sequences (stroke-order primary, length secondary). */
export function cmpStrokeSeq(a?: StrokeType[], b?: StrokeType[]): number {
  const len = Math.min(a?.length ?? 0, b?.length ?? 0);
  for (let i = 0; i < len; i++) {
    const av = STROKE_ORDER[(a as StrokeType[])[i]] ?? 99;
    const bv = STROKE_ORDER[(b as StrokeType[])[i]] ?? 99;
    if (av !== bv) return av - bv;
  }
  return (a?.length ?? 0) - (b?.length ?? 0);
}

export function cmpPosition(aPos?: RadicalPosition | null, bPos?: RadicalPosition | null): number {
  const av = aPos ? POSITION_ORDER.indexOf(aPos) : Number.POSITIVE_INFINITY;
  const bv = bPos ? POSITION_ORDER.indexOf(bPos) : Number.POSITIVE_INFINITY;
  return av - bv;
}

/**
 * The core 3-tier character sort.
 * 1. Undifferentiated first (no semanticCluster) — sub-sort: strokeOrder → strokeCount.
 * 2. Semantic cluster group:
 *    a. Group by semanticCluster string (部)
 *    b. Within cluster: sort by position → heading-form strokes → heading-form strokeSequence.
 *    c. Within each allomorph bucket: sort characters by peripherals strokeSequence → peripheral.strokes.
 */
export function radicalSortCompare(a: SortedCharEntry, b: SortedCharEntry): number {
  const aU = !a.semanticCluster;
  const bU = !b.semanticCluster;
  if (aU && bU) {
    const bySeq = cmpStrokeSeq(a.strokeSequence, b.strokeSequence);
    if (bySeq !== 0) return bySeq;
    return cmpNum(a.strokes, b.strokes);
  }
  if (aU) return -1;
  if (bU) return 1;

  // 2a. Group by semanticCluster → lexical order as a stable tie (so group order is deterministic)
  const cluster = (a.semanticCluster as string).localeCompare(b.semanticCluster as string, 'zh-Hans-CN');
  if (cluster !== 0) return cluster;

  // 2b. Position → headingForm.strokeSequence → headingForm.strokes
  const byPos = cmpPosition(a.headingForm?.position ?? null, b.headingForm?.position ?? null);
  if (byPos !== 0) return byPos;
  const aHF = a.headingForm?.strokeSequence ?? [];
  const bHF = b.headingForm?.strokeSequence ?? [];
  const byHFSeq = cmpStrokeSeq(aHF, bHF);
  if (byHFSeq !== 0) return byHFSeq;
  const byHFStrokes = cmpNum(a.headingForm?.strokes ?? (aHF.length || null), b.headingForm?.strokes ?? (bHF.length || null));
  if (byHFStrokes !== 0) return byHFStrokes;
  // same allomorph glyph → keep order stable by glyph
  const g = (a.headingForm?.glyph ?? '').localeCompare(b.headingForm?.glyph ?? '', 'zh-Hans-CN');
  if (g !== 0) return g;

  // 2c. Peripherals sub-sort: strokeSequence → peripheral.strokes → total-strokes → pinyin
  const aPerSeq = a.peripherals.strokeSequence ?? [];
  const bPerSeq = b.peripherals.strokeSequence ?? [];
  const byPerSeq = cmpStrokeSeq(aPerSeq, bPerSeq);
  if (byPerSeq !== 0) return byPerSeq;
  const byPerStrokes = cmpNum(a.peripherals.strokes ?? (aPerSeq.length || null), b.peripherals.strokes ?? (bPerSeq.length || null));
  if (byPerStrokes !== 0) return byPerStrokes;
  const byTotal = cmpNum(a.strokes, b.strokes);
  if (byTotal !== 0) return byTotal;
  return a.pinyin.localeCompare(b.pinyin, 'zh-Hans-CN');
}

export function sortCharacters(list: SortedCharEntry[]): SortedCharEntry[] {
  return list.slice().sort(radicalSortCompare);
}

// --- Grouped rendering output ------------------------------------------------

export interface AllomorphGroup {
  headingForm: HeadingForm;
  characters: SortedCharEntry[];
}
export interface ClusterGroup {
  semanticCluster: string;
  allomorphs: AllomorphGroup[];
}
export interface RadicalGrouped {
  undifferentiated: SortedCharEntry[];
  clusters: ClusterGroup[];
}

/** Build a 3-level structure for rendering, preserving sort order at every level. */
export function groupByRadicalHierarchy(list: SortedCharEntry[]): RadicalGrouped {
  const sorted = sortCharacters(list);
  const undifferentiated = sorted.filter(c => !c.semanticCluster);
  const clusterMap = new Map<string, Map<string, AllomorphGroup>>();
  for (const c of sorted) {
    if (!c.semanticCluster) continue;
    const hf = c.headingForm ?? { glyph: c.char, position: 'centre' as RadicalPosition, strokes: c.strokes ?? null, strokeSequence: c.strokeSequence };
    const key = `${hf.position}|${hf.glyph}`;
    if (!clusterMap.has(c.semanticCluster)) clusterMap.set(c.semanticCluster, new Map());
    const clusterBuckets = clusterMap.get(c.semanticCluster) as Map<string, AllomorphGroup>;
    if (!clusterBuckets.has(key)) {
      clusterBuckets.set(key, { headingForm: hf, characters: [] });
    }
    clusterBuckets.get(key)!.characters.push(c);
  }
  const clusters: ClusterGroup[] = [...clusterMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'zh-Hans-CN'))
    .map(([semanticCluster, m]) => {
      const allomorphs = [...m.values()].sort((x, y) => {
        const byP = cmpPosition(x.headingForm.position, y.headingForm.position);
        if (byP !== 0) return byP;
        const byS = cmpStrokeSeq(x.headingForm.strokeSequence ?? [], y.headingForm.strokeSequence ?? []);
        if (byS !== 0) return byS;
        return cmpNum(x.headingForm.strokes ?? (x.headingForm.strokeSequence?.length || null), y.headingForm.strokes ?? (y.headingForm.strokeSequence?.length || null));
      });
      return { semanticCluster, allomorphs };
    });
  return { undifferentiated, clusters };
}

// --- Filtering helpers for the 部首/偏旁检索 UI --------------------------------

/** Match predicate: position (if set) → allomorph glyph (if set) → peripheral stroke prefix. */
export function charMatchesFilter(
  c: SortedCharEntry,
  opts: { position?: RadicalPosition | null; semanticCluster?: string | null; headingGlyph?: string | null; peripheralPrefix?: StrokeType[] }
): boolean {
  if (opts.position) {
    if (c.headingForm?.position !== opts.position) return false;
  }
  if (opts.semanticCluster) {
    if (c.semanticCluster !== opts.semanticCluster) return false;
  }
  if (opts.headingGlyph) {
    if (c.headingForm?.glyph !== opts.headingGlyph) return false;
  }
  if (opts.peripheralPrefix && opts.peripheralPrefix.length > 0) {
    const perSeq = c.peripherals.strokeSequence ?? [];
    if (perSeq.length < opts.peripheralPrefix.length) return false;
    for (let i = 0; i < opts.peripheralPrefix.length; i++) {
      if (opts.peripheralPrefix[i] === '通配' as StrokeType) continue;
      if (perSeq[i] !== opts.peripheralPrefix[i]) return false;
    }
  }
  return true;
}
