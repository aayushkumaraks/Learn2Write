import { useState, type FormEvent } from 'react';
import { LogIn, Users } from 'lucide-react';
import type { StrokeDifficulty } from '../types/kana';
import { getDifficultyBucket } from '../utils/progressStorage';
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../utils/strokeValidator';
import { normalizeDisplayName, type LocalUserProfile } from '../utils/userStorage';

interface UserLoginScreenProps {
  localUsers: LocalUserProfile[];
  activeBrowserUserIds: ReadonlySet<string>;
  totalCharacters: number;
  difficulty: StrokeDifficulty;
  onDifficultyChange: (difficulty: StrokeDifficulty) => void;
  onLogin: (userName: string) => void;
}

export function UserLoginScreen({
  localUsers,
  activeBrowserUserIds,
  totalCharacters,
  difficulty,
  onDifficultyChange,
  onLogin,
}: UserLoginScreenProps) {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeDisplayName(userName);
    if (!cleaned) {
      setError('Please enter a user name to continue.');
      return;
    }
    setError(null);
    onLogin(cleaned);
  };

  return (
    <div className="login-shell">
      <main className="login-card" aria-label="Local user login">
        <div className="login-brand">
          <span className="brand-mark login-brand-mark" aria-hidden="true">
            書
          </span>
          <div>
            <h1 className="login-title">Learn2Write</h1>
            <p className="login-subtitle">Offline Stroke-Order Writing Practice</p>
          </div>
        </div>

        <p className="login-intro">
          Enter your user name to track your writing progress offline in this browser. No password
          needed.
        </p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="username-input" className="login-label">
              User name
            </label>
            <input
              id="username-input"
              name="username"
              type="text"
              className="login-input"
              placeholder="e.g. Yuki, Aarav, Somchai"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                if (error) setError(null);
              }}
              autoComplete="username"
              autoFocus
              maxLength={48}
            />
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="login-field">
            <span className="login-label">Difficulty</span>
            <div
              className="difficulty-pills"
              role="radiogroup"
              aria-label="Choose stroke difficulty"
              data-testid="login-difficulty-selector"
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
          </div>

          <button type="submit" className="login-submit-btn">
            <LogIn size={16} />
            <span>Login</span>
          </button>
        </form>

        {localUsers.length > 0 && (
          <section className="login-users-section" aria-label="Local users on this browser">
            <div className="login-users-header">
              <Users size={14} />
              <span>Local users on this browser ({localUsers.length})</span>
            </div>
            <ul className="login-users-list" data-testid="local-users-list">
              {localUsers.map((user) => {
                const isLive = activeBrowserUserIds.has(user.id);
                const practicedCount = getDifficultyBucket(user.progress, difficulty).practicedChars.length;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      className="login-user-row"
                      onClick={() => onLogin(user.name)}
                    >
                      <span className="login-user-main">
                        <span
                          className={`user-status-dot ${isLive ? 'is-live' : ''}`}
                          aria-hidden="true"
                        />
                        <span className="login-user-name">{user.name}</span>
                        {isLive && <span className="user-live-tag">Active now</span>}
                      </span>
                      <span className="login-user-meta">
                        {practicedCount} / {totalCharacters} practiced
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="login-footnote">
          Progress is saved locally in your browser until you clear browser data.
        </p>
      </main>
    </div>
  );
}
