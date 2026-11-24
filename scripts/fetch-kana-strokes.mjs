import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Fetches authentic KanjiVG SVG stroke order data (CC BY-SA 3.0)
 * for all 46 basic Hiragana and 46 basic Katakana characters
 * and writes them to src/data/kanaStrokes.json.
 */

const HIRAGANA = [
  { char: 'あ', romaji: 'a', row: 'a', col: 0 },
  { char: 'い', romaji: 'i', row: 'a', col: 1 },
  { char: 'う', romaji: 'u', row: 'a', col: 2 },
  { char: 'え', romaji: 'e', row: 'a', col: 3 },
  { char: 'お', romaji: 'o', row: 'a', col: 4 },

  { char: 'か', romaji: 'ka', row: 'k', col: 0 },
  { char: 'き', romaji: 'ki', row: 'k', col: 1 },
  { char: 'く', romaji: 'ku', row: 'k', col: 2 },
  { char: 'け', romaji: 'ke', row: 'k', col: 3 },
  { char: 'こ', romaji: 'ko', row: 'k', col: 4 },

  { char: 'さ', romaji: 'sa', row: 's', col: 0 },
  { char: 'し', romaji: 'shi', row: 's', col: 1 },
  { char: 'す', romaji: 'su', row: 's', col: 2 },
  { char: 'せ', romaji: 'se', row: 's', col: 3 },
  { char: 'そ', romaji: 'so', row: 's', col: 4 },

  { char: 'た', romaji: 'ta', row: 't', col: 0 },
  { char: 'ち', romaji: 'chi', row: 't', col: 1 },
  { char: 'つ', romaji: 'tsu', row: 't', col: 2 },
  { char: 'て', romaji: 'te', row: 't', col: 3 },
  { char: 'と', romaji: 'to', row: 't', col: 4 },

  { char: 'な', romaji: 'na', row: 'n', col: 0 },
  { char: 'に', romaji: 'ni', row: 'n', col: 1 },
  { char: 'ぬ', romaji: 'nu', row: 'n', col: 2 },
  { char: 'ね', romaji: 'ne', row: 'n', col: 3 },
  { char: 'の', romaji: 'no', row: 'n', col: 4 },

  { char: 'は', romaji: 'ha', row: 'h', col: 0 },
  { char: 'ひ', romaji: 'hi', row: 'h', col: 1 },
  { char: 'ふ', romaji: 'fu', row: 'h', col: 2 },
  { char: 'へ', romaji: 'he', row: 'h', col: 3 },
  { char: 'ほ', romaji: 'ho', row: 'h', col: 4 },

  { char: 'ま', romaji: 'ma', row: 'm', col: 0 },
  { char: 'み', romaji: 'mi', row: 'm', col: 1 },
  { char: 'む', romaji: 'mu', row: 'm', col: 2 },
  { char: 'め', romaji: 'me', row: 'm', col: 3 },
  { char: 'も', romaji: 'mo', row: 'm', col: 4 },

  { char: 'や', romaji: 'ya', row: 'y', col: 0 },
  { char: 'ゆ', romaji: 'yu', row: 'y', col: 2 },
  { char: 'よ', romaji: 'yo', row: 'y', col: 4 },

  { char: 'ら', romaji: 'ra', row: 'r', col: 0 },
  { char: 'り', romaji: 'ri', row: 'r', col: 1 },
  { char: 'る', romaji: 'ru', row: 'r', col: 2 },
  { char: 'れ', romaji: 're', row: 'r', col: 3 },
  { char: 'ろ', romaji: 'ro', row: 'r', col: 4 },

  { char: 'わ', romaji: 'wa', row: 'w', col: 0 },
  { char: 'を', romaji: 'wo', row: 'w', col: 4 },
  { char: 'ん', romaji: 'n', row: 'nn', col: 0 },
];

const KATAKANA = [
  { char: 'ア', romaji: 'a', row: 'a', col: 0 },
  { char: 'イ', romaji: 'i', row: 'a', col: 1 },
  { char: 'ウ', romaji: 'u', row: 'a', col: 2 },
  { char: 'エ', romaji: 'e', row: 'a', col: 3 },
  { char: 'オ', romaji: 'o', row: 'a', col: 4 },

  { char: 'カ', romaji: 'ka', row: 'k', col: 0 },
  { char: 'キ', romaji: 'ki', row: 'k', col: 1 },
  { char: 'ク', romaji: 'ku', row: 'k', col: 2 },
  { char: 'ケ', romaji: 'ke', row: 'k', col: 3 },
  { char: 'コ', romaji: 'ko', row: 'k', col: 4 },

  { char: 'サ', romaji: 'sa', row: 's', col: 0 },
  { char: 'シ', romaji: 'shi', row: 's', col: 1 },
  { char: 'ス', romaji: 'su', row: 's', col: 2 },
  { char: 'セ', romaji: 'se', row: 's', col: 3 },
  { char: 'ソ', romaji: 'so', row: 's', col: 4 },

  { char: 'タ', romaji: 'ta', row: 't', col: 0 },
  { char: 'チ', romaji: 'chi', row: 't', col: 1 },
  { char: 'ツ', romaji: 'tsu', row: 't', col: 2 },
  { char: 'テ', romaji: 'te', row: 't', col: 3 },
  { char: 'ト', romaji: 'to', row: 't', col: 4 },

  { char: 'ナ', romaji: 'na', row: 'n', col: 0 },
  { char: 'ニ', romaji: 'ni', row: 'n', col: 1 },
  { char: 'ヌ', romaji: 'nu', row: 'n', col: 2 },
  { char: 'ネ', romaji: 'ne', row: 'n', col: 3 },
  { char: 'ノ', romaji: 'no', row: 'n', col: 4 },

  { char: 'ハ', romaji: 'ha', row: 'h', col: 0 },
  { char: 'ヒ', romaji: 'hi', row: 'h', col: 1 },
  { char: 'フ', romaji: 'fu', row: 'h', col: 2 },
  { char: 'ヘ', romaji: 'he', row: 'h', col: 3 },
  { char: 'ホ', romaji: 'ho', row: 'h', col: 4 },

  { char: 'マ', romaji: 'ma', row: 'm', col: 0 },
  { char: 'ミ', romaji: 'mi', row: 'm', col: 1 },
  { char: 'ム', romaji: 'mu', row: 'm', col: 2 },
  { char: 'メ', romaji: 'me', row: 'm', col: 3 },
  { char: 'モ', romaji: 'mo', row: 'm', col: 4 },

  { char: 'ヤ', romaji: 'ya', row: 'y', col: 0 },
  { char: 'ユ', romaji: 'yu', row: 'y', col: 2 },
  { char: 'ヨ', romaji: 'yo', row: 'y', col: 4 },

  { char: 'ラ', romaji: 'ra', row: 'r', col: 0 },
  { char: 'リ', romaji: 'ri', row: 'r', col: 1 },
  { char: 'ル', romaji: 'ru', row: 'r', col: 2 },
  { char: 'レ', romaji: 're', row: 'r', col: 3 },
  { char: 'ロ', romaji: 'ro', row: 'r', col: 4 },

  { char: 'ワ', romaji: 'wa', row: 'w', col: 0 },
  { char: 'ヲ', romaji: 'wo', row: 'w', col: 4 },
  { char: 'ン', romaji: 'n', row: 'nn', col: 0 },
];

function parseKanjiVgSvg(svgText) {
  // Extract ordered stroke <path ... d="..." /> elements
  const strokes = [];
  const pathRegex = /<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/g;
  let match;
  while ((match = pathRegex.exec(svgText)) !== null) {
    strokes.push(match[1].trim());
  }

  // Extract stroke number label positions from <text transform="matrix(1 0 0 1 x y)">n</text>
  const numberPositions = [];
  const textRegex = /<text\b[^>]*transform="matrix\(1 0 0 1 ([0-9.-]+) ([0-9.-]+)\)"[^>]*>\s*(\d+)\s*<\/text>/g;
  while ((match = textRegex.exec(svgText)) !== null) {
    numberPositions.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      num: parseInt(match[3], 10),
    });
  }

  return { strokes, numberPositions };
}

async function fetchCharacter(item, script) {
  const codeHex = item.char.codePointAt(0).toString(16).padStart(5, '0');
  const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${codeHex}.svg`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${item.char} (${codeHex}): HTTP ${res.status}`);
  }
  const svg = await res.text();
  const { strokes, numberPositions } = parseKanjiVgSvg(svg);
  if (strokes.length === 0) {
    throw new Error(`No stroke paths found for ${item.char} (${codeHex})`);
  }
  return {
    ...item,
    script,
    unicode: codeHex,
    strokes,
    numberPositions,
  };
}

async function main() {
  const batchFetch = async (list, script) => {
    const results = [];
    const concurrency = 10;
    for (let i = 0; i < list.length; i += concurrency) {
      const slice = list.slice(i, i + concurrency);
      const chunk = await Promise.all(slice.map((item) => fetchCharacter(item, script)));
      results.push(...chunk);
    }
    return results;
  };

  console.log('Fetching 46 Hiragana stroke SVGs from KanjiVG...');
  const hiragana = await batchFetch(HIRAGANA, 'hiragana');
  console.log('Fetching 46 Katakana stroke SVGs from KanjiVG...');
  const katakana = await batchFetch(KATAKANA, 'katakana');

  const output = {
    source: 'KanjiVG (https://kanjivg.tagaini.net/) - CC BY-SA 3.0',
    viewBox: '0 0 109 109',
    hiragana,
    katakana,
  };

  const outPath = path.resolve(process.cwd(), 'src/data/kanaStrokes.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Wrote ${hiragana.length} hiragana + ${katakana.length} katakana to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
