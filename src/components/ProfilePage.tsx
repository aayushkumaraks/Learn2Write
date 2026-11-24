import { useMemo } from 'react';
import { ArrowLeft, Award, BarChart3, CheckCircle2, Globe2, Target, Users } from 'lucide-react';
import type { HindiScript, KanaScript, WritingLanguage } from '../types/kana';
import { computeUserStats } from '../utils/profileStats';
import type { LocalUserProfile } from '../utils/userStorage';

interface ProfilePageProps {
  currentUser: LocalUserProfile;
  localUsers: LocalUserProfile[];
  activeBrowserUserIds: ReadonlySet<string>;
  onBackToPractice: () => void;
  onPracticeScript: (language: WritingLanguage, script: KanaScript, hindiScript?: HindiScript) => void;
  onSwitchUser: (userName: string) => void;
}

function formatAccuracy(accuracyPct: number | null): string {
  return accuracyPct === null ? '—' : `${accuracyPct}%`;
}

export function ProfilePage({
  currentUser,
  localUsers,
  activeBrowserUserIds,
  onBackToPractice,
  onPracticeScript,
  onSwitchUser,
}: ProfilePageProps) {
  const currentStats = useMemo(() => computeUserStats(currentUser), [currentUser]);
  const allUserStats = useMemo(
    () => localUsers.map((user) => computeUserStats(user)),
    [localUsers]
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

        <button
          type="button"
          className="profile-back-btn"
          onClick={onBackToPractice}
        >
          <ArrowLeft size={15} />
          <span>Back to Practice</span>
        </button>
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
                <th scope="col">Thai</th>
                <th scope="col">Hindi</th>
              </tr>
            </thead>
            <tbody>
              {allUserStats.map((u) => {
                const isCurrent = u.userId === currentUser.id;
                const isLive = isCurrent || activeBrowserUserIds.has(u.userId);
                const jp = u.languages.find((l) => l.language === 'japanese')!;
                const th = u.languages.find((l) => l.language === 'thai')!;
                const hi = u.languages.find((l) => l.language === 'hindi')!;
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
                    <td>
                      <span>{th.practicedChars}/{th.totalChars}</span>
                      <span className="table-sub-meta"> · {formatAccuracy(th.accuracyPct)}</span>
                    </td>
                    <td>
                      <span>{hi.practicedChars}/{hi.totalChars}</span>
                      <span className="table-sub-meta"> · {formatAccuracy(hi.accuracyPct)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
