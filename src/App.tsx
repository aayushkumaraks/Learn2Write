import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Hand,
  Lock,
  MousePointer2,
  Pause,
  PenTool,
  Play,
  RotateCcw,
  User,
} from 'lucide-react';
import { HindiChart } from './components/HindiChart';
import { getUnlockedMaxIndex, KanaChart } from './components/KanaChart';
import { LocalUsersBar } from './components/LocalUsersBar';
import { ProfilePage } from './components/ProfilePage';
import { ScriptGridPanel } from './components/ScriptGridPanel';
import { ToolBar } from './components/ToolBar';
import { ToolDock } from './components/ToolDock';
import { UserLoginScreen } from './components/UserLoginScreen';
import { WritingCanvas } from './components/WritingCanvas';
import {
  getHindiList,
  HINDI_COMBINATIONS_LIST,
  HINDI_CONSONANTS_LIST,
  HINDI_VOWELS_LIST,
} from './data/hindi';
import { getKanaList, HIRAGANA_LIST, KANJI_LIST, KATAKANA_LIST } from './data/kana';
import { THAI_CONSONANTS_LIST } from './data/thai';
import { useTouchDetection } from './hooks/useTouchDetection';
import type {
  DrawnStroke,
  GridStyle,
  HindiScript,
  KanaCharacter,
  KanaScript,
  PencilType,
  StrokeDifficulty,
  StrokeSize,
  WritingLanguage,
} from './types/kana';
import {
  createDefaultProgressData,
  getDifficultyBucket,
  recordCharacterPractice,
  type PersistedProgressData,
  type PracticePreferences,
} from './utils/progressStorage';
import { DIFFICULTY_LABELS, validateDrawnCharacter } from './utils/strokeValidator';
import {
  createTabId,
  deleteUserFromStore,
  getActiveBrowserUserIds,
  getSortedLocalUsers,
  getTabUserId,
  heartbeatTabSession,
  hydrateUsersStoreFromIndexedDB,
  loadUsersStoreSync,
  loginWithUserName,
  logoutUsersStore,
  mergeUsersStore,
  removeTabSession,
  resetUserProgressInStore,
  saveUsersStore,
  setTabUserId,
  subscribeToActiveSessions,
  subscribeToUsersStoreUpdates,
  updateUserProgressInStore,
  type LocalUsersStore,
} from './utils/userStorage';

const TOTAL_CHARACTER_COUNT =
  HIRAGANA_LIST.length +
  KATAKANA_LIST.length +
  KANJI_LIST.length +
  THAI_CONSONANTS_LIST.length +
  HINDI_VOWELS_LIST.length +
  HINDI_CONSONANTS_LIST.length +
  HINDI_COMBINATIONS_LIST.length;

const FALLBACK_PROGRESS = createDefaultProgressData(0);

const ENABLED_LANGUAGES: ReadonlySet<WritingLanguage> = new Set(['japanese']);

function isSmallViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(max-width: 1080px)').matches;
}

function nextTimestamp(prevUpdatedAt: number): number {
  return Math.max(prevUpdatedAt + 1, Date.now());
}

export function App() {
  // Check local user availability on first load (localStorage + sessionStorage per-tab)
  const [initialState] = useState(() => {
    const store = loadUsersStoreSync();
    const savedTabUser = getTabUserId();
    const resolvedUserId =
      savedTabUser && store.users[savedTabUser] ? savedTabUser : store.activeUserId;
    return { store, resolvedUserId };
  });

  const [usersStore, setUsersStore] = useState<LocalUsersStore>(initialState.store);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialState.resolvedUserId);
  const [activeBrowserUserIds, setActiveBrowserUserIds] = useState<Set<string>>(() =>
    getActiveBrowserUserIds()
  );

  const tabIdRef = useRef<string>(createTabId());
  const usersStoreRef = useRef(usersStore);
  usersStoreRef.current = usersStore;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const currentUser = currentUserId ? (usersStore.users[currentUserId] ?? null) : null;
  const progress = currentUser?.progress ?? FALLBACK_PROGRESS;

  const { script, hindiScript, selectedChar } = progress.resume;
  const language: WritingLanguage = ENABLED_LANGUAGES.has(progress.resume.language)
    ? progress.resume.language
    : 'japanese';
  const { pencil, strokeSize, inkColor, gridStyle, showTrace, showNumbers, guideSpeed, difficulty } =
    progress.preferences;

  const [isToolDockOpen, setIsToolDockOpen] = useState<boolean>(() => !isSmallViewport());
  const [activeView, setActiveView] = useState<'practice' | 'profile'>('practice');
  const [loginDifficulty, setLoginDifficulty] = useState<StrokeDifficulty>('medium');

  // Canvas strokes (ephemeral per active attempt)
  const [strokes, setStrokes] = useState<DrawnStroke[]>([]);

  // Guide animation state
  const [isGuidePlaying, setIsGuidePlaying] = useState<boolean>(true);
  const [guidePlayNonce, setGuidePlayNonce] = useState<number>(0);
  const [focusedStroke, setFocusedStroke] = useState<number | null>(null);
  const [activeGuideStroke, setActiveGuideStroke] = useState<number | null>(null);

  // Success celebration animation (every match) & one-time modals
  const [successAnimNonce, setSuccessAnimNonce] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showFailureModal, setShowFailureModal] = useState<boolean>(false);
  const [lockedModalInfo, setLockedModalInfo] = useState<{
    target: KanaCharacter;
    blocker: KanaCharacter;
  } | null>(null);
  const shownSuccessModalCharsRef = useRef<Set<string>>(new Set());

  // Offline/online status indicator (app works 100% offline in both states)
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine === false : false
  );

  // Touch vs Mouse detection
  const { activeInputMode, isTouchSupported, isManualOverride, setManualMode } =
    useTouchDetection();

  const currentList = useMemo(() => {
    if (language === 'thai') return THAI_CONSONANTS_LIST;
    if (language === 'hindi') return getHindiList(hindiScript);
    return getKanaList(script);
  }, [language, script, hindiScript]);

  const activeBucket = useMemo(
    () => getDifficultyBucket(progress, difficulty),
    [progress, difficulty]
  );

  const practicedChars = useMemo(
    () => new Set(activeBucket.practicedChars),
    [activeBucket.practicedChars]
  );

  const unlockedMaxIdx = useMemo(
    () => getUnlockedMaxIndex(currentList, practicedChars),
    [currentList, practicedChars]
  );

  const selected = useMemo(() => {
    const idx = currentList.findIndex((item) => item.char === selectedChar);
    if (idx === -1) return currentList[0];
    return currentList[Math.min(idx, unlockedMaxIdx)];
  }, [currentList, selectedChar, unlockedMaxIdx]);

  const currentIndex = useMemo(
    () => Math.max(0, currentList.findIndex((item) => item.char === selected.char)),
    [currentList, selected]
  );

  const localUsers = useMemo(
    () => getSortedLocalUsers(usersStore, activeBrowserUserIds, currentUser?.id ?? null),
    [usersStore, activeBrowserUserIds, currentUser?.id]
  );

  const validation = useMemo(
    () => validateDrawnCharacter(strokes, selected, difficulty),
    [strokes, selected, difficulty]
  );

  // Persist users store to both localStorage and IndexedDB
  useEffect(() => {
    if (usersStore.updatedAt > 0 || Object.keys(usersStore.users).length > 0) {
      saveUsersStore(usersStore);
    }
  }, [usersStore]);

  // Reconcile with IndexedDB mirror on startup (recovers users & progress if localStorage was cleared/stale)
  useEffect(() => {
    let cancelled = false;
    void hydrateUsersStoreFromIndexedDB(usersStoreRef.current).then((hydrated) => {
      if (cancelled || !hydrated) return;
      setUsersStore((prev) => {
        const reconciled = mergeUsersStore(prev, hydrated);
        return JSON.stringify(reconciled) === JSON.stringify(prev) ? prev : reconciled;
      });
      if (!currentUserIdRef.current && hydrated.activeUserId) {
        setCurrentUserId(hydrated.activeUserId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep local users & progress synced across open browser tabs
  useEffect(() => {
    const unsubUsers = subscribeToUsersStoreUpdates((remote) => {
      setUsersStore((prev) => {
        const merged = mergeUsersStore(prev, remote);
        return JSON.stringify(merged) === JSON.stringify(prev) ? prev : merged;
      });
    });
    const unsubSessions = subscribeToActiveSessions((liveIds) => {
      setActiveBrowserUserIds(liveIds);
    });
    return () => {
      unsubUsers();
      unsubSessions();
    };
  }, []);

  // Maintain live presence heartbeat for this browser tab
  useEffect(() => {
    const tabId = tabIdRef.current;
    const activeId = currentUser?.id ?? null;
    setTabUserId(activeId);
    heartbeatTabSession(tabId, activeId);
    setActiveBrowserUserIds(getActiveBrowserUserIds());

    if (!activeId) return;

    const timer = window.setInterval(() => {
      heartbeatTabSession(tabId, activeId);
      setActiveBrowserUserIds(getActiveBrowserUserIds());
    }, 10_000);

    const handlePageHide = () => {
      removeTabSession(tabId);
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [currentUser?.id]);

  // Clean up tab session on unmount
  useEffect(() => {
    const tabId = tabIdRef.current;
    return () => {
      removeTabSession(tabId);
    };
  }, []);

  // Track browser offline/online connectivity status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateCurrentUserProgress = useCallback(
    (updater: (prev: PersistedProgressData) => PersistedProgressData) => {
      const uid = currentUserIdRef.current;
      if (!uid) return;
      setUsersStore((prev) => updateUserProgressInStore(prev, uid, updater));
    },
    []
  );

  // Record a matched validation once per completed drawing attempt,
  // and show failure modal on mismatch until the user succeeds at least once.
  const matchedAttemptCharRef = useRef<string | null>(null);
  const mismatchedAttemptRef = useRef<boolean>(false);
  useEffect(() => {
    if (!currentUser) return;
    if (strokes.length === 0) {
      matchedAttemptCharRef.current = null;
      mismatchedAttemptRef.current = false;
      return;
    }

    const hasSucceededOnce =
      shownSuccessModalCharsRef.current.has(selected.char) ||
      (activeBucket.characters[selected.char]?.matchedCount ?? 0) > 0;

    if (validation.status === 'matched' && matchedAttemptCharRef.current !== selected.char) {
      matchedAttemptCharRef.current = selected.char;
      mismatchedAttemptRef.current = false;
      setShowFailureModal(false);
      setSuccessAnimNonce((n) => n + 1);
      if (!hasSucceededOnce) {
        shownSuccessModalCharsRef.current.add(selected.char);
        setShowSuccessModal(true);
      }
      updateCurrentUserProgress((prev) =>
        recordCharacterPractice(prev, selected.char, {
          matched: true,
          difficulty,
          now: nextTimestamp(prev.updatedAt),
        })
      );
    } else if (validation.status === 'mismatch' && !mismatchedAttemptRef.current) {
      mismatchedAttemptRef.current = true;
      if (!hasSucceededOnce) {
        setShowFailureModal(true);
      }
    } else if (validation.status !== 'mismatch') {
      mismatchedAttemptRef.current = false;
    }
  }, [
    currentUser,
    validation.status,
    strokes.length,
    selected.char,
    activeBucket.characters,
    difficulty,
    updateCurrentUserProgress,
  ]);

  const resetCanvasForCharacter = useCallback(() => {
    matchedAttemptCharRef.current = null;
    mismatchedAttemptRef.current = false;
    setShowSuccessModal(false);
    setShowFailureModal(false);
    setLockedModalInfo(null);
    setStrokes([]);
    setFocusedStroke(null);
    setIsGuidePlaying(true);
    setGuidePlayNonce((n) => n + 1);
  }, []);

  const handleLogin = useCallback(
    (rawName: string, chosenDifficulty?: StrokeDifficulty) => {
      const result = loginWithUserName(usersStoreRef.current, rawName);
      if (!result) return;
      shownSuccessModalCharsRef.current.clear();
      let nextStore = result.store;
      if (chosenDifficulty) {
        nextStore = updateUserProgressInStore(nextStore, result.user.id, (prev) => ({
          ...prev,
          updatedAt: nextTimestamp(prev.updatedAt),
          preferences: {
            ...prev.preferences,
            difficulty: chosenDifficulty,
          },
        }));
      }
      saveUsersStore(nextStore);
      setUsersStore(nextStore);
      setCurrentUserId(result.user.id);
      resetCanvasForCharacter();
    },
    [resetCanvasForCharacter]
  );

  const handleLogout = useCallback(() => {
    removeTabSession(tabIdRef.current);
    setTabUserId(null);
    shownSuccessModalCharsRef.current.clear();
    setShowSuccessModal(false);
    setShowFailureModal(false);
    const nextStore = logoutUsersStore(usersStoreRef.current);
    saveUsersStore(nextStore);
    setUsersStore(nextStore);
    setCurrentUserId(null);
    setActiveView('practice');
    setActiveBrowserUserIds(getActiveBrowserUserIds());
    matchedAttemptCharRef.current = null;
    setStrokes([]);
  }, []);

  const handleResetCurrentProfile = useCallback(() => {
    const uid = currentUserIdRef.current;
    if (!uid) return;
    shownSuccessModalCharsRef.current.clear();
    const nextStore = resetUserProgressInStore(usersStoreRef.current, uid);
    saveUsersStore(nextStore);
    setUsersStore(nextStore);
    resetCanvasForCharacter();
  }, [resetCanvasForCharacter]);

  const handleDeleteCurrentProfile = useCallback(() => {
    const uid = currentUserIdRef.current;
    if (!uid) return;
    removeTabSession(tabIdRef.current);
    setTabUserId(null);
    shownSuccessModalCharsRef.current.clear();
    setShowSuccessModal(false);
    setShowFailureModal(false);
    setLockedModalInfo(null);
    const nextStore = deleteUserFromStore(usersStoreRef.current, uid);
    saveUsersStore(nextStore);
    setUsersStore(nextStore);
    setCurrentUserId(null);
    setActiveView('practice');
    setActiveBrowserUserIds(getActiveBrowserUserIds());
    matchedAttemptCharRef.current = null;
    setStrokes([]);
  }, []);

  const handlePracticeScript = useCallback(
    (nextLang: WritingLanguage, nextScript: KanaScript, nextHindiScript?: HindiScript) => {
      if (!ENABLED_LANGUAGES.has(nextLang)) return;
      updateCurrentUserProgress((prev) => {
        const resolvedHindi = nextHindiScript ?? prev.resume.hindiScript;
        const resolvedScript =
          nextLang === 'japanese' ? nextScript : prev.resume.script;
        const nextList =
          nextLang === 'thai'
            ? THAI_CONSONANTS_LIST
            : nextLang === 'hindi'
              ? getHindiList(resolvedHindi)
              : getKanaList(resolvedScript);
        return {
          ...prev,
          updatedAt: nextTimestamp(prev.updatedAt),
          resume: {
            ...prev.resume,
            language: nextLang,
            script: resolvedScript,
            hindiScript: resolvedHindi,
            selectedChar: nextList[0].char,
          },
        };
      });
      resetCanvasForCharacter();
      setActiveView('practice');
    },
    [updateCurrentUserProgress, resetCanvasForCharacter]
  );

  const updatePreferences = useCallback(
    (updater: (prev: PracticePreferences) => PracticePreferences) => {
      updateCurrentUserProgress((prev) => {
        const nextPrefs = updater(prev.preferences);
        if (nextPrefs === prev.preferences) return prev;
        return {
          ...prev,
          updatedAt: nextTimestamp(prev.updatedAt),
          preferences: nextPrefs,
        };
      });
    },
    [updateCurrentUserProgress]
  );

  const selectCharacter = useCallback(
    (kana: KanaCharacter) => {
      const targetIdx = currentList.findIndex((item) => item.char === kana.char);
      if (targetIdx > unlockedMaxIdx) {
        const blocker = currentList[unlockedMaxIdx];
        setLockedModalInfo({ target: kana, blocker });
        return;
      }
      setLockedModalInfo(null);
      updateCurrentUserProgress((prev) => ({
        ...prev,
        updatedAt: nextTimestamp(prev.updatedAt),
        resume: {
          ...prev.resume,
          selectedChar: kana.char,
        },
      }));
      resetCanvasForCharacter();
    },
    [currentList, unlockedMaxIdx, updateCurrentUserProgress, resetCanvasForCharacter]
  );

  const handleLanguageChange = useCallback(
    (nextLang: WritingLanguage) => {
      if (!ENABLED_LANGUAGES.has(nextLang) || nextLang === language) return;
      updateCurrentUserProgress((prev) => {
        const nextScript =
          nextLang === 'japanese' &&
          (prev.resume.script === 'thai' || prev.resume.script.startsWith('hindi'))
            ? 'hiragana'
            : prev.resume.script;
        const nextList =
          nextLang === 'thai'
            ? THAI_CONSONANTS_LIST
            : nextLang === 'hindi'
              ? getHindiList(prev.resume.hindiScript)
              : getKanaList(nextScript);
        return {
          ...prev,
          updatedAt: nextTimestamp(prev.updatedAt),
          resume: {
            ...prev.resume,
            language: nextLang,
            script: nextScript,
            selectedChar: nextList[0].char,
          },
        };
      });
      resetCanvasForCharacter();
    },
    [language, updateCurrentUserProgress, resetCanvasForCharacter]
  );

  const handleHindiScriptChange = useCallback(
    (nextScript: HindiScript) => {
      if (nextScript === hindiScript) return;
      const nextList = getHindiList(nextScript);
      updateCurrentUserProgress((prev) => ({
        ...prev,
        updatedAt: nextTimestamp(prev.updatedAt),
        resume: {
          ...prev.resume,
          hindiScript: nextScript,
          selectedChar: nextList[0].char,
        },
      }));
      resetCanvasForCharacter();
    },
    [hindiScript, updateCurrentUserProgress, resetCanvasForCharacter]
  );

  const handleScriptChange = useCallback(
    (nextScript: KanaScript) => {
      if (nextScript === script) return;
      const nextList = getKanaList(nextScript);
      const nextUnlockedMax = getUnlockedMaxIndex(nextList, practicedChars);
      // Try to match the same romaji if already unlocked, otherwise jump to the current frontier
      const matchIdx = nextList.findIndex((item) => item.romaji === selected.romaji);
      const target =
        matchIdx !== -1 && matchIdx <= nextUnlockedMax
          ? nextList[matchIdx]
          : nextList[nextUnlockedMax];
      setLockedModalInfo(null);
      updateCurrentUserProgress((prev) => ({
        ...prev,
        updatedAt: nextTimestamp(prev.updatedAt),
        resume: {
          ...prev.resume,
          script: nextScript,
          selectedChar: target.char,
        },
      }));
      resetCanvasForCharacter();
    },
    [script, selected.romaji, practicedChars, updateCurrentUserProgress, resetCanvasForCharacter]
  );

  const handleStepCharacter = useCallback(
    (delta: number) => {
      const nextIdx = currentIndex + delta;
      if (nextIdx < 0) {
        selectCharacter(currentList[unlockedMaxIdx]);
        return;
      }
      if (nextIdx > unlockedMaxIdx) {
        const blocker = currentList[unlockedMaxIdx];
        const target = currentList[nextIdx] ?? currentList[currentList.length - 1];
        setLockedModalInfo({ target, blocker });
        return;
      }
      selectCharacter(currentList[nextIdx]);
    },
    [currentIndex, currentList, unlockedMaxIdx, selectCharacter]
  );

  const handleReplayGuide = useCallback(() => {
    setFocusedStroke(null);
    setIsGuidePlaying(true);
    setGuidePlayNonce((n) => n + 1);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isGuidePlaying) {
      setIsGuidePlaying(false);
    } else {
      setFocusedStroke(null);
      setIsGuidePlaying(true);
      setGuidePlayNonce((n) => n + 1);
    }
  }, [isGuidePlaying]);

  const handlePlaySingleStroke = useCallback((strokeIdx: number) => {
    setFocusedStroke(strokeIdx);
    setIsGuidePlaying(true);
    setGuidePlayNonce((n) => n + 1);
  }, []);

  const handleGuideComplete = useCallback(() => {
    setIsGuidePlaying(false);
  }, []);

  const handlePencilChange = useCallback(
    (nextPencil: PencilType) => {
      updatePreferences((prev) => ({ ...prev, pencil: nextPencil }));
    },
    [updatePreferences]
  );

  const handleStrokeSizeChange = useCallback(
    (nextSize: StrokeSize) => {
      updatePreferences((prev) => ({ ...prev, strokeSize: nextSize }));
    },
    [updatePreferences]
  );

  const handleInkColorChange = useCallback(
    (nextColor: string) => {
      updatePreferences((prev) => ({ ...prev, inkColor: nextColor }));
    },
    [updatePreferences]
  );

  const handleCycleGrid = useCallback(() => {
    updatePreferences((prev) => {
      const nextGrid: GridStyle =
        prev.gridStyle === 'crosshair'
          ? 'quad'
          : prev.gridStyle === 'quad'
            ? 'none'
            : 'crosshair';
      return { ...prev, gridStyle: nextGrid };
    });
  }, [updatePreferences]);

  const handleToggleTrace = useCallback(() => {
    updatePreferences((prev) => ({ ...prev, showTrace: !prev.showTrace }));
  }, [updatePreferences]);

  const handleToggleNumbers = useCallback(() => {
    updatePreferences((prev) => ({ ...prev, showNumbers: !prev.showNumbers }));
  }, [updatePreferences]);

  const handleToggleGuideSpeed = useCallback(() => {
    updatePreferences((prev) => ({
      ...prev,
      guideSpeed: prev.guideSpeed === 'normal' ? 'slow' : 'normal',
    }));
  }, [updatePreferences]);

  const handleDifficultyChange = useCallback(
    (nextDifficulty: StrokeDifficulty) => {
      updatePreferences((prev) => ({ ...prev, difficulty: nextDifficulty }));
    },
    [updatePreferences]
  );

  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    matchedAttemptCharRef.current = null;
    setStrokes([]);
  }, []);

  const handleUserPracticed = useCallback(
    (char: string) => {
      updateCurrentUserProgress((prev) =>
        recordCharacterPractice(prev, char, {
          difficulty: prev.preferences.difficulty,
          now: nextTimestamp(prev.updatedAt),
        })
      );
    },
    [updateCurrentUserProgress]
  );

  // Mark font-validated characters (Thai/Hindi) as practiced as soon as their sketch matches
  useEffect(() => {
    if (selected.strokes.length === 0 && validation.isMatch) {
      handleUserPracticed(selected.char);
    }
  }, [selected.strokes.length, selected.char, validation.isMatch, handleUserPracticed]);

  const handleToggleInputMode = useCallback(() => {
    const next = activeInputMode === 'touch' ? 'mouse' : 'touch';
    setManualMode(next);
  }, [activeInputMode, setManualMode]);

  // Keyboard shortcuts for desktop convenience (only in practice view when logged in)
  useEffect(() => {
    if (!currentUser || activeView !== 'practice') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'ArrowRight') {
        handleStepCharacter(1);
      } else if (e.key === 'ArrowLeft') {
        handleStepCharacter(-1);
      } else if (
        (e.code === 'Space' || e.key === ' ') &&
        !(e.target instanceof HTMLButtonElement)
      ) {
        e.preventDefault();
        handleReplayGuide();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentUser, activeView, handleUndo, handleStepCharacter, handleReplayGuide]);

  // First load / logged-out check: ask only for User name and show existing local browser users
  if (!currentUser) {
    return (
      <UserLoginScreen
        localUsers={localUsers}
        activeBrowserUserIds={activeBrowserUserIds}
        totalCharacters={TOTAL_CHARACTER_COUNT}
        difficulty={loginDifficulty}
        onDifficultyChange={setLoginDifficulty}
        onLogin={(name) => handleLogin(name, loginDifficulty)}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Minimal top bar */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            書
          </span>
          <div>
            <h1 className="brand-title">Learn2Write</h1>
            <p className="brand-subtitle">
              {language === 'thai'
                ? 'Thai Script Stroke Practice'
                : language === 'hindi'
                  ? 'Hindi Devanagari Stroke Practice'
                  : 'Japanese Kana Stroke Practice'}
            </p>
          </div>
        </div>

        <div className="header-right">
          <nav className="view-nav" aria-label="Workspace view">
            <button
              type="button"
              className={`view-nav-btn ${activeView === 'practice' ? 'is-active' : ''}`}
              onClick={() => setActiveView('practice')}
              aria-current={activeView === 'practice' ? 'page' : undefined}
              title={`Practice (${DIFFICULTY_LABELS[difficulty]})`}
            >
              <PenTool size={14} />
              <span>Practice</span>
              {activeView === 'practice' && (
                <span
                  className={`nav-diff-badge is-${difficulty}`}
                  aria-hidden="true"
                  data-testid="practice-tab-difficulty"
                >
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
              )}
            </button>
            <button
              type="button"
              className={`view-nav-btn ${activeView === 'profile' ? 'is-active' : ''}`}
              onClick={() => setActiveView('profile')}
              aria-current={activeView === 'profile' ? 'page' : undefined}
              title={`Profile (${DIFFICULTY_LABELS[difficulty]})`}
            >
              <User size={14} />
              <span>Profile</span>
              {activeView === 'profile' && (
                <span
                  className={`nav-diff-badge is-${difficulty}`}
                  aria-hidden="true"
                  data-testid="profile-tab-difficulty"
                >
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
              )}
            </button>
          </nav>

          <div className="language-select-wrap">
            <label htmlFor="language-select" className="sr-only">
              Select language
            </label>
            <select
              id="language-select"
              className="language-select"
              aria-label="Select language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as WritingLanguage)}
            >
              <option value="japanese">Japanese</option>
              <option value="thai" disabled>
                Thai (Disabled)
              </option>
              <option value="hindi" disabled>
                Hindi (Disabled)
              </option>
            </select>
          </div>

          <button
            type="button"
            className={`input-mode-pill ${activeInputMode === 'touch' ? 'is-touch' : 'is-mouse'}`}
            onClick={handleToggleInputMode}
            title={
              isManualOverride
                ? `Input mode manually set to ${activeInputMode}. Click to switch.`
                : `Auto-detected ${isTouchSupported ? 'touch screen' : 'mouse'} input (${activeInputMode} listeners active). Click to switch.`
            }
            data-testid="input-mode-badge"
          >
            {activeInputMode === 'touch' ? <Hand size={14} /> : <MousePointer2 size={14} />}
            <span>{activeInputMode === 'touch' ? 'Touch Mode' : 'Mouse Mode'}</span>
          </button>
        </div>
      </header>

      {/* Local browser users bar (lists all local users, switch by name, logout) */}
      <LocalUsersBar
        currentUser={currentUser}
        localUsers={localUsers}
        activeBrowserUserIds={activeBrowserUserIds}
        onSwitchUser={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main view: Practice workspace or Profile analytics page */}
      {activeView === 'profile' ? (
        <ProfilePage
          currentUser={currentUser}
          localUsers={localUsers}
          activeBrowserUserIds={activeBrowserUserIds}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          onBackToPractice={() => setActiveView('practice')}
          onPracticeScript={handlePracticeScript}
          onSwitchUser={handleLogin}
          onResetProfile={handleResetCurrentProfile}
          onDeleteProfile={handleDeleteCurrentProfile}
        />
      ) : (
        <main className="workspace">
        <ToolDock
          pencil={pencil}
          onPencilChange={handlePencilChange}
          strokeSize={strokeSize}
          onStrokeSizeChange={handleStrokeSizeChange}
          inkColor={inkColor}
          onInkColorChange={handleInkColorChange}
          isOpen={isToolDockOpen}
          onToggleOpen={() => setIsToolDockOpen((v) => !v)}
        />

        <section className="practice-column" aria-label="Writing practice area">
          {/* Selected character header + guide animation controls */}
          <div className="character-card">
            <div className="character-identity">
              <div className="character-badge" aria-label={`Selected character ${selected.char}`}>
                <span className="character-big">{selected.char}</span>
              </div>
              <div className="character-meta">
                <div className="character-title-row">
                  <span className="character-romaji">{selected.romaji}</span>
                  <span className="script-chip">
                    {selected.script === 'hiragana'
                      ? 'Hiragana'
                      : selected.script === 'katakana'
                        ? 'Katakana'
                        : selected.script === 'kanji'
                          ? 'Kanji'
                          : selected.script === 'thai'
                            ? 'Thai'
                            : selected.script === 'hindi-vowels'
                              ? 'Hindi · Vowels'
                              : selected.script === 'hindi-consonants'
                                ? 'Hindi · Consonants'
                                : 'Hindi · Combine'}
                  </span>
                </div>
                <p className="stroke-count-label">
                  {selected.strokes.length === 0
                    ? strokes.length > 0
                      ? `${strokes.length} ${strokes.length === 1 ? 'stroke' : 'strokes'} drawn`
                      : 'Font trace guide'
                    : strokes.length > 0
                      ? `${strokes.length} / ${selected.strokes.length} ${selected.strokes.length === 1 ? 'stroke' : 'strokes'}`
                      : `${selected.strokes.length} ${selected.strokes.length === 1 ? 'stroke' : 'strokes'}`}
                </p>
              </div>
            </div>

            <div className="character-nav">
              <button
                type="button"
                className="icon-btn"
                onClick={() => handleStepCharacter(-1)}
                aria-label="Previous character"
                title="Previous character"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="nav-counter">
                {currentIndex + 1} / {currentList.length}
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => handleStepCharacter(1)}
                aria-label="Next character"
                title="Next character"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Guide Animation Controls */}
          <div className="guide-bar" role="region" aria-label="Stroke guide animation controls">
            <div className="guide-controls-left">
              <button
                type="button"
                className="guide-play-btn"
                onClick={handleTogglePlay}
                disabled={selected.strokes.length === 0}
                aria-label={isGuidePlaying ? 'Pause guide animation' : 'Play guide animation'}
                title={
                  selected.strokes.length === 0
                    ? 'Font trace guide active (no stroke-order animation)'
                    : undefined
                }
              >
                {isGuidePlaying && selected.strokes.length > 0 ? (
                  <Pause size={15} />
                ) : (
                  <Play size={15} />
                )}
                <span>
                  {isGuidePlaying && selected.strokes.length > 0 ? 'Pause Guide' : 'Play Guide'}
                </span>
              </button>

              <button
                type="button"
                className="guide-secondary-btn"
                onClick={handleReplayGuide}
                disabled={selected.strokes.length === 0}
                title="Replay full stroke order animation"
              >
                <RotateCcw size={14} />
                <span>Replay</span>
              </button>

              <button
                type="button"
                className="guide-secondary-btn"
                onClick={handleToggleGuideSpeed}
                title="Toggle animation speed"
              >
                <Gauge size={14} />
                <span>{guideSpeed === 'slow' ? 'Slow' : 'Normal'}</span>
              </button>
            </div>

            {/* Individual stroke step pills */}
            {selected.strokes.length > 0 && (
              <div className="stroke-pills" aria-label="Play individual stroke">
                <span className="stroke-pills-label">Stroke:</span>
                {selected.strokes.map((_, idx) => {
                  const isActive =
                    (isGuidePlaying && activeGuideStroke === idx) || focusedStroke === idx;
                  return (
                    <button
                      key={`${selected.unicode}-pill-${idx}`}
                      type="button"
                      className={`stroke-pill ${isActive ? 'is-active' : ''}`}
                      onClick={() => handlePlaySingleStroke(idx)}
                      title={`Play stroke ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Grid Writing Canvas */}
          <WritingCanvas
            character={selected}
            pencil={pencil}
            strokeSize={strokeSize}
            inkColor={inkColor}
            gridStyle={gridStyle}
            showTrace={showTrace}
            showNumbers={showNumbers}
            inputMode={activeInputMode}
            strokes={strokes}
            difficulty={difficulty}
            validationStatus={validation.status}
            successAnimNonce={successAnimNonce}
            onStrokesChange={setStrokes}
            onUndo={handleUndo}
            onClear={handleClear}
            onUserPracticed={handleUserPracticed}
            isGuidePlaying={isGuidePlaying}
            guidePlayNonce={guidePlayNonce}
            guideSpeed={guideSpeed}
            focusedStroke={focusedStroke}
            onGuideComplete={handleGuideComplete}
            onActiveGuideStrokeChange={setActiveGuideStroke}
          />

          {/* Canvas Actions Bar */}
          <ToolBar
            gridStyle={gridStyle}
            onCycleGrid={handleCycleGrid}
            showTrace={showTrace}
            onToggleTrace={handleToggleTrace}
            showNumbers={showNumbers}
            onToggleNumbers={handleToggleNumbers}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            canUndo={strokes.length > 0}
            onUndo={handleUndo}
            onClear={handleClear}
          />
        </section>

        {/* Alphabet Selector Panel */}
        {language === 'thai' ? (
          <ScriptGridPanel
            title="Thai Consonants"
            sampleRange="ก–ฮ"
            ariaLabel="Thai alphabet selector"
            items={THAI_CONSONANTS_LIST}
            selected={selected}
            onSelect={selectCharacter}
            practicedChars={practicedChars}
          />
        ) : language === 'hindi' ? (
          <HindiChart
            script={hindiScript}
            onScriptChange={handleHindiScriptChange}
            selected={selected}
            onSelect={selectCharacter}
            practicedChars={practicedChars}
          />
        ) : (
          <KanaChart
            script={script}
            onScriptChange={handleScriptChange}
            selected={selected}
            onSelect={selectCharacter}
            practicedChars={practicedChars}
          />
        )}
      </main>
      )}

      {showSuccessModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="modal-confetti-layer"
            aria-hidden="true"
            data-testid="modal-confetti"
          >
            {Array.from({ length: 18 }, (_, idx) => (
              <span key={idx} className={`confetti-piece c${(idx % 18) + 1}`} />
            ))}
          </div>

          <div
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
            data-testid="success-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-modal-char" aria-hidden="true">
              {selected.char}
            </div>
            <h2 id="success-modal-title" className="success-modal-title">
              Great job!
            </h2>
            <p className="success-modal-body">
              You matched <strong>{selected.char}</strong> ({selected.romaji}). Would you like to
              keep practicing this character or move forward?
            </p>
            <div className="success-modal-actions">
              <button
                type="button"
                className="guide-secondary-btn success-modal-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleClear();
                }}
              >
                Keep Practicing
              </button>
              <button
                type="button"
                className="guide-play-btn success-modal-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleStepCharacter(1);
                }}
              >
                Move Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {showFailureModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            setShowFailureModal(false);
            handleClear();
          }}
        >
          <div
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="failure-modal-title"
            data-testid="failure-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="failure-modal-char" aria-hidden="true">
              {selected.char}
            </div>
            <h2 id="failure-modal-title" className="success-modal-title">
              Not quite right
            </h2>
            <p className="success-modal-body">
              Your strokes for <strong>{selected.char}</strong> ({selected.romaji}) did not match
              the guide. Try following the stroke order and try again.
            </p>
            <div className="success-modal-actions">
              <button
                type="button"
                className="guide-play-btn success-modal-btn"
                onClick={() => {
                  setShowFailureModal(false);
                  handleClear();
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {lockedModalInfo && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setLockedModalInfo(null)}
        >
          <div
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="locked-modal-title"
            data-testid="locked-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="locked-modal-char" aria-hidden="true">
              <Lock size={22} />
              <span>{lockedModalInfo.target.char}</span>
            </div>
            <h2 id="locked-modal-title" className="success-modal-title">
              Character Locked
            </h2>
            <p className="success-modal-body">
              To practice <strong>{lockedModalInfo.target.char}</strong> (
              {lockedModalInfo.target.romaji}), finish{' '}
              <strong>{lockedModalInfo.blocker.char}</strong> ({lockedModalInfo.blocker.romaji})
              first to unlock it!
            </p>
            <div className="success-modal-actions">
              <button
                type="button"
                className="guide-secondary-btn success-modal-btn"
                onClick={() => setLockedModalInfo(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="guide-play-btn success-modal-btn"
                onClick={() => {
                  const blocker = lockedModalInfo.blocker;
                  setLockedModalInfo(null);
                  selectCharacter(blocker);
                }}
              >
                Practice {lockedModalInfo.blocker.char}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-line">
          {language === 'thai' ? (
            <span>Thai Consonants Practice · ก–ฮ Stroke Guide</span>
          ) : language === 'hindi' ? (
            <span>Hindi Devanagari Practice · Complete Varnamala Stroke Guide</span>
          ) : (
            <span>Japanese Hiragana, Katakana &amp; Kanji · Stroke data from KanjiVG (CC BY-SA 3.0)</span>
          )}
          <span className="footer-sep" aria-hidden="true">
            ·
          </span>
          <span className="footer-status" data-testid="storage-status">
            {currentUser.name} · {isOffline ? 'Offline mode' : 'Offline-ready SPA'} ·{' '}
            {practicedChars.size} / {TOTAL_CHARACTER_COUNT} saved locally
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
