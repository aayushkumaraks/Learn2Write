import type { DrawPoint, DrawnStroke, KanaCharacter } from '../types/kana';

export interface Point2D {
  x: number;
  y: number;
}

export interface StrokeValidationResult {
  status: 'idle' | 'in-progress' | 'matched' | 'mismatch';
  isMatch: boolean;
  strokeCountMatch: boolean;
  matchedStrokes: boolean[];
}

const KANJIVG_SIZE = 109;
const SAMPLE_COUNT = 24;

// Thresholds in KanjiVG (0..109) coordinate units
const MAX_AVG_BIDIR_DIST = 15;
const MAX_DIR_DIST = 18;
const MAX_ENDPOINT_DIST = 26;

function dist2D(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function evalCubicBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
}

function evalQuadBezier(p0: Point2D, p1: Point2D, p2: Point2D, t: number): Point2D {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/**
 * Parses an SVG path string (supporting M/m, L/l, H/h, V/v, C/c, S/s, Q/q)
 * into a polyline in KanjiVG coordinates.
 */
export function parseSvgPathToPolyline(d: string, curveSteps = 16): Point2D[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return [];

  const points: Point2D[] = [];
  let i = 0;
  let curr: Point2D = { x: 0, y: 0 };
  let start: Point2D = { x: 0, y: 0 };
  let lastCmd = '';
  let lastCubicCtrl: Point2D | null = null;

  const nextNum = (): number => parseFloat(tokens[i++]);
  const isNum = (tok: string | undefined): boolean =>
    tok !== undefined && !/^[a-zA-Z]$/.test(tok);

  while (i < tokens.length) {
    let cmd = tokens[i];
    if (/^[a-zA-Z]$/.test(cmd)) {
      i++;
    } else {
      cmd = lastCmd === 'M' ? 'L' : lastCmd === 'm' ? 'l' : lastCmd;
    }

    const isRel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();

    if (upper === 'M') {
      const x = nextNum() + (isRel ? curr.x : 0);
      const y = nextNum() + (isRel ? curr.y : 0);
      curr = { x, y };
      start = { x, y };
      points.push(curr);
      lastCubicCtrl = null;
      while (isNum(tokens[i])) {
        const lx = nextNum() + (isRel ? curr.x : 0);
        const ly = nextNum() + (isRel ? curr.y : 0);
        curr = { x: lx, y: ly };
        points.push(curr);
      }
    } else if (upper === 'L') {
      while (isNum(tokens[i])) {
        const x = nextNum() + (isRel ? curr.x : 0);
        const y = nextNum() + (isRel ? curr.y : 0);
        curr = { x, y };
        points.push(curr);
      }
      lastCubicCtrl = null;
    } else if (upper === 'H') {
      while (isNum(tokens[i])) {
        const x = nextNum() + (isRel ? curr.x : 0);
        curr = { x, y: curr.y };
        points.push(curr);
      }
      lastCubicCtrl = null;
    } else if (upper === 'V') {
      while (isNum(tokens[i])) {
        const y = nextNum() + (isRel ? curr.y : 0);
        curr = { x: curr.x, y };
        points.push(curr);
      }
      lastCubicCtrl = null;
    } else if (upper === 'C') {
      while (isNum(tokens[i])) {
        const x1 = nextNum() + (isRel ? curr.x : 0);
        const y1 = nextNum() + (isRel ? curr.y : 0);
        const x2 = nextNum() + (isRel ? curr.x : 0);
        const y2 = nextNum() + (isRel ? curr.y : 0);
        const x = nextNum() + (isRel ? curr.x : 0);
        const y = nextNum() + (isRel ? curr.y : 0);
        const p0 = curr;
        const p1 = { x: x1, y: y1 };
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        for (let s = 1; s <= curveSteps; s++) {
          points.push(evalCubicBezier(p0, p1, p2, p3, s / curveSteps));
        }
        lastCubicCtrl = p2;
        curr = p3;
      }
    } else if (upper === 'S') {
      while (isNum(tokens[i])) {
        const p1 =
          lastCubicCtrl && (lastCmd.toUpperCase() === 'C' || lastCmd.toUpperCase() === 'S')
            ? { x: 2 * curr.x - lastCubicCtrl.x, y: 2 * curr.y - lastCubicCtrl.y }
            : curr;
        const x2 = nextNum() + (isRel ? curr.x : 0);
        const y2 = nextNum() + (isRel ? curr.y : 0);
        const x = nextNum() + (isRel ? curr.x : 0);
        const y = nextNum() + (isRel ? curr.y : 0);
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        for (let s = 1; s <= curveSteps; s++) {
          points.push(evalCubicBezier(curr, p1, p2, p3, s / curveSteps));
        }
        lastCubicCtrl = p2;
        curr = p3;
      }
    } else if (upper === 'Q') {
      while (isNum(tokens[i])) {
        const x1 = nextNum() + (isRel ? curr.x : 0);
        const y1 = nextNum() + (isRel ? curr.y : 0);
        const x = nextNum() + (isRel ? curr.x : 0);
        const y = nextNum() + (isRel ? curr.y : 0);
        const p1 = { x: x1, y: y1 };
        const p2 = { x, y };
        for (let s = 1; s <= curveSteps; s++) {
          points.push(evalQuadBezier(curr, p1, p2, s / curveSteps));
        }
        curr = p2;
      }
      lastCubicCtrl = null;
    } else if (upper === 'Z') {
      curr = start;
      points.push(curr);
      lastCubicCtrl = null;
    }

    lastCmd = cmd;
  }

  return points;
}

/**
 * Resamples a polyline to `count` equidistant points.
 */
export function resamplePolyline(points: Point2D[], count: number): Point2D[] {
  if (points.length === 0) return [];
  if (points.length === 1 || count <= 1) {
    return Array.from({ length: count }, () => points[0]);
  }

  const cumDist: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumDist.push(cumDist[i - 1] + dist2D(points[i - 1], points[i]));
  }
  const totalLen = cumDist[cumDist.length - 1];
  if (totalLen === 0) {
    return Array.from({ length: count }, () => points[0]);
  }

  const resampled: Point2D[] = [];
  let segIdx = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * totalLen;
    while (segIdx < cumDist.length - 2 && cumDist[segIdx + 1] < target) {
      segIdx++;
    }
    const segStart = cumDist[segIdx];
    const segEnd = cumDist[segIdx + 1];
    const segLen = segEnd - segStart;
    const t = segLen > 0 ? (target - segStart) / segLen : 0;
    const pA = points[segIdx];
    const pB = points[segIdx + 1];
    resampled.push({
      x: pA.x + (pB.x - pA.x) * t,
      y: pA.y + (pB.y - pA.y) * t,
    });
  }

  return resampled;
}

function meanNearestDistance(source: Point2D[], target: Point2D[]): number {
  if (source.length === 0 || target.length === 0) return Infinity;
  let sum = 0;
  for (const s of source) {
    let minD = Infinity;
    for (const t of target) {
      const d = dist2D(s, t);
      if (d < minD) minD = d;
    }
    sum += minD;
  }
  return sum / source.length;
}

function toKanjiVgPoints(points: DrawPoint[]): Point2D[] {
  return points.map((p) => ({
    x: p.x * KANJIVG_SIZE,
    y: p.y * KANJIVG_SIZE,
  }));
}

function validateSingleStroke(userStroke: DrawnStroke, refSvgPath: string): boolean {
  const rawUser = toKanjiVgPoints(userStroke.points);
  const rawRef = parseSvgPathToPolyline(refSvgPath);
  if (rawUser.length === 0 || rawRef.length === 0) return false;

  const user = resamplePolyline(rawUser, SAMPLE_COUNT);
  const ref = resamplePolyline(rawRef, SAMPLE_COUNT);

  const startDist = dist2D(user[0], ref[0]);
  const endDist = dist2D(user[user.length - 1], ref[ref.length - 1]);
  if (startDist > MAX_ENDPOINT_DIST || endDist > MAX_ENDPOINT_DIST) {
    return false;
  }

  const userToRef = meanNearestDistance(user, ref);
  const refToUser = meanNearestDistance(ref, user);
  const avgBidir = (userToRef + refToUser) / 2;

  return (
    avgBidir <= MAX_AVG_BIDIR_DIST &&
    userToRef <= MAX_DIR_DIST &&
    refToUser <= MAX_DIR_DIST
  );
}

function getFontFamilyForScript(script: KanaCharacter['script']): string {
  if (script === 'thai') {
    return "'Noto Sans Thai', 'FreeSerif', 'Thonburi', sans-serif";
  }
  return "'Noto Sans Devanagari', 'FreeSans', 'Kohinoor Devanagari', sans-serif";
}

function dilateBinary(mask: Uint8Array, size: number, radius: number): Uint8Array {
  const out = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask[y * size + x]) continue;
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(size - 1, y + radius);
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(size - 1, x + radius);
      for (let ny = y0; ny <= y1; ny++) {
        for (let nx = x0; nx <= x1; nx++) {
          if ((nx - x) * (nx - x) + (ny - y) * (ny - y) <= radius * radius) {
            out[ny * size + nx] = 1;
          }
        }
      }
    }
  }
  return out;
}

/**
 * Compares user-drawn strokes against the rendered font glyph on a 109x109 canvas.
 * Used for scripts without stored stroke-order data (Thai & Hindi) after every sketch.
 */
export function validateAgainstFontGlyph(
  strokes: DrawnStroke[],
  character: KanaCharacter
): StrokeValidationResult {
  if (strokes.length === 0) {
    return { status: 'idle', isMatch: false, strokeCountMatch: false, matchedStrokes: [] };
  }
  if (typeof document === 'undefined') {
    return { status: 'in-progress', isMatch: false, strokeCountMatch: false, matchedStrokes: [] };
  }

  const refCanvas = document.createElement('canvas');
  refCanvas.width = KANJIVG_SIZE;
  refCanvas.height = KANJIVG_SIZE;
  const refCtx = refCanvas.getContext('2d');

  const userCanvas = document.createElement('canvas');
  userCanvas.width = KANJIVG_SIZE;
  userCanvas.height = KANJIVG_SIZE;
  const userCtx = userCanvas.getContext('2d');

  if (!refCtx || !userCtx || typeof refCtx.getImageData !== 'function') {
    return { status: 'in-progress', isMatch: false, strokeCountMatch: false, matchedStrokes: [] };
  }

  // Render reference font glyph identically to StrokeGuideOverlay
  refCtx.clearRect(0, 0, KANJIVG_SIZE, KANJIVG_SIZE);
  refCtx.fillStyle = '#000000';
  refCtx.textAlign = 'center';
  refCtx.textBaseline = 'middle';
  refCtx.font = `74px ${getFontFamilyForScript(character.script)}`;
  refCtx.fillText(character.char, 54.5, 56);

  // Render user's drawn strokes
  userCtx.clearRect(0, 0, KANJIVG_SIZE, KANJIVG_SIZE);
  userCtx.strokeStyle = '#000000';
  userCtx.fillStyle = '#000000';
  userCtx.lineCap = 'round';
  userCtx.lineJoin = 'round';
  userCtx.lineWidth = 5.5;
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    userCtx.beginPath();
    const p0 = stroke.points[0];
    if (stroke.points.length === 1) {
      userCtx.arc(p0.x * KANJIVG_SIZE, p0.y * KANJIVG_SIZE, 2.25, 0, Math.PI * 2);
      userCtx.fill();
    } else {
      userCtx.moveTo(p0.x * KANJIVG_SIZE, p0.y * KANJIVG_SIZE);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        userCtx.lineTo(p.x * KANJIVG_SIZE, p.y * KANJIVG_SIZE);
      }
      userCtx.stroke();
    }
  }

  const refData = refCtx.getImageData(0, 0, KANJIVG_SIZE, KANJIVG_SIZE).data;
  const userData = userCtx.getImageData(0, 0, KANJIVG_SIZE, KANJIVG_SIZE).data;

  const totalPixels = KANJIVG_SIZE * KANJIVG_SIZE;
  const refMask = new Uint8Array(totalPixels);
  const userMask = new Uint8Array(totalPixels);
  let refCount = 0;
  let userCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    if (refData[i * 4 + 3] > 60) {
      refMask[i] = 1;
      refCount++;
    }
    if (userData[i * 4 + 3] > 60) {
      userMask[i] = 1;
      userCount++;
    }
  }

  if (refCount === 0 || userCount === 0) {
    return { status: 'in-progress', isMatch: false, strokeCountMatch: false, matchedStrokes: [] };
  }

  const refDilated = dilateBinary(refMask, KANJIVG_SIZE, 3);
  const userDilated = dilateBinary(userMask, KANJIVG_SIZE, 4);

  let coveredRef = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (refMask[i] && userDilated[i]) coveredRef++;
  }

  let onInkUser = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (userMask[i] && refDilated[i]) onInkUser++;
  }

  const coverage = coveredRef / refCount;
  const onInk = onInkUser / userCount;

  if (onInk < 0.52) {
    return { status: 'mismatch', isMatch: false, strokeCountMatch: false, matchedStrokes: [] };
  }

  if (coverage >= 0.88 && onInk >= 0.6) {
    return { status: 'matched', isMatch: true, strokeCountMatch: true, matchedStrokes: [] };
  }

  return { status: 'in-progress', isMatch: false, strokeCountMatch: false, matchedStrokes: [] };
}

/**
 * Validates user-drawn strokes against a KanaCharacter's KanjiVG stroke order and geometry,
 * or against the rendered font glyph when no stroke-order data is stored (Thai & Hindi).
 */
export function validateDrawnCharacter(
  strokes: DrawnStroke[],
  character: KanaCharacter
): StrokeValidationResult {
  const expectedCount = character.strokes.length;

  if (expectedCount === 0) {
    return validateAgainstFontGlyph(strokes, character);
  }

  if (strokes.length === 0) {
    return {
      status: 'idle',
      isMatch: false,
      strokeCountMatch: false,
      matchedStrokes: [],
    };
  }

  if (strokes.length < expectedCount) {
    const matchedStrokes = strokes.map((s, idx) =>
      validateSingleStroke(s, character.strokes[idx])
    );
    return {
      status: 'in-progress',
      isMatch: false,
      strokeCountMatch: false,
      matchedStrokes,
    };
  }

  if (strokes.length > expectedCount) {
    return {
      status: 'mismatch',
      isMatch: false,
      strokeCountMatch: false,
      matchedStrokes: [],
    };
  }

  const matchedStrokes = character.strokes.map((refPath, idx) =>
    validateSingleStroke(strokes[idx], refPath)
  );
  const isMatch = matchedStrokes.every(Boolean);

  return {
    status: isMatch ? 'matched' : 'mismatch',
    isMatch,
    strokeCountMatch: true,
    matchedStrokes,
  };
}
