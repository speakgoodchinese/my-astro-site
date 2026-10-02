import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve('characters');

// Verified Level-1 characters containing the 辶 radical
const CHUO_CHARS = [
    "边", "辽", "达", "迁", "过", "迈", "还", "这", "进", "远", 
    "违", "运", "近", "返", "还", "进", "远", "违", "运", "近", 
    "返", "迦", "迨", "迤", "迥", "迩", "迦", "迹", "适", "选", 
    "逊", "递", "逻", "逼", "遘", "遛", "遢", "遣", "遥", "遨", 
    "遭", "遮", "遹", "遴", "遵", "遯", "邅", "避", "邀", 
];

const UNIQUE_CHUO_CHARS = [...new Set(CHUO_CHARS)];
const NEW_RADICAL_SEQ = ["丶", "𠃊", "丶"];

function updateChuoSymbols() {
    if (!fs.existsSync(outputDir)) {
        console.error(`[Error] Directory '${outputDir}' not found.`);
        return;
    }

    let updatedCount = 0;

    for (const char of UNIQUE_CHUO_CHARS) {
        const filePath = path.join(outputDir, `${char}.md`);
        if (!fs.existsSync(filePath)) continue;

        let content = fs.readFileSync(filePath, 'utf8');

        // Target and replace the strokeSequence array specifically under headingForm for 辶
        content = content.replace(
            /(headingForm:\s*\n\s*glyph:\s*"辶"[\s\S]*?strokeSequence:\s*)\s*\[[^\]]+\]/,
            `$1${JSON.stringify(NEW_RADICAL_SEQ)}`
        );

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Updated] ${char}: stroke sequence updated to ${JSON.stringify(NEW_RADICAL_SEQ)}`);
        updatedCount++;
    }

    console.log(`\n[Success] Updated stroke symbols for ${updatedCount} character files.`);
}

updateChuoSymbols();