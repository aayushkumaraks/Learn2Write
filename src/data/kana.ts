import rawData from './kanaStrokes.json';
import rawKanjiData from './kanjiStrokes.json';
import type { KanaCharacter, KanaDataset, KanaScript } from '../types/kana';

export const KANA_DATASET: KanaDataset = rawData as KanaDataset;

export const HIRAGANA_LIST: KanaCharacter[] = KANA_DATASET.hiragana;
export const KATAKANA_LIST: KanaCharacter[] = KANA_DATASET.katakana;
export const KANJI_LIST: KanaCharacter[] = (rawKanjiData as { kanji: KanaCharacter[] }).kanji;

export interface GojuonRow {
  id: string;
  label: string;
}

export const GOJUON_ROWS: GojuonRow[] = [
  { id: 'a', label: 'A' },
  { id: 'k', label: 'K' },
  { id: 's', label: 'S' },
  { id: 't', label: 'T' },
  { id: 'n', label: 'N' },
  { id: 'h', label: 'H' },
  { id: 'm', label: 'M' },
  { id: 'y', label: 'Y' },
  { id: 'r', label: 'R' },
  { id: 'w', label: 'W' },
  { id: 'nn', label: 'N' },
];

export const VOWEL_HEADERS = ['a', 'i', 'u', 'e', 'o'] as const;

export function getKanaList(script: KanaScript): KanaCharacter[] {
  if (script === 'katakana') return KATAKANA_LIST;
  if (script === 'kanji') return KANJI_LIST;
  return HIRAGANA_LIST;
}

/**
 * Returns a 5-column row array (a, i, u, e, o) with nulls for empty Gojūon slots (yi, ye, wi, wu, we, etc.).
 */
export function buildGojuonGrid(script: KanaScript): Array<{
  row: GojuonRow;
  cells: Array<KanaCharacter | null>;
}> {
  const list = getKanaList(script);
  return GOJUON_ROWS.map((row) => {
    const cells: Array<KanaCharacter | null> = [null, null, null, null, null];
    for (const item of list) {
      if (item.row === row.id && item.col >= 0 && item.col < 5) {
        cells[item.col] = item;
      }
    }
    return { row, cells };
  });
}
