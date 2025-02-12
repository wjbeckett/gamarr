const paths = require('../config/paths');
const logger = require('../config/logger');
const taskQueue = require('./queue');
const TaskService = require('../services/taskService');
const fs = require('fs').promises;
const { normalizeDownloadPath } = require('../utils/helpers');

class Monitor {
    constructor() {
        this.downloadPath = paths.downloadsDir;
        this.processedPaths = new Set();
    }

    async checkPath(inputPath) {
        try {
            if (!inputPath) {
                throw new Error('Input path is required');
            }

            const normalizedPath = normalizeDownloadPath(inputPath);
            
            try {
                await fs.access(normalizedPath);
            } catch (error) {
                throw new Error(`Path does not exist: ${normalizedPath}`);
            }

            if (this.processedPaths.has(normalizedPath)) {
                logger.info(`Path already processed: ${normalizedPath}`);
                return;
            }

            // Check if task already exists
            const existingTask = await TaskService.findTaskByPath(normalizedPath);
            if (existingTask) {
                if (['processing', 'queued'].includes(existingTask.status)) {
                    logger.info(`Task already exists for path: ${normalizedPath}`);
                    return existingTask;
                }
            }

            // Add to queue for processing
            await taskQueue.addTask('process', { path: normalizedPath });
            this.processedPaths.add(normalizedPath);

        } catch (error) {
            logger.error('Failed to process path:', error);
            throw error;
        }
    }

    async updateProgress(taskId, progress, status = null) {
        try {
            if (status) {
                await TaskService.updateTask(taskId, status, progress);
            } else {
                await TaskService.updateProgress(taskId, progress);
            }
            logger.debug(`Updated task ${taskId} progress: ${progress}%`);
        } catch (error) {
            logger.error(`Failed to update task ${taskId} progress:`, error);
        }
    }

    /**
     * Clear processed paths cache
     */
    clearProcessedPaths() {
        this.processedPaths.clear();
        logger.info('Cleared processed paths cache');
    }

    /**
     * Get all currently processing tasks
     * @returns {Promise<Array>}
     */
    async getProcessingTasks() {
        try {
            return await TaskService.getTasksByStatus('processing');
        } catch (error) {
            logger.error('Failed to get processing tasks:', error);
            return [];
        }
    }

    /**
     * Cancel a task in progress
     * @param {number} taskId - The task ID to cancel
     */
    async cancelTask(taskId) {
        try {
            const task = await TaskService.getTaskById(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }

            if (task.status === 'completed' || task.status === 'failed') {
                throw new Error(`Cannot cancel task ${taskId} in status: ${task.status}`);
            }

            await TaskService.updateTask(taskId, 'cancelled', task.progress);
            logger.info(`Cancelled task ${taskId}`);

            // Remove from processed paths if present
            this.processedPaths.delete(task.path);

        } catch (error) {
            logger.error(`Failed to cancel task ${taskId}:`, error);
            throw error;
        }
    }
}

// Export a singleton instance
module.exports = new Monitor();