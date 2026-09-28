# Chinese Dictionary Integration - Product Requirements Document

## Overview
- **Summary**: Integrate a comprehensive Chinese linguistic dictionary into the Astro site, featuring 8,105 standard characters (通用规范汉字表) and multi-character words (词) with a structural linguistic classification system based on semantic weight (首重 / 尾重 dual-index architecture). All entries are editable as MDX/markdown files via Astro Content Collections.
- **Purpose**: Build a browsable, searchable Chinese dictionary with semantic structural indexing, integrated into the existing wikilink rendering pipeline and site architecture.
- **Target Users**: Readers of the site who encounter Chinese characters in blog posts, students of Chinese, and editors maintaining dictionary entries via MDX.

## Goals
1. Establish two content collections: `characters` (字) and `words` (词), editable as MD/MDX files with strict Zod schemas.
2. Implement the 首重 / 尾重 (first-leaning / last-leaning) structural classification for words, with `structureType: 'first' | 'last'`.
3. Build a dual-index architecture: under 首重 group by first character; under 尾重 group by last character.
4. Provide a search/browse UI component (Tailwind-styled) with structural-lens switching and client-side lazy-loaded Fuse.js/MiniSearch indexing.
5. Update the wikilink rendering pipeline so character/word references in content automatically link to their dictionary entry pages.
6. Avoid loading the full dictionary payload into every server-rendered page; prefer client-side lazy indexing.

## Non-Goals
1. We are not authoring the full 8,105 character definitions now; we scaffold the collection, schema, pages, index builder, and seed a working sample that proves every integration path. The remaining entries are editor-authored later.
2. No server-side search database; search is client-side via a lightweight JSON index loaded on demand.
3. No translation or bilingual UI beyond what is necessary for the dictionary metadata (pinyin, English gloss).

## Background & Context
- The site uses Astro 7 with Zod content collections, Tailwind CSS v4 via `@tailwindcss/vite`, a custom `remark-wiki-links.js` plugin that maps `[[...]]` syntax to collection pages, and an existing `/search` page using Pagefind.
- Existing collections: `posts`, `terms`, `propositions`, `categories`, `subcategories`, `manifesto`.
- The project structure, content config, layouts, and wikilink plugin were reviewed prior to drafting this spec.

## Functional Requirements
### Content & Schema
- **FR-1**: `characters` collection exists at `src/content/characters/` with a Zod schema requiring `char`, `pinyin`, `definition`, and optional metadata (strokes, radical, level from 通用规范汉字表, etc.). Entries are MD/MDX files.
- **FR-2**: `words` collection exists at `src/content/words/` with a Zod schema requiring `word`, `pinyin`, `definition`, and `structureType: 'first' | 'last'` plus optional fields (examples, related). Entries are MD/MDX files.
- **FR-3**: Static routes `/characters/[id]` and `/words/[id]` render each entry's body, metadata, and cross-links.
- **FR-4**: Character entry pages display 首重 words indexed by that character as the first character, and 尾重 words indexed by that character as the last character (dual-index display on the character page).

### Structural Indexing
- **FR-5**: A build-time utility/script produces a lightweight JSON index (written to `public/` or generated at page-load) grouping:
  - 首重 words by their first character
  - 尾重 words by their last character
- **FR-6**: Character lookup endpoint / page can return, for a given character, the list of 首重 words anchored at it and 尾重 words anchored at it.

### Browse & Search UI
- **FR-7**: A dedicated dictionary browse page (`/dictionary`) with tabs for 字 / 词, and within 词 a toggle between 首重 / 尾重 structural views.
- **FR-8**: A client-side search input, loading a MiniSearch/Fuse index on first interaction (lazy loaded), that matches characters and words (by char, word, pinyin, definition) and renders results with links to entry pages, styled with Tailwind.
- **FR-9**: A reusable search/modal Astro component (or island) exposing the same UI for embedding.

### Wikilink Integration
- **FR-10**: The `remark-wiki-links` plugin (or its replacement) resolves `[[字]]` and `[[词|label]]` references to their respective dictionary routes (`/characters/...`, `/words/...`), falling back gracefully to existing collections.
- **FR-11**: Character references appearing in blog posts render as links to their character entry.

### Performance
- **FR-12**: The full dictionary dataset is never inlined into SSR HTML output for non-dictionary pages; the search index is fetched as a static JSON asset on first search interaction, and the search library is lazy-loaded via dynamic import.

## Non-Functional Requirements
- **NFR-1**: Build succeeds (`astro build`) with the new collections and pages.
- **NFR-2**: TypeScript/IDE diagnostics pass for files under `src/` (content config, layouts, utils).
- **NFR-3**: No new required heavy dependencies beyond a single lightweight client search library (Fuse.js or MiniSearch).
- **NFR-4**: Code follows the existing style patterns: Astro components in `src/components/`, layouts in `src/layouts/`, utilities in `src/utils/`, plugins in `src/plugins/`.

## Constraints
- **Technical**: Must use Astro content collections with Zod schemas; MD/MDX files must be the source of truth.
- **Business**: The site URL remains `https://speakgoodchinese.com`.
- **Dependencies**: Add at most one client-side search library. Astro, Tailwind, and existing deps stay.

## Assumptions
1. A sample of character entries and word entries (with both `first` and `last` structureType) will be sufficient to verify the integration; full 8,105-character data entry is out of scope.
2. Pinyin is stored as a plain string; no pinyin parser library is required.
3. The wikilink plugin uses Chinese-aware routing based on filename slugs; character slugs are the character itself when filename-safe.

## Acceptance Criteria

### AC-1: Characters content collection schema and routes
- **Type**: `rule`
- **Given**: The `content.config.ts` exports a `characters` collection with required `char`, `pinyin`, `definition` fields.
- **When**: Running `astro build` with at least one sample character MDX file in `src/content/characters/`.
- **Then**: Build succeeds and the route `/characters/<id>` renders the character, pinyin, definition, and MDX body.
- **Pass Condition**: Build log shows static page generated for `/characters/<id>.html` and the page markup contains the character and pinyin.
- **Evidence**: `astro build` output + curl/headless snapshot of one character page.

### AC-2: Words content collection with structureType
- **Type**: `rule`
- **Given**: The `content.config.ts` exports a `words` collection with required `word`, `pinyin`, `definition`, and `structureType: 'first' | 'last'` enforced by Zod.
- **When**: Running `astro build` with at least one 首重 and one 尾重 sample MDX file in `src/content/words/`.
- **Then**: Build succeeds; `/words/<id>` renders the word, pinyin, definition, and the structureType badge/label.
- **Pass Condition**: Word routes generate and HTML contains structureType value rendered visibly.
- **Evidence**: `astro build` output + page render for one `first` and one `last` sample.

### AC-3: Dual-index grouping correctness
- **Type**: `rule`
- **Given**: Character C is present; word W1 has `structureType: 'first'` and begins with C; word W2 has `structureType: 'last'` and ends with C.
- **When**: Building the dual index utility and rendering the character C page.
- **Then**: The page displays W1 under 首重 section and W2 under 尾重 section (and not vice versa).
- **Pass Condition**: Static HTML for `/characters/C` contains W1 in a section labelled 首重 and W2 in 尾重.
- **Evidence**: HTML snapshot / rendered output.

### AC-4: Dictionary browse page with structural lens toggle
- **Type**: `rule`
- **Given**: `/dictionary` page exists.
- **When**: Rendered in a browser.
- **Then**: Tabs/sections for 字 and 词 exist; inside 词 there is a toggle between 首重 / 尾重 views that filters/group words accordingly.
- **Pass Condition**: Page markup renders both lenses, and switching changes the visible groups.
- **Evidence**: Browser snapshot + DOM inspection.

### AC-5: Client-side lazy search with MiniSearch/Fuse
- **Type**: `rule`
- **Given**: The search component on `/dictionary` uses a lightweight library (MiniSearch or Fuse.js) loaded via a dynamic import.
- **When**: A user focuses the search input or types a query.
- **Then**: The library chunk and index JSON are fetched lazily (not present in initial SSR HTML), and results link to `/characters/...` or `/words/...` routes.
- **Pass Condition**: Network waterfall shows no search library or index in initial page load; after interaction both are fetched, and result items navigate to correct routes.
- **Evidence**: DevTools HAR/screenshot of requests.

### AC-6: Wikilinks resolve to dictionary entries
- **Type**: `rule`
- **Given**: A post or term MDX file contains `[[字]]` and `[[词]]` wikilinks matching existing dictionary entries.
- **When**: The markdown is processed via the remark pipeline.
- **Then**: The rendered HTML contains `<a href="/characters/...">...</a>` for character links and `<a href="/words/...">...</a>` for word links.
- **Pass Condition**: Rendered HTML of a sample post contains anchor tags pointing to the correct dictionary routes.
- **Evidence**: Rendered HTML snippet.

### AC-7: Tailwind-styled UI and UX quality
- **Type**: `rubric`
- **Dimension**: Visual design coherence and usability of the dictionary UI
- **Scale**: 1-5
- **Anchors**: 1 = no styling, unusable; 3 = basic functional styling with Tailwind classes, minor gaps; 5 = polished, responsive layout matching existing site palette (paper, ink, cinnabar, jade), proper focus states, mobile-friendly, accessible labels.
- **Pass Threshold**: >= 4
- **Evidence**: Screenshots of `/dictionary` and one character detail page.

### AC-8: Build/TS diagnostics
- **Type**: `rule`
- **Given**: Implementation complete.
- **When**: Running `astro build` and the IDE TypeScript diagnostics.
- **Then**: Build exits 0; no type/lint errors in new/modified source files under `src/`.
- **Pass Condition**: `astro build` exits with code 0 and `GetDiagnostics` reports zero errors.
- **Evidence**: Build exit code + diagnostics output.

### AC-9: No full dictionary payload in SSR HTML of non-dictionary pages
- **Type**: `rule`
- **Given**: The homepage or a random blog post page (non-dictionary route).
- **When**: Viewing its rendered HTML payload.
- **Then**: The HTML does not contain the full characters/words JSON dataset (only small references if any; search index is loaded client-side on demand).
- **Pass Condition**: HTML size of the homepage is within 1.1x of its pre-implementation baseline and does not contain a stringified array of all dictionary entries.
- **Evidence**: HTML source scan + file size comparison.

## Open Questions
- [ ] Slug strategy for Chinese filenames: keep the character itself as filename (e.g., `道.mdx`) for simplicity, or use an index-based slug with frontmatter `id`? Decision: use character/word itself as filename when filesystem-safe; fall back to slug only if needed. Covered by FR-1/FR-2.
- [ ] Search library: MiniSearch vs Fuse.js. Decision: MiniSearch (smaller, prefix/tokenized) unless build+test shows Fuse preferred.
