const path = require('path');
const logger = require('../config/logger');
const metadataService = require('../services/metadata');
const extractionService = require('../services/extraction');
const fileManager = require('../services/fileManager');
const progressTracker = require('../utils/progress');
const TaskService = require('../services/taskService');
const { tempDir, downloadsDir } = require('../config/paths');
const { normalizeDownloadPath } = require('../utils/helpers');

function extractGameNameAndVersion(downloadPath) {
    const folderName = path.basename(downloadPath);
    logger.debug(`Extracting game name and version from: ${folderName}`);

    const patterns = {
        version: /v\d+(\.\d+)*/,
        releaseGroup: /-([A-Za-z0-9_]+)$/,
        commonSuffixes: /-(CODEX|PLAZA|RELOADED|GOG|SKIDROW|RAZOR1911|DODI|FLT|HOODLUM|PROPHET|TiNYiSO)$/i,
        sizes: /\b\d+(\.\d+)?(MB|GB|TB)\b/i,
        indicators: /\b(PROPER|REPACK|MULTI\d*|UPDATE|PATCH|DLC|COMPLETE)\b/i
    };

    let cleanName = folderName;
    const versionMatch = cleanName.match(patterns.version);
    const version = versionMatch ? versionMatch[0] : 'unknown';
    cleanName = cleanName.replace(patterns.version, '');

    cleanName = cleanName
        .replace(patterns.commonSuffixes, '')
        .replace(patterns.releaseGroup, '')
        .replace(patterns.sizes, '')
        .replace(patterns.indicators, '')
        .replace(/\./g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    logger.debug(`Extracted name: "${cleanName}", version: "${version}"`);
    return { gameName: cleanName, version };
}

async function processDownload(downloadPath) {
    const normalizedPath = normalizeDownloadPath(downloadPath);
    logger.debug(`Normalized download path: ${normalizedPath}`);

    // Get the existing task
    const task = await TaskService.findTaskByPath(normalizedPath);
    if (!task) {
        throw new Error(`No task found for path: ${normalizedPath}`);
    }
    const taskId = task.id;

    // Check if task is already completed
    if (task.status === 'completed') {
        logger.info(`Task ${taskId} for path: ${normalizedPath} is already completed`);
        return { message: 'Task already completed', taskId };
    }

    // Initialize progress tracking
    progressTracker.start(taskId, 100); // Assuming 100 steps for simplicity

    // If the task is already processing or queued, log a warning but continue processing
    if (task.status === 'processing' || task.status === 'queued') {
        logger.warn(`Task ${taskId} is already being processed or queued. Continuing processing...`);
    } else {
        // Update the task status to 'processing'
        logger.info(`Started processing task: ${taskId} for path: ${normalizedPath}`);
        await TaskService.updateTaskStatus(taskId, 'processing');
    }

    try {
        // Perform processing steps
        const { gameName, version } = extractGameNameAndVersion(path.basename(normalizedPath));
        logger.info(`Extracted game name: "${gameName}", version: "${version}"`);
        await TaskService.updateProgress(taskId, 10);
        progressTracker.update(taskId, 10);

        const metadata = await metadataService.searchGameName(gameName);
        if (!metadata) {
            logger.warn(`No metadata found for game: ${gameName}`);
        } else {
            logger.info(`Found metadata: ${JSON.stringify(metadata)}`);
        }
        await TaskService.updateProgress(taskId, 20);
        progressTracker.update(taskId, 20);

        const extractPath = path.join(tempDir, taskId.toString());
        const extracted = await extractionService.extractArchives(
            normalizedPath,
            extractPath,
            taskId,
            async (progress) => {
                const mappedProgress = 20 + (progress * 0.6);
                const roundedProgress = Math.round(mappedProgress);
                await TaskService.updateProgress(taskId, roundedProgress);
                progressTracker.update(taskId, roundedProgress);
            }
        );

        if (!extracted) {
            logger.info('No archives found to extract, treating download path as the source');
            await fileManager.copyFiles(normalizedPath, extractPath);
        }

        const finalPath = await fileManager.moveFiles(extractPath, gameName, version);
        await TaskService.updateProgress(taskId, 90);
        progressTracker.update(taskId, 90);

        await fileManager.cleanUpTempDir(extractPath);
        await TaskService.updateProgress(taskId, 100);
        progressTracker.update(taskId, 100);

        logger.info(`Download processed successfully: ${finalPath}`);
        await TaskService.updateTaskStatus(taskId, 'completed');
        logger.info(`Task ${taskId} completed successfully`);
        return { message: 'Processing completed', taskId };
    } catch (error) {
        logger.error(`Error processing task ${taskId}:`, error);
        await TaskService.updateTaskStatus(taskId, 'failed', error.message);
        throw error;
    } finally {
        progressTracker.complete(taskId); // Clean up progress tracking
    }
}

module.exports = { processDownload };