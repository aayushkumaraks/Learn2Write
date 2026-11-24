import {
  createDefaultProgressData,
  loadProgressSync,
  mergeProgressData,
  readIndexedDBKey,
  sanitizeProgressData,
  writeIndexedDBKey,
  type PersistedProgressData,
} from './progressStorage';

export const USER_STORE_STORAGE_KEY = 'learn2write.users.v1';
export const ACTIVE_TAB_SESSIONS_KEY = 'learn2write.sessions.v1';
export const TAB_USER_SESSION_KEY = 'learn2write.tabUser.v1';

const IDB_USERS_KEY = 'users_store';
const SESSION_TTL_MS = 35_000;

export interface LocalUserProfile {
  /** Normalized case-insensitive identifier derived from User name */
  id: string;
  /** Display name entered by the user */
  name: string;
  createdAt: number;
  lastActiveAt: number;
  progress: PersistedProgressData;
}

export interface LocalUsersStore {
  version: 1;
  updatedAt: number;
  /** Most recently active user on this browser, or null when logged out */
  activeUserId: string | null;
  /** All local users saved on this browser, keyed by normalized id */
  users: Record<string, LocalUserProfile>;
}

interface ActiveTabSession {
  userId: string;
  lastSeen: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSafePositiveInt(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

export function normalizeDisplayName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, ' ');
}

export function toUserId(rawName: string): string {
  return normalizeDisplayName(rawName).toLowerCase();
}

export function createEmptyUsersStore(updatedAt = 0): LocalUsersStore {
  return {
    version: 1,
    updatedAt,
    activeUserId: null,
    users: {},
  };
}

export function sanitizeUsersStore(raw: unknown): LocalUsersStore {
  const base = createEmptyUsersStore(0);
  if (!isRecord(raw)) return base;

  const updatedAt = toSafePositiveInt(raw.updatedAt, 0);
  const users: Record<string, LocalUserProfile> = {};

  if (isRecord(raw.users)) {
    for (const [rawKey, entry] of Object.entries(raw.users)) {
      if (!isRecord(entry)) continue;
      const name = normalizeDisplayName(
        typeof entry.name === 'string' && entry.name.trim().length > 0 ? entry.name : rawKey
      );
      const id = toUserId(name);
      if (!id) continue;

      const createdAt = toSafePositiveInt(entry.createdAt, updatedAt);
      const lastActiveAt = Math.max(createdAt, toSafePositiveInt(entry.lastActiveAt, createdAt));
      const progress = sanitizeProgressData(entry.progress);

      users[id] = {
        id,
        name,
        createdAt,
        lastActiveAt,
        progress,
      };
    }
  }

  const rawActiveId =
    typeof raw.activeUserId === 'string' ? toUserId(raw.activeUserId) : null;
  const activeUserId = rawActiveId && users[rawActiveId] ? rawActiveId : null;

  return {
    version: 1,
    updatedAt,
    activeUserId,
    users,
  };
}

/**
 * Non-destructively merges two LocalUsersStore snapshots so no local user
 * or practiced character is ever lost across localStorage, IndexedDB, or tabs.
 */
export function mergeUsersStore(a: LocalUsersStore, b: LocalUsersStore): LocalUsersStore {
  const mergedUsers: Record<string, LocalUserProfile> = {};
  const allIds = new Set<string>([...Object.keys(a.users), ...Object.keys(b.users)]);

  for (const id of allIds) {
    const userA = a.users[id];
    const userB = b.users[id];

    if (userA && userB) {
      const preferB = userB.lastActiveAt > userA.lastActiveAt;
      const createdA = userA.createdAt || Number.MAX_SAFE_INTEGER;
      const createdB = userB.createdAt || Number.MAX_SAFE_INTEGER;
      const minCreated = Math.min(createdA, createdB);

      mergedUsers[id] = {
        id,
        name: preferB ? userB.name : userA.name,
        createdAt: minCreated === Number.MAX_SAFE_INTEGER ? 0 : minCreated,
        lastActiveAt: Math.max(userA.lastActiveAt, userB.lastActiveAt),
        progress: mergeProgressData(userA.progress, userB.progress),
      };
    } else if (userA) {
      mergedUsers[id] = {
        ...userA,
        progress: {
          ...userA.progress,
          practicedChars: [...userA.progress.practicedChars],
          characters: { ...userA.progress.characters },
          resume: { ...userA.progress.resume },
          preferences: { ...userA.progress.preferences },
        },
      };
    } else if (userB) {
      mergedUsers[id] = {
        ...userB,
        progress: {
          ...userB.progress,
          practicedChars: [...userB.progress.practicedChars],
          characters: { ...userB.progress.characters },
          resume: { ...userB.progress.resume },
          preferences: { ...userB.progress.preferences },
        },
      };
    }
  }

  const preferB = b.updatedAt > a.updatedAt;
  const candidateActive = preferB ? b.activeUserId : a.activeUserId;
  const activeUserId =
    candidateActive && mergedUsers[candidateActive] ? candidateActive : null;

  return {
    version: 1,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    activeUserId,
    users: mergedUsers,
  };
}

export function loginWithUserName(
  store: LocalUsersStore,
  rawName: string,
  now = Date.now()
): { store: LocalUsersStore; user: LocalUserProfile } | null {
  const name = normalizeDisplayName(rawName);
  const id = toUserId(name);
  if (!id) return null;

  const timestamp = Math.max(store.updatedAt + 1, now);
  const existing = store.users[id];

  let profile: LocalUserProfile;
  if (existing) {
    profile = {
      ...existing,
      lastActiveAt: timestamp,
    };
  } else {
    // If this is the very first user on a browser that has legacy unowned progress,
    // migrate it into their profile so prior progress is preserved.
    let initialProgress = createDefaultProgressData(timestamp);
    if (Object.keys(store.users).length === 0) {
      const legacy = loadProgressSync();
      if (legacy.practicedChars.length > 0 || legacy.updatedAt > 0) {
        initialProgress = {
          ...legacy,
          updatedAt: Math.max(legacy.updatedAt, timestamp),
        };
      }
    }

    profile = {
      id,
      name,
      createdAt: timestamp,
      lastActiveAt: timestamp,
      progress: initialProgress,
    };
  }

  const nextStore: LocalUsersStore = {
    version: 1,
    updatedAt: timestamp,
    activeUserId: id,
    users: {
      ...store.users,
      [id]: profile,
    },
  };

  return { store: nextStore, user: profile };
}

export function logoutUsersStore(store: LocalUsersStore, now = Date.now()): LocalUsersStore {
  const timestamp = Math.max(store.updatedAt + 1, now);
  return {
    ...store,
    updatedAt: timestamp,
    activeUserId: null,
  };
}

export function updateUserProgressInStore(
  store: LocalUsersStore,
  userId: string,
  updater: (prev: PersistedProgressData) => PersistedProgressData
): LocalUsersStore {
  const user = store.users[userId];
  if (!user) return store;

  const nextProgress = updater(user.progress);
  if (nextProgress === user.progress) return store;

  const timestamp = Math.max(store.updatedAt + 1, nextProgress.updatedAt, Date.now());
  return {
    ...store,
    updatedAt: timestamp,
    users: {
      ...store.users,
      [userId]: {
        ...user,
        lastActiveAt: timestamp,
        progress: nextProgress,
      },
    },
  };
}

export function getSortedLocalUsers(
  store: LocalUsersStore,
  activeBrowserUserIds: ReadonlySet<string>,
  currentUserId: string | null
): LocalUserProfile[] {
  return Object.values(store.users).sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    const aLive = activeBrowserUserIds.has(a.id) ? 1 : 0;
    const bLive = activeBrowserUserIds.has(b.id) ? 1 : 0;
    if (aLive !== bLive) return bLive - aLive;
    return b.lastActiveAt - a.lastActiveAt || a.name.localeCompare(b.name);
  });
}

export function loadUsersStoreSync(): LocalUsersStore {
  if (typeof localStorage === 'undefined') return createEmptyUsersStore(0);
  try {
    const raw = localStorage.getItem(USER_STORE_STORAGE_KEY);
    if (!raw) return createEmptyUsersStore(0);
    return sanitizeUsersStore(JSON.parse(raw));
  } catch {
    return createEmptyUsersStore(0);
  }
}

function writeUsersStoreToLocalStorage(store: LocalUsersStore): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(USER_STORE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota or restricted storage errors
  }
}

export function saveUsersStore(store: LocalUsersStore): void {
  writeUsersStoreToLocalStorage(store);
  void writeIndexedDBKey(IDB_USERS_KEY, store);
}

export async function hydrateUsersStoreFromIndexedDB(
  current: LocalUsersStore
): Promise<LocalUsersStore | null> {
  const rawIdb = await readIndexedDBKey(IDB_USERS_KEY);
  if (!rawIdb) {
    if (current.updatedAt > 0 || Object.keys(current.users).length > 0) {
      await writeIndexedDBKey(IDB_USERS_KEY, current);
    }
    return null;
  }

  const idbStore = sanitizeUsersStore(rawIdb);
  const merged = mergeUsersStore(current, idbStore);
  const changed = JSON.stringify(merged) !== JSON.stringify(current);

  if (changed) {
    writeUsersStoreToLocalStorage(merged);
  }
  if (JSON.stringify(merged) !== JSON.stringify(idbStore)) {
    await writeIndexedDBKey(IDB_USERS_KEY, merged);
  }

  return changed ? merged : null;
}

export function subscribeToUsersStoreUpdates(
  onRemoteStore: (remote: LocalUsersStore) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key !== USER_STORE_STORAGE_KEY) return;
    onRemoteStore(loadUsersStoreSync());
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

/* Per-tab session tracking so all active local users across open tabs on this browser are visible */

export function createTabId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTabUserId(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(TAB_USER_SESSION_KEY);
    return raw ? toUserId(raw) : null;
  } catch {
    return null;
  }
}

export function setTabUserId(userId: string | null): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (userId) {
      sessionStorage.setItem(TAB_USER_SESSION_KEY, userId);
    } else {
      sessionStorage.removeItem(TAB_USER_SESSION_KEY);
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
}

function readSessionsMap(now = Date.now()): Record<string, ActiveTabSession> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACTIVE_TAB_SESSIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const fresh: Record<string, ActiveTabSession> = {};
    for (const [tabId, entry] of Object.entries(parsed)) {
      if (!isRecord(entry)) continue;
      if (typeof entry.userId !== 'string' || typeof entry.lastSeen !== 'number') continue;
      if (now - entry.lastSeen <= SESSION_TTL_MS) {
        fresh[tabId] = { userId: toUserId(entry.userId), lastSeen: entry.lastSeen };
      }
    }
    return fresh;
  } catch {
    return {};
  }
}

function writeSessionsMap(map: Record<string, ActiveTabSession>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_TAB_SESSIONS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export function heartbeatTabSession(tabId: string, userId: string | null, now = Date.now()): void {
  const map = readSessionsMap(now);
  if (userId) {
    map[tabId] = { userId, lastSeen: now };
  } else {
    delete map[tabId];
  }
  writeSessionsMap(map);
}

export function removeTabSession(tabId: string): void {
  const map = readSessionsMap();
  if (tabId in map) {
    delete map[tabId];
    writeSessionsMap(map);
  }
}

export function getActiveBrowserUserIds(now = Date.now()): Set<string> {
  const map = readSessionsMap(now);
  return new Set(Object.values(map).map((s) => s.userId));
}

export function subscribeToActiveSessions(
  onActiveUsersChange: (activeUserIds: Set<string>) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key !== ACTIVE_TAB_SESSIONS_KEY) return;
    onActiveUsersChange(getActiveBrowserUserIds());
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
