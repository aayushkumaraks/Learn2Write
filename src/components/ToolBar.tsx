import {
  ChevronDown,
  ChevronUp,
  Eraser,
  Eye,
  EyeOff,
  Grid2x2,
  Undo2,
} from 'lucide-react';
import type { GridStyle, StrokeDifficulty } from '../types/kana';
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../utils/strokeValidator';

interface ToolBarProps {
  gridStyle: GridStyle;
  onCycleGrid: () => void;
  showTrace: boolean;
  onToggleTrace: () => void;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  difficulty: StrokeDifficulty;
  onDifficultyChange: (difficulty: StrokeDifficulty) => void;
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
  difficulty,
  onDifficultyChange,
  canUndo,
  onUndo,
  onClear,
}: ToolBarProps) {
  const diffIdx = DIFFICULTY_ORDER.indexOf(difficulty);
  const canLevelDown = diffIdx > 0;
  const canLevelUp = diffIdx < DIFFICULTY_ORDER.length - 1;

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

      <div className="difficulty-bar">
        <span className="difficulty-title">Strictness</span>
        <div className="difficulty-stepper" role="group" aria-label="Stroke strictness difficulty">
          <button
            type="button"
            className="diff-step-btn"
            onClick={() => canLevelDown && onDifficultyChange(DIFFICULTY_ORDER[diffIdx - 1])}
            disabled={!canLevelDown}
            aria-label="Level down stroke difficulty"
            title="Decrease strictness"
          >
            <ChevronDown size={14} />
          </button>
          <span
            className={`difficulty-value is-${difficulty}`}
            data-testid="difficulty-label"
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
          <button
            type="button"
            className="diff-step-btn"
            onClick={() => canLevelUp && onDifficultyChange(DIFFICULTY_ORDER[diffIdx + 1])}
            disabled={!canLevelUp}
            aria-label="Level up stroke difficulty"
            title="Increase strictness"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
