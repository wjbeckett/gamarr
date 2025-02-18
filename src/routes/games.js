const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../config/logger');
const fs = require('fs-extra');
const path = require('path');
const { validateGameJson } = require('../utils/validateJson');
const uiFileManager = require('../services/uiFileManager');


router.get('/nfo', async (req, res) => {
    const { path: nfoPath } = req.query;
    
    try {
        const nfoContent = await uiFileManager.fetchNfoContent(nfoPath);
        const parsedContent = uiFileManager.parseNfoContent(nfoContent);
        res.json({
            raw: nfoContent,
            parsed: parsedContent
        });
    } catch (error) {
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
            // Ensure metadata is always valid JSON
            const metadata = game.metadata ? JSON.parse(game.metadata) : null;

            // Check if the destination path exists
            let status = 'missing';
            let allVersions = [];
            let latestVersion = null;

            if (game.destination_path && fs.existsSync(game.destination_path)) {
                try {
                    // Discover subfolders in the destination path
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
                        status = 'completed'; // Update status to 'completed' if versions are found
                    } else {
                        status = 'pending'; // Path exists but no version folders found
                    }
                } catch (error) {
                    logger.error(`Error reading versions for game ${game.name}:`, error);
                    status = 'error';
                }
            }

            const enrichedGame = {
                ...game,
                metadata, // Send already parsed metadata
                status,   // Add the status field
                allVersions, // Add discovered versions
                latestVersion // Add the latest version
            };

            res.json(enrichedGame);
        } catch (error) {
            logger.error('Error parsing metadata:', error);
            res.status(500).json({ error: 'Invalid game data format' });
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

// Force search (TODO)
router.post('/:id/search', (req, res) => {
    // Implement force search functionality
});

// Download (TODO)
router.post('/:id/download', (req, res) => {
    // Implement download functionality
});

module.exports = router;