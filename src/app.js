const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./config/logger');
const TaskService = require('./services/taskService');
const Monitor = require('./tasks/monitor');
const { normalizeDownloadPath } = require('./utils/helpers');
const path = require('path');
const app = express();
//const MetadataService = require('./services/metadataService');
const { searchGameName } = require('./utils/gameSearch');

// Add body-parser middleware to parse JSON requests
app.use(bodyParser.json());

app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ 
                error: 'Search query is required' 
            });
        }

        logger.info(`Searching for game: ${query}`);
        
        // Use your existing game search functionality
        const results = await searchGameName(query);
        
        res.json({
            success: true,
            results
        });
    } catch (error) {
        logger.error('Game search failed:', error);
        res.status(500).json({ 
            error: 'Failed to search for games',
            details: error.message 
        });
    }
});

// API Routes
app.post('/api/games', async (req, res) => {
    try {
        const { name, release_date, description, destination_path } = req.body;

        if (!name || !destination_path) {
            return res.status(400).json({ error: 'Name and destination path are required.' });
        }

        const query = `
            INSERT INTO games (name, release_date, description, destination_path, status)
            VALUES (?, ?, ?, ?, 'new')
        `;
        db.run(query, [name, release_date, description, destination_path], function (err) {
            if (err) {
                logger.error('Failed to add game to library:', err);
                return res.status(500).json({ error: 'Failed to add game to library.' });
            }

            res.json({ id: this.lastID, name, release_date, description, destination_path, status: 'new' });
        });
    } catch (error) {
        logger.error('Error adding game to library:', error);
        res.status(500).json({ error: 'Internal server error.' });
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
