// src/services/taskService.js
const db = require('../db');
const logger = require('../config/logger');
const path = require('path');
const { normalizeDownloadPath } = require('../utils/helpers');

class TaskService {
    static async createTask(inputPath) {
        const normalizedPath = normalizeDownloadPath(inputPath);
        logger.debug(`Attempting to create task for normalized path: ${normalizedPath}`);
        
        return new Promise((resolve, reject) => {
            // Check if a task for the same normalized path already exists
            const checkQuery = `SELECT * FROM tasks WHERE path = ? ORDER BY created_at DESC LIMIT 1`;
            db.get(checkQuery, [normalizedPath], (err, row) => {
                if (err) {
                    logger.error('Failed to check for existing task:', err);
                    reject(err);
                } else if (row) {
                    if (['new', 'processing', 'queued'].includes(row.status)) {
                        logger.warn(`Active task already exists for path: ${normalizedPath} with status: ${row.status}`);
                        resolve(row); // Return the existing active task
                    } else if (row.status === 'completed') {
                        logger.info(`Path already processed: ${normalizedPath}`);
                        resolve(row); // Return the completed task
                    } else {
                        // Handle other statuses if needed
                        logger.warn(`Task for path ${normalizedPath} exists with unexpected status: ${row.status}`);
                        resolve(row);
                    }
                } else {
                    // If no task exists, create a new one
                    const query = `INSERT INTO tasks (path, status, progress) VALUES (?, 'new', 0)`;
                    db.run(query, [normalizedPath], function(err) {
                        if (err) {
                            logger.error('Failed to create task:', err);
                            reject(err);
                        } else {
                            logger.debug(`Task created with ID: ${this.lastID}`);
                            resolve({ id: this.lastID, path: normalizedPath, status: 'new', progress: 0 });
                        }
                    });
                }
            });
        });
    }

    static async updateTask(id, status, progress, error = null) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE tasks 
                SET status = ?, 
                    progress = ?, 
                    error = ?,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            db.run(query, [status, progress, error, id], function(err) {
                if (err) {
                    logger.error(`Failed to update task ${id}:`, err);
                    reject(err);
                } else {
                    logger.debug(`Updated task ${id}: status=${status}, progress=${progress}`);
                    resolve();
                }
            });
        });
    }

    static async findTaskByPath(path) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM tasks WHERE path = ? ORDER BY created_at DESC LIMIT 1`;
            db.get(query, [path], (err, row) => {
                if (err) {
                    logger.error('Failed to find task by path:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
    
    static async updateTaskStatus(taskId, status, error = null) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE tasks SET status = ?, error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            db.run(query, [status, error, taskId], function(err) {
                if (err) {
                    logger.error(`Failed to update status for task ${taskId}:`, err);
                    reject(err);
                } else {
                    logger.debug(`Status updated for task ${taskId}: ${status}`);
                    resolve(this.changes > 0);
                }
            });
        });
    }

    static async updateProgress(taskId, progress) {
        logger.debug(`Attempting to update progress for task ${taskId} to ${progress}%`);
        return new Promise((resolve, reject) => {
            const query = `UPDATE tasks SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            db.run(query, [progress, taskId], function(err) {
                if (err) {
                    logger.error(`Failed to update progress for task ${taskId}:`, err);
                    reject(err);
                } else if (this.changes === 0) {
                    logger.warn(`No rows updated for task ${taskId}. Task may not exist.`);
                    resolve(false);
                } else {
                    logger.debug(`Progress updated for task ${taskId}: ${progress}%`);
                    resolve(true);
                }
            });
        });
    }

    static async getTaskById(id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM tasks WHERE id = ?`;
            db.get(query, [id], (err, row) => {
                if (err) {
                    logger.error(`Failed to get task ${id}:`, err);
                    reject(err);
                } else {
                    logger.debug(`Retrieved task ${id}:`, row);
                    resolve(row);
                }
            });
        });
    }

    static async getTaskProgress(id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT progress FROM tasks WHERE id = ?`;
            db.get(query, [id], (err, row) => {
                if (err) {
                    logger.error(`Failed to get progress for task ${id}:`, err);
                    reject(err);
                } else {
                    const progress = row ? row.progress : 0;
                    logger.debug(`Retrieved progress for task ${id}: ${progress}%`);
                    resolve(progress);
                }
            });
        });
    }

    static async getTasksByStatus(status) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM tasks WHERE status = ?`;
            db.all(query, [status], (err, rows) => {
                if (err) {
                    logger.error(`Failed to get tasks with status ${status}:`, err);
                    reject(err);
                } else {
                    logger.debug(`Retrieved ${rows.length} tasks with status ${status}`);
                    resolve(rows);
                }
            });
        });
    }

    static async getAllTasks() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM tasks ORDER BY created_at DESC`;
            db.all(query, [], (err, rows) => {
                if (err) {
                    logger.error('Failed to get all tasks:', err);
                    reject(err);
                } else {
                    logger.debug(`Retrieved ${rows.length} tasks`);
                    resolve(rows);
                }
            });
        });
    }

    static async getNextQueuedTask() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM tasks WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`;
            db.get(query, (err, row) => {
                if (err) {
                    logger.error('Failed to fetch next queued task:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = TaskService;