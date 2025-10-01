import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManualRestoreButton from '../src/components/ManualRestoreButton';
import type { AppState } from '../src/state/types';

// Mock the ManualRestoreDialog component
vi.mock('../src/components/ManualRestoreDialog', () => ({
  default: ({ isOpen, onRestore, onCancel, currentPortfolioData }: any) => {
    if (!isOpen) return null;
    
    return (
      <div data-testid="manual-restore-dialog">
        <div>Manual Restore Dialog</div>
        <button 
          onClick={() => onRestore({ test: 'restored-data' })}
          data-testid="mock-restore-button"
        >
          Mock Restore
        </button>
        <button onClick={onCancel} data-testid="mock-cancel-button">
          Mock Cancel
        </button>
        <div data-testid="current-portfolio-data">
          {currentPortfolioData ? JSON.stringify(currentPortfolioData) : 'No data'}
        </div>
      </div>
    );
  },
}));

describe('ManualRestoreButton', () => {
  const mockOnRestore = vi.fn();
  
  const mockCurrentPortfolioData: AppState = {
    portfolios: [
      {
        id: 'portfolio-1',
        name: 'Test Portfolio',
        type: 'actual',
        lists: {
          sections: ['Core', 'Satellite', 'Cash'],
          themes: ['All', 'Cash'],
          accounts: ['Brokerage'],
          themeSections: { All: 'Core', Cash: 'Cash' },
        },
        holdings: [],
        settings: {
          currency: 'GBP',
          lockTotal: false,
          enableLivePrices: true,
          livePriceUpdateInterval: 5,
          visibleColumns: {} as any,
        },
        budgets: {
          sections: {},
          accounts: {},
          themes: {},
        },
        trades: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    activePortfolioId: 'portfolio-1',
    playground: { enabled: false },
    filters: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onRestore: mockOnRestore,
    currentPortfolioData: mockCurrentPortfolioData,
  };

  it('should render button with default text and icon', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    expect(screen.getByText('Restore from Backup')).toBeInTheDocument();
    expect(screen.getByTitle('Restore portfolio data from a specific backup file')).toBeInTheDocument();
  });

  it('should render custom children when provided', () => {
    render(
      <ManualRestoreButton {...defaultProps}>
        <span>Custom Restore Text</span>
      </ManualRestoreButton>
    );
    
    expect(screen.getByText('Custom Restore Text')).toBeInTheDocument();
    expect(screen.queryByText('Restore from Backup')).not.toBeInTheDocument();
  });

  it('should open dialog when button is clicked', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    const button = screen.getByText('Restore from Backup');
    fireEvent.click(button);
    
    expect(screen.getByTestId('manual-restore-dialog')).toBeInTheDocument();
    expect(screen.getByText('Manual Restore Dialog')).toBeInTheDocument();
  });

  it('should close dialog when cancel is clicked', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Open dialog
    const button = screen.getByText('Restore from Backup');
    fireEvent.click(button);
    
    expect(screen.getByTestId('manual-restore-dialog')).toBeInTheDocument();
    
    // Close dialog
    const cancelButton = screen.getByTestId('mock-cancel-button');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByTestId('manual-restore-dialog')).not.toBeInTheDocument();
  });

  it('should call onRestore and close dialog when restore is completed', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Open dialog
    const button = screen.getByText('Restore from Backup');
    fireEvent.click(button);
    
    // Trigger restore
    const restoreButton = screen.getByTestId('mock-restore-button');
    fireEvent.click(restoreButton);
    
    expect(mockOnRestore).toHaveBeenCalledWith({ test: 'restored-data' });
    expect(screen.queryByTestId('manual-restore-dialog')).not.toBeInTheDocument();
  });

  it('should pass currentPortfolioData to dialog', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    // Open dialog
    const button = screen.getByText('Restore from Backup');
    fireEvent.click(button);
    
    const portfolioDataElement = screen.getByTestId('current-portfolio-data');
    expect(portfolioDataElement.textContent).toContain('portfolio-1');
    expect(portfolioDataElement.textContent).toContain('Test Portfolio');
  });

  it('should handle missing currentPortfolioData', () => {
    render(<ManualRestoreButton onRestore={mockOnRestore} />);
    
    // Open dialog
    const button = screen.getByText('Restore from Backup');
    fireEvent.click(button);
    
    const portfolioDataElement = screen.getByTestId('current-portfolio-data');
    expect(portfolioDataElement.textContent).toBe('No data');
  });

  describe('button styling variants', () => {
    it('should apply primary variant classes', () => {
      render(<ManualRestoreButton {...defaultProps} variant="primary" />);
      
      const button = screen.getByText('Restore from Backup');
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should apply secondary variant classes', () => {
      render(<ManualRestoreButton {...defaultProps} variant="secondary" />);
      
      const button = screen.getByText('Restore from Backup');
      expect(button).toHaveClass('bg-gray-600', 'text-white');
    });

    it('should apply outline variant classes (default)', () => {
      render(<ManualRestoreButton {...defaultProps} />);
      
      const button = screen.getByText('Restore from Backup');
      expect(button).toHaveClass('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    });
  });

  describe('button sizing', () => {
    it('should apply small size classes', () => {
      render(<ManualRestoreButton {...defaultProps} size="sm" />);
      
      const button = screen.getByText('Restore from Backup');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should apply medium size classes (default)', () => {
      render(<ManualRestoreButton {...defaultProps} />);
      
      const button = screen.getByText('Restore from Backup');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('should apply large size classes', () => {
      render(<ManualRestoreButton {...defaultProps} size="lg" />);
      
      const button = screen.getByText('Restore from Backup');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });
  });

  it('should apply custom className', () => {
    render(<ManualRestoreButton {...defaultProps} className="custom-class" />);
    
    const button = screen.getByText('Restore from Backup');
    expect(button).toHaveClass('custom-class');
  });

  it('should maintain button state when dialog is open', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    const button = screen.getByText('Restore from Backup');
    
    // Button should be enabled initially
    expect(button).not.toBeDisabled();
    
    // Open dialog
    fireEvent.click(button);
    
    // Button should still be enabled (dialog doesn't disable it)
    expect(button).not.toBeDisabled();
  });

  it('should have proper accessibility attributes', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    const button = screen.getByText('Restore from Backup');
    expect(button).toHaveAttribute('title', 'Restore portfolio data from a specific backup file');
  });

  it('should render SVG icon by default', () => {
    render(<ManualRestoreButton {...defaultProps} />);
    
    const button = screen.getByText('Restore from Backup');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-4', 'h-4', 'mr-2');
  });

  it('should not render icon when custom children are provided', () => {
    render(
      <ManualRestoreButton {...defaultProps}>
        Custom Text Only
      </ManualRestoreButton>
    );
    
    const button = screen.getByText('Custom Text Only');
    const svg = button.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  describe('dialog state management', () => {
    it('should start with dialog closed', () => {
      render(<ManualRestoreButton {...defaultProps} />);
      
      expect(screen.queryByTestId('manual-restore-dialog')).not.toBeInTheDocument();
    });

    it('should handle multiple open/close cycles', () => {
      render(<ManualRestoreButton {...defaultProps} />);
      
      const button = screen.getByText('Restore from Backup');
      
      // Open dialog
      fireEvent.click(button);
      expect(screen.getByTestId('manual-restore-dialog')).toBeInTheDocument();
      
      // Close dialog
      const cancelButton = screen.getByTestId('mock-cancel-button');
      fireEvent.click(cancelButton);
      expect(screen.queryByTestId('manual-restore-dialog')).not.toBeInTheDocument();
      
      // Open again
      fireEvent.click(button);
      expect(screen.getByTestId('manual-restore-dialog')).toBeInTheDocument();
    });
  });
});