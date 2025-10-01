// Simple script to verify the restore data
import fs from 'fs';

console.log('🔍 Checking portfolio-data.json...');

try {
  const data = JSON.parse(fs.readFileSync('portfolio-data.json', 'utf8'));
  
  console.log(`📊 Found ${data.portfolios.length} portfolios`);
  
  data.portfolios.forEach((portfolio, index) => {
    console.log(`Portfolio ${index + 1}: ${portfolio.name}`);
    console.log(`  - Holdings: ${portfolio.holdings.length}`);
    console.log(`  - Type: ${portfolio.type || 'MISSING'}`);
    console.log(`  - Created: ${portfolio.createdAt || 'MISSING'}`);
  });
  
  const mainPortfolio = data.portfolios[0];
  if (mainPortfolio.holdings.length === 0) {
    console.log('❌ Main portfolio has no holdings - restore failed');
  } else {
    console.log('✅ Main portfolio has holdings - restore succeeded');
    console.log(`First holding: ${mainPortfolio.holdings[0].name}`);
  }
  
} catch (error) {
  console.error('❌ Error reading portfolio data:', error.message);
}