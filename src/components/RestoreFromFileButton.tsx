import React, { useState } from 'react';
import { restoreFromLocalFile } from '../utils/restoreFromFile';
import { fixBackupData } from '../utils/fixBackupData';
import { usePortfolio } from '../state/portfolioStore';
import type { AppState } from '../state/types';

interface RestoreFromFileButtonProps {
  onRestore?: (data: AppState) => void;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const RestoreFromFileButton: React.FC<RestoreFromFileButtonProps> = ({
  onRestore,
  onError,
  className = '',
  style = {},
  children
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const { restoreFullBackup } = usePortfolio();

  const handleFileSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsRestoring(true);
      
      try {
        const result = await restoreFromLocalFile(file);
        
        if (result.success && result.data) {
          // Fix the backup data to ensure it has all required fields
          const fixedData = fixBackupData(result.data);
          
          // Show confirmation dialog
          const portfolioCount = fixedData.portfolios?.length || 0;
          const totalHoldings = fixedData.portfolios?.reduce((sum, p) => sum + (p.holdings?.length || 0), 0) || 0;
          
          const confirmMessage = `Restore backup from "${file.name}"?\n\n` +
            `This backup contains:\n` +
            `• ${portfolioCount} portfolio${portfolioCount !== 1 ? 's' : ''}\n` +
            `• ${totalHoldings} holding${totalHoldings !== 1 ? 's' : ''}\n\n` +
            `This will replace your current portfolio data and cannot be undone.`;
          
          if (window.confirm(confirmMessage)) {
            // Use the portfolio store's restore function to save to file system
            restoreFullBackup(fixedData);
            
            // Also call the optional callback
            onRestore?.(fixedData);
            
            // Show success message
            alert(`Portfolio restored successfully from "${file.name}"!\n\n` +
              `Restored ${portfolioCount} portfolio${portfolioCount !== 1 ? 's' : ''} ` +
              `with ${totalHoldings} holding${totalHoldings !== 1 ? 's' : ''}.`);
          }
        } else {
          const errorMessage = result.error || 'Failed to restore from backup file';
          onError?.(errorMessage);
          alert(`Restore failed: ${errorMessage}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        onError?.(errorMessage);
        alert(`Restore failed: ${errorMessage}`);
      } finally {
        setIsRestoring(false);
      }
    };
    
    input.click();
  };

  const defaultStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: isRestoring ? 'not-allowed' : 'pointer',
    opacity: isRestoring ? 0.6 : 1,
    transition: 'all 0.2s ease',
    ...style
  };

  return (
    <button
      onClick={handleFileSelect}
      disabled={isRestoring}
      className={className}
      style={defaultStyle}
      title="Select and restore from a backup file"
    >
      {isRestoring ? 'Restoring...' : (children || 'Restore from File')}
    </button>
  );
};

export default RestoreFromFileButton;