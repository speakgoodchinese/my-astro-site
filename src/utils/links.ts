import { getCollection } from 'astro:content';

export interface LinkedItem {
  id: string;
  title: string;
  type: 'term' | 'proposition';
  url: string;
  summary: string;
}

/**
 * Resolves explicit links and incoming backlinks for a given entry ID and type.
 */
export async function getConnectedEntries(currentId: string, currentType: 'term' | 'proposition', explicitTerms: string[] = [], explicitProps: string[] = []) {
  const allTerms = await getCollection('terms');
  const allPropositions = await getCollection('propositions');

  // Map collections into uniform structures for easy lookup
  const termMap = new Map(allTerms.map(t => [t.id, {
    id: t.id,
    title: t.data.term,
    type: 'term' as const,
    url: `/terms/${t.id}`,
    summary: t.data.summary,
    relatedTerms: t.data.relatedTerms || [],
    relatedPropositions: t.data.relatedPropositions || []
  }]));

  const propMap = new Map(allPropositions.map(p => [p.id, {
    id: p.id,
    title: p.data.title,
    type: 'proposition' as const,
    url: `/propositions/${p.id}`,
    summary: p.data.summary,
    relatedTerms: p.data.relatedTerms || [],
    relatedPropositions: p.data.relatedPropositions || []
  }]));

  // 1. Resolve Explicit Forward Links
  const explicitLinks: LinkedItem[] = [];
  
  for (const tId of explicitTerms) {
    if (termMap.has(tId)) {
      const item = termMap.get(tId)!;
      explicitLinks.push({ id: item.id, title: item.title, type: item.type, url: item.url, summary: item.summary });
    }
  }

  for (const pId of explicitProps) {
    if (propMap.has(pId)) {
      const item = propMap.get(pId)!;
      explicitLinks.push({ id: item.id, title: item.title, type: item.type, url: item.url, summary: item.summary });
    }
  }

  // 2. Resolve Implicit Backlinks (Incoming references pointing to currentId)
  const incomingBacklinks: LinkedItem[] = [];

  for (const [_, term] of termMap) {
    if (term.id === currentId && currentType === 'term') continue;
    if (term.relatedTerms.includes(currentId) || (currentType === 'proposition' && term.relatedPropositions.includes(currentId))) {
      incomingBacklinks.push({ id: term.id, title: term.title, type: term.type, url: term.url, summary: term.summary });
    }
  }

  for (const [_, prop] of propMap) {
    if (prop.id === currentId && currentType === 'proposition') continue;
    if (prop.relatedPropositions.includes(currentId) || (currentType === 'term' && prop.relatedTerms.includes(currentId))) {
      incomingBacklinks.push({ id: prop.id, title: prop.title, type: prop.type, url: prop.url, summary: prop.summary });
    }
  }

  return {
    explicitLinks,
    incomingBacklinks
  };
}