import { getCollection } from 'astro:content';

export interface LinkedItem {
  id: string;
  title: string;
  type: 'term' | 'proposition';
  url: string;
  summary: string;
}

/**
 * Resolves explicit links and incoming backlinks for a given entry ID and type using titles.
 */
export async function getConnectedEntries(currentId: string, currentType: 'term' | 'proposition', explicitTerms: string[] = [], explicitProps: string[] = []) {
  const allTerms = await getCollection('terms');
  const allPropositions = await getCollection('propositions');

  // Find current entry's title to properly skip self-references in backlinks
  const currentTermObj = allTerms.find(t => t.id === currentId);
  const currentPropObj = allPropositions.find(p => p.id === currentId);
  const currentTitle = currentTermObj ? currentTermObj.data.term : (currentPropObj ? currentPropObj.data.title : '');

  // Map collections by their TITLE for easy lookup from frontmatter arrays
  const termMapByTitle = new Map(allTerms.map(t => [t.data.term, {
    id: t.id,
    title: t.data.term,
    type: 'term' as const,
    url: `/terms/${t.id}`,
    summary: t.data.summary,
    relatedTerms: t.data.relatedTerms || [],
    relatedPropositions: t.data.relatedPropositions || []
  }]));

  const propMapByTitle = new Map(allPropositions.map(p => [p.data.title, {
    id: p.id,
    title: p.data.title,
    type: 'proposition' as const,
    url: `/propositions/${p.id}`,
    summary: p.data.summary,
    relatedTerms: p.data.relatedTerms || [],
    relatedPropositions: p.data.relatedPropositions || []
  }]));

  // Also keep an ID-based map or direct lookup for backlink comparisons
  const termMap = new Map(allTerms.map(t => [t.id, termMapByTitle.get(t.data.term)!]));
  const propMap = new Map(allPropositions.map(p => [p.id, propMapByTitle.get(p.data.title)!]));

  // 1. Resolve Explicit Forward Links (using titles from frontmatter)
  const explicitLinks: LinkedItem[] = [];
  
  for (const tTitle of explicitTerms) {
    if (termMapByTitle.has(tTitle)) {
      const item = termMapByTitle.get(tTitle)!;
      explicitLinks.push({ id: item.id, title: item.title, type: item.type, url: item.url, summary: item.summary });
    }
  }

  for (const pTitle of explicitProps) {
    if (propMapByTitle.has(pTitle)) {
      const item = propMapByTitle.get(pTitle)!;
      explicitLinks.push({ id: item.id, title: item.title, type: item.type, url: item.url, summary: item.summary });
    }
  }

  // 2. Resolve Implicit Backlinks (Incoming references pointing to currentTitle or currentId)
  const incomingBacklinks: LinkedItem[] = [];

  for (const [_, term] of termMap) {
    if (term.id === currentId && currentType === 'term') continue;
    // Check if term references us by our title or id
    if (term.relatedTerms.includes(currentTitle) || term.relatedTerms.includes(currentId) || 
        (currentType === 'proposition' && (term.relatedPropositions.includes(currentTitle) || term.relatedPropositions.includes(currentId)))) {
      incomingBacklinks.push({ id: term.id, title: term.title, type: term.type, url: term.url, summary: term.summary });
    }
  }

  for (const [_, prop] of propMap) {
    if (prop.id === currentId && currentType === 'proposition') continue;
    // Check if prop references us by our title or id
    if (prop.relatedPropositions.includes(currentTitle) || prop.relatedPropositions.includes(currentId) || 
        (currentType === 'term' && (prop.relatedTerms.includes(currentTitle) || prop.relatedTerms.includes(currentId)))) {
      incomingBacklinks.push({ id: prop.id, title: prop.title, type: prop.type, url: prop.url, summary: prop.summary });
    }
  }

  return {
    explicitLinks,
    incomingBacklinks
  };
}