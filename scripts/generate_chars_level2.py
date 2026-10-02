#!/usr/bin/env python3

import csv
import io
from pathlib import Path
import urllib.request
import datetime
import json

# ------------------------------------------------------------
# Sources
# ------------------------------------------------------------

# Path to your local Level 2 character list file
ROOT_DIR = Path(__file__).resolve().parent.parent
LEVEL2_TXT_PATH = ROOT_DIR / "scripts" / "level-2.txt"

STROKE_URL = (
    "https://raw.githubusercontent.com/"
    "takushun-wu/han-ideographs-stroke-order/master/order.tsv"
)

CHARS_JSON_URL = (
    "https://raw.githubusercontent.com/"
    "jaywcjlove/table-of-general-standard-chinese-characters/master/data/characters.json"
)

PINYIN_JSON_URL = (
    "https://raw.githubusercontent.com/"
    "jaywcjlove/table-of-general-standard-chinese-characters/master/data/pinyin.json"
)

# ------------------------------------------------------------
# Stroke Code Mapping (12345 -> 5-symbol set)
# ------------------------------------------------------------

STROKE_MAP = {
    '1': '一',
    '2': '丨',
    '3': '丿',
    '4': '丶',
    '5': '𠃊'
}

def translate_sequence(seq_str):
    tokens = []
    for char in seq_str:
        if char in STROKE_MAP:
            tokens.append(STROKE_MAP[char])
        elif char.isdigit():
            tokens.append(char)
    return tokens


# ------------------------------------------------------------
# Download helper
# ------------------------------------------------------------

def download(url):
    print(f"Downloading: {url}")
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(request) as response:
        return response.read().decode("utf-8")


# ------------------------------------------------------------
# Load Level-2 Characters & Pinyin Map
# ------------------------------------------------------------

def load_level2_and_pinyin():
    # 1. Load exact Level 2 characters from local file
    if not LEVEL2_TXT_PATH.exists():
        raise FileNotFoundError(f"Could not find Level 2 file at: {LEVEL2_TXT_PATH}")
    
    level2_text = LEVEL2_TXT_PATH.read_text(encoding="utf-8")
    chars = []
    for line in level2_text.splitlines():
        line = line.strip()
        if not line:
            continue
        for char in line:
            # Accepts any non-whitespace character instead of strict CJK range
            if not char.isspace():
                chars.append(char)
            # if '\u4e00' <= char <= '\u9fff':
            #    chars.append(char)
    level2_chars = list(dict.fromkeys(chars))  # Unique Level 2 characters

    # 2. Load official parallel character and pinyin tables for mapping
    all_chars = json.loads(download(CHARS_JSON_URL))
    all_pinyin = json.loads(download(PINYIN_JSON_URL))

    pinyin_map = {}
    for c, p in zip(all_chars, all_pinyin):
        if isinstance(p, list):
            pinyin_map[c] = p[0]  # Take primary pronunciation if multiple exist
        else:
            pinyin_map[c] = p

    return level2_chars, pinyin_map


# ------------------------------------------------------------
# Read stroke-order database
# ------------------------------------------------------------

def load_strokes(text):
    strokes = {}
    reader = csv.reader(io.StringIO(text), delimiter="\t")

    for row in reader:
        if not row or row[0].lower() in ("order", "序号") or len(row) < 5:
            continue

        char = row[1].strip()
        sequence = row[4].strip()

        if len(char) != 1 or not sequence:
            continue

        tokens = translate_sequence(sequence)
        if tokens:
            strokes[char] = tokens

    return strokes


# ------------------------------------------------------------
# Markdown Generator
# ------------------------------------------------------------

def write_markdown_files(level2, pinyin_map, strokes_map, output_dir):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    today_date = datetime.date.today().isoformat()
    missing_strokes = []
    missing_pinyin = []

    for char in level2:
        seq = strokes_map.get(char)
        if not seq:
            missing_strokes.append(char)
            # Provide a fallback sequence if missing from TSV
            seq = ["一"]

        pinyin = pinyin_map.get(char, "pīnyīn")
        if pinyin == "pīnyīn":
            missing_pinyin.append(char)

        total_strokes = len(seq)
        stroke_sequence_json = json.dumps(seq, ensure_ascii=False)
        
        markdown_content = f"""---
char: "{char}"
pinyin: "{pinyin}"
definition: "Standard Level 2 character entry for {char}"
strokes: {total_strokes}
strokeSequence: {stroke_sequence_json}
level: "二级"
relatedChars: []
semanticCluster: null
headingForm: null
peripherals:
  strokes: {total_strokes}
  strokeSequence: {stroke_sequence_json}
date: "{today_date}"
---

Standard Level 2 character entry for {char}.
"""

        file_path = output_path / f"{char}.md"
        file_path.write_text(markdown_content, encoding="utf-8")

    return missing_strokes, missing_pinyin


# ------------------------------------------------------------
# Main
# ------------------------------------------------------------

def main():
    level2, pinyin_map = load_level2_and_pinyin()
    print(f"Loaded Level-2 characters: {len(level2)}")

    stroke_text = download(STROKE_URL)
    strokes = load_strokes(stroke_text)
    print(f"Loaded characters in stroke database: {len(strokes)}")

    output_dir = ROOT_DIR / "scripts" / "characters2"
    missing_strokes, missing_pinyin = write_markdown_files(level2, pinyin_map, strokes, output_dir)

    if missing_strokes:
        print(f"\nWARNING: Stroke order missing for {len(missing_strokes)} characters (used fallback).")
    if missing_pinyin:
        print(f"\nWARNING: Pinyin missing for {len(missing_pinyin)} characters.")

    print()
    print("SUCCESS")
    print("-------")
    print(f"Generated {len(level2)} Level 2 markdown files in: {output_dir}/")


if __name__ == "__main__":
    main()