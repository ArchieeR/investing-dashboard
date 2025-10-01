import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RestoreDialog } from '../src/components/RestoreDialog';
import type { BackupMetadata, RestoreResult } from '../src/hooks/useRestoreDetection';

describe('RestoreDialog', () => {
  const mockBackups: BackupMetadata[] = [
    {
      timestamp: '2025-09-23T21:24:33.089Z',
      filePath: 'backups/portfolio-2025-09-23T21-24-33-089Z.json',
      portfolioCount: 3,
      holdingsCount: 15,
    },
    {
      timestamp: '2025-09-23T20:58:00.670Z',
      filePath: 'backups/portfolio-2025-09-23T20-58-00-670Z.json',
      portfolioCount: 3,
      holdingsCount: 12,
    },
    {
      timestamp: '2025-09-23T20:44:48.858Z',
      filePath: 'backups/portfolio-2025-09-23T20-44-48-858Z.json',
      portfolioCount: 2,
      holdingsCount: 8,
    },
  ];

  const defaultProps = {
    isOpen: true,
    availableBackups: mockBackups,
    onRestore: vi.fn(),
    onCancel: vi.fn(),
    isRestoring: false,
  };

  it('should not render when isOpen is false', () => {
    render(<RestoreDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Restore Portfolio Data')).not.toBeInTheDocument();
  });

  it('should render dialog when isOpen is true', () => {
    render(<RestoreDialog {...defaultProps} />);
    
    expect(screen.getByText('Restore Portfolio Data')).toBeInTheDocument();
    expect(screen.getByText(/Your portfolio appears to be empty/)).toBeInTheDocument();
  });

  it('should display latest backup information', () => {
    render(<RestoreDialog {...defaultProps} />);
    
    expect(screen.getByText('Latest Backup')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Portfolios: 3';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Holdings: 15';
    })).toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    render(<RestoreDialog {...defaultProps} />);
    
    // The exact format depends on locale, but should contain date/time elements
    const dateText = screen.getByText(/Date:/);
    expect(dateText).toBeInTheDocument();
  });

  it('should call onRestore with no parameters when restoring latest backup', async () => {
    const mockOnRestore = vi.fn().mockResolvedValue({ success: true });
    
    render(<RestoreDialog {...defaultProps} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);
    
    expect(mockOnRestore).toHaveBeenCalledWith();
  });

  it('should display other available backups when more than one exists', () => {
    render(<RestoreDialog {...defaultProps} />);
    
    expect(screen.getByText('Other Available Backups')).toBeInTheDocument();
    
    // Should show 2 other backups (excluding the latest)
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(2);
  });

  it('should allow selecting and restoring from specific backup', async () => {
    const mockOnRestore = vi.fn().mockResolvedValue({ success: true });
    
    render(<RestoreDialog {...defaultProps} onRestore={mockOnRestore} />);
    
    // Select the second backup
    const radioButtons = screen.getAllByRole('radio');
    fireEvent.click(radioButtons[0]);
    
    // The restore button should appear
    const restoreSelectedButton = screen.getByText('Restore Selected Backup');
    fireEvent.click(restoreSelectedButton);
    
    expect(mockOnRestore).toHaveBeenCalledWith(mockBackups[1].filePath);
  });

  it('should not show restore selected button when no backup is selected', () => {
    render(<RestoreDialog {...defaultProps} />);
    
    expect(screen.queryByText('Restore Selected Backup')).not.toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockOnCancel = vi.fn();
    
    render(<RestoreDialog {...defaultProps} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state when isRestoring is true', () => {
    render(<RestoreDialog {...defaultProps} isRestoring={true} />);
    
    expect(screen.getByText('Restoring...')).toBeInTheDocument();
    
    // Buttons should be disabled
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should display error message when restore fails', async () => {
    const mockOnRestore = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Backup file corrupted' 
    });
    
    render(<RestoreDialog {...defaultProps} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('Backup file corrupted')).toBeInTheDocument();
    });
  });

  it('should display generic error when restore fails without specific error', async () => {
    const mockOnRestore = vi.fn().mockResolvedValue({ success: false });
    
    render(<RestoreDialog {...defaultProps} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByText('Restore failed')).toBeInTheDocument();
    });
  });

  it('should handle single backup scenario', () => {
    const singleBackup = [mockBackups[0]];
    
    render(<RestoreDialog {...defaultProps} availableBackups={singleBackup} />);
    
    expect(screen.getByText('Latest Backup')).toBeInTheDocument();
    expect(screen.queryByText('Other Available Backups')).not.toBeInTheDocument();
  });

  it('should handle empty backups array', () => {
    render(<RestoreDialog {...defaultProps} availableBackups={[]} />);
    
    expect(screen.queryByText('Latest Backup')).not.toBeInTheDocument();
    expect(screen.queryByText('Other Available Backups')).not.toBeInTheDocument();
  });

  it('should clear error when attempting new restore', async () => {
    const mockOnRestore = vi.fn()
      .mockResolvedValueOnce({ success: false, error: 'First error' })
      .mockResolvedValueOnce({ success: true });
    
    render(<RestoreDialog {...defaultProps} onRestore={mockOnRestore} />);
    
    const restoreButton = screen.getByText('Restore Latest Backup');
    
    // First restore fails
    fireEvent.click(restoreButton);
    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });
    
    // Second restore should clear the error
    fireEvent.click(restoreButton);
    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });

  it('should display backup metadata correctly', () => {
    render(<RestoreDialog {...defaultProps} />);
    
    // Check that backup metadata is displayed for other backups
    expect(screen.getByText((content, element) => {
      return element?.textContent === '3 portfolios, 12 holdings';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '2 portfolios, 8 holdings';
    })).toBeInTheDocument();
  });
});