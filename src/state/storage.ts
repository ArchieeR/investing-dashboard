import type { AppState } from './types';
import { serializeAppState } from '../utils/serializeState';

const STORAGE_KEY = 'portfolio-manager-state';

const isStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isDevelopment = (): boolean => 
  import.meta.env.DEV;

export const loadState = async (): Promise<AppState | undefined> => {
  // Try file storage first in development
  if (isDevelopment()) {
    try {
      const response = await fetch('/api/portfolio/load');
      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ Portfolio data loaded from file');
        return result.data as AppState;
      }
    } catch (error) {
      console.warn('File storage not available, using localStorage:', error);
    }
  }

  // Fallback to localStorage
  const localStorageData = loadFromLocalStorage();
  
  // If we have localStorage data but no file data, migrate it
  if (localStorageData && isDevelopment()) {
    await migrateFromLocalStorage(localStorageData);
  }
  
  return localStorageData;
};

const loadFromLocalStorage = (): AppState | undefined => {
  if (!isStorageAvailable()) {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }

    console.log('✅ Portfolio data loaded from localStorage');
    return JSON.parse(raw) as AppState;
  } catch {
    return undefined;
  }
};

const migrateFromLocalStorage = async (state: AppState): Promise<void> => {
  if (!isDevelopment()) return;
  
  try {
    const response = await fetch('/api/portfolio/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state }),
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ Migration completed:', result.message);
    }
  } catch (error) {
    console.warn('Migration failed:', error);
  }
};

export const saveState = async (state: AppState): Promise<void> => {
  // Save to file storage in development
  if (isDevelopment()) {
    try {
      const serializedState = serializeAppState(state);
      const response = await fetch('/api/portfolio/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: serializedState }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Save API error:', response.status, errorText);
        throw new Error(`Save failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Portfolio data saved to file');
      } else {
        console.warn('File save failed:', result.error);
      }
    } catch (error) {
      console.warn('File storage not available:', error);
    }
  }

  // Also save to localStorage as backup
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
  // Note: We don't clear the file storage to preserve data
  // Only clear localStorage
  if (!isStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore removal errors.
  }
};
