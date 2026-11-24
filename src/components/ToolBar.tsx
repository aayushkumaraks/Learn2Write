import {
  Eraser,
  Eye,
  EyeOff,
  Grid2x2,
  Undo2,
} from 'lucide-react';
import type { GridStyle } from '../types/kana';

interface ToolBarProps {
  gridStyle: GridStyle;
  onCycleGrid: () => void;
  showTrace: boolean;
  onToggleTrace: () => void;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
}

const GRID_LABELS: Record<GridStyle, string> = {
  crosshair: 'Cross Grid',
  quad: 'Fine Grid',
  none: 'No Grid',
};

export function ToolBar({
  gridStyle,
  onCycleGrid,
  showTrace,
  onToggleTrace,
  showNumbers,
  onToggleNumbers,
  canUndo,
  onUndo,
  onClear,
}: ToolBarProps) {
  return (
    <div className="toolbar" role="region" aria-label="Canvas controls">
      <div className="tool-actions">
        <button type="button" className="action-btn" onClick={onCycleGrid} title="Switch canvas grid">
          <Grid2x2 size={15} />
          <span>{GRID_LABELS[gridStyle]}</span>
        </button>

        <button
          type="button"
          className={`action-btn ${showTrace ? 'is-toggled' : ''}`}
          onClick={onToggleTrace}
          title="Toggle faint trace guide"
        >
          {showTrace ? <Eye size={15} /> : <EyeOff size={15} />}
          <span>Trace</span>
        </button>

        <button
          type="button"
          className={`action-btn ${showNumbers ? 'is-toggled' : ''}`}
          onClick={onToggleNumbers}
          title="Toggle stroke order numbers"
        >
          <span className="num-icon">#</span>
          <span>Order</span>
        </button>

        <div className="action-spacer" />

        <button
          type="button"
          className="action-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last stroke"
        >
          <Undo2 size={15} />
          <span>Undo</span>
        </button>

        <button
          type="button"
          className="action-btn action-clear"
          onClick={onClear}
          disabled={!canUndo}
          title="Clear canvas"
        >
          <Eraser size={15} />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
