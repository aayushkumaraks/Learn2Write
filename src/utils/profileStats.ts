import { HIRAGANA_LIST, KANJI_LIST, KATAKANA_LIST } from '../data/kana';
import type { HindiScript, KanaCharacter, KanaScript, WritingLanguage } from '../types/kana';
import type { PersistedProgressData } from './progressStorage';
import type { LocalUserProfile } from './userStorage';

export interface ScriptStats {
  id: KanaScript;
  label: string;
  sample: string;
  language: WritingLanguage;
  hindiScript?: HindiScript;
  totalChars: number;
  practicedChars: number;
  matchedChars: number;
  completionPct: number;
  attempts: number;
  matches: number;
  accuracyPct: number | null;
}

export interface LanguageStats {
  language: WritingLanguage;
  label: string;
  sample: string;
  totalChars: number;
  practicedChars: number;
  matchedChars: number;
  completionPct: number;
  attempts: number;
  matches: number;
  accuracyPct: number | null;
  scripts: ScriptStats[];
}

export interface UserProfileStats {
  userId: string;
  userName: string;
  lastActiveAt: number;
  totalChars: number;
  practicedChars: number;
  matchedChars: number;
  completionPct: number;
  attempts: number;
  matches: number;
  accuracyPct: number | null;
  languages: LanguageStats[];
}

interface ScriptDefinition {
  id: KanaScript;
  label: string;
  sample: string;
  language: WritingLanguage;
  hindiScript?: HindiScript;
  items: KanaCharacter[];
}

const LANGUAGE_DEFINITIONS: Array<{
  language: WritingLanguage;
  label: string;
  sample: string;
  scripts: ScriptDefinition[];
}> = [
  {
    language: 'japanese',
    label: 'Japanese',
    sample: 'あ ア 漢',
    scripts: [
      { id: 'hiragana', label: 'Hiragana', sample: 'あ', language: 'japanese', items: HIRAGANA_LIST },
      { id: 'katakana', label: 'Katakana', sample: 'ア', language: 'japanese', items: KATAKANA_LIST },
      { id: 'kanji', label: 'Kanji', sample: '漢', language: 'japanese', items: KANJI_LIST },
    ],
  },
];

function computeScriptStats(def: ScriptDefinition, progress: PersistedProgressData): ScriptStats {
  const practicedSet = new Set(progress.practicedChars);
  let practicedChars = 0;
  let matchedChars = 0;
  let attempts = 0;
  let matches = 0;

  for (const item of def.items) {
    const entry = progress.characters[item.char];
    if (entry) {
      const charAttempts = Math.max(1, entry.practicedCount);
      const charMatches = Math.min(charAttempts, Math.max(0, entry.matchedCount));
      practicedChars += 1;
      if (charMatches > 0) matchedChars += 1;
      attempts += charAttempts;
      matches += charMatches;
    } else if (practicedSet.has(item.char)) {
      practicedChars += 1;
      attempts += 1;
    }
  }

  const totalChars = def.items.length;
  const completionPct = totalChars > 0 ? Math.round((practicedChars / totalChars) * 100) : 0;
  const accuracyPct = attempts > 0 ? Math.round((matches / attempts) * 100) : null;

  return {
    id: def.id,
    label: def.label,
    sample: def.sample,
    language: def.language,
    hindiScript: def.hindiScript,
    totalChars,
    practicedChars,
    matchedChars,
    completionPct,
    attempts,
    matches,
    accuracyPct,
  };
}

export function computeLanguageStats(progress: PersistedProgressData): LanguageStats[] {
  return LANGUAGE_DEFINITIONS.map((langDef) => {
    const scripts = langDef.scripts.map((s) => computeScriptStats(s, progress));
    const totalChars = scripts.reduce((sum, s) => sum + s.totalChars, 0);
    const practicedChars = scripts.reduce((sum, s) => sum + s.practicedChars, 0);
    const matchedChars = scripts.reduce((sum, s) => sum + s.matchedChars, 0);
    const attempts = scripts.reduce((sum, s) => sum + s.attempts, 0);
    const matches = scripts.reduce((sum, s) => sum + s.matches, 0);

    return {
      language: langDef.language,
      label: langDef.label,
      sample: langDef.sample,
      totalChars,
      practicedChars,
      matchedChars,
      completionPct: totalChars > 0 ? Math.round((practicedChars / totalChars) * 100) : 0,
      attempts,
      matches,
      accuracyPct: attempts > 0 ? Math.round((matches / attempts) * 100) : null,
      scripts,
    };
  });
}

export function computeUserStats(user: LocalUserProfile): UserProfileStats {
  const languages = computeLanguageStats(user.progress);
  const totalChars = languages.reduce((sum, l) => sum + l.totalChars, 0);
  const practicedChars = languages.reduce((sum, l) => sum + l.practicedChars, 0);
  const matchedChars = languages.reduce((sum, l) => sum + l.matchedChars, 0);
  const attempts = languages.reduce((sum, l) => sum + l.attempts, 0);
  const matches = languages.reduce((sum, l) => sum + l.matches, 0);

  return {
    userId: user.id,
    userName: user.name,
    lastActiveAt: user.lastActiveAt,
    totalChars,
    practicedChars,
    matchedChars,
    completionPct: totalChars > 0 ? Math.round((practicedChars / totalChars) * 100) : 0,
    attempts,
    matches,
    accuracyPct: attempts > 0 ? Math.round((matches / attempts) * 100) : null,
    languages,
  };
}
