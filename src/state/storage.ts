import type { AppState } from './types';

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

    return JSON.parse(raw) as AppState;
  } catch {
    return undefined;
  }
};

export const saveState = (state: AppState): void => {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    // Ignore removal errors.
  }
};
