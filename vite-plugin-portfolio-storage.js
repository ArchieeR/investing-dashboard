import fs from 'fs-extra';
import path from 'path';

const DATA_FILE = './portfolio-data.json';
const BACKUP_DIR = './backups';

// Track last backup time to avoid too frequent backups
let lastBackupTime = 0;
const BACKUP_INTERVAL = 60000; // Only backup every 60 seconds

export function portfolioStoragePlugin() {
  return {
    name: 'portfolio-storage',
    configureServer(server) {
      console.log('🔧 Portfolio storage plugin loaded - file storage enabled');
      
      // Ensure backup directory exists
      fs.ensureDirSync(BACKUP_DIR);
      
      // Add API endpoints for portfolio data
      server.middlewares.use('/api/portfolio/save', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              
              // Always save to main file
              await fs.writeJson(DATA_FILE, data.state, { spaces: 2 });
              
              // Only create backup if enough time has passed
              const now = Date.now();
              if (now - lastBackupTime > BACKUP_INTERVAL) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFile = path.join(BACKUP_DIR, `portfolio-${timestamp}.json`);
                await fs.writeJson(backupFile, data.state, { spaces: 2 });
                lastBackupTime = now;
                
                // Keep only last 20 backups in the backup folder
                const backupFiles = await fs.readdir(BACKUP_DIR);
                const portfolioBackups = backupFiles
                  .filter(f => f.startsWith('portfolio-') && f.endsWith('.json'))
                  .sort()
                  .reverse();
                
                for (let i = 20; i < portfolioBackups.length; i++) {
                  await fs.remove(path.join(BACKUP_DIR, portfolioBackups[i]));
                }
                
                console.log('📁 Backup created:', backupFile);
              }
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
              console.log('✅ Portfolio data saved to:', DATA_FILE);
            } catch (error) {
              console.error('❌ Save failed:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
        } else {
          next();
        }
      });

      server.middlewares.use('/api/portfolio/load', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            if (await fs.pathExists(DATA_FILE)) {
              const data = await fs.readJson(DATA_FILE);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, data }));
              console.log('✅ Portfolio data loaded from:', DATA_FILE);
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, data: null }));
              console.log('ℹ️ No portfolio data file found');
            }
          } catch (error) {
            console.error('❌ Load failed:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
        } else {
          next();
        }
      });

      // Add recovery endpoint to check localStorage data
      server.middlewares.use('/api/portfolio/recover', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              
              // Force save the localStorage data to file (overwrite existing)
              await fs.writeJson(DATA_FILE, data.state, { spaces: 2 });
              
              // Create recovery backup
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const backupFile = path.join(BACKUP_DIR, `portfolio-recovery-${timestamp}.json`);
              await fs.writeJson(backupFile, data.state, { spaces: 2 });
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Recovery completed successfully' }));
              console.log('🔄 Portfolio data recovered from localStorage to:', DATA_FILE);
            } catch (error) {
              console.error('❌ Recovery failed:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
        } else {
          next();
        }
      });

      // Add migration endpoint to transfer localStorage data to file
      server.middlewares.use('/api/portfolio/migrate', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              
              // Check if file already exists
              if (await fs.pathExists(DATA_FILE)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'File already exists, no migration needed' }));
                return;
              }
              
              // Save localStorage data to file
              await fs.writeJson(DATA_FILE, data.state, { spaces: 2 });
              
              // Create initial backup
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const backupFile = path.join(BACKUP_DIR, `portfolio-migration-${timestamp}.json`);
              await fs.writeJson(backupFile, data.state, { spaces: 2 });
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Migration completed successfully' }));
              console.log('🔄 Portfolio data migrated from localStorage to:', DATA_FILE);
            } catch (error) {
              console.error('❌ Migration failed:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
        } else {
          next();
        }
      });

      // Add backups listing endpoint
      server.middlewares.use('/api/portfolio/backups', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            if (!await fs.pathExists(BACKUP_DIR)) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify([]));
              return;
            }

            const backupFiles = await fs.readdir(BACKUP_DIR);
            const portfolioBackups = backupFiles
              .filter(f => f.startsWith('portfolio-') && f.endsWith('.json'))
              .sort()
              .reverse(); // Most recent first

            const backupMetadata = await Promise.all(
              portfolioBackups.map(async (filename) => {
                const filePath = path.join(BACKUP_DIR, filename);
                try {
                  const data = await fs.readJson(filePath);
                  const portfolioCount = data.portfolios ? data.portfolios.length : 0;
                  const holdingsCount = data.portfolios 
                    ? data.portfolios.reduce((sum, p) => sum + (p.holdings ? p.holdings.length : 0), 0)
                    : 0;
                  
                  // Extract timestamp from filename
                  const timestampMatch = filename.match(/portfolio-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
                  const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();

                  return {
                    timestamp,
                    filePath: filename,
                    portfolioCount,
                    holdingsCount,
                  };
                } catch (error) {
                  console.warn(`Failed to read backup file ${filename}:`, error);
                  return null;
                }
              })
            );

            const validBackups = backupMetadata.filter(backup => backup !== null);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(validBackups));
            console.log(`✅ Listed ${validBackups.length} backup files`);
          } catch (error) {
            console.error('❌ Failed to list backups:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
        } else {
          next();
        }
      });

      // Add restore endpoint
      server.middlewares.use('/api/portfolio/restore', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { filePath } = JSON.parse(body);
              
              if (!filePath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'filePath is required' }));
                return;
              }

              const backupFilePath = path.join(BACKUP_DIR, filePath);
              
              // Validate file exists and is within backup directory
              if (!await fs.pathExists(backupFilePath) || !backupFilePath.startsWith(path.resolve(BACKUP_DIR))) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Backup file not found' }));
                return;
              }

              // Create pre-restore backup of current state if main file exists
              if (await fs.pathExists(DATA_FILE)) {
                const currentData = await fs.readJson(DATA_FILE);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const preRestoreBackup = path.join(BACKUP_DIR, `portfolio-pre-restore-${timestamp}.json`);
                await fs.writeJson(preRestoreBackup, currentData, { spaces: 2 });
                console.log('📁 Pre-restore backup created:', preRestoreBackup);
              }

              // Load and validate backup data
              const backupData = await fs.readJson(backupFilePath);
              
              // Basic validation
              if (!backupData || typeof backupData !== 'object') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid backup data format' }));
                return;
              }

              // Restore the backup to main file
              await fs.writeJson(DATA_FILE, backupData, { spaces: 2 });
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: true, 
                data: backupData,
                message: `Portfolio restored from ${filePath}` 
              }));
              console.log('🔄 Portfolio restored from:', backupFilePath);
            } catch (error) {
              console.error('❌ Restore failed:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}