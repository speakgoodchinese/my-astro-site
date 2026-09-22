import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    date: z.string(), // e.g., "2026-09-22"
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
    summary: z.string(),
    relatedTerms: z.array(z.string()).default([]),
    relatedPropositions: z.array(z.string()).default([]),
    date: z.string().optional(), // e.g., "2026-09-22"
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
    date: z.string().optional(), // e.g., "2026-09-22"
  }),
});

const categoriesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
  schema: z.object({
    id: z.string(), // Matches category IDs like 'thoughts', 'language', 'arts'
  }),
});

const subcategoriesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/subcategories' }),
  schema: z.object({
    id: z.string(), // Matches subcategory IDs like 'ethics', 'cosmology', etc.
    category: z.string(), // Links the subcategory back to its parent category if needed
  }),
});

export const collections = { 
  manifesto: manifestoCollection, 
  posts: postsCollection,
  terms: termsCollection, 
  propositions: propositionsCollection,
  categories: categoriesCollection,
  subcategories: subcategoriesCollection,
};