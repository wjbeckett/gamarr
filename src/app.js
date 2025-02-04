// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./config/logger');
const TaskService = require('./services/taskService');
const Monitor = require('./tasks/monitor');
const { normalizeDownloadPath } = require('./utils/helpers');

const app = express();

// Add body-parser middleware to parse JSON requests
app.use(bodyParser.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;