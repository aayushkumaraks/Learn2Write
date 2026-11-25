import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  Globe2,
  RotateCcw,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import type { HindiScript, KanaScript, StrokeDifficulty, WritingLanguage } from '../types/kana';
import { computeUserStats } from '../utils/profileStats';
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../utils/strokeValidator';
import type { LocalUserProfile } from '../utils/userStorage';

interface ProfilePageProps {
  currentUser: LocalUserProfile;
  localUsers: LocalUserProfile[];
  activeBrowserUserIds: ReadonlySet<string>;
  difficulty: StrokeDifficulty;
  onDifficultyChange: (difficulty: StrokeDifficulty) => void;
  onBackToPractice: () => void;
  onPracticeScript: (language: WritingLanguage, script: KanaScript, hindiScript?: HindiScript) => void;
  onSwitchUser: (userName: string) => void;
  onResetProfile: () => void;
  onDeleteProfile: () => void;
}

function formatAccuracy(accuracyPct: number | null): string {
  return accuracyPct === null ? '—' : `${accuracyPct}%`;
}

export function ProfilePage({
  currentUser,
  localUsers,
  activeBrowserUserIds,
  difficulty,
  onDifficultyChange,
  onBackToPractice,
  onPracticeScript,
  onSwitchUser,
  onResetProfile,
  onDeleteProfile,
}: ProfilePageProps) {
  const [confirmAction, setConfirmAction] = useState<'reset' | 'delete' | null>(null);
  const currentStats = useMemo(
    () => computeUserStats(currentUser, difficulty),
    [currentUser, difficulty]
  );
  const allUserStats = useMemo(
    () => localUsers.map((user) => computeUserStats(user, difficulty)),
    [localUsers, difficulty]
  );

  return (
    <main className="profile-page" aria-label="User profile and progress">
      {/* Top profile summary banner */}
      <section className="profile-hero">
        <div className="profile-hero-left">
          <div className="profile-avatar" aria-hidden="true">
            {currentUser.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="profile-name">{currentUser.name}</h2>
            <p className="profile-tagline">
              Offline Progress &amp; Accuracy Dashboard · Stored locally in this browser
            </p>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            type="button"
            className="profile-action-btn is-warning"
            onClick={() => setConfirmAction('reset')}
          >
            <RotateCcw size={14} />
            <span>Reset Progress</span>
          </button>

          <button
            type="button"
            className="profile-action-btn is-danger"
            onClick={() => setConfirmAction('delete')}
          >
            <Trash2 size={14} />
            <span>Delete Profile</span>
          </button>

          <button
            type="button"
            className="profile-back-btn"
            onClick={onBackToPractice}
          >
            <ArrowLeft size={15} />
            <span>Back to Practice</span>
          </button>
        </div>
      </section>

      {/* Difficulty selector for performance logs */}
      <section className="profile-difficulty-bar" aria-label="Filter performance by difficulty">
        <span className="profile-difficulty-label">
          Performance Logs ({DIFFICULTY_LABELS[difficulty]})
        </span>
        <div
          className="difficulty-pills"
          role="radiogroup"
          aria-label="Select difficulty for performance logs"
          data-testid="profile-difficulty-selector"
        >
          {DIFFICULTY_ORDER.map((diff) => {
            const active = difficulty === diff;
            return (
              <button
                key={diff}
                type="button"
                role="radio"
                aria-checked={active}
                className={`diff-pill-btn is-${diff} ${active ? 'is-active' : ''}`}
                onClick={() => onDifficultyChange(diff)}
              >
                {DIFFICULTY_LABELS[diff]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Logged-in user key metrics */}
      <section className="profile-kpi-grid" aria-label="Overall user statistics">
        <div className="profile-kpi-card" data-testid="profile-kpi-progress">
          <div className="profile-kpi-head">
            <Award size={15} />
            <span>Overall Progress</span>
          </div>
          <div className="profile-kpi-value">{currentStats.completionPct}%</div>
          <div className="profile-kpi-sub">
            {currentStats.practicedChars} / {currentStats.totalChars} characters practiced
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${currentStats.completionPct}%` }}
            />
          </div>
        </div>

        <div className="profile-kpi-card" data-testid="profile-kpi-accuracy">
          <div className="profile-kpi-head">
            <Target size={15} />
            <span>Overall Accuracy</span>
          </div>
          <div className="profile-kpi-value">{formatAccuracy(currentStats.accuracyPct)}</div>
          <div className="profile-kpi-sub">
            {currentStats.attempts > 0
              ? `${currentStats.matches} accurate / ${currentStats.attempts} attempts`
              : 'Complete a character to measure accuracy'}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill is-accuracy"
              style={{ width: `${currentStats.accuracyPct ?? 0}%` }}
            />
          </div>
        </div>

        <div className="profile-kpi-card" data-testid="profile-kpi-mastered">
          <div className="profile-kpi-head">
            <CheckCircle2 size={15} />
            <span>Matched Characters</span>
          </div>
          <div className="profile-kpi-value">{currentStats.matchedChars}</div>
          <div className="profile-kpi-sub">
            Characters drawn accurately at least once
          </div>
        </div>

        <div className="profile-kpi-card" data-testid="profile-kpi-attempts">
          <div className="profile-kpi-head">
            <BarChart3 size={15} />
            <span>Total Attempts</span>
          </div>
          <div className="profile-kpi-value">{currentStats.attempts}</div>
          <div className="profile-kpi-sub">
            Completed stroke-order practice attempts
          </div>
        </div>
      </section>

      {/* Language-wise progress & accuracy */}
      <section className="profile-section" aria-label="Language-wise progress and accuracy">
        <div className="profile-section-header">
          <Globe2 size={16} aria-hidden="true" />
          <h3>Language-Wise Progress &amp; Accuracy</h3>
        </div>

        <div className="language-stats-grid">
          {currentStats.languages.map((lang) => (
            <article
              key={lang.language}
              className="language-stat-card"
              data-testid={`lang-card-${lang.language}`}
            >
              <div className="language-stat-top">
                <div>
                  <h4 className="language-stat-title">{lang.label}</h4>
                  <span className="language-stat-sample">{lang.sample}</span>
                </div>
                <div className="language-accuracy-pill" title="Stroke accuracy for this language">
                  <span className="language-accuracy-label">Accuracy</span>
                  <strong className="language-accuracy-val">
                    {formatAccuracy(lang.accuracyPct)}
                  </strong>
                </div>
              </div>

              <div className="language-progress-summary">
                <span>
                  {lang.practicedChars} / {lang.totalChars} practiced ({lang.completionPct}%)
                </span>
                <span className="language-attempts-meta">
                  {lang.attempts > 0 ? `${lang.matches}/${lang.attempts} accurate` : 'No attempts'}
                </span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${lang.completionPct}%` }}
                />
              </div>

              <ul className="script-breakdown-list">
                {lang.scripts.map((sc) => (
                  <li key={sc.id} className="script-breakdown-row">
                    <button
                      type="button"
                      className="script-breakdown-btn"
                      onClick={() => onPracticeScript(sc.language, sc.id, sc.hindiScript)}
                      title={`Practice ${lang.label} ${sc.label}`}
                    >
                      <span className="script-breakdown-name">
                        <span className="script-breakdown-sample">{sc.sample}</span>
                        <span>{sc.label}</span>
                      </span>
                      <span className="script-breakdown-metrics">
                        <span>
                          {sc.practicedChars}/{sc.totalChars}
                        </span>
                        <span className="script-accuracy-chip">
                          {formatAccuracy(sc.accuracyPct)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* User-wise progress & accuracy across all local users on this browser */}
      <section className="profile-section" aria-label="User-wise progress and accuracy">
        <div className="profile-section-header">
          <Users size={16} aria-hidden="true" />
          <h3>User-Wise Progress &amp; Accuracy ({allUserStats.length} local {allUserStats.length === 1 ? 'user' : 'users'})</h3>
        </div>

        <div className="user-stats-table-wrap">
          <table className="user-stats-table" data-testid="user-stats-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Overall Progress</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Japanese</th>
              </tr>
            </thead>
            <tbody>
              {allUserStats.map((u) => {
                const isCurrent = u.userId === currentUser.id;
                const isLive = isCurrent || activeBrowserUserIds.has(u.userId);
                const jp = u.languages.find((l) => l.language === 'japanese')!;
                return (
                  <tr
                    key={u.userId}
                    className={isCurrent ? 'is-current-row' : ''}
                    data-testid={`user-stats-row-${u.userId}`}
                  >
                    <td>
                      <button
                        type="button"
                        className="table-user-btn"
                        onClick={() => {
                          if (!isCurrent) onSwitchUser(u.userName);
                        }}
                        title={isCurrent ? `${u.userName} (current user)` : `Switch to ${u.userName}`}
                      >
                        <span
                          className={`user-status-dot ${isLive ? 'is-live' : ''}`}
                          aria-hidden="true"
                        />
                        <span className="table-user-name">{u.userName}</span>
                        {isCurrent && <span className="user-chip-badge">You</span>}
                        {!isCurrent && isLive && <span className="user-chip-badge">Active</span>}
                      </button>
                    </td>
                    <td>
                      <div className="table-progress-cell">
                        <span>
                          {u.practicedChars} / {u.totalChars} ({u.completionPct}%)
                        </span>
                        <div className="progress-track table-progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${u.completionPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-accuracy-val">{formatAccuracy(u.accuracyPct)}</span>
                      <span className="table-sub-meta">
                        {u.attempts > 0 ? ` (${u.matches}/${u.attempts})` : ''}
                      </span>
                    </td>
                    <td>
                      <span>{jp.practicedChars}/{jp.totalChars}</span>
                      <span className="table-sub-meta"> · {formatAccuracy(jp.accuracyPct)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {confirmAction && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-confirm-title"
            data-testid="profile-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={confirmAction === 'delete' ? 'failure-modal-char' : 'locked-modal-char'}
              aria-hidden="true"
            >
              {confirmAction === 'delete' ? <Trash2 size={24} /> : <RotateCcw size={24} />}
            </div>
            <h2 id="profile-confirm-title" className="success-modal-title">
              {confirmAction === 'delete' ? 'Delete Profile?' : 'Reset Profile Progress?'}
            </h2>
            <p className="success-modal-body">
              {confirmAction === 'delete'
                ? `This will permanently delete "${currentUser.name}" and all their local progress from this browser.`
                : `This will clear all practiced characters, accuracy stats, and unlocked stages for "${currentUser.name}".`}
            </p>
            <div className="success-modal-actions">
              <button
                type="button"
                className="guide-secondary-btn success-modal-btn"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`success-modal-btn ${confirmAction === 'delete' ? 'danger-confirm-btn' : 'guide-play-btn'}`}
                onClick={() => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === 'delete') {
                    onDeleteProfile();
                  } else {
                    onResetProfile();
                  }
                }}
              >
                {confirmAction === 'delete' ? 'Confirm Delete' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
