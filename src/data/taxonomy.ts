export interface SubcategoryMeta {
  id: string;
  title: string;
  cta: string;
  desc?: string;
}

export interface CategoryMeta {
  id: string;
  title: string;
  cta?: string; // Added optional or required cta property
  subcategories: SubcategoryMeta[];
}

export const TAXONOMY: CategoryMeta[] = [
  {
    id: 'thoughts',
    title: 'Thoughts 思想',
    cta: 'Explore the foundational streams of Chinese thought, from cosmology to human nature.', // Added category CTA
    subcategories: [
      { id: 'ethics', title: 'Ethics & Self-Cultivation (修身与处世)', cta: 'Explore practical wisdom, moral action, and internal alignment with reality.' },
      { id: 'cosmology', title: 'Natural Order & Principles (天道与物理)', cta: 'Examine the origins of the universe, natural ordering principles, and fundamental reality.' },
      { id: 'consciousness', title: 'Human Nature & Consciousness (性与心)', cta: 'Investigate the structure of the mind, innate moral capacity, and the self.' },
    ],
  },
  {
    id: 'language',
    title: 'Language 语言',
    cta: 'Investigate the rigorous interplay between words, names, and ultimate reality - examining how language bridges, or fails to capture, transcendent truth.',
    subcategories: [
      { id: 'semantics', title: 'Rectification of Names (名实之辨)', cta: 'Study the precise correspondence between words, titles, and actual behavior or reality.' },
      { id: 'transcendence', title: 'Words and Intent (言意之辨)', cta: 'Analyze the philosophical limitations of language in capturing ultimate, unspoken truths.' },
      { id: 'logic', title: 'Dialectics & Argumentation (名辩思辨)', cta: 'Focus on the logic and disputation in analysis, paradoxes, and rhetorical debate.' },
    ],
  },
  {
    id: 'arts',
    title: 'Arts & Expressions 文艺',
    cta: 'Discover how aesthetic creation, spatial resonance, and daily practices serve as living reflections of inner spiritual cultivation.',
    subcategories: [
      { id: 'aesthetics', title: 'Elevation and Flow (意境与气韵)', cta: 'Capture the elevated artistic realm and the fluid, vital resonance underlying creative expression.' },
      { id: 'expression', title: 'Metaphor and Imagery (比兴与意象)', cta: 'Use physical or natural imagery to evoke deep emotional and philosophical resonance.' },
      { id: 'living-arts', title: 'Living Arts (生活与艺术)', cta: 'Treat physical crafts, daily practices, and creative expression as living exercises in spiritual cultivation.' },
    ],
  },
];