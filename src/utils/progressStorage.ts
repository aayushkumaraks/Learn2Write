import type {
  GridStyle,
  HindiScript,
  KanaScript,
  PencilType,
  StrokeDifficulty,
  StrokeSize,
  WritingLanguage,
} from '../types/kana';
import { INK_COLORS } from './pencilEngine';

export const PROGRESS_STORAGE_KEY = 'learn2write.progress.v2';
export const LEGACY_PRACTICED_STORAGE_KEY = 'learn2write.practiced.v1';

const IDB_DB_NAME = 'learn2write_storage';
const IDB_DB_VERSION = 1;
const IDB_STORE_NAME = 'kv';
const IDB_PROGRESS_KEY = 'progress';

export interface CharacterProgress {
  practicedCount: number;
  matchedCount: number;
  firstPracticedAt: number;
  lastPracticedAt: number;
}

export interface PracticePreferences {
  pencil: PencilType;
  strokeSize: StrokeSize;
  inkColor: string;
  gridStyle: GridStyle;
  showTrace: boolean;
  showNumbers: boolean;
  guideSpeed: 'slow' | 'normal';
  difficulty: StrokeDifficulty;
}

export interface ResumePosition {
  language: WritingLanguage;
  script: KanaScript;
  hindiScript: HindiScript;
  selectedChar: string;
}

export interface DifficultyProgressBucket {
  practicedChars: string[];
  characters: Record<string, CharacterProgress>;
}

export interface PersistedProgressData {
  version: 2;
  updatedAt: number;
  practicedChars: string[];
  characters: Record<string, CharacterProgress>;
  byDifficulty?: Partial<Record<StrokeDifficulty, DifficultyProgressBucket>>;
  resume: ResumePosition;
  preferences: PracticePreferences;
}

const VALID_LANGUAGES: ReadonlySet<WritingLanguage> = new Set(['japanese', 'thai', 'hindi']);
const VALID_JAPANESE_SCRIPTS: ReadonlySet<KanaScript> = new Set(['hiragana', 'katakana', 'kanji']);
const VALID_HINDI_SCRIPTS: ReadonlySet<HindiScript> = new Set([
  'hindi-vowels',
  'hindi-consonants',
  'hindi-combinations',
]);
const VALID_PENCILS: ReadonlySet<PencilType> = new Set(['pencil', 'brush', 'ballpoint', 'marker']);
const VALID_SIZES: ReadonlySet<StrokeSize> = new Set(['fine', 'medium', 'bold']);
const VALID_GRIDS: ReadonlySet<GridStyle> = new Set(['crosshair', 'quad', 'none']);
const VALID_DIFFICULTIES: ReadonlySet<StrokeDifficulty> = new Set([
  'easy',
  'medium',
  'strict',
  'asian_parents',
]);
const VALID_INK_HEXES: ReadonlySet<string> = new Set(INK_COLORS.map((c) => c.hex));

export const DEFAULT_PREFERENCES: PracticePreferences = {
  pencil: 'brush',
  strokeSize: 'medium',
  inkColor: INK_COLORS[0].hex,
  gridStyle: 'crosshair',
  showTrace: true,
  showNumbers: true,
  guideSpeed: 'normal',
  difficulty: 'medium',
};

export const DEFAULT_RESUME: ResumePosition = {
  language: 'japanese',
  script: 'hiragana',
  hindiScript: 'hindi-vowels',
  selectedChar: 'あ',
};

export function createDefaultProgressData(updatedAt = 0): PersistedProgressData {
  return {
    version: 2,
    updatedAt,
    practicedChars: [],
    characters: {},
    resume: { ...DEFAULT_RESUME },
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSafePositiveInt(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

export function sanitizeProgressData(raw: unknown): PersistedProgressData {
  const base = createDefaultProgressData(0);
  if (!isRecord(raw)) return base;

  const updatedAt = toSafePositiveInt(raw.updatedAt, 0);
  const characters: Record<string, CharacterProgress> = {};
  const practicedSet = new Set<string>();

  if (isRecord(raw.characters)) {
    for (const [char, entry] of Object.entries(raw.characters)) {
      if (typeof char !== 'string' || char.length === 0 || !isRecord(entry)) continue;
      const practicedCount = Math.max(1, toSafePositiveInt(entry.practicedCount, 1));
      const matchedCount = toSafePositiveInt(entry.matchedCount, 0);
      const firstPracticedAt = toSafePositiveInt(entry.firstPracticedAt, updatedAt);
      const lastPracticedAt = Math.max(
        firstPracticedAt,
        toSafePositiveInt(entry.lastPracticedAt, firstPracticedAt)
      );
      characters[char] = {
        practicedCount,
        matchedCount,
        firstPracticedAt,
        lastPracticedAt,
      };
      practicedSet.add(char);
    }
  }

  if (Array.isArray(raw.practicedChars)) {
    for (const item of raw.practicedChars) {
      if (typeof item === 'string' && item.length > 0) {
        practicedSet.add(item);
        if (!characters[item]) {
          characters[item] = {
            practicedCount: 1,
            matchedCount: 0,
            firstPracticedAt: updatedAt,
            lastPracticedAt: updatedAt,
          };
        }
      }
    }
  }

  const rawResume = isRecord(raw.resume) ? raw.resume : {};
  const language = VALID_LANGUAGES.has(rawResume.language as WritingLanguage)
    ? (rawResume.language as WritingLanguage)
    : DEFAULT_RESUME.language;
  const script = VALID_JAPANESE_SCRIPTS.has(rawResume.script as KanaScript)
    ? (rawResume.script as KanaScript)
    : DEFAULT_RESUME.script;
  const hindiScript = VALID_HINDI_SCRIPTS.has(rawResume.hindiScript as HindiScript)
    ? (rawResume.hindiScript as HindiScript)
    : DEFAULT_RESUME.hindiScript;
  const selectedChar =
    typeof rawResume.selectedChar === 'string' && rawResume.selectedChar.length > 0
      ? rawResume.selectedChar
      : DEFAULT_RESUME.selectedChar;

  const rawPrefs = isRecord(raw.preferences) ? raw.preferences : {};
  const pencil = VALID_PENCILS.has(rawPrefs.pencil as PencilType)
    ? (rawPrefs.pencil as PencilType)
    : DEFAULT_PREFERENCES.pencil;
  const strokeSize = VALID_SIZES.has(rawPrefs.strokeSize as StrokeSize)
    ? (rawPrefs.strokeSize as StrokeSize)
    : DEFAULT_PREFERENCES.strokeSize;
  const inkColor =
    typeof rawPrefs.inkColor === 'string' && VALID_INK_HEXES.has(rawPrefs.inkColor)
      ? rawPrefs.inkColor
      : DEFAULT_PREFERENCES.inkColor;
  const gridStyle = VALID_GRIDS.has(rawPrefs.gridStyle as GridStyle)
    ? (rawPrefs.gridStyle as GridStyle)
    : DEFAULT_PREFERENCES.gridStyle;
  const showTrace =
    typeof rawPrefs.showTrace === 'boolean' ? rawPrefs.showTrace : DEFAULT_PREFERENCES.showTrace;
  const showNumbers =
    typeof rawPrefs.showNumbers === 'boolean'
      ? rawPrefs.showNumbers
      : DEFAULT_PREFERENCES.showNumbers;
  const guideSpeed =
    rawPrefs.guideSpeed === 'slow' || rawPrefs.guideSpeed === 'normal'
      ? rawPrefs.guideSpeed
      : DEFAULT_PREFERENCES.guideSpeed;
  const difficulty = VALID_DIFFICULTIES.has(rawPrefs.difficulty as StrokeDifficulty)
    ? (rawPrefs.difficulty as StrokeDifficulty)
    : DEFAULT_PREFERENCES.difficulty;

  const rawByDiff = isRecord(raw.byDifficulty) ? raw.byDifficulty : {};
  const byDifficulty: Partial<Record<StrokeDifficulty, DifficultyProgressBucket>> = {};
  for (const diff of VALID_DIFFICULTIES) {
    const rawBucket = rawByDiff[diff];
    if (isRecord(rawBucket)) {
      const bChars: Record<string, CharacterProgress> = {};
      const bPracticed = new Set<string>();
      if (Array.isArray(rawBucket.practicedChars)) {
        for (const ch of rawBucket.practicedChars) {
          if (typeof ch === 'string' && ch.length > 0) bPracticed.add(ch);
        }
      }
      if (isRecord(rawBucket.characters)) {
        for (const [ch, entry] of Object.entries(rawBucket.characters)) {
          if (!ch || !isRecord(entry)) continue;
          bPracticed.add(ch);
          bChars[ch] = {
            practicedCount: Math.max(1, toSafePositiveInt(entry.practicedCount, 1)),
            matchedCount: toSafePositiveInt(entry.matchedCount, 0),
            firstPracticedAt: toSafePositiveInt(entry.firstPracticedAt, 0),
            lastPracticedAt: toSafePositiveInt(entry.lastPracticedAt, 0),
          };
        }
      }
      byDifficulty[diff] = {
        practicedChars: Array.from(bPracticed),
        characters: bChars,
      };
    }
  }

  return {
    version: 2,
    updatedAt,
    practicedChars: Array.from(practicedSet),
    characters,
    byDifficulty,
    resume: {
      language,
      script,
      hindiScript,
      selectedChar,
    },
    preferences: {
      pencil,
      strokeSize,
      inkColor,
      gridStyle,
      showTrace,
      showNumbers,
      guideSpeed,
      difficulty,
    },
  };
}

export function getDifficultyBucket(
  progress: PersistedProgressData,
  difficulty: StrokeDifficulty
): DifficultyProgressBucket {
  const bucket = progress.byDifficulty?.[difficulty];
  if (bucket) return bucket;
  if (difficulty === 'medium') {
    return {
      practicedChars: progress.practicedChars,
      characters: progress.characters,
    };
  }
  return { practicedChars: [], characters: {} };
}

/**
 * Non-destructively merges two progress snapshots so practiced characters are never lost
 * when reconciling localStorage, IndexedDB, or cross-tab updates.
 */
export function mergeProgressData(
  a: PersistedProgressData,
  b: PersistedProgressData
): PersistedProgressData {
  const mergedChars: Record<string, CharacterProgress> = {};
  const practicedSet = new Set<string>([...a.practicedChars, ...b.practicedChars]);

  const allKeys = new Set<string>([
    ...Object.keys(a.characters),
    ...Object.keys(b.characters),
    ...practicedSet,
  ]);

  for (const char of allKeys) {
    const entryA = a.characters[char];
    const entryB = b.characters[char];
    practicedSet.add(char);

    if (entryA && entryB) {
      const firstA = entryA.firstPracticedAt || Number.MAX_SAFE_INTEGER;
      const firstB = entryB.firstPracticedAt || Number.MAX_SAFE_INTEGER;
      const firstMin = Math.min(firstA, firstB);
      mergedChars[char] = {
        practicedCount: Math.max(entryA.practicedCount, entryB.practicedCount),
        matchedCount: Math.max(entryA.matchedCount, entryB.matchedCount),
        firstPracticedAt: firstMin === Number.MAX_SAFE_INTEGER ? 0 : firstMin,
        lastPracticedAt: Math.max(entryA.lastPracticedAt, entryB.lastPracticedAt),
      };
    } else if (entryA) {
      mergedChars[char] = { ...entryA };
    } else if (entryB) {
      mergedChars[char] = { ...entryB };
    } else {
      mergedChars[char] = {
        practicedCount: 1,
        matchedCount: 0,
        firstPracticedAt: 0,
        lastPracticedAt: 0,
      };
    }
  }

  const mergedByDifficulty: Partial<Record<StrokeDifficulty, DifficultyProgressBucket>> = {};
  for (const diff of VALID_DIFFICULTIES) {
    const buckA = a.byDifficulty?.[diff];
    const buckB = b.byDifficulty?.[diff];
    if (!buckA && !buckB) continue;
    const bPracticed = new Set<string>([
      ...(buckA?.practicedChars ?? []),
      ...(buckB?.practicedChars ?? []),
    ]);
    const bChars: Record<string, CharacterProgress> = {};
    const bKeys = new Set<string>([
      ...Object.keys(buckA?.characters ?? {}),
      ...Object.keys(buckB?.characters ?? {}),
      ...bPracticed,
    ]);
    for (const ch of bKeys) {
      const eA = buckA?.characters[ch];
      const eB = buckB?.characters[ch];
      bPracticed.add(ch);
      if (eA && eB) {
        const fA = eA.firstPracticedAt || Number.MAX_SAFE_INTEGER;
        const fB = eB.firstPracticedAt || Number.MAX_SAFE_INTEGER;
        const fMin = Math.min(fA, fB);
        bChars[ch] = {
          practicedCount: Math.max(eA.practicedCount, eB.practicedCount),
          matchedCount: Math.max(eA.matchedCount, eB.matchedCount),
          firstPracticedAt: fMin === Number.MAX_SAFE_INTEGER ? 0 : fMin,
          lastPracticedAt: Math.max(eA.lastPracticedAt, eB.lastPracticedAt),
        };
      } else if (eA) {
        bChars[ch] = { ...eA };
      } else if (eB) {
        bChars[ch] = { ...eB };
      } else {
        bChars[ch] = { practicedCount: 1, matchedCount: 0, firstPracticedAt: 0, lastPracticedAt: 0 };
      }
    }
    mergedByDifficulty[diff] = {
      practicedChars: Array.from(bPracticed),
      characters: bChars,
    };
  }

  const preferB = b.updatedAt > a.updatedAt;
  const newer = preferB ? b : a;

  return {
    version: 2,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    practicedChars: Array.from(practicedSet),
    characters: mergedChars,
    byDifficulty: mergedByDifficulty,
    resume: { ...newer.resume },
    preferences: { ...newer.preferences },
  };
}

export function recordCharacterPractice(
  current: PersistedProgressData,
  char: string,
  options?: { matched?: boolean; now?: number; difficulty?: StrokeDifficulty }
): PersistedProgressData {
  if (!char) return current;
  const now = options?.now ?? Date.now();
  const diff = options?.difficulty ?? current.preferences.difficulty ?? 'medium';
  const currentBucket = getDifficultyBucket(current, diff);
  const existing = currentBucket.characters[char];
  const practicedCount = (existing?.practicedCount ?? 0) + (options?.matched ? (existing ? 0 : 1) : 1);
  const matchedCount = (existing?.matchedCount ?? 0) + (options?.matched ? 1 : 0);
  const firstPracticedAt = existing?.firstPracticedAt ? existing.firstPracticedAt : now;

  const practicedSet = new Set(currentBucket.practicedChars);
  practicedSet.add(char);

  const nextBucket: DifficultyProgressBucket = {
    practicedChars: Array.from(practicedSet),
    characters: {
      ...currentBucket.characters,
      [char]: {
        practicedCount,
        matchedCount,
        firstPracticedAt,
        lastPracticedAt: now,
      },
    },
  };

  return {
    ...current,
    updatedAt: now,
    practicedChars: diff === 'medium' ? nextBucket.practicedChars : current.practicedChars,
    characters: diff === 'medium' ? nextBucket.characters : current.characters,
    byDifficulty: {
      ...(current.byDifficulty ?? {}),
      [diff]: nextBucket,
    },
  };
}

function readLegacyPracticedFromLocalStorage(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_PRACTICED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.length > 0)
      : [];
  } catch {
    return [];
  }
}

export function loadProgressSync(): PersistedProgressData {
  let result = createDefaultProgressData(0);

  if (typeof localStorage !== 'undefined') {
    try {
      const rawV2 = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (rawV2) {
        result = sanitizeProgressData(JSON.parse(rawV2));
      }
    } catch {
      result = createDefaultProgressData(0);
    }

    // Migrate any characters from legacy v1 key so historical progress is never lost
    const legacyChars = readLegacyPracticedFromLocalStorage();
    if (legacyChars.length > 0) {
      const legacySnapshot = sanitizeProgressData({
        version: 2,
        updatedAt: 0,
        practicedChars: legacyChars,
      });
      result = mergeProgressData(result, legacySnapshot);
    }
  }

  return result;
}

function writeToLocalStorage(data: PersistedProgressData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(LEGACY_PRACTICED_STORAGE_KEY, JSON.stringify(data.practicedChars));
  } catch {
    // Ignore storage quota / private mode restrictions
  }
}

function openProgressDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function readIndexedDBKey<T = unknown>(key: string): Promise<T | null> {
  const db = await openProgressDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function writeIndexedDBKey(key: string, value: unknown): Promise<void> {
  const db = await openProgressDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function readProgressFromIndexedDB(): Promise<PersistedProgressData | null> {
  const raw = await readIndexedDBKey(IDB_PROGRESS_KEY);
  return raw ? sanitizeProgressData(raw) : null;
}

export async function writeProgressToIndexedDB(data: PersistedProgressData): Promise<void> {
  await writeIndexedDBKey(IDB_PROGRESS_KEY, data);
}

/**
 * Persists progress synchronously to localStorage and mirrors it asynchronously to IndexedDB
 * so user progress stays durable until browser data is cleared.
 */
export function saveProgress(data: PersistedProgressData): void {
  writeToLocalStorage(data);
  void writeProgressToIndexedDB(data);
}

/**
 * Reconciles synchronous localStorage state with IndexedDB on startup.
 * If IndexedDB has progress missing from localStorage, merges them non-destructively,
 * persists the merged snapshot back to both stores, and returns the merged snapshot.
 * Returns null if no update to in-memory state is needed.
 */
export async function hydrateProgressFromIndexedDB(
  current: PersistedProgressData
): Promise<PersistedProgressData | null> {
  const idbData = await readProgressFromIndexedDB();
  if (!idbData) {
    if (current.updatedAt > 0 || current.practicedChars.length > 0) {
      await writeProgressToIndexedDB(current);
    }
    return null;
  }

  const merged = mergeProgressData(current, idbData);
  const changed =
    merged.updatedAt !== current.updatedAt ||
    merged.practicedChars.length !== current.practicedChars.length ||
    JSON.stringify(merged) !== JSON.stringify(current);

  if (changed) {
    writeToLocalStorage(merged);
  }
  if (JSON.stringify(merged) !== JSON.stringify(idbData)) {
    await writeProgressToIndexedDB(merged);
  }

  return changed ? merged : null;
}

/**
 * Keeps open tabs in sync whenever another tab updates user progress in localStorage.
 */
export function subscribeToStorageUpdates(
  onRemoteProgress: (remote: PersistedProgressData) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: StorageEvent) => {
    if (
      event.key !== PROGRESS_STORAGE_KEY &&
      event.key !== LEGACY_PRACTICED_STORAGE_KEY
    ) {
      return;
    }
    onRemoteProgress(loadProgressSync());
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
