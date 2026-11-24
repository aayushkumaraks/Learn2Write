import { useMemo } from 'react';
import { buildGojuonGrid, KANJI_LIST, VOWEL_HEADERS } from '../data/kana';
import type { KanaCharacter, KanaScript } from '../types/kana';

interface KanaChartProps {
  script: KanaScript;
  onScriptChange: (script: KanaScript) => void;
  selected: KanaCharacter;
  onSelect: (kana: KanaCharacter) => void;
  practicedChars: Set<string>;
}

export function KanaChart({
  script,
  onScriptChange,
  selected,
  onSelect,
  practicedChars,
}: KanaChartProps) {
  const isKanji = script === 'kanji';
  const rows = useMemo(() => (isKanji ? [] : buildGojuonGrid(script)), [isKanji, script]);
  const { totalInScript, practicedInScript } = useMemo(() => {
    if (isKanji) {
      return {
        totalInScript: KANJI_LIST.length,
        practicedInScript: KANJI_LIST.filter((c) => practicedChars.has(c.char)).length,
      };
    }
    let total = 0;
    let practiced = 0;
    for (const r of rows) {
      for (const c of r.cells) {
        if (c) {
          total += 1;
          if (practicedChars.has(c.char)) practiced += 1;
        }
      }
    }
    return { totalInScript: total, practicedInScript: practiced };
  }, [isKanji, rows, practicedChars]);

  return (
    <aside className="kana-panel" aria-label="Japanese alphabet selector">
      <div className="kana-panel-header">
        <div className="script-tabs" role="tablist" aria-label="Choose Japanese script">
          <button
            type="button"
            role="tab"
            aria-selected={script === 'hiragana'}
            className={`script-tab ${script === 'hiragana' ? 'is-active' : ''}`}
            onClick={() => onScriptChange('hiragana')}
          >
            Hiragana
            <span className="script-sample">あ</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={script === 'katakana'}
            className={`script-tab ${script === 'katakana' ? 'is-active' : ''}`}
            onClick={() => onScriptChange('katakana')}
          >
            Katakana
            <span className="script-sample">ア</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={script === 'kanji'}
            className={`script-tab ${script === 'kanji' ? 'is-active' : ''}`}
            onClick={() => onScriptChange('kanji')}
          >
            Kanji
            <span className="script-sample">漢</span>
          </button>
        </div>

        <div className="progress-meta" title="Characters practiced in this script">
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

      {isKanji ? (
        <div className="thai-grid-scroll">
          {KANJI_LIST.map((item) => {
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
      ) : (
        <>
          {/* Column vowel headers */}
          <div className="chart-header-row" aria-hidden="true">
            <span className="row-axis-spacer" />
            {VOWEL_HEADERS.map((v) => (
              <span key={v} className="col-vowel">
                {v}
              </span>
            ))}
          </div>

          {/* 46-character Gojūon chart */}
          <div className="kana-grid-scroll">
            {rows.map(({ row, cells }) => (
              <div key={row.id} className="kana-row">
                <span className="row-axis" aria-hidden="true">
                  {row.label}
                </span>
                {cells.map((item, colIdx) => {
                  if (!item) {
                    return <div key={`${row.id}-${colIdx}`} className="kana-cell-empty" aria-hidden="true" />;
                  }
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
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
