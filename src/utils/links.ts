import { getCollection } from 'astro:content';

export async function getConnectedEntries(currentId, currentType, relatedTerms = [], relatedPropositions = []) {
  const explicitLinks = [];
  const incomingBacklinks = [];

  // Fetch collections to resolve explicit links and backlinks
  const terms = await getCollection('terms');
  const propositions = await getCollection('propositions');
  const allEntries = [...terms, ...propositions];

  // Map for quick lookup
  const entryMap = new Map(allEntries.map(e => [e.id, e]));

  // 1. Resolve explicit links from frontmatter arrays
  const targetIds = [...(relatedTerms || []), ...(relatedPropositions || [])];
  for (const id of targetIds) {
    const target = entryMap.get(id);
    if (target) {
      explicitLinks.push({
        title: target.data.title || id,
        url: `/${target.collection}/${target.id}`,
        type: target.collection,
        summary: target.data.summary || ''
      });
    }
  }

  // 2. Resolve incoming backlinks (other entries pointing here)
  for (const entry of allEntries) {
    if (entry.id === currentId) continue;
    
    const entryRelations = [
      ...(entry.data.relatedTerms || []),
      ...(entry.data.relatedPropositions || [])
    ];

    if (entryRelations.includes(currentId)) {
      incomingBacklinks.push({
        title: entry.data.title || entry.id,
        url: `/${entry.collection}/${entry.id}`,
        type: entry.collection,
        summary: entry.data.summary || ''
      });
    }
  }

  return { explicitLinks, incomingBacklinks };
}