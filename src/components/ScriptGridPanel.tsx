import { useMemo } from 'react';
import type { KanaCharacter } from '../types/kana';

interface ScriptGridPanelProps {
  title: string;
  sampleRange: string;
  ariaLabel: string;
  items: KanaCharacter[];
  selected: KanaCharacter;
  onSelect: (item: KanaCharacter) => void;
  practicedChars: Set<string>;
}

export function ScriptGridPanel({
  title,
  sampleRange,
  ariaLabel,
  items,
  selected,
  onSelect,
  practicedChars,
}: ScriptGridPanelProps) {
  const totalCount = items.length;
  const practicedCount = useMemo(
    () => items.filter((item) => practicedChars.has(item.char)).length,
    [items, practicedChars]
  );

  return (
    <aside className="kana-panel" aria-label={ariaLabel}>
      <div className="kana-panel-header">
        <div className="thai-panel-title-row">
          <span className="thai-panel-title">{title}</span>
          <span className="script-sample">{sampleRange}</span>
        </div>

        <div className="progress-meta" title={`Characters practiced in ${title}`}>
          <span>
            {practicedCount} / {totalCount} practiced
          </span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(practicedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="thai-grid-scroll">
        {items.map((item) => {
          const isSelected = item.char === selected.char;
          const isPracticed = practicedChars.has(item.char);
          return (
            <button
              key={item.char}
              type="button"
              className={`kana-cell ${isSelected ? 'is-selected' : ''} ${isPracticed ? 'is-practiced' : ''}`}
              onClick={() => onSelect(item)}
              aria-pressed={isSelected}
              aria-label={`${item.char} (${item.romaji})`}
            >
              <span className="kana-glyph">{item.char}</span>
              <span className="kana-romaji">{item.romaji}</span>
              {isPracticed && <span className="practiced-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
