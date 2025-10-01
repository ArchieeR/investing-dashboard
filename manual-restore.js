import fs from 'fs';

console.log('🔄 Manual restore process...');

// Read the backup file
const backupData = JSON.parse(fs.readFileSync('portfolio-backup-restore.json', 'utf8'));

console.log('📊 Backup file data:');
console.log(`- Portfolios: ${backupData.portfolios.length}`);
console.log(`- Main portfolio holdings: ${backupData.portfolios[0].holdings.length}`);

// Add missing fields
const now = new Date().toISOString();
backupData.portfolios.forEach(portfolio => {
  if (!portfolio.type) portfolio.type = 'actual';
  if (!portfolio.createdAt) portfolio.createdAt = now;
  if (!portfolio.updatedAt) portfolio.updatedAt = now;
});

console.log('✅ Added missing fields');

// Write directly to portfolio-data.json
fs.writeFileSync('portfolio-data.json', JSON.stringify(backupData, null, 2));

console.log('✅ Wrote data to portfolio-data.json');

// Verify what was written
const savedData = JSON.parse(fs.readFileSync('portfolio-data.json', 'utf8'));
console.log('🔍 Verification:');
console.log(`- Portfolios: ${savedData.portfolios.length}`);
console.log(`- Main portfolio holdings: ${savedData.portfolios[0].holdings.length}`);

if (savedData.portfolios[0].holdings.length > 0) {
  console.log(`- First holding: ${savedData.portfolios[0].holdings[0].name}`);
  console.log('🎉 Manual restore successful!');
} else {
  console.log('❌ Manual restore failed - no holdings');
}