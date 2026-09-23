// src/plugins/remark-wiki-links.js
import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';

function buildWikiMap() {
  const titleToPath = new Map();
  const contentDir = path.resolve(process.cwd(), 'src/content');

  if (!fs.existsSync(contentDir)) return { titleToPath };

  const collections = fs.readdirSync(contentDir, { withFileTypes: true });
  
  for (const col of collections) {
    if (!col.isDirectory()) continue;
    const colPath = path.join(contentDir, col.name);
    const files = fs.readdirSync(colPath);

    for (const file of files) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
      const filePath = path.join(colPath, file);
      let content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

      const slug = file.replace(/\.(md|mdx)$/, '');
      const urlPath = `/${col.name}/${slug}`;

      const titleMatch = content.match(/^(?:---\s*\n)?[\s\S]*?title:\s*(["']?)([^"'\n\r]+)\1/m);
      if (titleMatch) {
        const primaryTitle = titleMatch[2].trim();
        titleToPath.set(primaryTitle, urlPath);
      }
      
      titleToPath.set(slug, urlPath);
    }
  }

  return { titleToPath };
}

let wikiData = null;

export function remarkWikiLinks() {
  if (process.env.NODE_ENV !== 'production' || !wikiData) {
    wikiData = buildWikiMap();
  }

  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const text = node.value;
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

      if (!wikiLinkRegex.test(text)) return;

      const children = [];
      let lastIndex = 0;
      let match;

      wikiLinkRegex.lastIndex = 0;

      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const innerContent = match[1].trim();
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
          children.push({
            type: 'text',
            value: text.slice(lastIndex, matchIndex),
          });
        }

        let targetKey = innerContent;
        let displayText = innerContent;

        if (innerContent.includes('|')) {
          const parts = innerContent.split('|').map(s => s.trim());
          targetKey = parts[0];
          displayText = parts[1];
        }

        let href = '';

        // 1. Check map first
        if (wikiData.titleToPath.has(targetKey)) {
          href = wikiData.titleToPath.get(targetKey);
        } else {
          // 2. Check if it exists as a proposition file explicitly
          const propPath = path.resolve(process.cwd(), `src/content/propositions/${targetKey}.md`);
          const propMdxPath = path.resolve(process.cwd(), `src/content/propositions/${targetKey}.mdx`);
          const slugKey = targetKey.toLowerCase().replace(/\s+/g, '-');
          const slugPropPath = path.resolve(process.cwd(), `src/content/propositions/${slugKey}.md`);

          if (fs.existsSync(propPath) || fs.existsSync(propMdxPath)) {
            href = `/propositions/${targetKey}`;
          } else if (fs.existsSync(slugPropPath)) {
            href = `/propositions/${slugKey}`;
          } else {
            // 3. Fallback routing for unmapped entries
            const hasChinese = /[\u4e00-\u9fa5]/.test(targetKey);
            if (hasChinese) {
              href = `/propositions/${slugKey || targetKey}`;
            } else {
              href = `/terms/${targetKey}`;
            }
          }
        }

        children.push({
          type: 'link',
          url: href,
          children: [{ type: 'text', value: displayText }],
        });

        lastIndex = matchIndex + fullMatch.length;
      }

      if (lastIndex < text.length) {
        children.push({
          type: 'text',
          value: text.slice(lastIndex),
        });
      }

      parent.children.splice(index, 1, ...children);
    });
  };
}