import { useState, type FormEvent } from 'react';
import { LogOut, UserPlus, Users, X } from 'lucide-react';
import { normalizeDisplayName, type LocalUserProfile } from '../utils/userStorage';

interface LocalUsersBarProps {
  currentUser: LocalUserProfile;
  localUsers: LocalUserProfile[];
  activeBrowserUserIds: ReadonlySet<string>;
  onSwitchUser: (userName: string) => void;
  onLogout: () => void;
}

export function LocalUsersBar({
  currentUser,
  localUsers,
  activeBrowserUserIds,
  onSwitchUser,
  onLogout,
}: LocalUsersBarProps) {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeDisplayName(newUserName);
    if (!cleaned) return;
    onSwitchUser(cleaned);
    setNewUserName('');
    setIsAddingUser(false);
  };

  return (
    <section className="users-bar" aria-label="Local users on this browser">
      <div className="users-bar-left">
        <div className="users-bar-label">
          <Users size={14} aria-hidden="true" />
          <span>Local users ({localUsers.length}):</span>
        </div>

        <ul className="users-chip-list" data-testid="local-users-list">
          {localUsers.map((user) => {
            const isCurrent = user.id === currentUser.id;
            const isLive = isCurrent || activeBrowserUserIds.has(user.id);
            const practicedCount = user.progress.practicedChars.length;
            return (
              <li key={user.id}>
                <button
                  type="button"
                  className={`user-chip ${isCurrent ? 'is-current' : ''} ${isLive ? 'is-live' : ''}`}
                  onClick={() => {
                    if (!isCurrent) onSwitchUser(user.name);
                  }}
                  aria-current={isCurrent ? 'true' : undefined}
                  title={
                    isCurrent
                      ? `Signed in as ${user.name} (${practicedCount} practiced)`
                      : `Switch to ${user.name} (${practicedCount} practiced)`
                  }
                >
                  <span
                    className={`user-status-dot ${isLive ? 'is-live' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="user-chip-name">{user.name}</span>
                  <span className="user-chip-count">{practicedCount}</span>
                  {isCurrent && <span className="user-chip-badge">You</span>}
                  {!isCurrent && isLive && <span className="user-chip-badge">Active</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="users-bar-actions">
        {isAddingUser ? (
          <form className="quick-login-form" onSubmit={handleAddSubmit}>
            <label htmlFor="quick-username-input" className="sr-only">
              User name
            </label>
            <input
              id="quick-username-input"
              type="text"
              className="quick-login-input"
              placeholder="User name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              autoFocus
              maxLength={48}
            />
            <button
              type="submit"
              className="quick-login-submit"
              disabled={!normalizeDisplayName(newUserName)}
            >
              Login
            </button>
            <button
              type="button"
              className="quick-login-cancel"
              onClick={() => {
                setIsAddingUser(false);
                setNewUserName('');
              }}
              aria-label="Cancel adding user"
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="users-action-btn"
            onClick={() => setIsAddingUser(true)}
            title="Login with another user name"
          >
            <UserPlus size={14} />
            <span>Add User</span>
          </button>
        )}

        <button
          type="button"
          className="users-action-btn is-logout"
          onClick={onLogout}
          title={`Logout ${currentUser.name}`}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </section>
  );
}
