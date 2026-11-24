import {
  Brush,
  Highlighter,
  PanelLeftClose,
  PanelLeftOpen,
  Pen,
  Pencil,
} from 'lucide-react';
import type { PencilType, StrokeSize } from '../types/kana';
import { INK_COLORS, PENCIL_PRESETS } from '../utils/pencilEngine';

interface ToolDockProps {
  pencil: PencilType;
  onPencilChange: (pencil: PencilType) => void;
  strokeSize: StrokeSize;
  onStrokeSizeChange: (size: StrokeSize) => void;
  inkColor: string;
  onInkColorChange: (hex: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const PENCIL_ORDER: PencilType[] = ['pencil', 'brush', 'ballpoint', 'marker'];
const SIZE_ORDER: StrokeSize[] = ['fine', 'medium', 'bold'];

function PencilIcon({ type }: { type: PencilType }) {
  switch (type) {
    case 'pencil':
      return <Pencil size={16} strokeWidth={1.8} />;
    case 'brush':
      return <Brush size={16} strokeWidth={1.8} />;
    case 'ballpoint':
      return <Pen size={16} strokeWidth={1.8} />;
    case 'marker':
      return <Highlighter size={16} strokeWidth={1.8} />;
  }
}

export function ToolDock({
  pencil,
  onPencilChange,
  strokeSize,
  onStrokeSizeChange,
  inkColor,
  onInkColorChange,
  isOpen,
  onToggleOpen,
}: ToolDockProps) {
  return (
    <aside
      className={`tool-dock ${isOpen ? 'is-open' : 'is-collapsed'}`}
      aria-label="Writing instrument dock"
    >
      {isOpen ? (
        <div className="tool-dock-card">
          <div className="tool-dock-header">
            <span className="tool-dock-title">Brush &amp; Ink</span>
            <button
              type="button"
              className="tool-dock-toggle"
              onClick={onToggleOpen}
              aria-expanded={true}
              aria-label="Collapse writing tools dock"
              title="Collapse dock"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <div className="tool-dock-body">
            {/* Writing instrument selector */}
            <div className="tool-section">
              <span className="tool-label">Instrument</span>
              <div className="pencil-grid dock-pencil-grid" role="radiogroup" aria-label="Choose pencil type">
                {PENCIL_ORDER.map((type) => {
                  const preset = PENCIL_PRESETS[type];
                  const active = pencil === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`pencil-btn ${active ? 'is-active' : ''}`}
                      onClick={() => onPencilChange(type)}
                      title={preset.description}
                    >
                      <PencilIcon type={type} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tip Size */}
            <div className="tool-section">
              <span className="tool-label">Tip Size</span>
              <div className="segmented-control dock-segmented" role="radiogroup" aria-label="Stroke size">
                {SIZE_ORDER.map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    aria-checked={strokeSize === size}
                    className={`seg-btn ${strokeSize === size ? 'is-active' : ''}`}
                    onClick={() => onStrokeSizeChange(size)}
                  >
                    {size[0].toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Color */}
            <div className="tool-section">
              <span className="tool-label">Ink</span>
              <div className="color-swatches" role="radiogroup" aria-label="Ink color">
                {INK_COLORS.map((c) => {
                  const active = inkColor === c.hex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={c.label}
                      title={c.label}
                      className={`swatch-btn ${active ? 'is-active' : ''}`}
                      style={{ '--swatch-color': c.hex } as React.CSSProperties}
                      onClick={() => onInkColorChange(c.hex)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="tool-dock-rail"
          onClick={onToggleOpen}
          aria-expanded={false}
          aria-label="Expand writing tools dock"
          title="Expand Brush & Ink dock"
        >
          <PanelLeftOpen size={16} />
          <span className="dock-rail-divider" aria-hidden="true" />
          <span className="dock-rail-icon" aria-hidden="true">
            <PencilIcon type={pencil} />
          </span>
          <span
            className="dock-rail-swatch"
            style={{ backgroundColor: inkColor }}
            aria-hidden="true"
          />
          <span className="dock-rail-label">Tools</span>
        </button>
      )}
    </aside>
  );
}
