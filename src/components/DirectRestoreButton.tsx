import React, { useState } from 'react';
import { getFixedBackupData } from '../utils/fixBackupData';
import { validateBackupData } from '../utils/backupUtils';
import { usePortfolio } from '../state/portfolioStore';
import type { AppState } from '../state/types';

interface DirectRestoreButtonProps {
  onRestore?: (data: AppState) => void;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DirectRestoreButton: React.FC<DirectRestoreButtonProps> = ({
  onRestore,
  onError,
  className = '',
  style = {}
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const { restoreFullBackup } = usePortfolio();

  const handleDirectRestore = async () => {
    setIsRestoring(true);
    
    try {
      // Get the fixed backup data
      const backupData = getFixedBackupData();
      
      // Validate the backup data
      const validation = validateBackupData(backupData);
      
      if (!validation.isValid) {
        const errorMessage = `Backup data validation failed: ${validation.errors.join(', ')}`;
        onError?.(errorMessage);
        alert(`Restore failed: ${errorMessage}`);
        return;
      }
      
      // Show confirmation dialog
      const portfolioCount = backupData.portfolios?.length || 0;
      const totalHoldings = backupData.portfolios?.reduce((sum, p) => sum + (p.holdings?.length || 0), 0) || 0;
      
      const confirmMessage = `Restore your backup data?\n\n` +
        `This backup contains:\n` +
        `• ${portfolioCount} portfolio${portfolioCount !== 1 ? 's' : ''}\n` +
        `• ${totalHoldings} holding${totalHoldings !== 1 ? 's' : ''}\n` +
        `• Main Portfolio: ${backupData.portfolios[0]?.name || 'Unknown'}\n` +
        `• Family ISA: ${backupData.portfolios[1]?.name || 'Unknown'}\n` +
        `• Play Portfolio: ${backupData.portfolios[2]?.name || 'Unknown'}\n\n` +
        `This will replace your current portfolio data and cannot be undone.`;
      
      if (window.confirm(confirmMessage)) {
        // Use the portfolio store's restore function to save to file system
        restoreFullBackup(backupData);
        
        // Also call the optional callback
        onRestore?.(backupData);
        
        // Give the save effect time to run, then show success message
        setTimeout(() => {
          alert(`Portfolio restored successfully!\n\n` +
            `Restored ${portfolioCount} portfolio${portfolioCount !== 1 ? 's' : ''} ` +
            `with ${totalHoldings} holding${totalHoldings !== 1 ? 's' : ''}.\n\n` +
            `Your Main Portfolio now has:\n` +
            `• ${backupData.portfolios[0]?.holdings?.length || 0} holdings\n` +
            `• Budget allocations: Core (35%), Satellite (50%), Gold (15%)\n` +
            `• Themes: Index, AI Infra, Defense, Nuclear, etc.\n\n` +
            `The data should now persist after page refresh! 🎉`);
        }, 500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
      alert(`Restore failed: ${errorMessage}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const defaultStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: isRestoring ? 'not-allowed' : 'pointer',
    opacity: isRestoring ? 0.6 : 1,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    ...style
  };

  return (
    <button
      onClick={handleDirectRestore}
      disabled={isRestoring}
      className={className}
      style={defaultStyle}
      title="Restore your portfolio-backup-restore.json data directly"
    >
      {isRestoring ? (
        <>
          <span>🔄</span>
          <span>Restoring...</span>
        </>
      ) : (
        <>
          <span>🚀</span>
          <span>Restore My Backup Data</span>
        </>
      )}
    </button>
  );
};

export default DirectRestoreButton;