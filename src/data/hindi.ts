import type { HindiScript, KanaCharacter } from '../types/kana';

interface HindiSeed {
  char: string;
  romaji: string;
  strokes: string[];
}

// Vowels (Swar) + Anunasik (15)
const HINDI_VOWEL_SEEDS: HindiSeed[] = [
  { char: 'अ', romaji: 'a', strokes: ['M 28 38 C 44 30, 52 46, 36 56 C 56 62, 54 86, 28 80', 'M 44 56 L 70 56', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },
  { char: 'आ', romaji: 'aa', strokes: ['M 24 38 C 40 30, 48 46, 32 56 C 52 62, 50 86, 24 80', 'M 40 56 L 62 56', 'M 62 28 L 62 86', 'M 78 28 L 78 86', 'M 18 28 L 88 28'] },
  { char: 'इ', romaji: 'i', strokes: ['M 54 28 L 54 40 C 34 40, 34 56, 54 58 C 68 60, 66 78, 42 78 C 34 78, 34 68, 44 72 L 66 88', 'M 24 28 L 84 28'] },
  { char: 'ई', romaji: 'ii', strokes: ['M 54 28 L 54 40 C 34 40, 34 56, 54 58 C 68 60, 66 78, 42 78 C 34 78, 34 68, 44 72 L 66 88', 'M 56 28 C 56 14, 74 12, 78 22', 'M 24 28 L 84 28'] },
  { char: 'उ', romaji: 'u', strokes: ['M 34 38 C 56 32, 60 50, 42 56 C 64 62, 62 86, 30 80', 'M 24 28 L 84 28'] },
  { char: 'ऊ', romaji: 'uu', strokes: ['M 32 38 C 54 32, 58 50, 40 56 C 62 62, 60 86, 28 80', 'M 54 56 C 72 52, 82 66, 70 80', 'M 24 28 L 86 28'] },
  { char: 'ऋ', romaji: 'ri', strokes: ['M 30 40 L 52 54 L 30 68', 'M 52 28 L 52 86', 'M 52 54 L 74 44 C 82 58, 66 64, 62 74 C 60 82, 72 88, 80 80', 'M 22 28 L 86 28'] },
  { char: 'ए', romaji: 'e', strokes: ['M 38 28 L 38 56 L 56 78', 'M 68 28 L 68 58 L 54 58', 'M 24 28 L 84 28'] },
  { char: 'ऐ', romaji: 'ai', strokes: ['M 38 28 L 38 56 L 56 78', 'M 68 28 L 68 58 L 54 58', 'M 68 28 L 52 12', 'M 24 28 L 84 28'] },
  { char: 'ओ', romaji: 'o', strokes: ['M 24 38 C 40 30, 48 46, 32 56 C 52 62, 50 86, 24 80', 'M 40 56 L 62 56', 'M 62 28 L 62 86', 'M 78 28 L 78 86', 'M 78 28 L 62 12', 'M 18 28 L 88 28'] },
  { char: 'औ', romaji: 'au', strokes: ['M 24 38 C 40 30, 48 46, 32 56 C 52 62, 50 86, 24 80', 'M 40 56 L 62 56', 'M 62 28 L 62 86', 'M 78 28 L 78 86', 'M 78 28 L 58 12', 'M 78 28 L 74 10', 'M 18 28 L 88 28'] },
  { char: 'अं', romaji: 'am', strokes: ['M 28 38 C 44 30, 52 46, 36 56 C 56 62, 54 86, 28 80', 'M 44 56 L 70 56', 'M 70 28 L 70 86', 'M 22 28 L 84 28', 'M 54 16 C 52 16, 52 20, 56 20 C 58 20, 58 16, 54 16'] },
  { char: 'अः', romaji: 'ah', strokes: ['M 24 38 C 40 30, 48 46, 32 56 C 52 62, 50 86, 24 80', 'M 40 56 L 66 56', 'M 66 28 L 66 86', 'M 18 28 L 78 28', 'M 84 44 C 82 44, 82 48, 86 48', 'M 84 68 C 82 68, 82 72, 86 72'] },
  { char: 'ऑ', romaji: 'aw', strokes: ['M 24 38 C 40 30, 48 46, 32 56 C 52 62, 50 86, 24 80', 'M 40 56 L 62 56', 'M 62 28 L 62 86', 'M 78 28 L 78 86', 'M 64 14 C 70 22, 82 22, 86 14', 'M 18 28 L 88 28'] },
  { char: 'अँ', romaji: 'an', strokes: ['M 28 38 C 44 30, 52 46, 36 56 C 56 62, 54 86, 28 80', 'M 44 56 L 70 56', 'M 70 28 L 70 86', 'M 44 14 C 50 22, 62 22, 66 14', 'M 54 12 C 52 12, 52 16, 56 16', 'M 22 28 L 84 28'] },
];

// Consonants (Vyanjan) + Dviguna & Nukta (40)
const HINDI_CONSONANT_SEEDS: HindiSeed[] = [
  { char: 'क', romaji: 'ka', strokes: ['M 54 28 L 54 86', 'M 54 52 C 30 42, 26 70, 54 60 C 78 50, 82 74, 66 80', 'M 22 28 L 86 28'] },
  { char: 'ख', romaji: 'kha', strokes: ['M 28 30 C 44 38, 42 56, 26 56 L 56 76', 'M 68 56 C 52 48, 52 70, 68 64', 'M 72 28 L 72 86', 'M 22 28 L 86 28'] },
  { char: 'ग', romaji: 'ga', strokes: ['M 42 28 L 42 66 C 42 74, 28 70, 32 60 L 42 60', 'M 70 28 L 70 86', 'M 24 28 L 84 28'] },
  { char: 'घ', romaji: 'gha', strokes: ['M 44 34 C 24 36, 24 54, 42 56 C 24 62, 28 80, 68 70', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },
  { char: 'ङ', romaji: 'nga', strokes: ['M 54 28 L 54 38 C 32 38, 32 54, 54 56 C 72 58, 70 82, 34 78', 'M 78 52 C 76 52, 76 56, 80 56', 'M 24 28 L 84 28'] },

  { char: 'च', romaji: 'cha', strokes: ['M 24 52 L 50 52 C 42 72, 60 78, 70 64', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },
  { char: 'छ', romaji: 'chha', strokes: ['M 52 28 L 46 36 C 26 38, 26 54, 44 56 C 24 64, 30 84, 58 80 C 74 78, 76 62, 62 60 C 52 60, 52 72, 62 72 L 62 50', 'M 22 28 L 84 28'] },
  { char: 'ज', romaji: 'ja', strokes: ['M 28 54 C 26 76, 54 78, 54 54 L 72 54', 'M 72 28 L 72 86', 'M 22 28 L 86 28'] },
  { char: 'झ', romaji: 'jha', strokes: ['M 44 28 L 44 38 C 26 38, 26 54, 44 56 C 58 58, 56 76, 34 76 L 54 86', 'M 54 58 L 74 58', 'M 74 28 L 74 86', 'M 22 28 L 86 28'] },
  { char: 'ञ', romaji: 'nya', strokes: ['M 28 42 C 48 34, 52 74, 28 66', 'M 48 54 L 72 54', 'M 72 28 L 72 86', 'M 22 28 L 86 28'] },

  { char: 'ट', romaji: 'ta', strokes: ['M 56 28 L 56 42 C 28 42, 28 80, 74 76', 'M 24 28 L 84 28'] },
  { char: 'ठ', romaji: 'tha', strokes: ['M 54 28 L 54 42 C 30 42, 30 78, 54 78 C 78 78, 78 42, 54 42', 'M 24 28 L 84 28'] },
  { char: 'ड', romaji: 'da', strokes: ['M 54 28 L 54 38 C 32 38, 32 54, 54 56 C 72 58, 70 82, 34 78', 'M 24 28 L 84 28'] },
  { char: 'ढ', romaji: 'dha', strokes: ['M 56 28 L 56 42 C 28 42, 28 80, 62 78 C 76 76, 76 60, 64 62 C 56 64, 58 74, 66 74', 'M 24 28 L 84 28'] },
  { char: 'ण', romaji: 'na', strokes: ['M 30 28 L 30 64 C 30 76, 54 76, 54 64 L 54 28', 'M 74 28 L 74 86', 'M 22 28 L 86 28'] },

  { char: 'त', romaji: 'ta', strokes: ['M 70 52 L 42 52 C 32 52, 32 70, 44 82', 'M 70 28 L 70 86', 'M 24 28 L 84 28'] },
  { char: 'थ', romaji: 'tha', strokes: ['M 38 38 C 30 38, 30 48, 38 48 C 46 48, 46 38, 38 38 M 44 46 C 28 60, 42 78, 70 68', 'M 70 28 L 70 86', 'M 24 28 L 84 28'] },
  { char: 'द', romaji: 'da', strokes: ['M 56 28 L 56 42 C 30 42, 30 76, 56 76 C 72 76, 72 60, 60 60 C 52 60, 52 72, 66 88', 'M 24 28 L 84 28'] },
  { char: 'ध', romaji: 'dha', strokes: ['M 38 34 C 30 34, 30 44, 38 44 C 46 44, 46 34, 38 34 M 38 44 C 24 52, 28 64, 46 62 C 28 70, 38 82, 70 70', 'M 70 28 L 70 86', 'M 48 28 L 86 28'] },
  { char: 'न', romaji: 'na', strokes: ['M 70 50 L 34 50 C 26 50, 26 64, 36 62 C 42 60, 42 50, 34 50', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },

  { char: 'प', romaji: 'pa', strokes: ['M 36 28 L 36 64 C 36 74, 60 74, 70 64', 'M 70 28 L 70 86', 'M 24 28 L 84 28'] },
  { char: 'फ', romaji: 'pha', strokes: ['M 32 28 L 32 62 C 32 72, 54 72, 54 62', 'M 54 28 L 54 86', 'M 54 52 C 78 44, 82 72, 68 80', 'M 22 28 L 86 28'] },
  { char: 'ब', romaji: 'ba', strokes: ['M 70 46 C 32 34, 24 78, 70 66', 'M 42 50 L 62 66', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },
  { char: 'भ', romaji: 'bha', strokes: ['M 34 34 C 26 34, 26 44, 34 44 C 42 44, 42 34, 34 34 M 40 42 L 40 72 C 40 80, 26 74, 32 64 L 70 64', 'M 70 28 L 70 86', 'M 48 28 L 86 28'] },
  { char: 'म', romaji: 'ma', strokes: ['M 40 28 L 40 72 C 40 80, 26 74, 32 62 L 70 62', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },

  { char: 'य', romaji: 'ya', strokes: ['M 34 34 C 54 34, 52 54, 34 62 C 34 76, 56 78, 70 66', 'M 70 28 L 70 86', 'M 24 28 L 84 28'] },
  { char: 'र', romaji: 'ra', strokes: ['M 40 32 C 62 32, 62 56, 36 56 L 66 84', 'M 24 28 L 84 28'] },
  { char: 'ल', romaji: 'la', strokes: ['M 70 54 C 58 46, 50 56, 50 62 C 46 46, 26 52, 34 76', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },
  { char: 'व', romaji: 'va', strokes: ['M 70 44 C 30 34, 28 78, 70 66', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },

  { char: 'श', romaji: 'sha', strokes: ['M 36 34 C 28 34, 28 44, 36 44 C 44 44, 44 34, 36 34 M 42 42 C 56 48, 52 70, 30 66 L 56 84', 'M 72 28 L 72 86', 'M 50 28 L 86 28'] },
  { char: 'ष', romaji: 'sha', strokes: ['M 36 28 L 36 64 C 36 74, 60 74, 70 64', 'M 40 44 L 66 64', 'M 70 28 L 70 86', 'M 24 28 L 84 28'] },
  { char: 'स', romaji: 'sa', strokes: ['M 34 32 C 54 32, 52 54, 30 56 L 52 82', 'M 46 58 L 72 58', 'M 72 28 L 72 86', 'M 22 28 L 86 28'] },
  { char: 'ह', romaji: 'ha', strokes: ['M 56 28 L 56 40 C 32 40, 32 56, 58 58', 'M 56 58 C 32 62, 36 88, 66 84', 'M 24 28 L 84 28'] },
  { char: 'क्ष', romaji: 'ksha', strokes: ['M 36 38 C 28 38, 28 48, 36 48 C 44 48, 44 38, 36 38', 'M 38 48 C 24 54, 24 72, 42 74 C 34 80, 44 88, 56 78', 'M 44 56 L 70 56', 'M 70 28 L 70 86', 'M 22 28 L 86 28'] },
  { char: 'त्र', romaji: 'tra', strokes: ['M 30 46 L 64 56 L 32 76', 'M 64 28 L 64 86', 'M 22 28 L 84 28'] },
  { char: 'ज्ञ', romaji: 'gya', strokes: ['M 32 52 L 50 52 C 56 64, 42 74, 30 68 L 48 84', 'M 50 52 L 70 52', 'M 70 28 L 70 86', 'M 22 28 L 84 28'] },
];

// Character Combinations: Conjuncts, Nukta Combinations, and Matra Combinations (22)
const HINDI_COMBINATION_SEEDS: HindiSeed[] = [
  // Conjuncts (half-consonant + consonant)
  { char: 'श्र', romaji: 'श्+र = shra', strokes: ['M 36 36 C 28 36, 28 46, 36 46 C 44 46, 44 36, 36 36', 'M 40 44 C 54 50, 50 64, 30 74', 'M 50 56 L 72 56', 'M 72 28 L 72 86', 'M 22 28 L 86 28'] },
  { char: 'क्त', romaji: 'क्+त = kta', strokes: ['M 44 28 L 44 86', 'M 44 52 C 24 44, 22 68, 44 60', 'M 72 52 L 50 52 C 44 52, 44 68, 54 78', 'M 72 28 L 72 86', 'M 18 28 L 88 28'] },
  { char: 'स्त', romaji: 'स्+त = sta', strokes: ['M 24 32 C 40 32, 38 52, 22 54 L 38 78', 'M 34 56 L 52 56', 'M 72 52 L 52 52 C 46 52, 46 68, 56 78', 'M 72 28 L 72 86', 'M 18 28 L 88 28'] },
  { char: 'न्द', romaji: 'न्+द = nda', strokes: ['M 44 50 L 24 50 C 18 50, 18 62, 26 60', 'M 66 28 L 66 42 C 44 42, 44 74, 66 74 C 80 74, 80 58, 70 58 C 62 58, 62 70, 74 86', 'M 18 28 L 86 28'] },
  { char: 'द्य', romaji: 'द्+य = dya', strokes: ['M 48 28 L 48 42 C 26 42, 26 72, 48 72 L 54 78', 'M 54 44 C 66 44, 66 64, 52 70 C 52 80, 66 80, 74 70', 'M 74 28 L 74 86', 'M 20 28 L 86 28'] },

  // Dviguna & Nukta Combinations (consonant + nukta)
  { char: 'ड़', romaji: 'ड+़ = da', strokes: ['M 54 28 L 54 38 C 32 38, 32 54, 54 56 C 72 58, 70 80, 34 76', 'M 54 88 C 52 88, 52 92, 56 92', 'M 24 28 L 84 28'] },
  { char: 'ढ़', romaji: 'ढ+़ = dha', strokes: ['M 56 28 L 56 42 C 28 42, 28 78, 62 76 C 76 74, 76 58, 64 60 C 56 62, 58 72, 66 72', 'M 54 88 C 52 88, 52 92, 56 92', 'M 24 28 L 84 28'] },
  { char: 'क़', romaji: 'क+़ = qa', strokes: ['M 54 28 L 54 86', 'M 54 52 C 30 42, 26 70, 54 60 C 78 50, 82 74, 66 80', 'M 36 78 C 34 78, 34 82, 38 82', 'M 22 28 L 86 28'] },
  { char: 'ख़', romaji: 'ख+़ = kha', strokes: ['M 28 30 C 44 38, 42 56, 26 56 L 56 76', 'M 68 56 C 52 48, 52 70, 68 64', 'M 72 28 L 72 86', 'M 34 78 C 32 78, 32 82, 36 82', 'M 22 28 L 86 28'] },
  { char: 'ग़', romaji: 'ग+़ = gha', strokes: ['M 42 28 L 42 66 C 42 74, 28 70, 32 60 L 42 60', 'M 70 28 L 70 86', 'M 34 80 C 32 80, 32 84, 36 84', 'M 24 28 L 84 28'] },
  { char: 'ज़', romaji: 'ज+़ = za', strokes: ['M 28 54 C 26 76, 54 78, 54 54 L 72 54', 'M 72 28 L 72 86', 'M 38 80 C 36 80, 36 84, 40 84', 'M 22 28 L 86 28'] },
  { char: 'फ़', romaji: 'फ+़ = fa', strokes: ['M 32 28 L 32 62 C 32 72, 54 72, 54 62', 'M 54 28 L 54 86', 'M 54 52 C 78 44, 82 72, 68 80', 'M 38 80 C 36 80, 36 84, 40 84', 'M 22 28 L 86 28'] },

  // Consonant + Vowel Matra combinations (Barakhadi with क)
  { char: 'का', romaji: 'क+ा = kaa', strokes: ['M 46 28 L 46 86', 'M 46 52 C 26 42, 22 70, 46 60 C 64 52, 68 72, 56 78', 'M 78 28 L 78 86', 'M 18 28 L 88 28'] },
  { char: 'कि', romaji: 'क+ि = ki', strokes: ['M 30 28 L 30 86', 'M 62 28 L 62 86', 'M 62 52 C 42 42, 38 70, 62 60 C 80 52, 82 72, 70 78', 'M 30 28 C 34 10, 60 10, 62 28', 'M 20 28 L 86 28'] },
  { char: 'की', romaji: 'क+ी = kii', strokes: ['M 46 28 L 46 86', 'M 46 52 C 26 42, 22 70, 46 60 C 64 52, 68 72, 56 78', 'M 78 28 L 78 86', 'M 46 28 C 48 10, 76 10, 78 28', 'M 18 28 L 88 28'] },
  { char: 'कु', romaji: 'क+ु = ku', strokes: ['M 54 28 L 54 84', 'M 54 50 C 30 40, 26 68, 54 58 C 78 48, 82 70, 66 76', 'M 54 84 C 44 84, 40 94, 48 96', 'M 22 28 L 86 28'] },
  { char: 'कू', romaji: 'क+ू = kuu', strokes: ['M 54 28 L 54 84', 'M 54 50 C 30 40, 26 68, 54 58 C 78 48, 82 70, 66 76', 'M 54 84 C 66 84, 70 94, 62 96', 'M 22 28 L 86 28'] },
  { char: 'कृ', romaji: 'क+ृ = kri', strokes: ['M 54 28 L 54 84', 'M 54 50 C 30 40, 26 68, 54 58 C 78 48, 82 70, 66 76', 'M 54 84 C 42 86, 42 96, 56 96', 'M 22 28 L 86 28'] },
  { char: 'के', romaji: 'क+े = ke', strokes: ['M 54 28 L 54 86', 'M 54 52 C 30 42, 26 70, 54 60 C 78 50, 82 74, 66 80', 'M 54 28 L 36 12', 'M 22 28 L 86 28'] },
  { char: 'कै', romaji: 'क+ै = kai', strokes: ['M 54 28 L 54 86', 'M 54 52 C 30 42, 26 70, 54 60 C 78 50, 82 74, 66 80', 'M 54 28 L 34 12', 'M 54 28 L 50 10', 'M 22 28 L 86 28'] },
  { char: 'को', romaji: 'क+ो = ko', strokes: ['M 46 28 L 46 86', 'M 46 52 C 26 42, 22 70, 46 60 C 64 52, 68 72, 56 78', 'M 78 28 L 78 86', 'M 78 28 L 60 12', 'M 18 28 L 88 28'] },
  { char: 'कौ', romaji: 'क+ौ = kau', strokes: ['M 46 28 L 46 86', 'M 46 52 C 26 42, 22 70, 46 60 C 64 52, 68 72, 56 78', 'M 78 28 L 78 86', 'M 78 28 L 56 12', 'M 78 28 L 74 10', 'M 18 28 L 88 28'] },
];

function extractStartPos(d: string, num: number) {
  const match = d.match(/M\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)/i);
  const x = match ? parseFloat(match[1]) : 50;
  const y = match ? parseFloat(match[2]) : 50;
  return { x, y, num };
}

function buildHindiList(seeds: HindiSeed[], script: HindiScript): KanaCharacter[] {
  return seeds.map((item, idx) => ({
    char: item.char,
    romaji: item.romaji,
    row: `${script}-${Math.floor(idx / 5)}`,
    col: idx % 5,
    script,
    unicode: Array.from(item.char)
      .map((c) => c.codePointAt(0)!.toString(16).padStart(4, '0'))
      .join('-'),
    strokes: item.strokes,
    numberPositions: item.strokes.map((d, sIdx) => extractStartPos(d, sIdx + 1)),
  }));
}

export const HINDI_VOWELS_LIST: KanaCharacter[] = buildHindiList(
  HINDI_VOWEL_SEEDS,
  'hindi-vowels'
);

export const HINDI_CONSONANTS_LIST: KanaCharacter[] = buildHindiList(
  HINDI_CONSONANT_SEEDS,
  'hindi-consonants'
);

export const HINDI_COMBINATIONS_LIST: KanaCharacter[] = buildHindiList(
  HINDI_COMBINATION_SEEDS,
  'hindi-combinations'
);

export function getHindiList(script: HindiScript): KanaCharacter[] {
  if (script === 'hindi-consonants') return HINDI_CONSONANTS_LIST;
  if (script === 'hindi-combinations') return HINDI_COMBINATIONS_LIST;
  return HINDI_VOWELS_LIST;
}
