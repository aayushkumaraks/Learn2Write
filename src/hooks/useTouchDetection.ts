import { useEffect, useState } from 'react';
import type { InputMode } from '../types/kana';

export interface TouchDetectionSignals {
  hasOntouchstart: boolean;
  maxTouchPoints: number;
  coarsePointer: boolean;
}

export function detectTouchCapability(): {
  isTouchSupported: boolean;
  signals: TouchDetectionSignals;
} {
  if (typeof window === 'undefined') {
    return {
      isTouchSupported: false,
      signals: {
        hasOntouchstart: false,
        maxTouchPoints: 0,
        coarsePointer: false,
      },
    };
  }

  const hasOntouchstart = 'ontouchstart' in window;
  const maxTouchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  const coarsePointer =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;

  const isTouchSupported = hasOntouchstart || maxTouchPoints > 0 || coarsePointer;

  return {
    isTouchSupported,
    signals: {
      hasOntouchstart,
      maxTouchPoints,
      coarsePointer,
    },
  };
}

export interface UseTouchDetectionResult {
  /** Whether the browser/device reports touch screen support */
  isTouchSupported: boolean;
  /** The active event-listener mode currently bound to the canvas */
  activeInputMode: InputMode;
  /** Whether the user manually overrode the auto-detected mode */
  isManualOverride: boolean;
  /** Toggle or explicitly set input mode (useful on hybrid touch laptops) */
  setManualMode: (mode: InputMode | null) => void;
  /** Raw capability signals used for detection */
  signals: TouchDetectionSignals;
}

export function useTouchDetection(): UseTouchDetectionResult {
  const [detection, setDetection] = useState(() => detectTouchCapability());
  const [runtimeMode, setRuntimeMode] = useState<InputMode | null>(null);
  const [manualMode, setManualMode] = useState<InputMode | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refresh = () => setDetection(detectTouchCapability());
    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)')
        : null;

    const handleMediaChange = () => refresh();
    if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // On hybrid devices (touchscreen laptops), adapt if a real touch event occurs
    const handleFirstTouch = () => {
      setRuntimeMode('touch');
    };

    window.addEventListener('touchstart', handleFirstTouch, { passive: true });

    return () => {
      if (mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  const detectedMode: InputMode =
    runtimeMode ?? (detection.isTouchSupported ? 'touch' : 'mouse');
  const activeInputMode: InputMode = manualMode ?? detectedMode;

  return {
    isTouchSupported: detection.isTouchSupported || runtimeMode === 'touch',
    activeInputMode,
    isManualOverride: manualMode !== null,
    setManualMode,
    signals: detection.signals,
  };
}
