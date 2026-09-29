import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const charsDir = path.join(root, 'src/content/characters');

// --- Stroke 5-type classifier (mirrors fix-stroke-sequence logic) ---
const STROKE_VALID = new Set(['横', '竖', '撇', '点', '折']);
const CLASS_MAP = {
  '横': '横', '提': '横',
  '竖': '竖', '竖钩': '竖',
  '撇': '撇',
  '点': '点', '捺': '点',
};
function classifyStroke(s) {
  if (!s) return '折';
  if (STROKE_VALID.has(s)) return s;
  if (CLASS_MAP[s]) return CLASS_MAP[s];
  return '折';
}
function normalizeSeq(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(classifyStroke).filter(s => STROKE_VALID.has(s));
}
function parseSeqLiteral(txt) {
  const match = txt.match(/^strokeSequence:\s*(\[[^\]]*\])\s*$/m);
  if (!match) return null;
  try { return normalizeSeq(JSON.parse(match[1])); } catch { return null; }
}

// --- Frontmatter read/write helpers (YAML-block-safe string manipulation) ---
function readBlock(txt) {
  const m = txt.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(\r?\n?)/);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length, inner: m[1], leadingLen: m[0].length - m[1].length, trailing: m[2] ?? '' };
}
function getField(inner, key) {
  const lineRegex = new RegExp(`(^|\\n)(${key}:\\s*[^\\n]*(?:\\n[ \\t]+[^\\n]*)*)`, 'm');
  const m = inner.match(lineRegex);
  return m ? m[2] : null;
}
function removeField(inner, key) {
  const re = new RegExp(`\\n?${key}:\\s*[^\\n]*(?:\\n[ \\t]+[^\\n]*)*`, 'gm');
  return inner.replace(re, '').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}
function setFieldJSON(inner, key, value) {
  const stripped = removeField(inner, key);
  const line = `${key}: ${JSON.stringify(value)}`;
  return stripped ? `${stripped}\n${line}\n` : `${line}\n`;
}
function setFieldObject(inner, key, value) {
  const stripped = removeField(inner, key);
  const yaml = `${key}:\n` + Object.entries(value).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n');
  return stripped ? `${stripped}\n${yaml}\n` : `${yaml}\n`;
}

// --- Canonical 部首 → (allomorphs table) ---
// Entries: [semanticCluster, allomorphList[]]
// Each allomorph = { glyph, position, strokes (count, optional), strokeSequence (5-type, optional) }
const CLUSTER_TABLE = [
  ['水', [
    { glyph: '氵', position: 'left', strokeSequence: ['点','点','提→横'] },
    { glyph: '水', position: 'bottom' },
    { glyph: '氺', position: 'bottom' },
  ]],
  ['手', [
    { glyph: '扌', position: 'left', strokeSequence: ['横','竖钩','提→横'] },
    { glyph: '手', position: 'bottom' },
    { glyph: '龵', position: 'top' },
  ]],
  ['心', [
    { glyph: '忄', position: 'left', strokeSequence: ['点','点','竖'] },
    { glyph: '心', position: 'bottom' },
    { glyph: '⺗', position: 'bottom' },
  ]],
  ['火', [
    { glyph: '火', position: 'bottom' },
    { glyph: '灬', position: 'bottom' },
  ]],
  ['人', [
    { glyph: '亻', position: 'left', strokeSequence: ['撇','竖'] },
    { glyph: '人', position: 'top' },
    { glyph: '入', position: 'top' },
  ]],
  ['阜/邑', [
    { glyph: '阝', position: 'left' }, // 阜 左耳
    { glyph: '阝', position: 'right' }, // 邑 右耳
  ]],
  ['言', [
    { glyph: '讠', position: 'left', strokeSequence: ['点','横折提→折'] },
    { glyph: '言', position: 'top' },
  ]],
  ['口', [
    { glyph: '口', position: 'left' },
    { glyph: '口', position: 'top' },
    { glyph: '口', position: 'right' },
  ]],
  ['日', [
    { glyph: '日', position: 'left' },
    { glyph: '日', position: 'top' },
    { glyph: '曰', position: 'top' },
  ]],
  ['月', [
    { glyph: '月', position: 'left' },
    { glyph: '月', position: 'right' },
    { glyph: '月', position: 'bottom' },
  ]],
  ['木', [
    { glyph: '木', position: 'left' },
    { glyph: '木', position: 'top' },
    { glyph: '木', position: 'bottom' },
  ]],
  ['土', [
    { glyph: '土', position: 'left' },
    { glyph: '土', position: 'bottom' },
    { glyph: '土', position: 'top' },
  ]],
  ['金', [
    { glyph: '钅', position: 'left' },
    { glyph: '金', position: 'bottom' },
    { glyph: '金', position: 'top' },
  ]],
  ['女', [
    { glyph: '女', position: 'left' },
    { glyph: '女', position: 'bottom' },
    { glyph: '女', position: 'top' },
  ]],
  ['糸', [
    { glyph: '纟', position: 'left' },
    { glyph: '糸', position: 'bottom' },
  ]],
  ['疒', [
    { glyph: '疒', position: 'surround' },
  ]],
  ['宀', [
    { glyph: '宀', position: 'top' },
  ]],
  ['辶', [
    { glyph: '辶', position: 'bottom' },
  ]],
  ['囗', [
    { glyph: '囗', position: 'surround' }, // full enclosure
  ]],
  ['广', [
    { glyph: '广', position: 'surround' },
  ]],
  ['厂', [
    { glyph: '厂', position: 'surround' },
  ]],
  ['尸', [
    { glyph: '尸', position: 'surround' },
  ]],
  ['气', [
    { glyph: '气', position: 'surround' },
  ]],
  ['冂', [
    { glyph: '冂', position: 'surround' },
  ]],
  ['匚', [
    { glyph: '匚', position: 'surround' },
  ]],
  ['匸', [
    { glyph: '匸', position: 'surround' },
  ]],
  ['门', [
    { glyph: '门', position: 'surround' },
  ]],
  ['凵', [
    { glyph: '凵', position: 'surround' },
  ]],
  ['戈', [
    { glyph: '戈', position: 'right' },
  ]],
  ['山', [
    { glyph: '山', position: 'left' },
    { glyph: '山', position: 'top' },
  ]],
  ['页', [
    { glyph: '页', position: 'right' },
  ]],
  ['目', [
    { glyph: '目', position: 'left' },
    { glyph: '目', position: 'bottom' },
  ]],
  ['父', [
    { glyph: '父', position: 'top' },
  ]],
  ['车', [
    { glyph: '车', position: 'left' },
    { glyph: '车', position: 'top' },
  ]],
  ['彳', [
    { glyph: '彳', position: 'left' },
  ]],
  ['夂', [
    { glyph: '夂', position: 'bottom' },
    { glyph: '夊', position: 'bottom' },
  ]],
  ['大', [
    { glyph: '大', position: 'top' },
    { glyph: '大', position: 'bottom' },
  ]],
  ['小', [
    { glyph: '小', position: 'top' },
    { glyph: '⺌', position: 'top' },
  ]],
  ['戈', [
    { glyph: '戈', position: 'right' },
  ]],
  ['匚', [
    { glyph: '匚', position: 'centre' },
  ]],
  ['户', [
    { glyph: '户', position: 'top' },
  ]],
  ['力', [
    { glyph: '力', position: 'right' },
    { glyph: '力', position: 'bottom' },
  ]],
  ['欠', [
    { glyph: '欠', position: 'right' },
  ]],
  ['京', [
    { glyph: '京', position: 'top' },
  ]],
  ['儿', [
    { glyph: '儿', position: 'bottom' },
  ]],
  ['方', [
    { glyph: '方', position: 'top' },
    { glyph: '方', position: 'left' },
    { glyph: '方', position: 'right' },
  ]],
  ['行', [
    { glyph: '行', position: 'centre' },
  ]],
  ['子', [
    { glyph: '子', position: 'bottom' },
    { glyph: '子', position: 'left' },
    { glyph: '孑', position: 'left' },
  ]],
  ['至', [
    { glyph: '至', position: 'left' },
    { glyph: '至', position: 'top' },
  ]],
  ['又', [
    { glyph: '又', position: 'bottom' },
    { glyph: '又', position: 'right' },
  ]],
  ['乙', [
    { glyph: '乙', position: 'bottom' },
    { glyph: '乛', position: 'top' },
  ]],
  ['生', [
    { glyph: '生', position: 'top' },
  ]],
  ['矢', [
    { glyph: '矢', position: 'left' },
  ]],
  ['巾', [
    { glyph: '巾', position: 'bottom' },
  ]],
  ['厂', [
    { glyph: '厂', position: 'surround' },
  ]],
  ['田', [
    { glyph: '田', position: 'top' },
    { glyph: '田', position: 'left' },
  ]],
  ['爫', [
    { glyph: '爫', position: 'top' },
  ]],
  ['襾', [
    { glyph: '襾', position: 'top' },
  ]],
  ['里', [
    { glyph: '里', position: 'centre' },
  ]],
  ['十', [
    { glyph: '十', position: 'centre' },
  ]],
  ['八', [
    { glyph: '八', position: 'top' },
  ]],
  ['丨', [
    { glyph: '丨', position: 'centre' },
  ]],
  ['一', [
    { glyph: '一', position: 'top' },
  ]],
  ['干', [
    { glyph: '干', position: 'top' },
  ]],
  ['厶', [
    { glyph: '厶', position: 'bottom' },
  ]],
  ['凵', [
    { glyph: '凵', position: 'surround' },
  ]],
  ['刂', [
    { glyph: '刂', position: 'right' },
  ]],
  ['见', [
    { glyph: '见', position: 'bottom' },
  ]],
  ['门', [
    { glyph: '门', position: 'surround' },
  ]],
  ['耂', [
    { glyph: '耂', position: 'top' },
  ]],
  ['工', [
    { glyph: '工', position: 'centre' },
  ]],
];

// Map: radicalText (legacy 部首 field value) → semanticCluster key
const RADICAL_TO_CLUSTER = {
  '氵': '水', '水': '水', '氺': '水',
  '扌': '手', '手': '手',
  '忄': '心', '心': '心', '⺗': '心',
  '灬': '火', '火': '火',
  '亻': '人', '人': '人', '入': '人',
  '阝（左）': '阜/邑', '阝（右）': '阜/邑', '阝': '阜/邑',
  '讠（言）': '言', '言': '言',
  '口': '口',
  '日': '日', '曰': '日',
  '月': '月',
  '木': '木',
  '土': '土',
  '钅': '金', '金': '金',
  '女': '女',
  '纟（糸）': '糸', '糸': '糸',
  '疒': '疒',
  '宀': '宀',
  '辶': '辶',
  '囗': '囗',
  '山': '山',
  '页（頁）': '页', '页': '页',
  '目': '目',
  '父': '父',
  '车（車）': '车', '车': '车',
  '彳': '彳',
  '夂': '夂', '夊': '夂',
  '大': '大',
  '小': '小', '⺌': '小',
  '戈': '戈',
  '匚': '匚',
  '户': '户',
  '丶': '丶', '乛（乙）': '乙',
  '力': '力',
  '欠': '欠',
  '京': '京',
  '儿': '儿',
  '方': '方',
  '行': '行',
  '生': '生',
  '矢': '矢',
  '巾': '巾',
  '厂': '厂',
  '田': '田',
  '爫': '爫',
  '襾': '襾',
  '里': '里',
  '十': '十',
  '八': '八',
  '丨': '丨',
  '一': '一',
  '干': '干',
  '耂（老）': '耂',
  '厶': '厶',
  '凵': '凵',
  '刂': '刂',
  '见（見）': '见', '见': '见',
  '门（門）': '门', '门': '门',
  '工': '工',
  '子': '子', '孑': '子',
  '至': '至',
  '又': '又',
  '乙': '乙', '乛': '乙',
  '匸': '匸',
  '广': '广',
  '尸': '尸',
  '冂': '冂',
  '气': '气',
};
const POSITION_ORDER = ['left', 'right', 'top', 'bottom', 'centre', 'surround'];

// --- Char-specific overrides for known high-frequency characters (explicit assignment beats fuzzy heuristics) ---
const CHAR_EXPLICIT = {
  '中': { semanticCluster: '丨', headingForm: { glyph: '丨', position: 'centre' }, peripheral: { glyphs: ['口'] } },
  '国': { semanticCluster: '囗', headingForm: { glyph: '囗', position: 'surround' }, peripheral: { glyphs: ['玉'] } },
  '道': { semanticCluster: '辶', headingForm: { glyph: '辶', position: 'bottom' }, peripheral: { glyphs: ['首'] } },
  '德': { semanticCluster: '彳', headingForm: { glyph: '彳', position: 'left' }, peripheral: { glyphs: ['十','四','一','心'] } },
  '学': { semanticCluster: '子', headingForm: { glyph: '子', position: 'bottom' }, peripheral: { glyphs: ['⺍','冖'] } },
  '习': { semanticCluster: null, headingForm: null, peripheral: { glyphs: ['习'] } },
  '语': { semanticCluster: '言', headingForm: { glyph: '讠', position: 'left' }, peripheral: { glyphs: ['吾'] } },
  '话': { semanticCluster: '言', headingForm: { glyph: '讠', position: 'left' }, peripheral: { glyphs: ['舌'] } },
  '说': { semanticCluster: '言', headingForm: { glyph: '讠', position: 'left' }, peripheral: { glyphs: ['兑'] } },
  '读': { semanticCluster: '言', headingForm: { glyph: '讠', position: 'left' }, peripheral: { glyphs: ['卖'] } },
  '认': { semanticCluster: '言', headingForm: { glyph: '讠', position: 'left' }, peripheral: { glyphs: ['人'] } },
  '识': { semanticCluster: '言', headingForm: { glyph: '讠', position: 'left' }, peripheral: { glyphs: ['只'] } },
  '问': { semanticCluster: '门', headingForm: { glyph: '门', position: 'surround' }, peripheral: { glyphs: ['口'] } },
  '间': { semanticCluster: '门', headingForm: { glyph: '门', position: 'surround' }, peripheral: { glyphs: ['日'] } },
  '题': { semanticCluster: '页', headingForm: { glyph: '页', position: 'right' }, peripheral: { glyphs: ['是'] } },
  '就': { semanticCluster: '京', headingForm: { glyph: '京', position: 'top' }, peripheral: { glyphs: ['尤'] } },
  '院': { semanticCluster: '阜/邑', headingForm: { glyph: '阝', position: 'left' }, peripheral: { glyphs: ['完'] } },
  '华': { semanticCluster: '十', headingForm: { glyph: '十', position: 'bottom' }, peripheral: { glyphs: ['化'] } },
  '写': { semanticCluster: '宀', headingForm: { glyph: '冖', position: 'top' }, peripheral: { glyphs: ['与'] } },
  '字': { semanticCluster: '宀', headingForm: { glyph: '宀', position: 'top' }, peripheral: { glyphs: ['子'] } },
  '家': { semanticCluster: '宀', headingForm: { glyph: '宀', position: 'top' }, peripheral: { glyphs: ['豕'] } },
  '宝': { semanticCluster: '宀', headingForm: { glyph: '宀', position: 'top' }, peripheral: { glyphs: ['玉'] } },
  '昨': { semanticCluster: '日', headingForm: { glyph: '日', position: 'left' }, peripheral: { glyphs: ['乍'] } },
  '时': { semanticCluster: '日', headingForm: { glyph: '日', position: 'left' }, peripheral: { glyphs: ['寸'] } },
  '明': { semanticCluster: '日', headingForm: { glyph: '日', position: 'left' }, peripheral: { glyphs: ['月'] } },
  '是': { semanticCluster: '日', headingForm: { glyph: '日', position: 'top' }, peripheral: { glyphs: ['疋'] } },
  '老': { semanticCluster: '耂', headingForm: { glyph: '耂', position: 'top' }, peripheral: { glyphs: ['匕'] } },
  '师': { semanticCluster: '巾', headingForm: { glyph: '巾', position: 'bottom' }, peripheral: { glyphs: ['丨','丿','一'] } },
  '医': { semanticCluster: '匚', headingForm: { glyph: '匚', position: 'surround' }, peripheral: { glyphs: ['矢'] } },
  '都': { semanticCluster: '阜/邑', headingForm: { glyph: '阝', position: 'right' }, peripheral: { glyphs: ['者'] } },
  '到': { semanticCluster: '至', headingForm: { glyph: '至', position: 'left' }, peripheral: { glyphs: ['刂'] } },
  '知': { semanticCluster: '矢', headingForm: { glyph: '矢', position: 'left' }, peripheral: { glyphs: ['口'] } },
  '真': { semanticCluster: '目', headingForm: { glyph: '目', position: 'centre' }, peripheral: { glyphs: ['十','具'] } },
  '正': { semanticCluster: '一', headingForm: { glyph: '一', position: 'top' }, peripheral: { glyphs: ['止'] } },
  '方': { semanticCluster: '方', headingForm: { glyph: '方', position: 'top' }, peripheral: { glyphs: ['丶','万'] } },
  '地': { semanticCluster: '土', headingForm: { glyph: '土', position: 'left' }, peripheral: { glyphs: ['也'] } },
  '世': { semanticCluster: '一', headingForm: { glyph: '一', position: 'top' }, peripheral: { glyphs: ['卅'] } },
  '界': { semanticCluster: '田', headingForm: { glyph: '田', position: 'top' }, peripheral: { glyphs: ['介'] } },
  '喜': { semanticCluster: '口', headingForm: { glyph: '口', position: 'bottom' }, peripheral: { glyphs: ['壴','口'] } },
  '欢': { semanticCluster: '欠', headingForm: { glyph: '欠', position: 'right' }, peripheral: { glyphs: ['雚'] } },
  '乐': { semanticCluster: '木', headingForm: { glyph: '木', position: 'bottom' }, peripheral: { glyphs: ['幺','小'] } },
  '光': { semanticCluster: '儿', headingForm: { glyph: '儿', position: 'bottom' }, peripheral: { glyphs: ['⺌','一'] } },
  '阳': { semanticCluster: '阜/邑', headingForm: { glyph: '阝', position: 'left' }, peripheral: { glyphs: ['日'] } },
  '太': { semanticCluster: '大', headingForm: { glyph: '大', position: 'centre' }, peripheral: { glyphs: ['丶'] } },
  '美': { semanticCluster: '大', headingForm: { glyph: '大', position: 'bottom' }, peripheral: { glyphs: ['羊'] } },
  '好': { semanticCluster: '女', headingForm: { glyph: '女', position: 'left' }, peripheral: { glyphs: ['子'] } },
  '常': { semanticCluster: '巾', headingForm: { glyph: '巾', position: 'bottom' }, peripheral: { glyphs: ['尚'] } },
  '经': { semanticCluster: '糸', headingForm: { glyph: '纟', position: 'left' }, peripheral: { glyphs: ['坙'] } },
  '坐': { semanticCluster: '土', headingForm: { glyph: '土', position: 'bottom' }, peripheral: { glyphs: ['人','人'] } },
  '可': { semanticCluster: '口', headingForm: { glyph: '口', position: 'right' }, peripheral: { glyphs: ['丁'] } },
  '所': { semanticCluster: '户', headingForm: { glyph: '户', position: 'left' }, peripheral: { glyphs: ['斤'] } },
  '过': { semanticCluster: '辶', headingForm: { glyph: '辶', position: 'bottom' }, peripheral: { glyphs: ['寸'] } },
  '爱': { semanticCluster: '爫', headingForm: { glyph: '爫', position: 'top' }, peripheral: { glyphs: ['冖','心','夂'] } },
  '我': { semanticCluster: '戈', headingForm: { glyph: '戈', position: 'right' }, peripheral: { glyphs: ['手'] } },
  '后': { semanticCluster: '口', headingForm: { glyph: '口', position: 'bottom' }, peripheral: { glyphs: ['𠂆'] } },
  '前': { semanticCluster: '刂', headingForm: { glyph: '刂', position: 'right' }, peripheral: { glyphs: ['歬'] } },
  '年': { semanticCluster: '干', headingForm: { glyph: '干', position: 'top' }, peripheral: { glyphs: ['千','牛'] } },
  '书': { semanticCluster: '乙', headingForm: { glyph: '乙', position: 'bottom' }, peripheral: { glyphs: ['曰','丨'] } },
  '先': { semanticCluster: '儿', headingForm: { glyph: '儿', position: 'bottom' }, peripheral: { glyphs: ['牛'] } },
  '要': { semanticCluster: '襾', headingForm: { glyph: '襾', position: 'top' }, peripheral: { glyphs: ['女'] } },
  '父': { semanticCluster: '父', headingForm: { glyph: '父', position: 'top' }, peripheral: { glyphs: ['乂','丶'] } },
  '母': { semanticCluster: '女', headingForm: { glyph: '女', position: 'centre' }, peripheral: { glyphs: ['两点'] } },
  '爸': { semanticCluster: '父', headingForm: { glyph: '父', position: 'top' }, peripheral: { glyphs: ['巴'] } },
  '妈': { semanticCluster: '女', headingForm: { glyph: '女', position: 'left' }, peripheral: { glyphs: ['马'] } },
  '朋': { semanticCluster: '月', headingForm: { glyph: '月', position: 'left' }, peripheral: { glyphs: ['月'] } },
  '友': { semanticCluster: '又', headingForm: { glyph: '又', position: 'bottom' }, peripheral: { glyphs: ['𠂇'] } },
  '工': { semanticCluster: '工', headingForm: { glyph: '工', position: 'centre' }, peripheral: { glyphs: ['一','丨','一'] } },
  '作': { semanticCluster: '人', headingForm: { glyph: '亻', position: 'left' }, peripheral: { glyphs: ['乍'] } },
  '区': { semanticCluster: '匸', headingForm: { glyph: '匸', position: 'surround' }, peripheral: { glyphs: ['乂'] } },
  '疼': { semanticCluster: '疒', headingForm: { glyph: '疒', position: 'surround' }, peripheral: { glyphs: ['冬'] } },
  '病': { semanticCluster: '疒', headingForm: { glyph: '疒', position: 'surround' }, peripheral: { glyphs: ['丙'] } },
  '底': { semanticCluster: '广', headingForm: { glyph: '广', position: 'surround' }, peripheral: { glyphs: ['氐'] } },
  '厅': { semanticCluster: '厂', headingForm: { glyph: '厂', position: 'surround' }, peripheral: { glyphs: ['丁'] } },
  '居': { semanticCluster: '尸', headingForm: { glyph: '尸', position: 'surround' }, peripheral: { glyphs: ['古'] } },
  '同': { semanticCluster: '冂', headingForm: { glyph: '冂', position: 'surround' }, peripheral: { glyphs: ['一','口'] } },
};

// --- Utility: pick allomorph for a char + cluster based on char glyph presence or explicit override ---
function pickAllomorph(char, cluster, charSequence, hfOverride) {
  if (hfOverride) {
    const clusterAllos = CLUSTER_TABLE.find(([k]) => k === cluster)?.[1] ?? [];
    // allow override glyph to be matched against any allo
    const m = clusterAllos.find(a => a.glyph === hfOverride.glyph) ?? clusterAllos.find(a => a.position === hfOverride.position) ?? null;
    if (m) {
      const seq = normalizeSeq(m.strokeSequence ?? []);
      return { glyph: hfOverride.glyph ?? m.glyph, position: hfOverride.position ?? m.position, strokes: seq.length, strokeSequence: seq };
    }
    return { glyph: hfOverride.glyph, position: hfOverride.position, strokes: hfOverride.strokeSequence?.length ?? null, strokeSequence: normalizeSeq(hfOverride.strokeSequence ?? []) };
  }
  if (!cluster) return null;
  const clusterRow = CLUSTER_TABLE.find(([k]) => k === cluster);
  if (!clusterRow) return null;
  const allos = clusterRow[1];
  // Pick first allo whose glyph appears in char; fallback to first allo if none match glyph-identity
  const byGlyph = allos.find(a => char.includes(a.glyph));
  if (byGlyph) {
    const seq = normalizeSeq(byGlyph.strokeSequence ?? []);
    return { glyph: byGlyph.glyph, position: byGlyph.position, strokes: seq.length || null, strokeSequence: seq };
  }
  const first = allos[0];
  const seq = normalizeSeq(first.strokeSequence ?? []);
  return { glyph: first.glyph, position: first.position, strokes: seq.length || null, strokeSequence: seq };
}

function computePeripheralStrokes(totalStrokes, allomorph) {
  const allo = allomorph?.strokes ?? 0;
  const n = (typeof totalStrokes === 'number') ? totalStrokes - allo : null;
  return n == null ? null : Math.max(0, n);
}

// --- Main: iterate all characters, rewrite frontmatter when fields missing or stale ---
const files = fs.readdirSync(charsDir).filter(f => f.endsWith('.md'));
let changed = 0, skipped = 0;
for (const f of files) {
  const p = path.join(charsDir, f);
  const txt = fs.readFileSync(p, 'utf8');
  const block = readBlock(txt);
  if (!block) { skipped++; continue; }
  const char = f.slice(0, -3);
  const radField = (getField(block.inner, 'radical') || '').match(/^radical:\s*(.*)$/m)?.[1]?.trim() ?? '';
  const radVal = radField.startsWith('"') || radField.startsWith("'") ? radField.slice(1, -1) : radField;
  const seq = parseSeqLiteral(block.inner) ?? [];
  const strokesMatch = block.inner.match(/^strokes:\s*(\d+)\s*$/m);
  const totalStrokes = strokesMatch ? Number(strokesMatch[1]) : seq.length;

  let semanticCluster;
  let headingFormOverride = null;
  let peripheralOverride = null;

  const explicit = CHAR_EXPLICIT[char];
  if (explicit) {
    semanticCluster = explicit.semanticCluster ?? null;
    headingFormOverride = explicit.headingForm;
    peripheralOverride = explicit.peripheral;
  } else {
    semanticCluster = radVal ? (RADICAL_TO_CLUSTER[radVal] ?? null) : null;
  }

  const allomorph = pickAllomorph(char, semanticCluster, seq, headingFormOverride);
  const headingForm = allomorph ? {
    glyph: allomorph.glyph,
    position: allomorph.position,
    strokes: allomorph.strokes ?? undefined,
    strokeSequence: allomorph.strokeSequence.length ? allomorph.strokeSequence : undefined,
  } : null;

  const peripheralStrokes = computePeripheralStrokes(totalStrokes, allomorph);
  const peripheral = {
    glyphs: peripheralOverride?.glyphs ?? [],
    strokes: peripheralOverride?.strokes ?? peripheralStrokes ?? undefined,
    strokeSequence: peripheralOverride?.strokeSequence ?? [],
  };
  // drop empty strokes key to keep YAML tight
  if (peripheral.strokes === undefined) delete peripheral.strokes;

  let newInner = block.inner;
  newInner = setFieldJSON(newInner, 'semanticCluster', semanticCluster);
  if (headingForm) {
    const hf = { glyph: headingForm.glyph, position: headingForm.position };
    if (headingForm.strokes != null) hf.strokes = headingForm.strokes;
    if (headingForm.strokeSequence?.length) hf.strokeSequence = headingForm.strokeSequence;
    newInner = setFieldObject(newInner, 'headingForm', hf);
  } else {
    newInner = removeField(newInner, 'headingForm');
    if (newInner && !newInner.endsWith('\n')) newInner += '\n';
    newInner += `headingForm: null\n`;
  }
  const perObj = { glyphs: peripheral.glyphs, strokeSequence: peripheral.strokeSequence };
  if (peripheral.strokes !== undefined) perObj.strokes = peripheral.strokes;
  // if strokeSequence is empty, drop it to keep files clean
  if (perObj.strokeSequence.length === 0) delete perObj.strokeSequence;
  newInner = setFieldObject(newInner, 'peripherals', perObj);

  // Normalize level field to 一级 if still broken (belt + suspenders)
  const lm = newInner.match(/^level:\s*"([^"]*)"\s*$/m);
  if (lm) {
    const mapBad = { '一':'一级','二':'二级','三':'三级','1':'一级','2':'二级','3':'三级' };
    if (mapBad[lm[1]]) {
      newInner = newInner.replace(/^level:\s*"[^"]*"\s*$/m, `level: "${mapBad[lm[1]]}"`);
    }
  }

  const newBlock = '---\n' + newInner + (newInner.endsWith('\n') ? '' : '\n') + '---' + (block.trailing || '\n');
  const newTxt = txt.slice(0, block.start) + newBlock + txt.slice(block.end);
  if (newTxt !== txt) {
    fs.writeFileSync(p, newTxt, 'utf8');
    changed++;
  } else {
    skipped++;
  }
}
console.log(`files=${files.length} changed=${changed} skipped=${skipped}`);
