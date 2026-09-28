# Chinese Dictionary Integration - Implementation Plan

## Task 1: Add dictionary content collection schemas to content.config.ts
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Add `characters` collection (loader: glob `src/content/characters/**/*.{md,mdx}`) with Zod schema: required `char`, `pinyin`, `definition`; optional: `strokes`, `radical`, `level`, `traditional`, `relatedChars`, `date`.
  - Add `words` collection (loader: glob `src/content/words/**/*.{md,mdx}`) with Zod schema: required `word`, `pinyin`, `definition`, `structureType: z.enum(['first','last'])`; optional: `examples`, `relatedWords`, `date`.
  - Export in `collections` object.
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `rule` TR-1.1: Running `astro check` (or TS diagnostics) reports no errors for the updated [content.config.ts](file:///C:/Projects/astro-site/src/content.config.ts). Evidence: `GetDiagnostics` + build step output.
  - `rule` TR-1.2: Zod rejects a word entry missing `structureType` and a character entry missing `char`. Evidence: manual code review of schema + validation error reproduction via sample file if possible; otherwise schema inspection.
- **Notes**: None

## Task 2: Seed sample character (字) MDX entries and scaffold folders
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Create `src/content/characters/` folder.
  - Add ~15-25 sample character MDX files (including 道, 德, 仁, 学, 语, 言, 山, 水, 人, 心, 天, 地, 大, 小, 中, 国, 家, 风, 花, 雪, 月) covering the required frontmatter fields, to exercise rendering and indexing.
- **Acceptance Criteria Addressed**: AC-1, AC-3
- **Test Requirements**:
  - `rule` TR-2.1: At least one character file exists; its frontmatter parses with the schema. Evidence: `astro build` succeeds generating `/characters/<slug>.html`.
  - `rubric` TR-2.2: Sample coverage; scale 1-5; anchors 1=0 chars, 3=5 chars, 5>=15 chars covering diverse radicals/levels; threshold >=4. Evidence: directory listing.

## Task 3: Seed sample word (词) MDX entries with both 首重 and 尾重 structureType
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Create `src/content/words/` folder.
  - Add ~20-30 sample word MDX entries.
  - Ensure every 首重 (first) word's `word` starts with a character that also exists in the `characters` collection sample.
  - Ensure every 尾重 (last) word's `word` ends with a character that also exists in the `characters` collection sample.
  - Include both structure types at least 10 each.
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `rule` TR-3.1: Build succeeds generating `/words/<slug>.html` for each sample word. Evidence: build output.
  - `rule` TR-3.2: At least 10 `first` and 10 `last` structureType samples exist and at least one character C anchors one W1(first) starting with C and one W2(last) ending with C. Evidence: content listing + content grep.

## Task 4: Build dual-index grouping utility
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2, Task 3
- **Description**:
  - Create `src/utils/dictionaryIndex.ts`.
  - Export functions:
    - `buildDualIndex(characters, words)` returning `{ byFirstChar: Map<char, Word[]>, byLastChar: Map<char, Word[]>, allChars, allWords }` where `byFirstChar` only includes words with `structureType==='first'` keyed by first character; `byLastChar` only includes words with `structureType==='last'` keyed by last character.
    - `getWordsForChar(char, dualIndex)` returning `{ firstLeaners: Word[], lastLeaners: Word[] }`.
  - Also emit a serializable static JSON to `public/dictionary-index.json` (build-time script under `scripts/` if needed, or computed on-demand at request time for SSRable pages). Prefer a build-time Node script that writes `public/dictionary-index.json` during `npm run prebuild` / `astro build` hook, so search page can fetch it lazily.
- **Acceptance Criteria Addressed**: AC-3, AC-5
- **Test Requirements**:
  - `rule` TR-4.1: Unit behavior via node REPL: for the sample C/W1/W2, `buildDualIndex(...).byFirstChar.get(C)` contains W1; `byLastChar.get(C)` contains W2. Evidence: snippet + build-time validation.
  - `rule` TR-4.2: After build, `public/dictionary-index.json` exists and is valid JSON parseable by browser. Evidence: file exists + JSON.parse succeeds in test.

## Task 5: Create character detail page `/characters/[id]`
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - Add `src/pages/characters/[id].astro`.
  - Use `getCollection('characters')` + `getStaticPaths`.
  - Render character, pinyin, definition, MDX body, strokes/radical/level metadata if present.
  - Use `buildDualIndex` to display two sections:
    - 首重 词组 (Words anchored by this character as first)
    - 尾重 词组 (Words anchored by this character as last)
    - Each item links to `/words/<wordId>`.
  - Layout via existing [Layout.astro](file:///C:/Projects/astro-site/src/layouts/Layout.astro).
- **Acceptance Criteria Addressed**: AC-1, AC-3
- **Test Requirements**:
  - `rule` TR-5.1: Character page exists for sample character C and renders the correct two lists with W1/W2. Evidence: HTML snippet.
  - `rubric` TR-5.2: Layout polish matching site aesthetic; scale 1-5; threshold >=4. Evidence: screenshot.

## Task 6: Create word detail page `/words/[id]`
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - Add `src/pages/words/[id].astro`.
  - Use `getCollection('words')` + `getStaticPaths`.
  - Render word, pinyin, definition, a 首重/尾重 badge corresponding to `structureType`, examples if present, and MDX body.
  - Render links to anchor character(s): if `first` -> link first char `/characters/<firstChar>`; if `last` -> link last char.
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `rule` TR-6.1: Word page renders visible structureType and a link back to the anchor character page. Evidence: HTML snippet.
  - `rule` TR-6.2: All sample words have generated pages. Evidence: build output.

## Task 7: Dictionary browse page `/dictionary` with tabs/lens toggle
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4, Task 5, Task 6
- **Description**:
  - Add `src/pages/dictionary.astro`.
  - Include two top tabs: 字 (Characters) / 词 (Words).
  - Inside 词 tab add a toggle/segmented control: 首重 / 尾重 / 全部.
  - Render grouped lists: Characters list alphabetically or by radical (just a simple list of links to `/characters/<id>`); Words under 首重 grouped by first character header; under 尾重 grouped by last character header.
  - Do NOT inline all entry bodies; only titles + links (keep HTML small per AC-9).
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-7.1: Tabs render; 词 tab has toggle; switching shows correct groupings. Evidence: browser snapshot.
  - `rubric` TR-7.2: Visual polish and responsiveness; scale 1-5; threshold >=4. Evidence: screenshot.

## Task 8: Client-side lazy search component using MiniSearch (or Fuse.js)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4, Task 7
- **Description**:
  - Install `minisearch` (or `fuse.js`) via npm and add to `package.json`.
  - Create `src/components/DictionarySearch.astro` as an island with a script that:
    - On first focus/keystroke in the search input, dynamically imports the search library and fetches `/dictionary-index.json`.
    - Builds an in-memory MiniSearch/Fuse index over `{ type, id, char|word, pinyin, definition, structureType? }`.
    - Renders results grouped by type, linking to `/characters/<id>` or `/words/<id>`.
    - Styled with Tailwind.
  - Embed this component on `/dictionary`.
- **Acceptance Criteria Addressed**: AC-5, AC-7, AC-9
- **Test Requirements**:
  - `rule` TR-8.1: Initial SSR HTML of `/dictionary` does not contain a stringified dictionary data array; network requests after first interaction include `minisearch` chunk and `dictionary-index.json`. Evidence: DevTools net log + source grep.
  - `rule` TR-8.2: Typing a known character/word/pinyin returns the expected result with a correct href. Evidence: DOM snapshot.
  - `rubric` TR-8.3: UI quality; scale 1-5; threshold >=4. Evidence: screenshot.

## Task 9: Update remark-wiki-links plugin to resolve 字 / 词 dictionary routes
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2, Task 3
- **Description**:
  - Update [remark-wiki-links.js](file:///C:/Projects/astro-site/src/plugins/remark-wiki-links.js) `buildWikiMap()` to scan `src/content/characters/*.{md,mdx}` and `src/content/words/*.{md,mdx}`, mapping:
    - `char` frontmatter -> `/characters/<slug>`
    - `word` frontmatter -> `/words/<slug>`
    - Also by filename slug.
  - Precedence: exact title/char/word match over existing heuristics. Avoid breaking existing `terms`/`propositions`/`posts` links.
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-9.1: A blog post containing `[[道]]` and `[[大道]]` renders with hrefs `/characters/道` and `/words/大道` (assuming entries exist). Evidence: rendered HTML snippet.
  - `rule` TR-9.2: Existing links to terms/propositions still resolve correctly. Evidence: existing sample term `[[道]]` maps if it's a term too; else at least one `[[related proposition]]` in a sample post still links to `/propositions/...`.

## Task 10: Update Layout navigation and site references (optional link in header/sidebar)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 7
- **Description**:
  - Add a link "Dictionary 字典" in the top nav of [Layout.astro](file:///C:/Projects/astro-site/src/layouts/Layout.astro) pointing to `/dictionary`.
- **Acceptance Criteria Addressed**: AC-7 (usability)
- **Test Requirements**:
  - `rule` TR-10.1: Top nav contains a visible link to `/dictionary`. Evidence: snapshot.
  - `rubric` TR-10.2: Consistency with existing nav styling; threshold >=4.

## Task 11: Wire dictionary index build into the build pipeline
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - Create `scripts/build-dictionary-index.mjs` that reads the content files, runs `buildDualIndex`, and writes the serializable portion to `public/dictionary-index.json`.
  - Add a `prebuild` script in `package.json`: `node scripts/build-dictionary-index.mjs`.
  - Ensure the script runs with the current working directory set correctly and uses ESM imports.
- **Acceptance Criteria Addressed**: AC-5, AC-8
- **Test Requirements**:
  - `rule` TR-11.1: `npm run build` (or `astro build`) first produces `public/dictionary-index.json` with non-empty arrays for `allChars` and `allWords` and map structures `byFirstCharEntries` / `byLastCharEntries`. Evidence: build output + file inspection.

## Task 12: Build, diagnostics, and final verification
- **Status**: `pending`
- **Priority**: high
- **Depends On**: All prior tasks
- **Description**:
  - Run `astro build` and confirm exit 0.
  - Run `GetDiagnostics` to check TS/lint errors.
  - Compare homepage HTML size to verify AC-9.
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-12.1: `astro build` exits code 0. Evidence: command output.
  - `rule` TR-12.2: `GetDiagnostics` returns zero errors in new/modified files. Evidence: diagnostics output.
  - `rule` TR-12.3: Homepage HTML does NOT contain a JSON blob of length > 50kb0 for dictionary data (small inline references allowed, but not the full index). Evidence: source scan + file size.
