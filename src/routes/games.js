const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../config/logger');
const fs = require('fs-extra');
const path = require('path');
const { validateGameJson } = require('../utils/validateJson');
const uiFileManager = require('../services/uiFileManager');

// Helper function to find NFO files in a folder
function findNfoFile(folderPath) {
    try {
        const files = fs.readdirSync(folderPath);
        const nfoFile = files.find(file => file.toLowerCase().endsWith('.nfo'));
        if (nfoFile) {
            logger.debug(`Found NFO file: ${nfoFile} in ${folderPath}`);
            return path.join(folderPath, nfoFile);
        }
        logger.debug(`No NFO file found in ${folderPath}`);
        return null;
    } catch (error) {
        logger.error(`Error searching for NFO file in ${folderPath}:`, error);
        return null;
    }
}

async function getFolderSize(folderPath) {
    try {
        const files = await fs.readdir(folderPath);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            }
        }

        return totalSize;
    } catch (error) {
        logger.error(`Error calculating folder size for ${folderPath}:`, error);
        return 0;
    }
}

async function enrichGameWithVersions(game) {
    const { destination_path: destinationPath } = game;

    if (!destinationPath || !fs.existsSync(destinationPath)) {
        logger.debug(`Game directory does not exist: ${destinationPath}`);
        return {
            ...game,
            allVersions: [],
            latestVersion: null,
            status: 'missing'
        };
    }

    try {
        const subfolders = fs.readdirSync(destinationPath)
            .filter(item => {
                const itemPath = path.join(destinationPath, item);
                return fs.statSync(itemPath).isDirectory();
            });

        const versions = await Promise.all(
            subfolders.map(async (folder) => {
                const match = folder.match(/^v?(\d+\.\d+\.\d+\.\d+)/);
                if (!match) return null;

                const folderPath = path.join(destinationPath, folder);
                const size = await getFolderSize(folderPath);
                const nfoPath = findNfoFile(folderPath);
                let nfoContent = null;

                if (nfoPath) {
                    try {
                        const nfoData = await uiFileManager.fetchNfoContent(nfoPath);
                        nfoContent = nfoData;
                        logger.debug(`Successfully parsed NFO file for version ${match[1]}`);
                    } catch (error) {
                        logger.error(`Error parsing NFO file for version ${match[1]}:`, error);
                    }
                }

                return {
                    folder,
                    version: match[1],
                    path: folderPath,
                    size,
                    nfoPath,
                    nfoContent,
                    status: size > 0 ? 'completed' : 'empty'
                };
            })
        );

        const filteredVersions = versions.filter(Boolean).sort((a, b) => {
            return b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' });
        });

        const latestVersion = filteredVersions.length > 0 ? filteredVersions[0].version : null;

        // Save NFO content for the latest version
        if (latestVersion && filteredVersions[0].nfoContent) {
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE games SET nfo_content = ? WHERE id = ?`,
                    [JSON.stringify(filteredVersions[0].nfoContent.parsed), game.id],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        }

        return {
            ...game,
            allVersions: filteredVersions,
            latestVersion,
            status: filteredVersions.length > 0 ? 'completed' : 'pending'
        };
    } catch (error) {
        logger.error(`Error enriching game with versions: ${error.message}`);
        // Return the game with default values instead of throwing
        return {
            ...game,
            allVersions: [],
            latestVersion: null,
            status: 'error'
        };
    }
}


router.get('/nfo', async (req, res) => {
    const { path: nfoPath } = req.query;
    
    try {
        const nfoData = await uiFileManager.fetchNfoContent(nfoPath);
        res.json(nfoData);
    } catch (error) {
        logger.error('Error fetching NFO content:', error);
        res.status(500).json({ error: error.message });
    }
});


router.post('/', async (req, res) => {
    const { 
      name,
      release_date,
      description,
      destination_path,
      root_folder_id,
      cover_url,
      metadata
    } = req.body;
  
    if (!name || !root_folder_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    db.run(
      `INSERT INTO games (
        name,
        release_date,
        description,
        destination_path,
        root_folder_id,
        cover_url,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        release_date,
        description,
        destination_path,
        root_folder_id,
        cover_url,
        JSON.stringify(metadata || {})
      ],
      function(err) {
        if (err) {
          logger.error('Error creating game:', err);
          return res.status(500).json({ error: 'Failed to create game' });
        }
  
        db.get(
          `SELECT * FROM games WHERE id = ?`,
          [this.lastID],
          (err, newGame) => {
            if (err) {
              logger.error('Error fetching new game:', err);
              return res.status(500).json({ error: 'Game created but failed to fetch details' });
            }
            res.status(201).json(newGame);
          }
        );
      }
    );
  });

// Get all games (with versions)
router.get('/', (req, res) => {
    db.all(`
    SELECT 
        g.*,
        r.path as root_folder_name
    FROM games g
    LEFT JOIN root_folders r ON g.root_folder_id = r.id
    `, async (err, rows) => {
        if (err) {
            logger.error('Error fetching games:', err);
            return res.status(500).json({ error: 'Failed to fetch games' });
        }

        try {
            const gamesWithVersions = await Promise.all(
                rows.map(async (game) => {
                    let latestVersion = null;
                    let allVersions = [];
                    let status = 'new';

                    let metadata = {};
                    try {
                        metadata = game.metadata ? JSON.parse(game.metadata) : {};
                    } catch (error) {
                        logger.error(`Error parsing metadata for game ${game.name}:`, error);
                        metadata = {};
                    }
            
                    if (game.destination_path && fs.existsSync(game.destination_path)) {
                        try {
                            const subfolders = fs.readdirSync(game.destination_path)
                                .filter(item => {
                                    const itemPath = path.join(game.destination_path, item);
                                    return fs.statSync(itemPath).isDirectory();
                                });
            
                            // Extract version numbers from subfolder names
                            const versions = subfolders
                                .map(folder => {
                                    const match = folder.match(/^v?(\d+\.\d+\.\d+\.\d+)/);
                                    return match ? {
                                        folder,
                                        version: match[1],
                                        path: path.join(game.destination_path, folder)
                                    } : null;
                                })
                                .filter(Boolean)
                                .sort((a, b) => {
                                    return b.version.localeCompare(a.version, undefined, 
                                    { numeric: true, sensitivity: 'base' });
                                });
            
                            if (versions.length > 0) {
                                latestVersion = versions[0].version;
                                allVersions = versions.map(v => ({
                                    version: v.version,
                                    path: v.path
                                }));
                                // Update status to 'completed' if we found version folders
                                status = 'completed';
                            } else {
                                // Path exists but no version folders found
                                status = 'pending';
                            }
                        } catch (error) {
                            logger.error(`Error reading versions for game ${game.name}:`, error);
                            status = 'error';
                        }
                    } else {
                        // Path doesn't exist
                        status = 'missing';
                    }
            
                    return {
                        ...game,
                        platforms: metadata.platforms || [],
                        genres: metadata.genres || [],
                        gameModes: metadata.gameModes || [],
                        latestVersion,
                        allVersions,
                        status
                    };
                })
            );

            res.json(gamesWithVersions);
        } catch (error) {
            logger.error('Error processing games:', error);
            res.status(500).json({ error: 'Failed to process games' });
        }
    });
});

// Get game details
router.get('/:id', validateGameJson, (req, res) => {
    const { id } = req.params;

    db.get(`
        SELECT 
            g.*,
            r.path as root_folder_name
        FROM games g
        LEFT JOIN root_folders r ON g.root_folder_id = r.id
        WHERE g.id = ?
    `, [id], async (err, game) => {
        if (err) {
            logger.error('Error fetching game:', err);
            return res.status(500).json({ error: 'Failed to fetch game details' });
        }
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        try {
            // Get the enriched game data with versions and NFO content
            const enrichedGame = await enrichGameWithVersions(game);

            // Parse the metadata
            const metadata = game.metadata ? JSON.parse(game.metadata) : null;

            // Combine everything
            const fullGameData = {
                ...enrichedGame,
                metadata,
                root_folder_name: game.root_folder_name
            };

            res.json(fullGameData);
        } catch (error) {
            logger.error('Error processing game data:', error);
            res.status(500).json({ error: 'Failed to process game data' });
        }
    });
});

// Delete game
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { deleteFiles } = req.body;

    try {
        // Get game details first
        const game = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM games WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Delete files if requested
        if (deleteFiles && game.destination_path) {
            try {
                await fs.remove(game.destination_path);
                logger.info(`Deleted files at: ${game.destination_path}`);
            } catch (error) {
                logger.error(`Error deleting files: ${error.message}`);
                // Don't return here - continue with database deletion
            }
        }

        // Delete from database
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM games WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.json({ 
            message: 'Game deleted successfully',
            deletedFiles: deleteFiles && game.destination_path ? true : false
        });

    } catch (error) {
        logger.error('Error deleting game:', error);
        res.status(500).json({ error: 'Failed to delete game' });
    }
});

// Check path exists (for FileLocationInfo component)
router.get('/check-path', (req, res) => {
    const { path: gamePath } = req.query;

    if (!gamePath) {
        return res.status(400).json({ error: 'Path is required' });
    }

    try {
        const exists = fs.existsSync(gamePath);
        res.json({ exists });
    } catch (error) {
        console.error('Error checking path:', error);
        res.status(500).json({ error: 'Failed to check path' });
    }
});

router.get('/:id/version', (req, res) => {
    const { id } = req.params;
    
    // First get the game to find its path
    db.get('SELECT destination_path FROM games WHERE id = ?', [id], (err, game) => {
        if (err) {
            logger.error('Error fetching game:', err);
            return res.status(500).json({ error: 'Failed to fetch game' });
        }
        
        if (!game || !game.destination_path) {
            return res.status(404).json({ error: 'Game or path not found' });
        }

        try {
            const subfolders = fs.readdirSync(game.destination_path)
                .filter(item => {
                    const itemPath = path.join(game.destination_path, item);
                    return fs.statSync(itemPath).isDirectory();
                });

            // Extract version numbers from subfolder names
            const versions = subfolders
                .map(folder => {
                    const match = folder.match(/^v?(\d+\.\d+\.\d+\.\d+)/);
                    return match ? {
                        folder,
                        version: match[1],
                        path: path.join(game.destination_path, folder)
                    } : null;
                })
                .filter(Boolean)
                .sort((a, b) => {
                    return b.version.localeCompare(a.version, undefined, 
                        { numeric: true, sensitivity: 'base' });
                });

            if (versions.length > 0) {
                res.json({
                    version: versions[0].version,
                    path: versions[0].path,
                    allVersions: versions.map(v => ({
                        version: v.version,
                        path: v.path
                    }))
                });
            } else {
                res.json({ version: null, allVersions: [] });
            }
        } catch (error) {
            logger.error('Error reading game directory:', error);
            res.status(500).json({ error: 'Failed to read game directory' });
        }
    });
});

// Force scan game directory
router.post('/:id/scan', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the game details
        const game = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM games WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                if (!row) reject(new Error('Game not found'));
                resolve(row);
            });
        });

        // Re-scan the game directory and get enriched data
        const enrichedGame = await enrichGameWithVersions(game);

        // Update the database with the latest version and status
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE games SET latest_version = ?, status = ? WHERE id = ?`,
                [enrichedGame.latestVersion, enrichedGame.status, id],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        // Return the enriched game data
        res.json(enrichedGame);
    } catch (error) {
        logger.error('Error scanning game directory:', error);
        // Return a 404 if the game wasn't found, otherwise 500
        const statusCode = error.message === 'Game not found' ? 404 : 500;
        const errorMessage = error.message === 'Game not found' 
            ? 'Game not found' 
            : 'Failed to scan game directory';
        
        if (!res.headersSent) {
            res.status(statusCode).json({ 
                error: errorMessage,
                status: 'error'
            });
        }
    }
});

// Force search (TODO)
router.post('/:id/search', (req, res) => {
    // Implement force search functionality
});

// Download (TODO)
router.post('/:id/download', (req, res) => {
    // Implement download functionality
});

module.exports = router;