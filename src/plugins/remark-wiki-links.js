// src/plugins/remark-wiki-links.js
import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';

function buildWikiMap() {
  const map = new Map();
  // Maps titles/slugs/aliases to their URL path
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
      const content = fs.readFileSync(filePath, 'utf8');

      const slug = file.replace(/\.(md|mdx)$/, '');
      const urlPath = `/${col.name}/${slug}`;

      // Extract frontmatter title
      const titleMatch = content.match(/^title:\s*(["']?)([^"'\n]+)\1/m);
      let primaryTitle = slug;
      if (titleMatch) {
        primaryTitle = titleMatch[2].trim();
        titleToPath.set(primaryTitle, urlPath);
      }
      
      titleToPath.set(slug, urlPath);

      // Extract optional aliases (e.g., aliases: [Dao, Tao])
      const aliasMatch = content.match(/^aliases:\s*\[(.*?)\]/m);
      if (aliasMatch) {
        const aliases = aliasMatch[1].split(',').map(a => a.trim().replace(/['"]/g, ''));
        for (const alias of aliases) {
          if (alias) titleToPath.set(alias, urlPath);
        }
      }
    }
  }
  return { titleToPath };
}

let wikiData = null;

export function remarkWikiLinks() {
  if (!wikiData) {
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
        let href = '';

        // Handle pipe syntax [[Target|Display]] or [[Display|Target]]
        if (innerContent.includes('|')) {
          const parts = innerContent.split('|').map(s => s.trim());
          const partA = parts[0];
          const partB = parts[1];

          // Check which part exists in our map
          if (wikiData.titleToPath.has(partA)) {
            targetKey = partA;
            displayText = partB;
          } else if (wikiData.titleToPath.has(partB)) {
            targetKey = partB;
            displayText = partA;
          } else {
            // Default fallback if neither is found explicitly
            targetKey = partA;
            displayText = partB;
          }
        }

        // Resolve URL from map
        href = wikiData.titleToPath.get(targetKey) || `/terms/${targetKey}`;

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