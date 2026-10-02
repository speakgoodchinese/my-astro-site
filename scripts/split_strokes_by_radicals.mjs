import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolves from root/script/ up to root/src/content/characters
const outputDir = path.resolve(__dirname, '../src/content/characters');

// ============================================================================
// CONFIGURATION SECTION (Fully Future-Modifiable)
// ============================================================================

// 1. Modify this array anytime to add, remove, or change characters
const TARGET_CHARS = [
    // Standard Level 1 & Level 2 characters containing the 见 (見) radical
    "规", "视", "观", "觃", "规", "视", "觇", 
    "觌", "觍", "觏",  
    "觋", "觌", "觍", "觎", "觏", "觐", "觑"
];

const UNIQUE_TARGET_CHARS = [...new Set(TARGET_CHARS)];

const SEMANTIC_GLYPH = "见"
const RADICAL_GLYPH = "见";
const RADICAL_POSITION = "right"; // Options: "left", "right", etc.

// 2. Change this number to 4, 5, 6, etc., to alter how many strokes 
// are taken for the HeadingForm.
const RADICAL_STROKES_COUNT = 4; 

// ============================================================================
// PROCESSING FUNCTION
// ============================================================================

function processCharacterFiles() {
    if (!fs.existsSync(outputDir)) {
        console.error(`[Error] Directory '${outputDir}' not found.`);
        return;
    }

    let updatedCount = 0;
    let missingCount = 0;

    for (const char of UNIQUE_TARGET_CHARS) {
        const filePath = path.join(outputDir, `${char}.md`);
        if (!fs.existsSync(filePath)) {
            missingCount++;
            continue;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        const match = content.match(/strokeSequence:\s*(\[[^\]]+\])/);
        if (!match) continue;

        let fullSeq;
        try {
            fullSeq = JSON.parse(match[1]);
        } catch (e) {
            continue;
        }

        const totalStrokes = fullSeq.length;
        
        let headingSeq;
        let peripheralSeq;

        // Slice based on RADICAL_POSITION ("right" takes from the back, otherwise from the front)
        if (RADICAL_POSITION === "right") {
            const splitIndex = totalStrokes >= RADICAL_STROKES_COUNT ? totalStrokes - RADICAL_STROKES_COUNT : 0;
            peripheralSeq = fullSeq.slice(0, splitIndex);
            headingSeq = fullSeq.slice(splitIndex);
        } else {
            headingSeq = totalStrokes >= RADICAL_STROKES_COUNT 
                ? fullSeq.slice(0, RADICAL_STROKES_COUNT) 
                : fullSeq;
                
            peripheralSeq = totalStrokes >= RADICAL_STROKES_COUNT 
                ? fullSeq.slice(RADICAL_STROKES_COUNT) 
                : [];
        }

        const headingStrokes = headingSeq.length;
        const peripheralStrokes = peripheralSeq.length;

        const semanticClusterYaml = `semanticCluster: "${SEMANTIC_GLYPH}"`;
        
        const headingFormYaml = `headingForm:
  glyph: "${RADICAL_GLYPH}"
  position: "${RADICAL_POSITION}"
  strokes: ${headingStrokes}
  strokeSequence: ${JSON.stringify(headingSeq)}`;

        const peripheralsYaml = `peripherals:
  strokes: ${peripheralStrokes}
  strokeSequence: ${JSON.stringify(peripheralSeq)}`;

        content = content.replace(/semanticCluster:\s*null/, semanticClusterYaml);
        content = content.replace(/headingForm:\s*null/, headingFormYaml);
        content = content.replace(
            /peripherals:\s*[\s\S]*?date:/,
            `${peripheralsYaml}\ndate:`
        );

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Updated] ${char}: split into heading (${headingStrokes} strokes) and peripherals (${peripheralStrokes} strokes).`);
        updatedCount++;
    }

    console.log(`\n[Success] Updated ${updatedCount} character files.`);
    if (missingCount > 0) {
        console.log(`[Note] ${missingCount} characters from the list were outside scope or file not found.`);
    }
}

processCharacterFiles();