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
    // Level 1 & Level 2 Left-Month (肉月旁) Characters
    "肌", "肋", "肘", "肚", "肛", "肝", "肠", "股", "肢", "肤", 
    "肥", "肩", "肪", "肫", "肮", "肯", "肱", "肺", "胃", "胆", 
    "背", "胎", "胖", "胙", "胚", "胛", "胜", "胝", "胞", "胡", 
    "胤", "胥", "胧", "胪", "胯", "胰", "胱", "胳", "胴", "胶", 
    "胸", "胺", "胼", "能", "脂", "脆", "脉", "脑", "脓", "脔", 
    "脊", "胫", "脱", "脯", "脖", "脘", "脲", "脶", "脩", "脾", 
    "腆", "腈", "腐", "腑", "腓", "腔", "腕", "腚", "腙", "腮", 
    "腺", "腼", "肿", "腥", "脑", "腧", "腩", "腰", "腱", "脚", 
    "腴", "肠", "腹", "腺", "腻", "脬", "腱", "腿", "膀", "膂", 
    "膈", "膊", "膏", "膑", "膜", "膝", "膘", "膛", "膳", "臃", 
    "臂", "臀", "臆", "脸", "臊", "膳", "膛", "臀", "臂", "膺", 
    "膻", "胆", "脍", "脓", "脸", "脐", "臏", "腊", "脏"
];

const UNIQUE_TARGET_CHARS = [...new Set(TARGET_CHARS)];

const RADICAL_GLYPH = "月";
const RADICAL_POSITION = "left";

// 2. Change this number to 4, 5, 6, etc., to alter how many strokes 
// are taken from the front for the HeadingForm.
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
        
        // Take the first N strokes for headingForm, leave the remainder for peripherals
        const headingSeq = totalStrokes >= RADICAL_STROKES_COUNT 
            ? fullSeq.slice(0, RADICAL_STROKES_COUNT) 
            : fullSeq;
            
        const peripheralSeq = totalStrokes >= RADICAL_STROKES_COUNT 
            ? fullSeq.slice(RADICAL_STROKES_COUNT) 
            : [];

        const headingStrokes = headingSeq.length;
        const peripheralStrokes = peripheralSeq.length;

        const semanticClusterYaml = `semanticCluster: "${RADICAL_GLYPH}"`;
        
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