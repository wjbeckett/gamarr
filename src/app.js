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

// Add body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// POST endpoint to search for games
app.post('/api/search', async (req, res) => {
    const { query } = req.body;

    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const results = await metadataService.searchGameName(query);
        logger.debug('Search results being sent to client:', results); // Add this log
        res.json(results);
    } catch (error) {
        logger.error('Error searching for games:', error);
        res.status(500).json({ error: 'Failed to search for games' });
    }
});

// API endpoint to fetch all games
app.get('/api/games', async (req, res) => {
    try {
        db.all(`
            SELECT 
                id,
                name,
                release_date,
                description,
                destination_path,
                status,
                cover_url,
                created_at,
                updated_at
            FROM games
            ORDER BY created_at DESC
        `, [], (err, rows) => {
            if (err) {
                logger.error('Failed to fetch games:', err);
                return res.status(500).json({ error: 'Failed to fetch games' });
            }
            res.json(rows);
        });
    } catch (error) {
        logger.error('Error fetching games:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST endpoint to add a game to the library
app.post('/api/games', async (req, res) => {
    const { name, release_date, description, destination_path, status, cover_url } = req.body;

    if (!name || !destination_path) {
        return res.status(400).json({ error: 'Name and destination path are required' });
    }

    try {
        const query = `
            INSERT INTO games (name, release_date, description, destination_path, status, cover_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.run(query, [name, release_date, description, destination_path, status || 'new', cover_url]);
        res.status(201).json({ message: 'Game added successfully' });
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
            return res.status(400).json({ 
                error: 'Path is required in request body' 
            });
        }

        const normalizedPath = normalizeDownloadPath(inputPath);
        const task = await TaskService.createTask(normalizedPath);
        
        Monitor.checkPath(normalizedPath);  // Pass normalized path
        
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
