import { getFixedBackupData } from './src/utils/fixBackupData.js';

console.log('🔍 Testing backup data...');

const backupData = getFixedBackupData();

console.log('📊 Backup data structure:');
console.log(`- Portfolios: ${backupData.portfolios.length}`);
console.log(`- Active portfolio: ${backupData.activePortfolioId}`);

backupData.portfolios.forEach((portfolio, index) => {
  console.log(`\nPortfolio ${index + 1}: ${portfolio.name}`);
  console.log(`  - ID: ${portfolio.id}`);
  console.log(`  - Type: ${portfolio.type}`);
  console.log(`  - Holdings: ${portfolio.holdings.length}`);
  
  if (portfolio.holdings.length > 0) {
    console.log(`  - First holding: ${portfolio.holdings[0].name}`);
    console.log(`  - First holding ticker: ${portfolio.holdings[0].ticker}`);
    console.log(`  - First holding qty: ${portfolio.holdings[0].qty}`);
  }
});

console.log('\n✅ Backup data test complete');