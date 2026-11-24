import { useMemo } from 'react';
import { getHindiList } from '../data/hindi';
import type { HindiScript, KanaCharacter } from '../types/kana';

interface HindiChartProps {
  script: HindiScript;
  onScriptChange: (script: HindiScript) => void;
  selected: KanaCharacter;
  onSelect: (item: KanaCharacter) => void;
  practicedChars: Set<string>;
}

export function HindiChart({
  script,
  onScriptChange,
  selected,
  onSelect,
  practicedChars,
}: HindiChartProps) {
  const items = useMemo(() => getHindiList(script), [script]);
  const totalInScript = items.length;
  const practicedInScript = useMemo(
    () => items.filter((item) => practicedChars.has(item.char)).length,
    [items, practicedChars]
  );

  return (
    <aside className="kana-panel" aria-label="Hindi alphabet selector">
      <div className="kana-panel-header">
        <div className="script-tabs" role="tablist" aria-label="Choose Hindi section">
          <button
            type="button"
            role="tab"
            aria-selected={script === 'hindi-vowels'}
            className={`script-tab ${script === 'hindi-vowels' ? 'is-active' : ''}`}
            onClick={() => onScriptChange('hindi-vowels')}
          >
            Vowels
            <span className="script-sample">अ</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={script === 'hindi-consonants'}
            className={`script-tab ${script === 'hindi-consonants' ? 'is-active' : ''}`}
            onClick={() => onScriptChange('hindi-consonants')}
          >
            Consonants
            <span className="script-sample">क</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={script === 'hindi-combinations'}
            className={`script-tab ${script === 'hindi-combinations' ? 'is-active' : ''}`}
            onClick={() => onScriptChange('hindi-combinations')}
          >
            Combine
            <span className="script-sample">श्र</span>
          </button>
        </div>

        <div className="progress-meta" title="Characters practiced in this Hindi section">
          <span>
            {practicedInScript} / {totalInScript} practiced
          </span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(practicedInScript / totalInScript) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className={script === 'hindi-combinations' ? 'combine-grid-scroll' : 'thai-grid-scroll'}>
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
