import type {
  DrawPoint,
  DrawnStroke,
  InkColorOption,
  PencilType,
  StrokeDifficulty,
  StrokeSize,
} from '../types/kana';

export interface PencilPreset {
  id: PencilType;
  label: string;
  description: string;
  baseWidth: number;
  opacity: number;
  velocitySensitivity: number;
  textured: boolean;
}

export const PENCIL_PRESETS: Record<PencilType, PencilPreset> = {
  pencil: {
    id: 'pencil',
    label: '2B Pencil',
    description: 'Textured graphite feel',
    baseWidth: 5.5,
    opacity: 0.86,
    velocitySensitivity: 0.18,
    textured: true,
  },
  brush: {
    id: 'brush',
    label: 'Calligraphy Brush',
    description: 'Tapered fude ink strokes',
    baseWidth: 11,
    opacity: 0.96,
    velocitySensitivity: 0.58,
    textured: false,
  },
  ballpoint: {
    id: 'ballpoint',
    label: 'Ballpoint Pen',
    description: 'Crisp, even fine line',
    baseWidth: 3.4,
    opacity: 1,
    velocitySensitivity: 0.05,
    textured: false,
  },
  marker: {
    id: 'marker',
    label: 'Felt Marker',
    description: 'Bold smooth strokes',
    baseWidth: 13.5,
    opacity: 0.78,
    velocitySensitivity: 0.08,
    textured: false,
  },
};

export const SIZE_MULTIPLIERS: Record<StrokeSize, number> = {
  fine: 0.72,
  medium: 1,
  bold: 1.4,
};

export const INK_COLORS: InkColorOption[] = [
  { id: 'sumi', label: 'Sumi Ink', hex: '#2B2623' },
  { id: 'graphite', label: 'Graphite', hex: '#59534D' },
  { id: 'indigo', label: 'Indigo', hex: '#2D465E' },
  { id: 'vermilion', label: 'Vermilion', hex: '#B44D36' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getSegmentWidth(
  prev: DrawPoint,
  curr: DrawPoint,
  preset: PencilPreset,
  size: StrokeSize,
  canvasScale: number
): number {
  const base = preset.baseWidth * SIZE_MULTIPLIERS[size] * canvasScale;
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  const dist = Math.hypot(dx, dy);
  const dt = Math.max(1, curr.t - prev.t);
  const velocity = dist / dt; // normalized units per ms

  // Faster strokes thin out; slower strokes pool slightly thicker (especially for brush)
  const velocityFactor = clamp(1.18 - velocity * 140 * preset.velocitySensitivity, 0.36, 1.32);
  const pressureFactor = curr.pressure > 0 ? clamp(0.65 + curr.pressure * 0.7, 0.55, 1.35) : 1;

  return Math.max(1.2, base * velocityFactor * pressureFactor);
}

/**
 * Renders a single stroke onto a 2D canvas context.
 * Point coordinates are stored normalized (0..1) so resizing the canvas preserves crispness.
 */
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawnStroke,
  width: number,
  height: number
): void {
  const { points, pencil, size, color } = stroke;
  if (points.length === 0) return;

  const preset = PENCIL_PRESETS[pencil];
  const canvasScale = Math.min(width, height) / 420;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = preset.opacity;

  // Single tap / dot
  if (points.length === 1) {
    const p = points[0];
    const radius = (preset.baseWidth * SIZE_MULTIPLIERS[size] * canvasScale) / 2;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, Math.max(1, radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const prevPrev = i > 1 ? points[i - 2] : prev;

    const mid1X = ((prevPrev.x + prev.x) / 2) * width;
    const mid1Y = ((prevPrev.y + prev.y) / 2) * height;
    const mid2X = ((prev.x + curr.x) / 2) * width;
    const mid2Y = ((prev.y + curr.y) / 2) * height;

    const lineWidth = getSegmentWidth(prev, curr, preset, size, canvasScale);

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.moveTo(mid1X, mid1Y);
    ctx.quadraticCurveTo(prev.x * width, prev.y * height, mid2X, mid2Y);
    ctx.stroke();

    // Subtle graphite tooth/grain for 2B pencil
    if (preset.textured) {
      const segDist = Math.hypot(mid2X - mid1X, mid2Y - mid1Y);
      const grains = Math.min(8, Math.ceil(segDist / 3));
      ctx.save();
      ctx.globalAlpha = preset.opacity * 0.28;
      for (let g = 0; g < grains; g++) {
        const t = grains === 1 ? 0.5 : g / (grains - 1);
        const gx = mid1X + (mid2X - mid1X) * t;
        const gy = mid1Y + (mid2Y - mid1Y) * t;
        // Deterministic pseudo-random offset based on coordinates so redraws don't shimmer
        const seed = Math.sin(gx * 12.9898 + gy * 78.233 + g * 37.719) * 43758.5453;
        const jitterA = (seed - Math.floor(seed) - 0.5) * lineWidth * 0.72;
        const seed2 = Math.sin(gy * 24.123 + gx * 51.789 + g * 19.31) * 24634.6345;
        const jitterB = (seed2 - Math.floor(seed2) - 0.5) * lineWidth * 0.72;
        ctx.fillRect(gx + jitterA, gy + jitterB, 1.2, 1.2);
      }
      ctx.restore();
    }
  }

  // Final cap segment to the last point
  const lastPrev = points[points.length - 2];
  const last = points[points.length - 1];
  const lastMidX = ((lastPrev.x + last.x) / 2) * width;
  const lastMidY = ((lastPrev.y + last.y) / 2) * height;
  ctx.beginPath();
  ctx.lineWidth = getSegmentWidth(lastPrev, last, preset, size, canvasScale) * (pencil === 'brush' ? 0.72 : 1);
  ctx.moveTo(lastMidX, lastMidY);
  ctx.lineTo(last.x * width, last.y * height);
  ctx.stroke();

  ctx.restore();
}

export function renderAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: DrawnStroke[],
  width: number,
  height: number
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas?.width ?? width, ctx.canvas?.height ?? height);
  ctx.restore();
  for (const stroke of strokes) {
    renderStroke(ctx, stroke, width, height);
  }
}

/**
 * Smooths interior stroke points using weighted moving-average passes while
 * preserving start and end points. Applied on Easy (stronger) and Medium (gentle).
 */
export function smoothStrokePoints(
  points: DrawPoint[],
  difficulty: StrokeDifficulty
): DrawPoint[] {
  const passes = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 1 : 0;
  if (passes === 0 || points.length < 3) {
    return points;
  }

  let current = points;
  for (let p = 0; p < passes; p++) {
    const next: DrawPoint[] = [current[0]];
    for (let i = 1; i < current.length - 1; i++) {
      const prev = current[i - 1];
      const curr = current[i];
      const nxt = current[i + 1];
      next.push({
        x: 0.25 * prev.x + 0.5 * curr.x + 0.25 * nxt.x,
        y: 0.25 * prev.y + 0.5 * curr.y + 0.25 * nxt.y,
        t: curr.t,
        pressure: 0.25 * prev.pressure + 0.5 * curr.pressure + 0.25 * nxt.pressure,
      });
    }
    next.push(current[current.length - 1]);
    current = next;
  }

  return current;
}
