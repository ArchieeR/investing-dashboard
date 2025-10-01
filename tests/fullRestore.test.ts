import { describe, it, expect } from 'vitest';
import { getFixedBackupData } from '../src/utils/fixBackupData';
import { validateBackupData } from '../src/utils/backupUtils';

describe('fullRestore', () => {
  it('should provide valid backup data for full restore', () => {
    const backupData = getFixedBackupData();
    const validation = validateBackupData(backupData);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    
    // Should have all required fields
    expect(backupData.portfolios).toBeDefined();
    expect(backupData.portfolios.length).toBe(3);
    expect(backupData.activePortfolioId).toBe('portfolio-1');
    
    // Each portfolio should have required fields
    backupData.portfolios.forEach(portfolio => {
      expect(portfolio.type).toBeDefined();
      expect(portfolio.createdAt).toBeDefined();
      expect(portfolio.updatedAt).toBeDefined();
    });
    
    // Main portfolio should have holdings
    expect(backupData.portfolios[0].holdings.length).toBe(14);
    
    console.log('✅ Full backup data is valid and ready for restore');
    console.log(`📊 Contains ${backupData.portfolios.length} portfolios`);
    console.log(`📈 Main portfolio has ${backupData.portfolios[0].holdings.length} holdings`);
  });
});