import type { KanaCharacter } from '../types/kana';

interface ThaiSeed {
  char: string;
  romaji: string;
  strokes: string[];
}

// 44 Thai consonants (ก–ฮ) with KanjiVG-compatible 109x109 SVG stroke paths.
// Most Thai letters begin at the head loop (หัว) and flow continuously in a single stroke;
// multi-stroke letters (ญ, ฐ, ศ, ษ) separate the base/tail or diacritic stroke.
const THAI_SEEDS: ThaiSeed[] = [
  { char: 'ก', romaji: 'ko', strokes: ['M 34 88 L 34 46 C 34 32, 42 24, 52 22 L 44 16 C 54 14, 74 20, 74 40 L 74 88'] },
  { char: 'ข', romaji: 'kho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 78 C 34 88, 74 88, 74 78 L 74 24'] },
  { char: 'ฃ', romaji: 'kho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 78 C 34 88, 74 88, 74 78 L 74 26 L 64 20 L 74 16'] },
  { char: 'ค', romaji: 'kho', strokes: ['M 44 48 C 38 48, 36 56, 42 58 C 48 58, 48 50, 44 48 M 38 56 L 34 86 L 34 40 C 34 20, 74 20, 74 40 L 74 86'] },
  { char: 'ฅ', romaji: 'kho', strokes: ['M 44 48 C 38 48, 36 56, 42 58 C 48 58, 48 50, 44 48 M 38 56 L 34 86 L 34 38 C 34 20, 50 20, 54 30 C 58 20, 74 20, 74 38 L 74 86'] },
  { char: 'ฆ', romaji: 'kho', strokes: ['M 34 30 C 28 30, 28 38, 34 40 C 40 40, 40 32, 34 30 M 34 40 L 34 84 C 42 84, 50 74, 54 64 L 54 30 C 54 20, 74 20, 74 34 L 74 86'] },
  { char: 'ง', romaji: 'ngo', strokes: ['M 66 26 C 60 26, 58 34, 64 36 C 70 36, 72 28, 66 26 M 68 34 L 68 86 L 36 56'] },
  { char: 'จ', romaji: 'cho', strokes: ['M 44 58 C 38 58, 36 66, 42 68 C 48 68, 48 60, 44 58 M 40 66 L 34 86 L 34 42 C 34 20, 74 20, 74 42 L 74 86'] },
  { char: 'ฉ', romaji: 'cho', strokes: ['M 36 28 C 30 28, 28 36, 34 38 C 40 38, 42 30, 36 28 M 34 38 L 34 78 C 34 88, 66 88, 68 74 C 70 60, 54 56, 52 68 C 50 78, 72 86, 74 68 L 74 26'] },
  { char: 'ช', romaji: 'cho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 78 C 34 88, 74 88, 74 78 L 74 26 L 84 18'] },
  { char: 'ซ', romaji: 'so', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 78 C 34 88, 74 88, 74 78 L 74 28 L 64 22 L 74 18 L 84 12'] },
  { char: 'ฌ', romaji: 'cho', strokes: ['M 32 84 C 26 84, 26 76, 32 74 C 38 74, 38 82, 32 84 M 34 74 L 34 34 C 34 20, 54 20, 54 34 L 54 84 L 74 84 L 74 26'] },
  { char: 'ญ', romaji: 'yo', strokes: ['M 32 84 C 26 84, 26 76, 32 74 C 38 74, 38 82, 32 84 M 34 74 L 34 34 C 34 20, 74 20, 74 34 L 74 84', 'M 42 94 C 52 98, 68 98, 76 92'] },
  { char: 'ฎ', romaji: 'do', strokes: ['M 36 52 C 30 52, 28 60, 34 62 C 40 62, 40 54, 36 52 M 34 62 L 34 36 C 34 20, 74 20, 74 36 L 74 88 C 74 96, 56 98, 52 90 C 48 82, 62 78, 66 86'] },
  { char: 'ฏ', romaji: 'to', strokes: ['M 36 52 C 30 52, 28 60, 34 62 C 40 62, 40 54, 36 52 M 34 62 L 34 36 C 34 20, 74 20, 74 36 L 74 88 C 74 98, 52 98, 48 90 C 44 82, 58 80, 62 88 L 66 96'] },
  { char: 'ฐ', romaji: 'tho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 72 C 34 80, 74 80, 74 72 L 74 24', 'M 32 90 L 76 90 C 76 96, 54 98, 48 92'] },
  { char: 'ฑ', romaji: 'tho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 48 54 C 52 34, 74 34, 74 52 L 74 84'] },
  { char: 'ฒ', romaji: 'tho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 54 64 L 54 84 L 74 84 L 74 28'] },
  { char: 'ณ', romaji: 'no', strokes: ['M 32 84 C 26 84, 26 76, 32 74 C 38 74, 38 82, 32 84 M 34 74 L 34 34 C 34 20, 56 20, 56 34 L 56 84 L 74 84 L 74 24'] },
  { char: 'ด', romaji: 'do', strokes: ['M 54 56 C 48 56, 46 64, 52 66 C 58 66, 58 58, 54 56 M 52 66 L 34 84 L 34 40 C 34 20, 74 20, 74 40 L 74 84'] },
  { char: 'ต', romaji: 'to', strokes: ['M 54 56 C 48 56, 46 64, 52 66 C 58 66, 58 58, 54 56 M 52 66 L 34 84 L 34 38 C 34 20, 50 20, 54 30 C 58 20, 74 20, 74 38 L 74 84'] },
  { char: 'ถ', romaji: 'tho', strokes: ['M 38 84 C 32 84, 30 76, 36 74 C 42 74, 42 82, 38 84 M 34 74 L 34 40 C 34 20, 74 20, 74 40 L 74 84'] },
  { char: 'ท', romaji: 'tho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 52 40 C 56 24, 74 24, 74 42 L 74 84'] },
  { char: 'ธ', romaji: 'tho', strokes: ['M 34 24 L 68 24 L 34 48 L 34 84 L 74 84 L 74 42'] },
  { char: 'น', romaji: 'no', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 64 84 C 74 84, 76 68, 66 66 C 56 64, 56 80, 66 84 L 74 84 L 74 26'] },
  { char: 'บ', romaji: 'bo', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 74 84 L 74 26'] },
  { char: 'ป', romaji: 'po', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 74 84 L 74 12'] },
  { char: 'ผ', romaji: 'pho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 54 52 L 74 84 L 74 26'] },
  { char: 'ฝ', romaji: 'fo', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 54 52 L 74 84 L 74 12'] },
  { char: 'พ', romaji: 'pho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 54 44 L 74 84 L 74 26'] },
  { char: 'ฟ', romaji: 'fo', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 54 44 L 74 84 L 74 12'] },
  { char: 'ภ', romaji: 'pho', strokes: ['M 38 84 C 32 84, 30 76, 36 74 C 42 74, 42 82, 38 84 M 34 74 L 34 40 C 34 20, 74 20, 74 40 L 74 84'] },
  { char: 'ม', romaji: 'mo', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 78 C 34 88, 48 88, 48 76 C 48 64, 34 66, 34 76 L 74 76 L 74 26'] },
  { char: 'ย', romaji: 'yo', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 56 C 46 56, 46 70, 34 70 L 34 84 L 74 84 L 74 26'] },
  { char: 'ร', romaji: 'ro', strokes: ['M 52 84 C 46 84, 44 76, 50 74 C 56 74, 56 82, 52 84 M 50 74 L 50 48 C 50 36, 70 36, 70 26 C 70 18, 44 18, 38 26'] },
  { char: 'ล', romaji: 'lo', strokes: ['M 52 84 C 46 84, 44 76, 50 74 C 56 74, 56 82, 52 84 M 50 74 L 50 48 C 50 32, 34 32, 34 48 L 34 84 C 34 40, 74 22, 74 44 L 74 84'] },
  { char: 'ว', romaji: 'wo', strokes: ['M 66 84 C 60 84, 58 76, 64 74 C 70 74, 72 82, 66 84 M 68 74 L 68 42 C 68 20, 36 20, 36 42'] },
  { char: 'ศ', romaji: 'so', strokes: ['M 44 48 C 38 48, 36 56, 42 58 C 48 58, 48 50, 44 48 M 38 56 L 34 84 L 34 40 C 34 20, 74 20, 74 40 L 74 84', 'M 74 26 L 86 16'] },
  { char: 'ษ', romaji: 'so', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 74 84 L 74 26', 'M 34 62 L 62 44'] },
  { char: 'ส', romaji: 'so', strokes: ['M 52 84 C 46 84, 44 76, 50 74 C 56 74, 56 82, 52 84 M 50 74 L 50 48 C 50 32, 34 32, 34 48 L 34 84 C 34 40, 74 22, 74 44 L 74 84', 'M 74 26 L 86 16'] },
  { char: 'ห', romaji: 'ho', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 52 44 C 58 28, 74 30, 74 46 L 74 84 C 74 74, 62 74, 64 84'] },
  { char: 'ฬ', romaji: 'lo', strokes: ['M 36 30 C 30 30, 28 38, 34 40 C 40 40, 42 32, 36 30 M 34 40 L 34 84 L 54 44 L 74 84 L 74 26 C 74 16, 86 16, 84 26'] },
  { char: 'อ', romaji: 'o', strokes: ['M 54 56 C 48 56, 46 64, 52 66 C 58 66, 58 58, 54 56 M 52 66 L 34 78 L 34 40 C 34 20, 74 20, 74 40 L 74 78 C 74 88, 34 88, 34 78'] },
  { char: 'ฮ', romaji: 'ho', strokes: ['M 54 56 C 48 56, 46 64, 52 66 C 58 66, 58 58, 54 56 M 52 66 L 34 78 L 34 40 C 34 22, 54 22, 54 36 C 54 22, 74 22, 74 40 L 74 78 C 74 88, 34 88, 34 78'] },
];

function extractStartPos(d: string, num: number) {
  const match = d.match(/M\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)/i);
  const x = match ? parseFloat(match[1]) : 50;
  const y = match ? parseFloat(match[2]) : 50;
  return { x, y, num };
}

export const THAI_CONSONANTS_LIST: KanaCharacter[] = THAI_SEEDS.map((item, idx) => ({
  char: item.char,
  romaji: item.romaji,
  row: `t${Math.floor(idx / 5)}`,
  col: idx % 5,
  script: 'thai',
  unicode: item.char.codePointAt(0)!.toString(16).padStart(4, '0'),
  strokes: item.strokes,
  numberPositions: item.strokes.map((d, sIdx) => extractStartPos(d, sIdx + 1)),
}));
