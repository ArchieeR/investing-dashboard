import { validateBackupData, extractBackupMetadata } from './backupUtils';
import type { AppState } from '../state/types';

/**
 * Restore portfolio data from a local backup file
 */
export async function restoreFromLocalFile(file: File): Promise<{
  success: boolean;
  data?: AppState;
  error?: string;
  metadata?: any;
}> {
  try {
    // Read the file content
    const fileContent = await readFileAsText(file);
    
    // Parse JSON
    let backupData: any;
    try {
      backupData = JSON.parse(fileContent);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON format in backup file'
      };
    }
    
    // Validate the backup data structure
    const validation = validateBackupData(backupData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid backup data: ${validation.errors.join(', ')}`
      };
    }
    
    // Extract metadata for logging
    const metadata = extractBackupMetadata(file.name, backupData, file.size);
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Backup restored with warnings:', validation.warnings);
    }
    
    return {
      success: true,
      data: backupData as AppState,
      metadata
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore from file'
    };
  }
}

/**
 * Helper function to read file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Create a file input element and trigger file selection
 */
export function selectAndRestoreBackupFile(): Promise<{
  success: boolean;
  data?: AppState;
  error?: string;
  metadata?: any;
}> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({
          success: false,
          error: 'No file selected'
        });
        return;
      }
      
      const result = await restoreFromLocalFile(file);
      resolve(result);
    };
    
    input.oncancel = () => {
      resolve({
        success: false,
        error: 'File selection cancelled'
      });
    };
    
    // Trigger file selection
    input.click();
  });
}

/**
 * Restore from a specific file path (for your backup file)
 */
export async function restoreFromFilePath(filePath: string): Promise<{
  success: boolean;
  data?: AppState;
  error?: string;
  metadata?: any;
}> {
  try {
    // In a browser environment, we can't directly read from file paths
    // This would need to be handled by the server or through a file input
    return {
      success: false,
      error: 'Direct file path access not supported in browser. Please use file selection instead.'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore from file path'
    };
  }
}