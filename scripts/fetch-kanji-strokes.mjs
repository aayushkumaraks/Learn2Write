import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Fetches authentic KanjiVG SVG stroke order data (CC BY-SA 3.0)
 * for 45 essential daily-use Kanji and writes them to src/data/kanjiStrokes.json.
 */
const DAILY_KANJI = [
  // Numbers & Money
  { char: '一', romaji: 'ichi (one)' },
  { char: '二', romaji: 'ni (two)' },
  { char: '三', romaji: 'san (three)' },
  { char: '四', romaji: 'yon (four)' },
  { char: '五', romaji: 'go (five)' },
  { char: '六', romaji: 'roku (six)' },
  { char: '七', romaji: 'nana (seven)' },
  { char: '八', romaji: 'hachi (eight)' },
  { char: '九', romaji: 'kyū (nine)' },
  { char: '十', romaji: 'jū (ten)' },
  { char: '百', romaji: 'hyaku (hundred)' },
  { char: '千', romaji: 'sen (thousand)' },
  { char: '万', romaji: 'man (10k)' },
  { char: '円', romaji: 'en (yen)' },

  // Days, Elements & Nature
  { char: '日', romaji: 'nichi (sun/day)' },
  { char: '月', romaji: 'getsu (moon)' },
  { char: '火', romaji: 'ka (fire)' },
  { char: '水', romaji: 'sui (water)' },
  { char: '木', romaji: 'moku (tree)' },
  { char: '金', romaji: 'kin (gold)' },
  { char: '土', romaji: 'do (earth)' },
  { char: '山', romaji: 'yama (mountain)' },
  { char: '川', romaji: 'kawa (river)' },
  { char: '田', romaji: 'ta (rice field)' },

  // People & Body
  { char: '人', romaji: 'hito (person)' },
  { char: '口', romaji: 'kuchi (mouth)' },
  { char: '目', romaji: 'me (eye)' },
  { char: '耳', romaji: 'mimi (ear)' },
  { char: '手', romaji: 'te (hand)' },
  { char: '足', romaji: 'ashi (foot)' },
  { char: '力', romaji: 'chikara (power)' },
  { char: '子', romaji: 'ko (child)' },
  { char: '女', romaji: 'onna (woman)' },
  { char: '男', romaji: 'otoko (man)' },

  // Size, Position & Daily Life
  { char: '大', romaji: 'dai (big)' },
  { char: '小', romaji: 'shō (small)' },
  { char: '中', romaji: 'naka (middle)' },
  { char: '上', romaji: 'ue (up)' },
  { char: '下', romaji: 'shita (down)' },
  { char: '左', romaji: 'hidari (left)' },
  { char: '右', romaji: 'migi (right)' },
  { char: '本', romaji: 'hon (book)' },
  { char: '名', romaji: 'na (name)' },
  { char: '年', romaji: 'toshi (year)' },
  { char: '今', romaji: 'ima (now)' },
];

function parseKanjiVgSvg(svgText) {
  const strokes = [];
  const pathRegex = /<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/g;
  let match;
  while ((match = pathRegex.exec(svgText)) !== null) {
    strokes.push(match[1].trim());
  }

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

async function fetchCharacter(item, idx) {
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
    char: item.char,
    romaji: item.romaji,
    row: `k${Math.floor(idx / 5)}`,
    col: idx % 5,
    script: 'kanji',
    unicode: codeHex,
    strokes,
    numberPositions,
  };
}

async function main() {
  const kanji = [];
  const concurrency = 10;
  for (let i = 0; i < DAILY_KANJI.length; i += concurrency) {
    const slice = DAILY_KANJI.slice(i, i + concurrency);
    const chunk = await Promise.all(
      slice.map((item, offset) => fetchCharacter(item, i + offset))
    );
    kanji.push(...chunk);
  }

  const output = {
    source: 'KanjiVG (https://kanjivg.tagaini.net/) - CC BY-SA 3.0',
    viewBox: '0 0 109 109',
    kanji,
  };

  const outPath = path.resolve(process.cwd(), 'src/data/kanjiStrokes.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Wrote ${kanji.length} daily-use kanji to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
