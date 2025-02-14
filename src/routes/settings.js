const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../config/logger');
const fs = require('fs-extra');
const diskusage = require('diskusage');

// Get all general settings
router.get('/general', (req, res) => {
    db.all('SELECT * FROM general_settings ORDER BY key', [], (err, rows) => {
        if (err) {
            logger.error('Failed to fetch general settings:', err);
            return res.status(500).json({ error: 'Failed to fetch general settings' });
        }
        res.json(rows);
    });
});

// Update or create a general setting
router.post('/general', (req, res) => {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
    }

    db.run(`
        INSERT INTO general_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `, [key, value], (err) => {
        if (err) {
            logger.error('Failed to update general setting:', err);
            return res.status(500).json({ error: 'Failed to update setting' });
        }
        res.json({ message: 'Setting updated successfully' });
    });
});

// Get all indexers
router.get('/indexers', (req, res) => {
    db.all('SELECT * FROM indexers ORDER BY name', [], (err, rows) => {
        if (err) {
            logger.error('Failed to fetch indexers:', err);
            return res.status(500).json({ error: 'Failed to fetch indexers' });
        }
        res.json(rows);
    });
});

// Add a new indexer
router.post('/indexers', (req, res) => {
    const { name, url, api_key } = req.body;
    
    if (!name || !url || !api_key) {
        return res.status(400).json({ error: 'Name, URL, and API key are required' });
    }

    db.run(`
        INSERT INTO indexers (name, url, api_key)
        VALUES (?, ?, ?)
    `, [name, url, api_key], function(err) {
        if (err) {
            logger.error('Failed to add indexer:', err);
            return res.status(500).json({ error: 'Failed to add indexer' });
        }
        res.status(201).json({
            id: this.lastID,
            name,
            url,
            api_key,
            message: 'Indexer added successfully',
        });
    });
});

// Update an indexer
router.put('/indexers/:id', (req, res) => {
    const { name, url, api_key } = req.body;
    const { id } = req.params;

    if (!name || !url || !api_key) {
        return res.status(400).json({ error: 'Name, URL, and API key are required' });
    }

    db.run(`
        UPDATE indexers 
        SET name = ?, url = ?, api_key = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [name, url, api_key, id], function(err) {
        if (err) {
            logger.error('Failed to update indexer:', err);
            return res.status(500).json({ error: 'Failed to update indexer' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Indexer not found' });
        }
        res.json({ message: 'Indexer updated successfully' });
    });
});

// Delete an indexer
router.delete('/indexers/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM indexers WHERE id = ?', [id], function(err) {
        if (err) {
            logger.error('Failed to delete indexer:', err);
            return res.status(500).json({ error: 'Failed to delete indexer' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Indexer not found' });
        }
        res.json({ message: 'Indexer deleted successfully' });
    });
});

// Get all download clients
router.get('/download-clients', (req, res) => {
    db.all('SELECT * FROM download_clients ORDER BY name', [], (err, rows) => {
        if (err) {
            logger.error('Failed to fetch download clients:', err);
            return res.status(500).json({ error: 'Failed to fetch download clients' });
        }
        res.json(rows);
    });
});

// Add a new download client
router.post('/download-clients', (req, res) => {
    const { name, type, url, username, password, api_key, category } = req.body;
    
    if (!name || !type || !url) {
        return res.status(400).json({ error: 'Name, type, and URL are required' });
    }

    db.run(`
        INSERT INTO download_clients (name, type, url, username, password, api_key, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, type, url, username, password, api_key, category], function(err) {
        if (err) {
            logger.error('Failed to add download client:', err);
            return res.status(500).json({ error: 'Failed to add download client' });
        }
        res.status(201).json({ 
            id: this.lastID,
            message: 'Download client added successfully' 
        });
    });
});

// Update a download client
router.put('/download-clients/:id', (req, res) => {
    const { name, type, url, username, password, api_key, category } = req.body;
    const { id } = req.params;

    if (!name || !type || !url) {
        return res.status(400).json({ error: 'Name, type, and URL are required' });
    }

    db.run(`
        UPDATE download_clients 
        SET name = ?, type = ?, url = ?, username = ?, password = ?, 
            api_key = ?, category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [name, type, url, username, password, api_key, category, id], function(err) {
        if (err) {
            logger.error('Failed to update download client:', err);
            return res.status(500).json({ error: 'Failed to update download client' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Download client not found' });
        }
        res.json({ message: 'Download client updated successfully' });
    });
});

// Delete a download client
router.delete('/download-clients/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM download_clients WHERE id = ?', [id], function(err) {
        if (err) {
            logger.error('Failed to delete download client:', err);
            return res.status(500).json({ error: 'Failed to delete download client' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Download client not found' });
        }
        res.json({ message: 'Download client deleted successfully' });
    });
});

// Get all library locations
router.get('/library-locations', (req, res) => {
    db.all('SELECT * FROM library_locations ORDER BY name', [], (err, rows) => {
        if (err) {
            logger.error('Failed to fetch library locations:', err);
            return res.status(500).json({ error: 'Failed to fetch library locations' });
        }
        res.json(rows);
    });
});

// Add a new library location
router.post('/library-locations', (req, res) => {
    const { name, path } = req.body;

    if (!name || !path) {
        return res.status(400).json({ error: 'Name and path are required' });
    }

    db.run(`
        INSERT INTO library_locations (name, path)
        VALUES (?, ?)
    `, [name, path], function(err) {
        if (err) {
            logger.error('Failed to add library location:', err);
            return res.status(500).json({ error: 'Failed to add library location' });
        }
        res.status(201).json({
            id: this.lastID,
            message: 'Library location added successfully',
        });
    });
});

// Delete a library location
router.delete('/library-locations/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM library_locations WHERE id = ?', [id], function(err) {
        if (err) {
            logger.error('Failed to delete library location:', err);
            return res.status(500).json({ error: 'Failed to delete library location' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Library location not found' });
        }
        res.json({ message: 'Library location deleted successfully' });
    });
});

// Get all root folders
router.get('/root-folders', async (req, res) => {
    try {
        const rows = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM root_folders ORDER BY path', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Add free space information to each folder
        const foldersWithSpace = await Promise.all(rows.map(async (folder) => {
            try {
                const usage = await diskusage.check(folder.path);
                // Convert bytes to GB
                const freeSpace = Math.floor(usage.free / (1024 * 1024 * 1024));
                return {
                    ...folder,
                    free_space: freeSpace
                };
            } catch (error) {
                logger.error(`Error getting disk space for ${folder.path}:`, error);
                return {
                    ...folder,
                    free_space: null
                };
            }
        }));

        res.json(foldersWithSpace);
    } catch (error) {
        logger.error('Failed to fetch root folders:', error);
        res.status(500).json({ error: 'Failed to fetch root folders' });
    }
});

// Add a new root folder
router.post('/root-folders', (req, res) => {
    const { path } = req.body;
    
    if (!path) {
        return res.status(400).json({ error: 'Path is required' });
    }

    db.run(`
        INSERT INTO root_folders (path)
        VALUES (?)
    `, [path], function(err) {
        if (err) {
            logger.error('Failed to add root folder:', err);
            return res.status(500).json({ error: 'Failed to add root folder' });
        }
        res.status(201).json({
            id: this.lastID,
            path,
            message: 'Root folder added successfully',
        });
    });
});

// Delete a root folder
router.delete('/root-folders/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM root_folders WHERE id = ?', [id], function(err) {
        if (err) {
            logger.error('Failed to delete root folder:', err);
            return res.status(500).json({ error: 'Failed to delete root folder' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Root folder not found' });
        }
        res.json({ message: 'Root folder deleted successfully' });
    });
});

module.exports = router;