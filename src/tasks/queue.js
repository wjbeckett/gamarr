const Queue = require('better-queue');
const logger = require('../config/logger');
const { processDownload } = require('./processDownload');
const TaskService = require('../services/taskService');
const { normalizeDownloadPath } = require('../utils/helpers');

class TaskQueue {
    constructor() {
        this.queue = new Queue(async (task, cb) => {
            try {
                await this.processTask(task);
                cb(null, task);
            } catch (error) {
                logger.error('Task processing failed:', error);
                cb(error);
            }
        }, {
            concurrent: 1,
            maxRetries: 3,
            retryDelay: 1000,
        });

        this.queue.on('task_finish', (taskId, result, stats) => {
            logger.info(`Task ${taskId} completed in ${stats.elapsed}ms`);
        });

        this.queue.on('task_failed', (taskId, err, stats) => {
            logger.error(`Task ${taskId} failed after ${stats.elapsed}ms:`, err);
        });
    }

    async processTask(task) {
        const normalizedPath = normalizeDownloadPath(task.data.path);
        logger.debug(`Processing task for normalized path: ${normalizedPath}`);
        
        // Check if a task already exists for this path
        let taskRecord = await TaskService.findTaskByPath(normalizedPath);
        if (taskRecord) {
            if (['processing', 'queued'].includes(taskRecord.status)) {
                logger.warn(`Task already exists for path: ${normalizedPath} with status: ${taskRecord.status}`);
                return taskRecord; // Return the existing in-progress task
            } else if (taskRecord.status === 'completed') {
                logger.info(`Task ${taskRecord.id} for path: ${normalizedPath} is already completed`);
                return taskRecord; // Return the completed task
            } else {
                logger.info(`Reprocessing existing task ${taskRecord.id} for path: ${normalizedPath}`);
                await TaskService.updateTaskStatus(taskRecord.id, 'processing');
            }
        } else {
            // Create a new task if no existing task is found
            taskRecord = await TaskService.createTask(normalizedPath);
            logger.info(`Created new task ${taskRecord.id} for path: ${normalizedPath}`);
            await TaskService.updateTaskStatus(taskRecord.id, 'processing');
        }
        
        try {
            await processDownload(normalizedPath);
            await TaskService.updateTaskStatus(taskRecord.id, 'completed');
            return taskRecord;
        } catch (error) {
            await TaskService.updateTaskStatus(taskRecord.id, 'failed', error.message);
            throw error;
        }
    }

    async addTask(type, data) {
        logger.debug(`Adding task of type ${type}:`, data);
        
        return new Promise((resolve, reject) => {
            this.queue.push({ type, data }, (err, result) => {
                if (err) {
                    logger.error(`Failed to add task of type ${type}:`, err);
                    reject(err);
                } else {
                    logger.debug(`Successfully added task of type ${type}`);
                    resolve(result);
                }
            });
        });
    }

    getStats() {
        return {
            total: this.queue.length,
            running: this.queue.running,
            pending: this.queue.pending,
        };
    }
}

module.exports = new TaskQueue();