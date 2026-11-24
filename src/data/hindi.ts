import type { HindiScript, KanaCharacter } from '../types/kana';

interface HindiSeed {
  char: string;
  romaji: string;
}

// Vowels (Swar) + Anunasik (15) — rendered and validated via font superimposition
const HINDI_VOWEL_SEEDS: HindiSeed[] = [
  { char: 'अ', romaji: 'a' },
  { char: 'आ', romaji: 'aa' },
  { char: 'इ', romaji: 'i' },
  { char: 'ई', romaji: 'ii' },
  { char: 'उ', romaji: 'u' },
  { char: 'ऊ', romaji: 'uu' },
  { char: 'ऋ', romaji: 'ri' },
  { char: 'ए', romaji: 'e' },
  { char: 'ऐ', romaji: 'ai' },
  { char: 'ओ', romaji: 'o' },
  { char: 'औ', romaji: 'au' },
  { char: 'अं', romaji: 'am' },
  { char: 'अः', romaji: 'ah' },
  { char: 'ऑ', romaji: 'aw' },
  { char: 'अँ', romaji: 'an' },
];

// Consonants (Vyanjan) through क–ज्ञ (36)
const HINDI_CONSONANT_SEEDS: HindiSeed[] = [
  { char: 'क', romaji: 'ka' },
  { char: 'ख', romaji: 'kha' },
  { char: 'ग', romaji: 'ga' },
  { char: 'घ', romaji: 'gha' },
  { char: 'ङ', romaji: 'nga' },

  { char: 'च', romaji: 'cha' },
  { char: 'छ', romaji: 'chha' },
  { char: 'ज', romaji: 'ja' },
  { char: 'झ', romaji: 'jha' },
  { char: 'ञ', romaji: 'nya' },

  { char: 'ट', romaji: 'ta' },
  { char: 'ठ', romaji: 'tha' },
  { char: 'ड', romaji: 'da' },
  { char: 'ढ', romaji: 'dha' },
  { char: 'ण', romaji: 'na' },

  { char: 'त', romaji: 'ta' },
  { char: 'थ', romaji: 'tha' },
  { char: 'द', romaji: 'da' },
  { char: 'ध', romaji: 'dha' },
  { char: 'न', romaji: 'na' },

  { char: 'प', romaji: 'pa' },
  { char: 'फ', romaji: 'pha' },
  { char: 'ब', romaji: 'ba' },
  { char: 'भ', romaji: 'bha' },
  { char: 'म', romaji: 'ma' },

  { char: 'य', romaji: 'ya' },
  { char: 'र', romaji: 'ra' },
  { char: 'ल', romaji: 'la' },
  { char: 'व', romaji: 'va' },

  { char: 'श', romaji: 'sha' },
  { char: 'ष', romaji: 'sha' },
  { char: 'स', romaji: 'sa' },
  { char: 'ह', romaji: 'ha' },
  { char: 'क्ष', romaji: 'ksha' },
  { char: 'त्र', romaji: 'tra' },
  { char: 'ज्ञ', romaji: 'gya' },
];

// Character Combinations: Conjuncts, Nukta Combinations, and Matra Combinations (22)
const HINDI_COMBINATION_SEEDS: HindiSeed[] = [
  { char: 'श्र', romaji: 'श्+र = shra' },
  { char: 'क्त', romaji: 'क्+त = kta' },
  { char: 'स्त', romaji: 'स्+त = sta' },
  { char: 'न्द', romaji: 'न्+द = nda' },
  { char: 'द्य', romaji: 'द्+य = dya' },

  { char: 'ड़', romaji: 'ड+़ = da' },
  { char: 'ढ़', romaji: 'ढ+़ = dha' },
  { char: 'क़', romaji: 'क+़ = qa' },
  { char: 'ख़', romaji: 'ख+़ = kha' },
  { char: 'ग़', romaji: 'ग+़ = gha' },
  { char: 'ज़', romaji: 'ज+़ = za' },
  { char: 'फ़', romaji: 'फ+़ = fa' },

  { char: 'का', romaji: 'क+ा = kaa' },
  { char: 'कि', romaji: 'क+ि = ki' },
  { char: 'की', romaji: 'क+ी = kii' },
  { char: 'कु', romaji: 'क+ु = ku' },
  { char: 'कू', romaji: 'क+ू = kuu' },
  { char: 'कृ', romaji: 'क+ृ = kri' },
  { char: 'के', romaji: 'क+े = ke' },
  { char: 'कै', romaji: 'क+ै = kai' },
  { char: 'को', romaji: 'क+ो = ko' },
  { char: 'कौ', romaji: 'क+ौ = kau' },
];

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
    strokes: [],
    numberPositions: [],
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
