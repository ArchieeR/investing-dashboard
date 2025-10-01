import React, { useState } from 'react';
import ManualRestoreDialog from './ManualRestoreDialog';
import type { AppState } from '../state/types';

interface ManualRestoreButtonProps {
  onRestore: (restoredData: AppState) => void;
  currentPortfolioData?: AppState;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const ManualRestoreButton: React.FC<ManualRestoreButtonProps> = ({
  onRestore,
  currentPortfolioData,
  variant = 'outline',
  size = 'md',
  className = '',
  children,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRestore = (restoredData: AppState) => {
    onRestore(restoredData);
    setIsDialogOpen(false);
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={getButtonClasses()}
        title="Restore portfolio data from a specific backup file"
      >
        {children || (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Restore from Backup
          </>
        )}
      </button>
      
      <ManualRestoreDialog
        isOpen={isDialogOpen}
        onRestore={handleRestore}
        onCancel={() => setIsDialogOpen(false)}
        currentPortfolioData={currentPortfolioData}
      />
    </>
  );
};

export default ManualRestoreButton;