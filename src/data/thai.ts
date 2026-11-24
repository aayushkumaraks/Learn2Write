import type { KanaCharacter } from '../types/kana';

interface ThaiSeed {
  char: string;
  romaji: string;
}

// 44 Thai consonants (ก–ฮ) — rendered and validated via font superimposition
const THAI_SEEDS: ThaiSeed[] = [
  { char: 'ก', romaji: 'ko' },
  { char: 'ข', romaji: 'kho' },
  { char: 'ฃ', romaji: 'kho' },
  { char: 'ค', romaji: 'kho' },
  { char: 'ฅ', romaji: 'kho' },
  { char: 'ฆ', romaji: 'kho' },
  { char: 'ง', romaji: 'ngo' },
  { char: 'จ', romaji: 'cho' },
  { char: 'ฉ', romaji: 'cho' },
  { char: 'ช', romaji: 'cho' },
  { char: 'ซ', romaji: 'so' },
  { char: 'ฌ', romaji: 'cho' },
  { char: 'ญ', romaji: 'yo' },
  { char: 'ฎ', romaji: 'do' },
  { char: 'ฏ', romaji: 'to' },
  { char: 'ฐ', romaji: 'tho' },
  { char: 'ฑ', romaji: 'tho' },
  { char: 'ฒ', romaji: 'tho' },
  { char: 'ณ', romaji: 'no' },
  { char: 'ด', romaji: 'do' },
  { char: 'ต', romaji: 'to' },
  { char: 'ถ', romaji: 'tho' },
  { char: 'ท', romaji: 'tho' },
  { char: 'ธ', romaji: 'tho' },
  { char: 'น', romaji: 'no' },
  { char: 'บ', romaji: 'bo' },
  { char: 'ป', romaji: 'po' },
  { char: 'ผ', romaji: 'pho' },
  { char: 'ฝ', romaji: 'fo' },
  { char: 'พ', romaji: 'pho' },
  { char: 'ฟ', romaji: 'fo' },
  { char: 'ภ', romaji: 'pho' },
  { char: 'ม', romaji: 'mo' },
  { char: 'ย', romaji: 'yo' },
  { char: 'ร', romaji: 'ro' },
  { char: 'ล', romaji: 'lo' },
  { char: 'ว', romaji: 'wo' },
  { char: 'ศ', romaji: 'so' },
  { char: 'ษ', romaji: 'so' },
  { char: 'ส', romaji: 'so' },
  { char: 'ห', romaji: 'ho' },
  { char: 'ฬ', romaji: 'lo' },
  { char: 'อ', romaji: 'o' },
  { char: 'ฮ', romaji: 'ho' },
];

export const THAI_CONSONANTS_LIST: KanaCharacter[] = THAI_SEEDS.map((item, idx) => ({
  char: item.char,
  romaji: item.romaji,
  row: `t${Math.floor(idx / 5)}`,
  col: idx % 5,
  script: 'thai',
  unicode: item.char.codePointAt(0)!.toString(16).padStart(4, '0'),
  strokes: [],
  numberPositions: [],
}));
