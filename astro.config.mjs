// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark'; 
import { remarkWikiLinks } from './src/plugins/remark-wiki-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://speakgoodchinese.com',

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    processor: unified({
      remarkPlugins: [remarkWikiLinks],
    }),
  },  
});