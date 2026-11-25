import { Check, Eraser, Undo2, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import type { StrokeValidationResult } from '../utils/strokeValidator';
import type {
  DrawPoint,
  DrawnStroke,
  GridStyle,
  InputMode,
  KanaCharacter,
  PencilType,
  StrokeDifficulty,
  StrokeSize,
} from '../types/kana';
import { renderAllStrokes, renderStroke, smoothStrokePoints } from '../utils/pencilEngine';
import { StrokeGuideOverlay } from './StrokeGuideOverlay';

interface WritingCanvasProps {
  character: KanaCharacter;
  pencil: PencilType;
  strokeSize: StrokeSize;
  inkColor: string;
  gridStyle: GridStyle;
  showTrace: boolean;
  showNumbers: boolean;
  inputMode: InputMode;
  strokes: DrawnStroke[];
  difficulty?: StrokeDifficulty;
  validationStatus?: StrokeValidationResult['status'];
  successAnimNonce?: number;
  onStrokesChange: (updater: (prev: DrawnStroke[]) => DrawnStroke[]) => void;
  onUndo?: () => void;
  onClear?: () => void;
  onUserPracticed: (char: string) => void;
  isGuidePlaying: boolean;
  guidePlayNonce: number;
  guideSpeed: 'slow' | 'normal';
  focusedStroke: number | null;
  onGuideComplete: () => void;
  onActiveGuideStrokeChange: (idx: number | null) => void;
}

export function WritingCanvas({
  character,
  pencil,
  strokeSize,
  inkColor,
  gridStyle,
  showTrace,
  showNumbers,
  inputMode,
  strokes,
  difficulty = 'medium',
  validationStatus = 'idle',
  successAnimNonce = 0,
  onStrokesChange,
  onUndo,
  onClear,
  onUserPracticed,
  isGuidePlaying,
  guidePlayNonce,
  guideSpeed,
  focusedStroke,
  onGuideComplete,
  onActiveGuideStrokeChange,
}: WritingCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<DrawnStroke | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<DrawnStroke[]>(strokes);
  strokesRef.current = strokes;

  const settingsRef = useRef({
    pencil,
    strokeSize,
    inkColor,
    difficulty,
    char: character.char,
    expectedStrokes: character.strokes.length,
  });
  settingsRef.current = {
    pencil,
    strokeSize,
    inkColor,
    difficulty,
    char: character.char,
    expectedStrokes: character.strokes.length,
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || canvas.width;
    const cssHeight = rect.height || canvas.height;
    renderAllStrokes(ctx, strokesRef.current, cssWidth, cssHeight);
    if (activeStrokeRef.current) {
      renderStroke(ctx, activeStrokeRef.current, cssWidth, cssHeight);
    }
  }, []);

  // Sync canvas backing store with ResizeObserver for crisp HiDPI rendering
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width || container.clientWidth);
      const cssHeight = Math.max(1, rect.height || container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.max(1, Math.round(cssWidth * dpr));
      canvas.height = Math.max(1, Math.round(cssHeight * dpr));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(canvas.width / cssWidth, 0, 0, canvas.height / cssHeight, 0, 0);
      }
      redraw();
    };

    resize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  // Discard any in-progress stroke when switching characters
  useEffect(() => {
    activeStrokeRef.current = null;
    isDrawingRef.current = false;
  }, [character]);

  // Redraw whenever committed strokes change (e.g. Undo / Clear / Character switch)
  useEffect(() => {
    redraw();
  }, [strokes, redraw]);

  const toNormalizedPoint = (clientX: number, clientY: number, pressure = 0.5): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
      t: performance.now(),
      pressure,
    };
  };

  // Explicitly bind Touch Event listeners when touch mode is active,
  // or Mouse Event listeners when mouse mode is active.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const beginStroke = (pt: DrawPoint | null) => {
      if (!pt) return;
      isDrawingRef.current = true;
      activeStrokeRef.current = {
        points: [pt],
        pencil: settingsRef.current.pencil,
        size: settingsRef.current.strokeSize,
        color: settingsRef.current.inkColor,
      };
      redraw();
    };

    const extendStroke = (pt: DrawPoint | null) => {
      if (!isDrawingRef.current || !activeStrokeRef.current || !pt) return;
      const pts = activeStrokeRef.current.points;
      const last = pts[pts.length - 1];
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist < 0.0025) return; // avoid redundant sub-pixel noise
      pts.push(pt);
      redraw();
    };

    const finishStroke = () => {
      if (!isDrawingRef.current || !activeStrokeRef.current) return;
      const raw = activeStrokeRef.current;
      const finished: DrawnStroke = {
        ...raw,
        points: smoothStrokePoints(raw.points, settingsRef.current.difficulty),
      };
      activeStrokeRef.current = null;
      isDrawingRef.current = false;
      const nextCount = strokesRef.current.length + 1;
      onStrokesChange((prev) => [...prev, finished]);
      if (nextCount >= settingsRef.current.expectedStrokes) {
        onUserPracticed(settingsRef.current.char);
      }
    };

    if (inputMode === 'touch') {
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 0) return;
        e.preventDefault();
        const touch = e.touches[0];
        const force = typeof touch.force === 'number' && touch.force > 0 ? touch.force : 0.5;
        beginStroke(toNormalizedPoint(touch.clientX, touch.clientY, force));
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDrawingRef.current || e.touches.length === 0) return;
        e.preventDefault();
        const touch = e.touches[0];
        const force = typeof touch.force === 'number' && touch.force > 0 ? touch.force : 0.5;
        extendStroke(toNormalizedPoint(touch.clientX, touch.clientY, force));
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        finishStroke();
      };

      const handleTouchCancel = () => {
        finishStroke();
      };

      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchCancel);

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchCancel);
      };
    }

    // Mouse event listeners for non-touch devices
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      beginStroke(toNormalizedPoint(e.clientX, e.clientY, 0.5));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      extendStroke(toNormalizedPoint(e.clientX, e.clientY, 0.5));
    };

    const handleWindowMouseUp = () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      finishStroke();
    };

    const handleMouseUp = () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      finishStroke();
    };

    const handleMouseLeave = () => {
      if (isDrawingRef.current) {
        window.addEventListener('mouseup', handleWindowMouseUp, { once: true });
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [inputMode, onStrokesChange, onUserPracticed, redraw]);

  const stageStateClass =
    validationStatus === 'matched'
      ? 'is-matched'
      : validationStatus === 'mismatch'
        ? 'is-mismatch'
        : '';

  return (
    <div
      ref={containerRef}
      className={`canvas-stage ${stageStateClass}`}
      data-input-mode={inputMode}
      data-grid-style={gridStyle}
    >
      {/* Japanese writing practice grid */}
      {gridStyle !== 'none' && (
        <svg className="canvas-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {/* Outer inset practice frame */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            fill="none"
            stroke="#DFD5C5"
            strokeWidth="0.6"
          />

          {/* Classic crosshair center guides (十字リーダー) */}
          <line
            x1="50"
            y1="4"
            x2="50"
            y2="96"
            stroke="#D6C9B6"
            strokeWidth="0.55"
            strokeDasharray="2.2 2.2"
          />
          <line
            x1="4"
            y1="50"
            x2="96"
            y2="50"
            stroke="#D6C9B6"
            strokeWidth="0.55"
            strokeDasharray="2.2 2.2"
          />

          {/* Optional 4x4 fine sub-grid */}
          {gridStyle === 'quad' && (
            <>
              <line x1="27" y1="4" x2="27" y2="96" stroke="#E7DFD2" strokeWidth="0.4" strokeDasharray="1.5 2.5" />
              <line x1="73" y1="4" x2="73" y2="96" stroke="#E7DFD2" strokeWidth="0.4" strokeDasharray="1.5 2.5" />
              <line x1="4" y1="27" x2="96" y2="27" stroke="#E7DFD2" strokeWidth="0.4" strokeDasharray="1.5 2.5" />
              <line x1="4" y1="73" x2="96" y2="73" stroke="#E7DFD2" strokeWidth="0.4" strokeDasharray="1.5 2.5" />
              <line x1="4" y1="4" x2="96" y2="96" stroke="#ECE5D9" strokeWidth="0.35" strokeDasharray="1.5 3" />
              <line x1="96" y1="4" x2="4" y2="96" stroke="#ECE5D9" strokeWidth="0.35" strokeDasharray="1.5 3" />
            </>
          )}
        </svg>
      )}

      {/* Stroke-order trace & animation overlay */}
      <StrokeGuideOverlay
        character={character}
        showTrace={showTrace}
        showNumbers={showNumbers}
        isPlaying={isGuidePlaying}
        playNonce={guidePlayNonce}
        speed={guideSpeed}
        focusedStroke={focusedStroke}
        onAnimationComplete={onGuideComplete}
        onActiveStrokeChange={onActiveGuideStrokeChange}
      />

      {/* Interactive drawing layer */}
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        aria-label={`Practice canvas for ${character.script} ${character.char} (${character.romaji})`}
      />

      {(onUndo || onClear) && (
        <div className="canvas-floating-actions" role="group" aria-label="Quick canvas actions">
          {onUndo && (
            <button
              type="button"
              className="canvas-float-btn"
              onClick={onUndo}
              disabled={strokes.length === 0}
              aria-label="Quick undo"
              title="Undo last stroke"
              data-testid="canvas-undo-btn"
            >
              <Undo2 size={15} />
            </button>
          )}
          {onClear && (
            <button
              type="button"
              className="canvas-float-btn is-clear"
              onClick={onClear}
              disabled={strokes.length === 0}
              aria-label="Quick reset"
              title="Clear canvas"
              data-testid="canvas-clear-btn"
            >
              <Eraser size={15} />
            </button>
          )}
        </div>
      )}

      {validationStatus === 'matched' && (
        <>
          {successAnimNonce > 0 && (
            <div
              key={`success-anim-${successAnimNonce}`}
              className="success-burst"
              aria-hidden="true"
              data-testid="success-animation"
            >
              <span className="success-ring" />
              <span className="success-spark s1" />
              <span className="success-spark s2" />
              <span className="success-spark s3" />
              <span className="success-spark s4" />
              <span className="success-spark s5" />
              <span className="success-spark s6" />
              <span className="success-spark s7" />
              <span className="success-spark s8" />
            </div>
          )}
          <div
            key={`match-badge-${successAnimNonce}`}
            className="validation-badge is-matched"
            role="status"
            aria-label="Character matches"
            data-testid="match-checkmark"
            title="Great job! Character matches."
          >
            <Check size={20} strokeWidth={2.8} />
          </div>
        </>
      )}

      {validationStatus === 'mismatch' && (
        <div
          className="validation-badge is-mismatch"
          role="status"
          aria-label="Character does not match"
          data-testid="mismatch-cross"
          title="Strokes do not match the guide. Try again."
        >
          <X size={20} strokeWidth={2.8} />
        </div>
      )}
    </div>
  );
}
