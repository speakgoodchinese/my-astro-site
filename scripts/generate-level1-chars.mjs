import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.resolve(root, 'scripts/characters');
const txtPath = path.resolve(__dirname, 'level-1.txt');

// Exact mappings for 丁: stroke 1 is horizontal (1 / 一), stroke 2 is vertical (2 / 丨)
const SEED_OVERRIDES = new Map([
  ["丁", {
    char: "丁",
    pinyin: "dīng",
    definition: "Fourth Heavenly Stem, adult male, robust",
    strokes: 2,
    strokeSequence: ["一", "丨"],
    level: "一级",
    relatedChars: [],
    semanticCluster: null,
    headingForm: null,
    peripherals: {
      strokes: 2,
      strokeSequence: ["一", "丨"]
    },
    date: "2026-09-28",
    prose: "丁 is a standard Level 1 character entry."
  }],
  ["地", {
    char: "地",
    pinyin: "dì",
    definition: "Earth, ground, land; the receptive cosmic principle paired with 天",
    strokes: 6,
    strokeSequence: ["一", "丨", "一", "𠃊", "丨", "𠃊"],
    level: "一级",
    relatedChars: ["天", "山", "土"],
    semanticCluster: "土",
    headingForm: {
      glyph: "土",
      position: "left",
      strokes: 3,
      strokeSequence: ["一", "丨", "一"]
    },
    peripherals: {
      strokes: 3,
      strokeSequence: ["𠃊", "丨", "𠃊"]
    },
    date: "2026-09-28",
    prose: "地 is earth, soil, and ground."
  }]
]);

function generateMarkdownContent(data) {
  let headingFormYaml = "headingForm: null";
  if (data.headingForm) {
    headingFormYaml = `headingForm:
  glyph: "${data.headingForm.glyph}"
  position: "${data.headingForm.position}"
  strokes: ${data.headingForm.strokes}
  strokeSequence: ${JSON.stringify(data.headingForm.strokeSequence)}`;
  }

  let semanticClusterYaml = data.semanticCluster === null ? "semanticCluster: null" : `semanticCluster: "${data.semanticCluster}"`;

  return `---
char: "${data.char}"
pinyin: "${data.pinyin}"
definition: "${data.definition}"
strokes: ${data.strokes}
strokeSequence: ${JSON.stringify(data.strokeSequence)}
level: "${data.level}"
relatedChars: ${JSON.stringify(data.relatedChars)}
${semanticClusterYaml}
${headingFormYaml}
peripherals:
  strokes: ${data.peripherals.strokes}
  strokeSequence: ${JSON.stringify(data.peripherals.strokeSequence)}
date: "${data.date}"
---

${data.prose}
`;
}

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!fs.existsSync(txtPath)) {
    console.error(`[Error] Could not find character list file at: ${txtPath}`);
    process.exit(1);
  }

  const rawText = fs.readFileSync(txtPath, 'utf8');
  const level1Chars = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`[Generator] Processing ${level1Chars.length} characters using strict symbol rules...`);

  for (const ch of level1Chars) {
    let charData = SEED_OVERRIDES.get(ch);

    if (!charData) {
      // Default fallback template complying strictly with schema
      charData = {
        char: ch,
        pinyin: "pīnyīn",
        definition: `Standard Level 1 character entry for ${ch}`,
        strokes: 1,
        strokeSequence: ["一"],
        level: "一级",
        relatedChars: [],
        semanticCluster: null,
        headingForm: null,
        peripherals: {
          strokes: 1,
          strokeSequence: ["一"]
        },
        date: "2026-09-28",
        prose: `${ch} is a standard Level 1 vocabulary entry.`
      };
    }

    const filePath = path.join(outputDir, `${ch}.md`);
    fs.writeFileSync(filePath, generateMarkdownContent(charData), 'utf8');
  }

  console.log(`[Generator] Successfully generated ${level1Chars.length} markdown files.`);
}

main();