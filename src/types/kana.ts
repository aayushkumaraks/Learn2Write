export type WritingLanguage = 'japanese' | 'thai' | 'hindi';

export type HindiScript = 'hindi-vowels' | 'hindi-consonants' | 'hindi-combinations';

export type KanaScript = 'hiragana' | 'katakana' | 'kanji' | 'thai' | HindiScript;

export type PencilType = 'pencil' | 'brush' | 'ballpoint' | 'marker';

export type StrokeSize = 'fine' | 'medium' | 'bold';

export type GridStyle = 'crosshair' | 'quad' | 'none';

export type InputMode = 'touch' | 'mouse';

export type StrokeDifficulty = 'easy' | 'medium' | 'strict' | 'asian_parents';

export interface StrokeNumberPos {
  x: number;
  y: number;
  num: number;
}

export interface KanaCharacter {
  char: string;
  romaji: string;
  row: string;
  col: number;
  script: KanaScript;
  unicode: string;
  strokes: string[];
  numberPositions: StrokeNumberPos[];
}

export interface KanaDataset {
  source: string;
  viewBox: string;
  hiragana: KanaCharacter[];
  katakana: KanaCharacter[];
}

export interface InkColorOption {
  id: string;
  label: string;
  hex: string;
}

export interface DrawPoint {
  x: number;
  y: number;
  t: number;
  pressure: number;
}

export interface DrawnStroke {
  points: DrawPoint[];
  pencil: PencilType;
  size: StrokeSize;
  color: string;
}
