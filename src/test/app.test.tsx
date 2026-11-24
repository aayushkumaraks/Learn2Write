import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import indexHtml from '../../index.html?raw';
import { App } from '../App';
import {
  HINDI_COMBINATIONS_LIST,
  HINDI_CONSONANTS_LIST,
  HINDI_VOWELS_LIST,
} from '../data/hindi';
import { THAI_CONSONANTS_LIST } from '../data/thai';
import { HIRAGANA_LIST, KANJI_LIST, KATAKANA_LIST } from '../data/kana';
import { detectTouchCapability } from '../hooks/useTouchDetection';
import { WritingCanvas } from '../components/WritingCanvas';
import { requestPersistentStorage } from '../utils/offline';
import { renderAllStrokes } from '../utils/pencilEngine';
import {
  LEGACY_PRACTICED_STORAGE_KEY,
  PROGRESS_STORAGE_KEY,
  createDefaultProgressData,
  loadProgressSync,
  mergeProgressData,
  recordCharacterPractice,
  sanitizeProgressData,
} from '../utils/progressStorage';
import {
  ACTIVE_TAB_SESSIONS_KEY,
  USER_STORE_STORAGE_KEY,
  createEmptyUsersStore,
  heartbeatTabSession,
  loginWithUserName,
  saveUsersStore,
  updateUserProgressInStore,
} from '../utils/userStorage';
import { computeUserStats } from '../utils/profileStats';
import { parseSvgPathToPolyline, validateDrawnCharacter } from '../utils/strokeValidator';

function renderLoggedInApp(userName = 'Alice') {
  const rendered = render(<App />);
  const input = screen.queryByLabelText(/^User name$/i);
  if (input) {
    fireEvent.change(input, { target: { value: userName } });
    fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));
  }
  return rendered;
}

describe('Kana dataset completeness', () => {
  it('contains all 46 Hiragana and 46 Katakana single characters (no words)', () => {
    expect(HIRAGANA_LIST).toHaveLength(46);
    expect(KATAKANA_LIST).toHaveLength(46);

    for (const item of [...HIRAGANA_LIST, ...KATAKANA_LIST]) {
      expect(Array.from(item.char)).toHaveLength(1);
      expect(item.strokes.length).toBeGreaterThan(0);
      expect(item.numberPositions.length).toBe(item.strokes.length);
    }

    expect(KANJI_LIST).toHaveLength(45);
    for (const item of KANJI_LIST) {
      expect(Array.from(item.char)).toHaveLength(1);
      expect(item.strokes.length).toBeGreaterThan(0);
      expect(item.numberPositions.length).toBe(item.strokes.length);
    }

    expect(HINDI_VOWELS_LIST).toHaveLength(15);
    expect(HINDI_CONSONANTS_LIST).toHaveLength(36);
    expect(HINDI_COMBINATIONS_LIST).toHaveLength(22);
    for (const item of [
      ...HINDI_VOWELS_LIST,
      ...HINDI_CONSONANTS_LIST,
      ...HINDI_COMBINATIONS_LIST,
    ]) {
      expect(item.strokes).toHaveLength(0);
      expect(item.numberPositions).toHaveLength(0);
    }
  });
});

describe('Touch screen detection and event listener binding', () => {
  const originalMaxTouchPoints = navigator.maxTouchPoints;
  const hadOntouchstart = 'ontouchstart' in window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: originalMaxTouchPoints,
    });
    if (!hadOntouchstart && 'ontouchstart' in window) {
      delete (window as unknown as Record<string, unknown>).ontouchstart;
    }
  });

  it('detects touch capability when maxTouchPoints > 0', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });
    const result = detectTouchCapability();
    expect(result.isTouchSupported).toBe(true);
    expect(result.signals.maxTouchPoints).toBe(5);
  });

  it('binds ONLY touch event listeners when inputMode is touch', () => {
    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener');

    render(
      <WritingCanvas
        character={HIRAGANA_LIST[0]}
        pencil="pencil"
        strokeSize="medium"
        inkColor="#2B2623"
        gridStyle="crosshair"
        showTrace={true}
        showNumbers={true}
        inputMode="touch"
        strokes={[]}
        onStrokesChange={() => {}}
        onUserPracticed={() => {}}
        isGuidePlaying={false}
        guidePlayNonce={0}
        guideSpeed="normal"
        focusedStroke={null}
        onGuideComplete={() => {}}
        onActiveGuideStrokeChange={() => {}}
      />
    );

    const events = addSpy.mock.calls.map((c) => c[0]);
    expect(events).toContain('touchstart');
    expect(events).toContain('touchmove');
    expect(events).toContain('touchend');
    expect(events).toContain('touchcancel');
    expect(events).not.toContain('mousedown');
    expect(events).not.toContain('mousemove');
  });

  it('binds ONLY mouse event listeners when inputMode is mouse', () => {
    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener');

    render(
      <WritingCanvas
        character={HIRAGANA_LIST[0]}
        pencil="brush"
        strokeSize="medium"
        inkColor="#2B2623"
        gridStyle="crosshair"
        showTrace={true}
        showNumbers={true}
        inputMode="mouse"
        strokes={[]}
        onStrokesChange={() => {}}
        onUserPracticed={() => {}}
        isGuidePlaying={false}
        guidePlayNonce={0}
        guideSpeed="normal"
        focusedStroke={null}
        onGuideComplete={() => {}}
        onActiveGuideStrokeChange={() => {}}
      />
    );

    const events = addSpy.mock.calls.map((c) => c[0]);
    expect(events).toContain('mousedown');
    expect(events).toContain('mousemove');
    expect(events).toContain('mouseup');
    expect(events).toContain('mouseleave');
    expect(events).not.toContain('touchstart');
    expect(events).not.toContain('touchmove');
  });
});

describe('Learn2Write App UI flows', () => {
  it('switches between Hiragana and Katakana, chooses pencils, and renders stroke guide', () => {
    renderLoggedInApp('Alice');

    // Starts on Hiragana あ
    expect(screen.getByLabelText('Selected character あ')).toBeInTheDocument();
    expect(screen.getByTestId('stroke-guide-overlay')).toBeInTheDocument();

    // Switch to Katakana tab
    fireEvent.click(screen.getByRole('tab', { name: /Katakana/i }));
    expect(screen.getByLabelText('Selected character ア')).toBeInTheDocument();

    // Switch to Kanji tab
    fireEvent.click(screen.getByRole('tab', { name: /Kanji/i }));
    expect(screen.getByLabelText('Selected character 一')).toBeInTheDocument();

    // Select a different pencil type in the side dock
    const markerRadio = screen.getByRole('radio', { name: /Felt Marker/i });
    fireEvent.click(markerRadio);
    expect(markerRadio).toHaveAttribute('aria-checked', 'true');

    // Collapse and re-expand the writing tools side dock
    const collapseBtn = screen.getByRole('button', { name: /Collapse writing tools dock/i });
    fireEvent.click(collapseBtn);
    expect(screen.queryByRole('radio', { name: /Felt Marker/i })).not.toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: /Expand writing tools dock/i });
    fireEvent.click(expandBtn);
    expect(screen.getByRole('radio', { name: /Felt Marker/i })).toHaveAttribute('aria-checked', 'true');

    // Cycle canvas grid
    const gridBtn = screen.getByRole('button', { name: /Cross Grid/i });
    fireEvent.click(gridBtn);
    expect(screen.getByRole('button', { name: /Fine Grid/i })).toBeInTheDocument();
  });

  it('replays guide on Space key and marks multi-stroke character practiced only after expected strokes', () => {
    const onUserPracticed = vi.fn();
    const onStrokesChange = vi.fn();
    const threeStrokeChar = HIRAGANA_LIST[0]; // あ (3 strokes)
    expect(threeStrokeChar.strokes.length).toBeGreaterThan(1);

    const { rerender } = render(
      <WritingCanvas
        character={threeStrokeChar}
        pencil="brush"
        strokeSize="medium"
        inkColor="#2B2623"
        gridStyle="crosshair"
        showTrace={true}
        showNumbers={true}
        inputMode="mouse"
        strokes={[]}
        onStrokesChange={onStrokesChange}
        onUserPracticed={onUserPracticed}
        isGuidePlaying={false}
        guidePlayNonce={0}
        guideSpeed="normal"
        focusedStroke={null}
        onGuideComplete={() => {}}
        onActiveGuideStrokeChange={() => {}}
      />
    );

    const canvas = screen.getByLabelText(/Practice canvas for/i);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // First stroke should not mark 3-stroke character as practiced
    fireEvent.mouseDown(canvas, { button: 0, clientX: 20, clientY: 20 });
    fireEvent.mouseMove(canvas, { clientX: 80, clientY: 20 });
    fireEvent.mouseUp(canvas);
    expect(onUserPracticed).not.toHaveBeenCalled();

    // Re-render with 2 existing strokes; completing the 3rd should mark practiced
    const dummyStroke = {
      points: [{ x: 0.1, y: 0.1, t: 0, pressure: 0.5 }],
      pencil: 'brush' as const,
      size: 'medium' as const,
      color: '#2B2623',
    };
    rerender(
      <WritingCanvas
        character={threeStrokeChar}
        pencil="brush"
        strokeSize="medium"
        inkColor="#2B2623"
        gridStyle="crosshair"
        showTrace={true}
        showNumbers={true}
        inputMode="mouse"
        strokes={[dummyStroke, dummyStroke]}
        onStrokesChange={onStrokesChange}
        onUserPracticed={onUserPracticed}
        isGuidePlaying={false}
        guidePlayNonce={0}
        guideSpeed="normal"
        focusedStroke={null}
        onGuideComplete={() => {}}
        onActiveGuideStrokeChange={() => {}}
      />
    );

    fireEvent.mouseDown(canvas, { button: 0, clientX: 20, clientY: 60 });
    fireEvent.mouseMove(canvas, { clientX: 80, clientY: 60 });
    fireEvent.mouseUp(canvas);
    expect(onUserPracticed).toHaveBeenCalledWith(threeStrokeChar.char);

    // Space key in App replays guide
    renderLoggedInApp('Alice');
    const pauseBtn = screen.getByRole('button', { name: /Pause guide animation/i });
    fireEvent.click(pauseBtn);
    expect(screen.getByRole('button', { name: /Play guide animation/i })).toBeInTheDocument();

    fireEvent.keyDown(document.body, { code: 'Space', key: ' ' });
    expect(screen.getByRole('button', { name: /Pause guide animation/i })).toBeInTheDocument();
  });

  it('clears the entire canvas backing store regardless of transform or DPR', () => {
    const setTransform = vi.fn();
    const clearRect = vi.fn();
    const mockCtx = {
      canvas: { width: 1040, height: 1040 },
      save: vi.fn(),
      restore: vi.fn(),
      setTransform,
      clearRect,
    } as unknown as CanvasRenderingContext2D;

    renderAllStrokes(mockCtx, [], 517, 517);

    expect(setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(clearRect).toHaveBeenCalledWith(0, 0, 1040, 1040);
  });

  it('starts with the writing tools side dock collapsed on small viewports', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 1080px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      renderLoggedInApp('Alice');
      expect(screen.getByRole('button', { name: /Expand writing tools dock/i })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      expect(screen.queryByRole('radio', { name: /Felt Marker/i })).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('validates drawn strokes against KanjiVG paths and renders green checkmark or red cross', () => {
    const kana = HIRAGANA_LIST[0]; // あ (3 strokes)

    // Build matching strokes directly from the reference SVG polylines (normalized 0..1)
    const matchingStrokes = kana.strokes.map((d) => ({
      points: parseSvgPathToPolyline(d).map((p, idx) => ({
        x: p.x / 109,
        y: p.y / 109,
        t: idx * 10,
        pressure: 0.5,
      })),
      pencil: 'brush' as const,
      size: 'medium' as const,
      color: '#2B2623',
    }));

    expect(validateDrawnCharacter(matchingStrokes, kana).status).toBe('matched');

    // Incomplete strokes (< 3) stay in-progress
    expect(validateDrawnCharacter(matchingStrokes.slice(0, 2), kana).status).toBe('in-progress');

    // Reversed first stroke at full stroke count should fail validation (mismatch)
    const reversedStrokes = matchingStrokes.map((s, idx) =>
      idx === 0 ? { ...s, points: [...s.points].reverse() } : s
    );
    expect(validateDrawnCharacter(reversedStrokes, kana).status).toBe('mismatch');

    // WritingCanvas shows neither icon while in-progress
    const { rerender } = render(
      <WritingCanvas
        character={kana}
        pencil="brush"
        strokeSize="medium"
        inkColor="#2B2623"
        gridStyle="crosshair"
        showTrace={true}
        showNumbers={true}
        inputMode="mouse"
        strokes={matchingStrokes.slice(0, 2)}
        validationStatus="in-progress"
        onStrokesChange={() => {}}
        onUserPracticed={() => {}}
        isGuidePlaying={false}
        guidePlayNonce={0}
        guideSpeed="normal"
        focusedStroke={null}
        onGuideComplete={() => {}}
        onActiveGuideStrokeChange={() => {}}
      />
    );
    expect(screen.queryByTestId('match-checkmark')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mismatch-cross')).not.toBeInTheDocument();

    // Shows red cross when stroke count is reached and does not match
    rerender(
      <WritingCanvas
        character={kana}
        pencil="brush"
        strokeSize="medium"
        inkColor="#2B2623"
        gridStyle="crosshair"
        showTrace={true}
        showNumbers={true}
        inputMode="mouse"
        strokes={reversedStrokes}
        validationStatus="mismatch"
        onStrokesChange={() => {}}
        onUserPracticed={() => {}}
        isGuidePlaying={false}
        guidePlayNonce={0}
        guideSpeed="normal"
        focusedStroke={null}
        onGuideComplete={() => {}}
        onActiveGuideStrokeChange={() => {}}
      />
    );
    expect(screen.queryByTestId('match-checkmark')).not.toBeInTheDocument();
    expect(screen.getByTestId('mismatch-cross')).toBeInTheDocument();

    // Shows green checkmark when matched
    rerender(
      <WritingCanvas
        character={kana}
        pencil="brush"
        strokeSize="medium"
        inkColor="#2B2623"
        gridStyle="crosshair"
        showTrace={true}
        showNumbers={true}
        inputMode="mouse"
        strokes={matchingStrokes}
        validationStatus="matched"
        onStrokesChange={() => {}}
        onUserPracticed={() => {}}
        isGuidePlaying={false}
        guidePlayNonce={0}
        guideSpeed="normal"
        focusedStroke={null}
        onGuideComplete={() => {}}
        onActiveGuideStrokeChange={() => {}}
      />
    );
    expect(screen.getByTestId('match-checkmark')).toBeInTheDocument();
    expect(screen.queryByTestId('mismatch-cross')).not.toBeInTheDocument();
  });

  it('validates Thai and Hindi sketches against rendered font glyph without stored strokes', () => {
    const thaiChar = THAI_CONSONANTS_LIST[0]; // ก
    expect(thaiChar.strokes).toHaveLength(0);

    // Mock 2D canvas getImageData to simulate a 109x109 font glyph + matching/off-ink user strokes
    const originalCreateElement = document.createElement.bind(document);
    const createMockCtx = (isRef: boolean, mode: 'match' | 'mismatch' | 'partial') => {
      const data = new Uint8ClampedArray(109 * 109 * 4);
      const setPx = (x: number, y: number) => {
        const idx = (y * 109 + x) * 4;
        data[idx + 3] = 255;
      };
      if (isRef) {
        for (let y = 30; y <= 70; y++) setPx(40, y);
      } else if (mode === 'match') {
        for (let y = 30; y <= 70; y++) setPx(40, y);
      } else if (mode === 'partial') {
        for (let y = 30; y <= 58; y++) setPx(40, y); // ~71% coverage -> still incomplete
      } else {
        for (let y = 30; y <= 70; y++) setPx(80, y);
      }
      return {
        clearRect: vi.fn(),
        fillText: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        getImageData: () => ({ data }),
      };
    };

    let mode: 'match' | 'mismatch' | 'partial' = 'match';
    let callCount = 0;
    const spy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'canvas') {
        const isRef = callCount % 2 === 0;
        callCount++;
        return {
          width: 109,
          height: 109,
          getContext: () => createMockCtx(isRef, mode),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    }) as typeof document.createElement);

    try {
      const dummyStroke = [
        {
          points: [
            { x: 0.37, y: 0.28, t: 0, pressure: 0.5 },
            { x: 0.37, y: 0.64, t: 10, pressure: 0.5 },
          ],
          pencil: 'brush' as const,
          size: 'medium' as const,
          color: '#2B2623',
        },
      ];

      mode = 'match';
      expect(validateDrawnCharacter(dummyStroke, thaiChar).status).toBe('matched');

      mode = 'partial';
      expect(validateDrawnCharacter(dummyStroke, thaiChar).status).toBe('in-progress');

      mode = 'mismatch';
      expect(validateDrawnCharacter(dummyStroke, thaiChar).status).toBe('mismatch');
    } finally {
      spy.mockRestore();
    }
  });

  it('disables non-Japanese languages in the top-level language select menu', () => {
    renderLoggedInApp('Alice');

    const select = screen.getByLabelText('Select language') as HTMLSelectElement;
    expect(select.value).toBe('japanese');
    expect(screen.getByLabelText('Selected character あ')).toBeInTheDocument();

    const thaiOption = select.querySelector('option[value="thai"]') as HTMLOptionElement;
    const hindiOption = select.querySelector('option[value="hindi"]') as HTMLOptionElement;
    expect(thaiOption.disabled).toBe(true);
    expect(hindiOption.disabled).toBe(true);

    // Even if a change event is dispatched, language remains Japanese
    fireEvent.change(select, { target: { value: 'thai' } });
    expect(select.value).toBe('japanese');
    expect(screen.getByLabelText('Selected character あ')).toBeInTheDocument();
  });
});

describe('Offline SPA and durable browser progress storage', () => {
  it('loads zero external network resources in index.html and includes SEO metadata', () => {
    expect(indexHtml).not.toMatch(/<script[^>]+src=["']https?:\/\//i);
    expect(indexHtml).not.toMatch(
      /<link[^>]+rel=["'](?:stylesheet|preconnect|dns-prefetch|preload)["'][^>]+https?:\/\//i
    );
    expect(indexHtml).toContain('manifest.webmanifest');
    expect(indexHtml).toContain('icon.svg');
    expect(indexHtml).toContain('rel="canonical" href="https://aayushkumaraks.github.io/Learn2Write/"');
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('application/ld+json');
  });

  it('asks only for User name on first load and supports login, logout, and listing all local browser users', () => {
    render(<App />);

    // First load with no user details asks ONLY for User name (no password/email fields)
    const nameInput = screen.getByLabelText(/^User name$/i);
    expect(nameInput).toBeInTheDocument();
    expect(document.querySelectorAll('input')).toHaveLength(1);
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Select language/i)).not.toBeInTheDocument();

    // Rejects blank user name
    fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a user name/i);

    // Login as Alice using only User name
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));

    expect(screen.getByLabelText('Selected character あ')).toBeInTheDocument();
    const usersList = screen.getByTestId('local-users-list');
    expect(usersList).toHaveTextContent('Alice');
    expect(usersList).toHaveTextContent('You');

    // Change Alice's script to Katakana and tool to Felt Marker
    fireEvent.click(screen.getByRole('tab', { name: /Katakana/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Felt Marker/i }));
    expect(screen.getByLabelText('Selected character ア')).toBeInTheDocument();

    // Logout Alice -> returns to User name screen and lists Alice as a local browser user
    fireEvent.click(screen.getByRole('button', { name: /^Logout$/i }));
    expect(screen.getByLabelText(/^User name$/i)).toBeInTheDocument();
    expect(screen.getByTestId('local-users-list')).toHaveTextContent('Alice');

    // Login as a second local user (Bob) -> starts with fresh default state
    fireEvent.change(screen.getByLabelText(/^User name$/i), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));

    expect(screen.getByLabelText('Selected character あ')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Felt Marker/i })).toHaveAttribute(
      'aria-checked',
      'false'
    );

    // Both Alice and Bob are listed in local browser users
    const barList = screen.getByTestId('local-users-list');
    expect(barList).toHaveTextContent('Bob');
    expect(barList).toHaveTextContent('Alice');

    // Simulate Alice also being active right now in another tab on this browser
    heartbeatTabSession('other-tab-1', 'alice');
    fireEvent(
      window,
      new StorageEvent('storage', {
        key: ACTIVE_TAB_SESSIONS_KEY,
        newValue: localStorage.getItem(ACTIVE_TAB_SESSIONS_KEY),
      })
    );
    expect(screen.getByTestId('local-users-list')).toHaveTextContent('Active');

    // Switch back to Alice with one click -> restores Alice's Katakana & Felt Marker state
    fireEvent.click(screen.getByRole('button', { name: /Alice/i }));
    expect(screen.getByLabelText('Selected character ア')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Felt Marker/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('persists practiced characters, resume position, and tool preferences per user across reloads', () => {
    const { unmount } = renderLoggedInApp('Aarav');

    // Change Japanese script, character, pencil, grid, and guide speed
    fireEvent.click(screen.getByRole('tab', { name: /Katakana/i }));
    fireEvent.click(screen.getByRole('button', { name: /カ \(ka\)/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Felt Marker/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cross Grid/i }));
    fireEvent.click(screen.getByRole('button', { name: /Normal/i }));

    // Switch to Mouse Mode if jsdom auto-detected touch, then draw expected strokes on canvas
    const modeBadge = screen.getByTestId('input-mode-badge');
    if (modeBadge.textContent?.includes('Touch Mode')) {
      fireEvent.click(modeBadge);
    }

    const canvas = screen.getByLabelText(/Practice canvas for/i);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    const ka = KATAKANA_LIST.find((c) => c.char === 'カ')!;
    for (let i = 0; i < ka.strokes.length; i++) {
      fireEvent.mouseDown(canvas, { button: 0, clientX: 20, clientY: 20 + i * 10 });
      fireEvent.mouseMove(canvas, { clientX: 80, clientY: 20 + i * 10 });
      fireEvent.mouseUp(canvas);
    }

    expect(localStorage.getItem(USER_STORE_STORAGE_KEY)).toContain('カ');

    // Simulate closing and reopening the browser (sessionStorage cleared, localStorage kept)
    unmount();
    sessionStorage.clear();
    render(<App />);

    // Automatically stays logged in as Aarav without re-prompting for User name
    expect(screen.queryByLabelText(/^User name$/i)).not.toBeInTheDocument();
    expect((screen.getByLabelText('Select language') as HTMLSelectElement).value).toBe('japanese');
    expect(screen.getByRole('tab', { name: /Katakana/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByLabelText('Selected character カ')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Felt Marker/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('button', { name: /Fine Grid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Slow/i })).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 46 practiced/i)).toBeInTheDocument();
    expect(screen.getByTestId('storage-status')).toHaveTextContent('Aarav');
    expect(screen.getByTestId('storage-status')).toHaveTextContent('1 /');
  });

  it('migrates legacy learn2write.practiced.v1 progress into the first local user without losing data', () => {
    localStorage.setItem(LEGACY_PRACTICED_STORAGE_KEY, JSON.stringify(['あ', 'い', 'ア']));
    const loaded = loadProgressSync();

    expect(loaded.practicedChars).toEqual(expect.arrayContaining(['あ', 'い', 'ア']));
    expect(loaded.characters['あ'].practicedCount).toBe(1);

    renderLoggedInApp('Yuki');
    expect(screen.getByText(/2 \/ 46 practiced/i)).toBeInTheDocument();
  });

  it('handles corrupt localStorage gracefully and merges snapshots non-destructively', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, '{not-valid-json');
    const fallback = loadProgressSync();
    expect(fallback.practicedChars).toEqual([]);
    expect(fallback.resume.language).toBe('japanese');

    expect(sanitizeProgressData({ resume: { language: 'invalid' } }).resume.language).toBe(
      'japanese'
    );

    const a = recordCharacterPractice(createDefaultProgressData(100), 'あ', { now: 100 });
    const b = recordCharacterPractice(createDefaultProgressData(200), 'い', {
      matched: true,
      now: 200,
    });
    b.resume.language = 'thai';
    b.resume.selectedChar = 'ก';

    const merged = mergeProgressData(a, b);
    expect(merged.practicedChars).toEqual(expect.arrayContaining(['あ', 'い']));
    expect(merged.characters['い'].matchedCount).toBe(1);
    expect(merged.resume.language).toBe('thai');
    expect(merged.resume.selectedChar).toBe('ก');
  });

  it('requests persistent browser storage when StorageManager API is available', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    const persisted = vi.fn().mockResolvedValue(false);
    const originalStorage = navigator.storage;

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist, persisted },
    });

    try {
      const status = await requestPersistentStorage();
      expect(status).toBe('persisted');
      expect(persist).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(navigator, 'storage', {
        configurable: true,
        value: originalStorage,
      });
    }
  });

  it('shows language-wise and user-wise progress and accuracy on the Profile page', () => {
    // Seed two local users with distinct Japanese progress and accuracy
    let store = createEmptyUsersStore(0);
    const aliceLogin = loginWithUserName(store, 'Alice', 100)!;
    store = aliceLogin.store;
    // Alice: 2 Japanese attempts (1 matched = 50% accuracy)
    store = updateUserProgressInStore(store, 'alice', (prev) => {
      let next = recordCharacterPractice(prev, 'あ', { now: 110 });
      next = recordCharacterPractice(next, 'あ', { matched: true, now: 111 });
      next = recordCharacterPractice(next, 'い', { now: 112 }); // mismatch / non-matched attempt
      return next;
    });

    const bobLogin = loginWithUserName(store, 'Bob', 200)!;
    store = bobLogin.store;
    // Bob: 1 Japanese character practiced and matched (100% accuracy)
    store = updateUserProgressInStore(store, 'bob', (prev) => {
      let next = recordCharacterPractice(prev, 'ア', { now: 210 });
      next = recordCharacterPractice(next, 'ア', { matched: true, now: 211 });
      return next;
    });

    // Keep Alice active
    store = { ...store, activeUserId: 'alice', updatedAt: 300 };
    saveUsersStore(store);

    // Verify pure analytics helper
    const aliceStats = computeUserStats(store.users.alice);
    expect(aliceStats.practicedChars).toBe(2);
    expect(aliceStats.attempts).toBe(2);
    expect(aliceStats.matches).toBe(1);
    expect(aliceStats.accuracyPct).toBe(50);
    expect(aliceStats.languages.find((l) => l.language === 'japanese')?.accuracyPct).toBe(50);

    // Open Profile page in App
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Profile$/i }));

    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByTestId('profile-kpi-accuracy')).toHaveTextContent('50%');
    expect(screen.getByTestId('profile-kpi-progress')).toHaveTextContent('2 /');

    // Language-wise cards (Japanese only)
    expect(screen.getByTestId('lang-card-japanese')).toHaveTextContent('2 / 137 practiced');
    expect(screen.getByTestId('lang-card-japanese')).toHaveTextContent('50%');
    expect(screen.queryByTestId('lang-card-thai')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lang-card-hindi')).not.toBeInTheDocument();

    // User-wise comparison table lists both Alice and Bob with their accuracy
    const table = screen.getByTestId('user-stats-table');
    expect(table).toHaveTextContent('Alice');
    expect(table).toHaveTextContent('Bob');
    expect(screen.getByTestId('user-stats-row-bob')).toHaveTextContent('100%');
    expect(screen.getByTestId('user-stats-row-bob')).toHaveTextContent('1/137');

    // Clicking Bob in the table switches active user to Bob and updates Profile cards
    fireEvent.click(screen.getByTestId('user-stats-row-bob').querySelector('button')!);
    expect(screen.getByRole('heading', { name: 'Bob' })).toBeInTheDocument();
    expect(screen.getByTestId('profile-kpi-accuracy')).toHaveTextContent('100%');
    expect(screen.getByTestId('lang-card-japanese')).toHaveTextContent('1 / 137 practiced');

    // Clicking a script row jumps directly back into Practice view for that script
    fireEvent.click(screen.getByTitle('Practice Japanese Katakana'));
    expect(screen.getByLabelText('Selected character ア')).toBeInTheDocument();
  });
});
