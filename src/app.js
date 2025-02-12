const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./config/logger');
const TaskService = require('./services/taskService');
const Monitor = require('./tasks/monitor');
const { normalizeDownloadPath } = require('./utils/helpers');
const path = require('path');
const db = require('./db');
const metadataService = require('./services/metadata');
const app = express();
const fs = require('fs');
const settingsRouter = require('./routes/settings');
const gamesRouter = require('./routes/games');

// Add body-parser middleware to parse JSON requests
app.use(bodyParser.json());

app.use('/api/settings', settingsRouter);
app.use('/api/games', gamesRouter);

// POST endpoint to search for games
app.post('/api/search', async (req, res) => {
    const { query } = req.body;

    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const results = await metadataService.searchGameName(query);
        logger.debug('Search results being sent to client:', results);
        res.json(results);
    } catch (error) {
        logger.error('Error searching for games:', error);
        res.status(500).json({ error: 'Failed to search for games' });
    }
});

// API endpoint to fetch a specific game by ID
app.get('/api/games/:id', async (req, res) => {
    try {
        const { id } = req.params;

        db.get(`
            SELECT 
                games.id,
                games.name,
                games.release_date,
                games.description,
                games.destination_path,
                games.status,
                games.cover_url,
                library_locations.name AS library_name,
                library_locations.path AS library_path,
                games.created_at,
                games.updated_at
            FROM games
            LEFT JOIN library_locations ON games.library_location_id = library_locations.id
            WHERE games.id = ?
        `, [id], (err, row) => {
            if (err) {
                logger.error('Failed to fetch game:', err);
                return res.status(500).json({ error: 'Failed to fetch game' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Game not found' });
            }

            res.json(row);
        });
    } catch (error) {
        logger.error('Error fetching game:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// API endpoint to fetch all games
app.get('/api/games', (req, res) => {
    db.all(`
        SELECT 
            games.id,
            games.name,
            games.release_date,
            games.description,
            games.status,
            games.cover_url,
            games.destination_path,
            root_folders.path AS library_path
        FROM games
        LEFT JOIN root_folders ON games.root_folder_id = root_folders.id
        ORDER BY games.name
    `, (err, rows) => {
        if (err) {
            logger.error('Failed to fetch games:', err);
            return res.status(500).json({ error: 'Failed to fetch games' });
        }
        res.json(rows);
    });
});

// API endpoint to check if a path exists
app.get('/api/games/check-path', (req, res) => {
    const { path } = req.query;
    if (!path) {
        return res.status(400).json({ error: 'Path is required' });
    }

    fs.access(path, fs.constants.F_OK, (err) => {
        res.json({ exists: !err });
    });
});

// Get configured library locations
app.get('/api/settings/library-locations', (req, res) => {
    db.all('SELECT * FROM library_locations ORDER BY name', [], (err, rows) => {
        if (err) {
            logger.error('Failed to fetch library locations:', err);
            return res.status(500).json({ error: 'Failed to fetch library locations' });
        }
        res.json(rows);
    });
});

// POST endpoint to add a game to the library
app.post('/api/games', async (req, res) => {
    const { name, release_date, description, destination_path, status, cover_url, root_folder_id } = req.body;

    // Validate required fields
    if (!name || !destination_path || !root_folder_id) {
        return res.status(400).json({ error: 'Name, Destination Path, and Library Location are required' });
    }

    try {
        const query = `
            INSERT INTO games (name, release_date, description, destination_path, status, cover_url, root_folder_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [name, release_date, description, destination_path, status || 'new', cover_url, root_folder_id], function (err) {
            if (err) {
                logger.error('Failed to add game:', err);
                return res.status(500).json({ error: 'Failed to add game' });
            }
            res.status(201).json({ id: this.lastID, message: 'Game added successfully' });
        });
    } catch (error) {
        logger.error('Failed to add game:', error);
        res.status(500).json({ error: 'Failed to add game' });
    }
});

// API endpoint to process a path
app.post('/api/process', async (req, res) => {
    try {
        const { path: inputPath } = req.body;

        if (!inputPath) {
            return res.status(400).json({ error: 'Path is required in request body' });
        }

        const normalizedPath = normalizeDownloadPath(inputPath);
        const task = await TaskService.createTask(normalizedPath);

        Monitor.checkPath(normalizedPath);

        res.json({
            message: 'Processing started',
            taskId: task.id,
            path: normalizedPath
        });
    } catch (error) {
        logger.error('Failed to start processing:', error);
        res.status(500).json({
            error: 'Failed to start processing',
            details: error.message
        });
    }
});

// API endpoint to get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const status = req.query.status;
        let tasks;

        if (status) {
            tasks = await TaskService.getTasksByStatus(status);
        } else {
            tasks = await TaskService.getAllTasks();
        }

        res.json(tasks);
    } catch (error) {
        logger.error('Failed to fetch tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// API endpoint to get a specific task
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const task = await TaskService.getTaskById(req.params.id);
        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch task:', error);
        res.status(500).json({
            error: 'Failed to fetch task',
            details: error.message
        });
    }
});

// API endpoint to get task progress
app.get('/api/tasks/:id/progress', async (req, res) => {
    try {
        const progress = await TaskService.getTaskProgress(req.params.id);
        res.json({ progress });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Serve static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001; // Use a different port for the backend
app.listen(PORT, () => {
    logger.info(`Backend server is running on port ${PORT}`);
});

module.exports = app;