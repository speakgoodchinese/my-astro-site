import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve('characters');

// Verified Level-1 characters containing the 辶 radical
const TARGET_CHARS = [
    // Standard Level 1 & Level 2 characters containing the 见 (見) radical
    "规", "觅", "视", "觉", "观", "觃", "规", "觅", "视", "觇", 
    "览", "觉", "角", "解", "觌", "觍", "觚", "觜", "觏", "觫", 
    "觋", "觌", "觍", "觎", "觏", "觐", "觑"
];

const UNIQUE_CHUO_CHARS = [...new Set(CHUO_CHARS)];

const RADICAL_GLYPH = "辶";
const RADICAL_POSITION = "surround";
const RADICAL_STROKES = 3;
const RADICAL_SEQ = ["丶", "𠃊", "丶"]; // Standard 3-stroke sequence for 辶

function processChuoFiles() {
    if (!fs.existsSync(outputDir)) {
        console.error(`[Error] Directory '${outputDir}' not found.`);
        return;
    }

    let updatedCount = 0;
    let missingCount = 0;

    for (const char of UNIQUE_CHUO_CHARS) {
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
        
        // CORRECTED LOGIC: Since 辶 is written LAST, 
        // peripherals are everything BEFORE the last 3 strokes.
        const peripheralSeq = totalStrokes >= 3 ? fullSeq.slice(0, -3) : [];
        const peripheralStrokes = peripheralSeq.length;

        const semanticClusterYaml = `semanticCluster: "${RADICAL_GLYPH}"`;
        const headingFormYaml = `headingForm:
  glyph: "${RADICAL_GLYPH}"
  position: "${RADICAL_POSITION}"
  strokes: ${RADICAL_STROKES}
  strokeSequence: ${JSON.stringify(RADICAL_SEQ)}`;

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
        console.log(`[Updated] ${char}: correctly split (peripherals: ${peripheralStrokes} strokes, 辶 at end).`);
        updatedCount++;
    }

    console.log(`\n[Success] Updated ${updatedCount} character files.`);
    if (missingCount > 0) {
        console.log(`[Note] ${missingCount} characters from the list were outside the Level-1 scope or file not found.`);
    }
}

processChuoFiles();