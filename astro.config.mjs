// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import { remarkWikiLinks } from './src/plugins/remark-wiki-links.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://speakgoodchinese.com',

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    remarkPlugins: [remarkWikiLinks],
  },

});