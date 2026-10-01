import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const STROKE_TYPES = ['一', '丨', '丿', '丶', '𠃊'] as const;

const manifestoCollection = defineCollection({
  loader: glob({ pattern: '**.md', base: './src/content/manifesto' }),
  schema: z.object({
    title: z.string(),
  }),
});

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    relatedTerms: z.array(z.string()).optional(),
    relatedPropositions: z.array(z.string()).optional(),
    date: z.string(),
  }),
});

const termsCollection = defineCollection({
  loader: glob({ pattern: '**.md', base: './src/content/terms' }),
  schema: z.object({
    term: z.string(),
    pinyin: z.string(),
    category: z.string(),
    subcategory: z.string(),
    school: z.string(),
    era: z.string(),
    sourceText: z.string().optional(),
    summary: z.string(),
    relatedTerms: z.array(z.string()).default([]),
    relatedPropositions: z.array(z.string()).default([]),
    date: z.string().optional(),
  }),
});

const propositionsCollection = defineCollection({
  loader: glob({ pattern: '**.md', base: './src/content/propositions' }),
  schema: z.object({
    title: z.string(),
    pinyin: z.string(),
    category: z.string(),
    subcategory: z.string(),
    school: z.string(),
    era: z.string(),
    sourceText: z.string().optional(),
    summary: z.string(),
    relatedTerms: z.array(z.string()).default([]),
    relatedPropositions: z.array(z.string()).default([]),
    date: z.string().optional(),
  }),
});

const categoriesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
  schema: z.object({
    id: z.string(),
  }),
});

const subcategoriesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/subcategories' }),
  schema: z.object({
    id: z.string(),
    category: z.string(),
  }),
});

export const RADICAL_POSITIONS = ['left', 'right', 'top', 'bottom', 'centre', 'surround'] as const;
export type RadicalPosition = (typeof RADICAL_POSITIONS)[number];

const charactersCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/characters' }),
  schema: z.object({
    char: z.string().min(1).max(2),
    pinyin: z.string(),
    definition: z.string(),
    strokes: z.number().int().positive().optional(),
    strokeSequence: z.array(z.enum(STROKE_TYPES)).optional(),
    semanticCluster: z.string().nullable().optional(),
    headingForm: z.object({
      glyph: z.string(),
      position: z.enum(RADICAL_POSITIONS),
      strokes: z.number().int().nonnegative().optional(),
      strokeSequence: z.array(z.enum(STROKE_TYPES)).optional(),
    }).nullable().optional(),
    peripherals: z.object({
      strokes: z.number().int().nonnegative().optional(),
      strokeSequence: z.array(z.enum(STROKE_TYPES)).default([]),
    }).default({ glyphs: [], strokeSequence: [] }).optional(),
    level: z.enum(['一级', '二级', '三级']).optional(),
    relatedChars: z.array(z.string()).default([]),
    date: z.string().optional(),
  }),
});

const wordsCollection = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/words' }),
    schema: z.object({
      word: z.string().min(2),
      pinyin: z.string(),
      definition: z.string(),
      structureType: z.enum(['first', 'last', 'equal']),
      examples: z.array(z.string()).default([]),
      relatedWords: z.array(z.string()).default([]),
      date: z.string().optional(),
    }),
  });

export const collections = {
  manifesto: manifestoCollection,
  posts: postsCollection,
  terms: termsCollection,
  propositions: propositionsCollection,
  categories: categoriesCollection,
  subcategories: subcategoriesCollection,
  characters: charactersCollection,
  words: wordsCollection,
};