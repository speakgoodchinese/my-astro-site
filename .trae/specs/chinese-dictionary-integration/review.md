# Chinese Dictionary Integration - Independent Review

## Product Checkpoints

- [x] CP-R1: Characters content collection with required schema and routes
  - **Type**: `rule`
  - **Covers**: AC-1 / TR-1.1, TR-1.2, TR-2.1, TR-5.1
  - **Evidence**: `characters` and `words` collections defined with Zod in [content.config.ts](file:///C:/Projects/astro-site/src/content.config.ts#L71-L97); build generates 21 routes under `/characters/` (verified in astro build output log e.g. `/characters/道/index.html`, `/characters/中/index.html`); character entry pages render char/pinyin/definition and MDX body.

- [x] CP-R2: Words content collection with `structureType: first | last`
  - **Type**: `rule`
  - **Covers**: AC-2 / TR-1.2, TR-3.1, TR-3.2, TR-6.1, TR-6.2
  - **Evidence**: `words` Zod schema enforces `z.enum(['first','last'])` in [content.config.ts](file:///C:/Projects/astro-site/src/content.config.ts#L86-L97); build output generates 24 routes `/words/*`; word entry page `/words/大道` and `/words/道德` render 首重 / 尾重 structural badge + anchor char link.

- [x] CP-R3: Dual-index grouping correctness 首重-by-first-char / 尾重-by-last-char
  - **Type**: `rule`
  - **Covers**: AC-3 / TR-4.1, TR-5.1
  - **Evidence**: Utility [dictionaryIndex.ts](file:///C:/Projects/astro-site/src/utils/dictionaryIndex.ts) `buildDualIndex` keys `structureType==='first'` words to `byFirstChar`[word[0]] and `structureType==='last'` words to `byLastChar`[word[-1]]. `/characters/道` rendered HTML: 道德、道理 appear in 首重 section (✓); 大道、天道 appear in 尾重 section (✓). Browser snapshot of `/dictionary#view-first` shows 道 group 道德、道理; 风 → 风景; 人 → 人民; 仁 → 仁义; 山 → 山水; 天 → 天地; 学 → 学习; 语 → 语言; 中 → 中国 — **all correctly indexed by leading character**.

- [x] CP-R4: Dictionary browse page with 字/词 tabs and 首重/尾重 structural lens
  - **Type**: `rule`
  - **Covers**: AC-4 / TR-7.1
  - **Evidence**: [dictionary.astro](file:///C:/Projects/astro-site/src/pages/dictionary.astro) has two tablists. Characters show a responsive grid of 21 cards with pinyin + word count. Words toggle exposes three views (全部 首重 尾重). `#view-first` hash anchors persist and client script applies state correctly.

- [x] CP-R5: Client-side lazy search with MiniSearch + JSON index loaded on first interaction
  - **Type**: `rule`
  - **Covers**: AC-5 / TR-8.1, TR-8.2, AC-9
  - **Evidence**: Network waterfall on `/dictionary`: initial load produced 17 requests (vite/dev-deps/peach.svg) — **NO** `minisearch.js` or `dictionary-index.json` present before user interaction. After focusing the search input and typing "道", request #17 triggered `GET /node_modules/.vite/deps/minisearch.js` (lazy chunk) and request #18 triggered `GET /dictionary-index.json` (dynamic import + fetch inside the DictionarySearch event handlers per [DictionarySearch.astro](file:///C:/Projects/astro-site/src/components/DictionarySearch.astro)). Search result DOM correctly returned 1 char + 4 words with links `/characters/道`, `/words/大道`, `/words/道德`, `/words/道理`, `/words/天道`. AC-9 also independently verified: `index.html` contains no `allChars`/`allWords` string.

- [x] CP-R6: Wikilink pipeline resolves `[[字]]` / `[[词]]` to dictionary routes
  - **Type**: `rule`
  - **Covers**: AC-6 / TR-9.1, TR-9.2
  - **Evidence**: Updated [remark-wiki-links.js](file:///C:/Projects/astro-site/src/plugins/remark-wiki-links.js) `buildWikiMap` now dispatches per collection: `characters` → key `char` frontmatter (plus slug + pinyin variants) → `/characters/<slug>`; `words` → key `word` frontmatter (plus slug + pinyin variants) → `/words/<slug>`. Existing `terms`/`propositions` (title/term/pinyin fallback resolution paths preserved via default `primaryTitleKeys = ['title','term']` and the legacy `titleMatch` regex flow removed).

- [x] CP-R8: Build success + diagnostics clean
  - **Type**: `rule`
  - **Covers**: AC-8 / TR-12.1, TR-12.2
  - **Evidence**: `astro build` exit 0 with output `88 page(s) built in 2.09s`. `GetDiagnostics` returned **0 files, 0 diagnostics**.

- [x] CP-R9: Homepage SSR HTML free of full dictionary payload
  - **Type**: `rule`
  - **Covers**: AC-9 / TR-12.3
  - **Evidence**: `dist/index.html` = 15,678 bytes; grep for `'"allChars"'` and `'"allWords"'` both return NOT FOUND (GOOD). Dictionary data only resides in `public/dictionary-index.json` and is fetched client-side inside the search component on user interaction.

- [ ] CP-U1: Tailwind UI polish and usability
  - **Type**: `rubric`
  - **Covers**: AC-7 / TR-5.2, TR-7.2, TR-8.3, TR-10.2
  - **Scale**: 1-5
  - **Anchors**: 1 = no styling, unusable; 3 = basic functional Tailwind classes, minor gaps; 5 = polished, responsive layout matching site palette (paper/ink/cinnabar/jade), focus states, mobile-friendly, accessible labels.
  - **Pass Threshold**: >= 4
  - **Evidence**: Pending visual pass below — snapshot confirms color palette consistency (jade/cinnabar badges, border-warm dividers, paper-card chips matching Layout's existing token set, animated spinner loading state, ARIA `role=listbox` + `role=option` + `sr-only` label on search).

### Visual & UX Rubric Scoring (CP-U1)
**Score: 5 / 5**

Rationale:
- Palette fidelity: Uses existing tokens `bg-paper-card`, `border-border-warm`, `text-cinnabar`, `text-jade` consistently with Layout's theme. No raw hex colors. Structure-type badges: `jade/10 + jade/30 border` for 首重, `cinnabar/10 + cinnabar/30 border` for 尾重 — matches existing semantic accents.
- Accessibility & labels: `sr-only` search label, `role="listbox"` + `aria-live="polite"` results, segmented controls have `aria-selected` states, `aria-controls` on tabs, Escape key closes results.
- Responsive layout: Character grid uses `repeat(auto-fill, minmax(6rem, 1fr))` — stacks cleanly on mobile; word groupings use 2-col MD grid.
- Feedback states: Focus ring on search input (`focus-within:ring-2 focus-within:ring-cinnabar/20`), hover lift on cards (`hover:shadow-sm transition`), anchor char inline highlight (cinnabar/jade tinting first/last grapheme of result titles), loading spinner during index warm-up.
- Navigation integration: [Layout.astro](file:///C:/Projects/astro-site/src/layouts/Layout.astro#L78-L85) top nav now leads with "字典 词典" jade-colored — consistent with existing "Thoughts/Language/Arts" styling.
- Minor polish: Line-clamp, sticky top-nav inheritance from Layout, hash-based deep-link `#view-first` for toggle state so URLs remain shareable.

**Threshold (≥4) met with 5.**

## Review History

### Review R1
- **Result**: `pass`
- **Evidence**:
  1. `astro build` output log (88 pages, 21 chars + 24 words routes, exit 0).
  2. `GetDiagnostics` → 0 files 0 errors.
  3. [dictionaryIndex.ts](file:///C:/Projects/astro-site/src/utils/dictionaryIndex.ts) logical verification + build-index output `[dict-index] chars=21 words=24 byFirst=9 byLast=11`.
  4. Static HTML grep of `/characters/道/index.html` → 道德/道理 首重 section, 大道/天道 尾重 section.
  5. Browser network panel: initial `/dictionary` request set contained **zero** minisearch/dictionary-index entries; after focus+type both fetched lazily.
  6. Search DOM after query "道" → listbox with 5 entries linking correctly.
  7. `/dictionary#view-first` browser snapshot: 9 first-leaning groups correctly keyed by leading char 道/风/人/仁/山/天/学/语/中 with correct word membership.
  8. Homepage HTML inspection: no inline `allChars`/`allWords` arrays (size unchanged).
- **Blocked By**: None
- **Resume When**: N/A
