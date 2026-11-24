import { useEffect, useRef, useState } from 'react';
import type { KanaCharacter } from '../types/kana';

interface StrokeGuideOverlayProps {
  character: KanaCharacter;
  showTrace: boolean;
  showNumbers: boolean;
  isPlaying: boolean;
  playNonce: number;
  speed: 'slow' | 'normal';
  focusedStroke: number | null;
  onAnimationComplete: () => void;
  onActiveStrokeChange: (strokeIndex: number | null) => void;
}

interface TipPosition {
  x: number;
  y: number;
}

export function StrokeGuideOverlay({
  character,
  showTrace,
  showNumbers,
  isPlaying,
  playNonce,
  speed,
  focusedStroke,
  onAnimationComplete,
  onActiveStrokeChange,
}: StrokeGuideOverlayProps) {
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const pathLengthsRef = useRef<number[]>([]);
  const [animState, setAnimState] = useState<{
    strokeIndex: number;
    progress: number;
    tip: TipPosition | null;
  }>({
    strokeIndex: -1,
    progress: 0,
    tip: null,
  });

  // Reset refs array length when character changes
  pathRefs.current.length = character.strokes.length;
  pathLengthsRef.current.length = character.strokes.length;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let rafId = 0;
    let cancelled = false;
    const totalStrokes = character.strokes.length;
    const msPerUnit = speed === 'slow' ? 14 : 8.5;
    const minDuration = speed === 'slow' ? 580 : 380;
    const maxDuration = speed === 'slow' ? 1450 : 950;
    const pauseBetween = speed === 'slow' ? 320 : 210;

    // Measure actual SVG path lengths (with safe fallback for jsdom/tests)
    const lengths = character.strokes.map((_, idx) => {
      const el = pathRefs.current[idx];
      if (el && typeof el.getTotalLength === 'function') {
        try {
          const len = el.getTotalLength();
          return Number.isFinite(len) && len > 0 ? len : 60;
        } catch {
          return 60;
        }
      }
      return 60;
    });
    pathLengthsRef.current = lengths;

    const startStroke = focusedStroke !== null ? focusedStroke : 0;
    const endStroke = focusedStroke !== null ? focusedStroke : totalStrokes - 1;

    let currentIdx = startStroke;
    let phase: 'drawing' | 'pause' = 'drawing';
    let phaseStart = performance.now();

    onActiveStrokeChange(currentIdx);

    const step = (now: number) => {
      if (cancelled) return;

      const strokeLen = lengths[currentIdx] ?? 60;
      const duration = Math.min(maxDuration, Math.max(minDuration, strokeLen * msPerUnit));
      const elapsed = now - phaseStart;

      if (phase === 'drawing') {
        const rawT = Math.min(1, elapsed / duration);
        // Smooth ease-in-out cubic for natural brush motion
        const easedT =
          rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        let tip: TipPosition | null = null;
        const el = pathRefs.current[currentIdx];
        if (el && typeof el.getPointAtLength === 'function') {
          try {
            const pt = el.getPointAtLength(easedT * strokeLen);
            tip = { x: pt.x, y: pt.y };
          } catch {
            tip = null;
          }
        }

        setAnimState({
          strokeIndex: currentIdx,
          progress: easedT,
          tip,
        });

        if (rawT >= 1) {
          if (currentIdx >= endStroke) {
            setAnimState({ strokeIndex: endStroke, progress: 1, tip: null });
            onActiveStrokeChange(null);
            onAnimationComplete();
            return;
          }
          phase = 'pause';
          phaseStart = now;
        }
      } else {
        if (elapsed >= pauseBetween) {
          currentIdx += 1;
          phase = 'drawing';
          phaseStart = now;
          onActiveStrokeChange(currentIdx);
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [character, isPlaying, playNonce, speed, focusedStroke, onAnimationComplete, onActiveStrokeChange]);

  // Reset visual animation state when character changes and not playing
  useEffect(() => {
    if (!isPlaying && focusedStroke === null) {
      setAnimState({ strokeIndex: -1, progress: 0, tip: null });
    }
  }, [character, isPlaying, focusedStroke]);

  return (
    <svg
      className="guide-overlay"
      viewBox="0 0 109 109"
      aria-hidden="true"
      data-testid="stroke-guide-overlay"
    >
      {/* Hidden measurement paths so getTotalLength/getPointAtLength are always available */}
      <g className="guide-measure-layer">
        {character.strokes.map((d, idx) => (
          <path
            key={`measure-${character.unicode}-${idx}`}
            ref={(el) => {
              pathRefs.current[idx] = el;
            }}
            d={d}
            fill="none"
            stroke="transparent"
          />
        ))}
      </g>

      {/* Ghost trace layer */}
      {showTrace && (
        <g className="guide-trace-layer">
          {character.strokes.map((d, idx) => {
            const isHighlighted = focusedStroke === idx;
            return (
              <path
                key={`trace-${character.unicode}-${idx}`}
                d={d}
                fill="none"
                stroke={isHighlighted ? '#C87A5B' : '#D5C9B8'}
                strokeWidth={isHighlighted ? 5.6 : 4.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isHighlighted ? 0.55 : 0.48}
              />
            );
          })}
        </g>
      )}

      {/* Animated stroke-order layer */}
      {(isPlaying || animState.strokeIndex >= 0) && (
        <g className="guide-anim-layer">
          {character.strokes.map((d, idx) => {
            const isFocusedSingle = focusedStroke !== null;
            if (isFocusedSingle && idx !== focusedStroke) return null;

            const isCompleted = idx < animState.strokeIndex || (!isPlaying && idx <= animState.strokeIndex);
            const isActive = isPlaying && idx === animState.strokeIndex;

            if (!isCompleted && !isActive) return null;

            const totalLen = pathLengthsRef.current[idx] || 200;

            const dashOffset = isActive ? totalLen * (1 - animState.progress) : 0;

            return (
              <path
                key={`anim-${character.unicode}-${idx}`}
                d={d}
                fill="none"
                stroke={isActive ? '#B85A3F' : '#8F7B66'}
                strokeWidth={isActive ? 5.4 : 4.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={isActive ? totalLen : undefined}
                strokeDashoffset={isActive ? dashOffset : undefined}
                opacity={isActive ? 0.92 : 0.52}
              />
            );
          })}

          {/* Moving directional brush dot */}
          {isPlaying && animState.tip && (
            <g transform={`translate(${animState.tip.x}, ${animState.tip.y})`}>
              <circle r="5.6" fill="#B85A3F" opacity="0.22" />
              <circle r="3.1" fill="#B85A3F" stroke="#FAF7F2" strokeWidth="1.1" />
            </g>
          )}
        </g>
      )}

      {/* Stroke order numbers */}
      {showNumbers && (
        <g className="guide-numbers-layer">
          {character.numberPositions.map((pos, idx) => {
            const isActive =
              (isPlaying && animState.strokeIndex === idx) || focusedStroke === idx;
            return (
              <g
                key={`num-${character.unicode}-${pos.num}`}
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                <circle
                  cx="2.2"
                  cy="-2.8"
                  r="4.2"
                  fill={isActive ? '#B85A3F' : '#EFE7DA'}
                  stroke={isActive ? '#B85A3F' : '#C8B9A4'}
                  strokeWidth="0.7"
                />
                <text
                  x="2.2"
                  y="-0.8"
                  textAnchor="middle"
                  fontSize="5.2"
                  fontWeight="600"
                  fill={isActive ? '#FAF7F2' : '#6A5D4E'}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {pos.num}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
