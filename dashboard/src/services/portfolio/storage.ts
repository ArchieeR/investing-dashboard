// =============================================================================
// Portfolio Storage - localStorage persistence for Next.js client
// Adapted from _portfolio-reference/src/state/storage.ts
// =============================================================================

import type { AppState } from '@/types/portfolio';
import { serializeAppState, deserializeAppState } from './serialize';

const STORAGE_KEY = 'portfolio-manager-state';

const isStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadState = (): AppState | undefined => {
  if (!isStorageAvailable()) {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw);
    return deserializeAppState(parsed);
  } catch {
    return undefined;
  }
};

export const saveState = (state: AppState): void => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const serialized = serializeAppState(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore persistence errors (storage quota, privacy settings, etc.)
  }
};

export const clearState = (): void => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore removal errors
  }
};
