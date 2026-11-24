export type StoragePersistenceStatus = 'persisted' | 'best-effort' | 'unsupported';

/**
 * Requests persistent browser storage so user progress in localStorage and IndexedDB
 * is exempt from automatic browser eviction under storage pressure and stays available
 * until the user explicitly clears browser data.
 */
export async function requestPersistentStorage(): Promise<StoragePersistenceStatus> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.storage ||
    typeof navigator.storage.persist !== 'function'
  ) {
    return 'unsupported';
  }

  try {
    if (typeof navigator.storage.persisted === 'function') {
      const alreadyPersisted = await navigator.storage.persisted();
      if (alreadyPersisted) return 'persisted';
    }
    const granted = await navigator.storage.persist();
    return granted ? 'persisted' : 'best-effort';
  } catch {
    return 'best-effort';
  }
}

/**
 * Registers the build-generated offline service worker so the entire SPA shell
 * and all bundled stroke datasets remain available completely offline.
 */
export function registerOfflineServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (window.location.protocol !== 'https:' && window.location.protocol !== 'http:') return;

  const register = () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      // App remains fully functional even if service worker registration is blocked
    });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
