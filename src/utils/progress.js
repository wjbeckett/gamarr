const logger = require('../config/logger');

class ProgressTracker {
    constructor() {
        this.progress = {};
    }

    start(taskId, totalSteps) {
        this.progress[taskId] = {
            currentStep: 0,
            totalSteps,
            startTime: Date.now()
        };
        logger.info(`Started progress tracking for task: ${taskId}`);
    }

    update(taskId, step) {
        if (!this.progress[taskId]) {
            logger.warn(`No progress tracking found for task: ${taskId}`);
            this.start(taskId, 100); // Initialize progress tracking if missing
        }

        this.progress[taskId].currentStep = step;
        const { currentStep, totalSteps } = this.progress[taskId];
        const percentage = Math.round((currentStep / totalSteps) * 100);

        logger.info(`Task ${taskId} progress: ${percentage}% (${currentStep}/${totalSteps})`);
    }

    complete(taskId) {
        if (!this.progress[taskId]) {
            logger.warn(`No progress tracking found for task: ${taskId}`);
            return;
        }

        const { startTime } = this.progress[taskId];
        const duration = Date.now() - startTime;

        logger.info(`Task ${taskId} completed in ${duration}ms`);
        delete this.progress[taskId];
    }
}

module.exports = new ProgressTracker();