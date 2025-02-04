const { exec } = require('child_process');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const logger = require('../config/logger');
const TaskService = require('./taskService');

class ExtractionService {
    calculateTaskProgress(stage, currentProgress) {
        // Define stage weights
        const weights = {
            rar: 0.7,    // RAR extraction is 70% of total progress
            iso: 0.3     // ISO extraction is 30% of total progress
        };

        switch (stage) {
            case 'rar':
                return Math.round(currentProgress * weights.rar);
            case 'iso':
                // ISO progress starts after RAR is complete
                return Math.round(70 + (currentProgress * weights.iso));
            default:
                return 0;
        }
    }

    async findArchiveFiles(directoryPath) {
        try {
            const files = await fs.readdir(directoryPath);
            const archives = {
                rars: files.filter(file => file.toLowerCase().endsWith('.rar')),
                isos: files.filter(file => file.toLowerCase().endsWith('.iso'))
            };

            logger.debug(`Found archives in ${directoryPath}:`, archives);
            return archives;
        } catch (error) {
            logger.error(`Error finding archive files in ${directoryPath}:`, error);
            throw error;
        }
    }

    async findRootRARFile(archivePath) {
        const dir = path.dirname(archivePath);
        const files = await fs.readdir(dir);
        
        // First, look for .part1.rar or .rar (not .partX.rar where X > 1)
        const rootFile = files.find(file => {
            const isPartOne = /\.part1\.rar$/i.test(file);
            const isMainRar = /\.rar$/i.test(file) && !file.match(/\.part\d+\.rar$/i);
            return isPartOne || isMainRar;
        });

        return rootFile ? path.join(dir, rootFile) : null;
    }

    async extractArchives(sourcePath, destPath, taskId, progressCallback) {
        logger.info(`Looking for archives in: ${sourcePath}`);
        
        const archives = await this.findArchiveFiles(sourcePath);
        
        if (archives.rars.length === 0 && archives.isos.length === 0) {
            logger.info('No archive files found to extract');
            return false;
        }

        await fs.mkdir(destPath, { recursive: true });

        // Handle RAR archives first
        if (archives.rars.length > 0) {
            const firstRar = path.join(sourcePath, archives.rars[0]);
            const rootRar = await this.findRootRARFile(firstRar);
            
            if (rootRar) {
                await this.extractRAR(rootRar, destPath, async (progress) => {
                    const totalProgress = this.calculateTaskProgress('rar', progress);
                    // Update task progress in database
                    await TaskService.updateProgress(taskId, progress);
                    // Call the original progress callback if provided
                    if (progressCallback) {
                        progressCallback(totalProgress);
                    }
                    logger.info(`Task ${taskId} progress: ${totalProgress}% (RAR extraction: ${progress}%)`);
                });
                
                // After RAR extraction, check for nested ISO files
                const extractedFiles = await fs.readdir(destPath);
                const nestedIsos = extractedFiles.filter(file => file.toLowerCase().endsWith('.iso'));
                
                if (nestedIsos.length > 0) {
                    logger.info(`Found ${nestedIsos.length} nested ISO file(s)`);
                    for (const iso of nestedIsos) {
                        const isoPath = path.join(destPath, iso);
                        const isoExtractPath = path.join(destPath, path.parse(iso).name);
                        await this.extractISO(isoPath, isoExtractPath, async (progress) => {
                            const totalProgress = this.calculateTaskProgress('iso', progress);
                            // Update task progress in database
                            await TaskService.updateProgress(taskId, progress);
                            // Call the original progress callback if provided
                            if (progressCallback) {
                                progressCallback(totalProgress);
                            }
                            logger.info(`Task ${taskId} progress: ${totalProgress}% (ISO extraction: ${progress}%)`);
                        });
                        
                        // Remove the ISO file after extraction
                        await fs.unlink(isoPath).catch(err => 
                            logger.warn(`Failed to remove ISO file ${isoPath}:`, err)
                        );
                    }
                }
                return true;
            }
        }

        // Handle ISO files if no RAR was extracted
        if (archives.isos.length > 0) {
            const firstIso = path.join(sourcePath, archives.isos[0]);
            await this.extractISO(firstIso, destPath, async (progress) => {
                // If there's only ISO, treat it as 100% of the progress
                const totalProgress = progress;
                // Update task progress in database
                await TaskService.updateProgress(taskId, progress);
                if (progressCallback) {
                    progressCallback(totalProgress);
                }
                logger.info(`Task ${taskId} progress: ${totalProgress}% (ISO only)`);
            });
            return true;
        }

        return false;
    }

    async countRARParts(archivePath) {
        const dir = path.dirname(archivePath);
        const baseName = path.basename(archivePath);
        const files = await fs.readdir(dir);
        
        // If it's a .part1.rar file
        if (baseName.match(/\.part1\.rar$/i)) {
            const baseWithoutPart = baseName.replace('.part1.rar', '');
            return files.filter(file => 
                file.startsWith(baseWithoutPart) && 
                file.match(/\.part\d+\.rar$/i)
            ).length;
        }
        
        // If it's a regular .rar file, check for .r00, .r01, etc.
        if (baseName.match(/\.rar$/i)) {
            const baseWithoutExt = baseName.replace('.rar', '');
            const rParts = files.filter(file => 
                file.startsWith(baseWithoutExt) && 
                (file.match(/\.r\d+$/i) || file.match(/\.part\d+\.rar$/i))
            ).length;
            return rParts + 1; // Add 1 for the main .rar file
        }

        return 1; // Single file archive
    }

    async extractRAR(archivePath, extractPath, progressCallback) {
        logger.info(`Extracting RAR archive: ${archivePath}`);
        
        await fs.mkdir(extractPath, { recursive: true });
        const totalParts = await this.countRARParts(archivePath);
        logger.info(`Found ${totalParts} parts for archive ${path.basename(archivePath)}`);

        return new Promise((resolve, reject) => {
            const extractionProcess = exec(`unrar x -o+ -y "${archivePath}" "${extractPath}"`);
            let currentPart = 0;
            let lastReportedProgress = 0;

            extractionProcess.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                
                for (const line of lines) {
                    if (line.includes('Extracting from')) {
                        currentPart++;
                        logger.debug(`Processing part ${currentPart}/${totalParts}`);
                        continue;
                    }

                    const progressMatch = line.match(/(\d+)%/);
                    if (progressMatch) {
                        const fileProgress = parseInt(progressMatch[1]);
                        const overallProgress = Math.floor(
                            ((currentPart - 1) * 100 + fileProgress) / totalParts
                        );

                        if (overallProgress > lastReportedProgress) {
                            lastReportedProgress = overallProgress;
                            logger.info(`RAR extraction progress: ${overallProgress}% (Part ${currentPart}/${totalParts})`);
                            if (progressCallback) {
                                progressCallback(overallProgress);
                            }
                        }
                    }
                }
            });

            extractionProcess.stderr.on('data', (data) => {
                logger.error(`RAR extraction error: ${data}`);
            });

            extractionProcess.on('close', (code) => {
                if (code === 0) {
                    logger.info('RAR extraction completed successfully');
                    if (progressCallback) {
                        progressCallback(100);
                    }
                    resolve();
                } else {
                    reject(new Error(`RAR extraction failed with exit code ${code}`));
                }
            });
        });
    }

    async extractISO(isoPath, extractPath, progressCallback) {
        logger.info(`Extracting ISO file: ${isoPath}`);
        
        await fs.mkdir(extractPath, { recursive: true });

        return new Promise((resolve, reject) => {
            const extractionProcess = exec(`7z x "${isoPath}" -o"${extractPath}" -y`);
            let lastProgress = 0;

            extractionProcess.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                
                for (const line of lines) {
                    const progressMatch = line.match(/\s*(\d+(?:\.\d+)?)%/);
                    if (progressMatch) {
                        const currentProgress = Math.floor(parseFloat(progressMatch[1]));
                        if (currentProgress > lastProgress) {
                            lastProgress = currentProgress;
                            logger.info(`ISO extraction progress: ${currentProgress}%`);
                            if (progressCallback) {
                                progressCallback(currentProgress);
                            }
                        }
                    }
                }
            });

            extractionProcess.stderr.on('data', (data) => {
                const message = data.toString();
                if (!message.toLowerCase().includes('warning')) {
                    logger.error(`ISO extraction error: ${message}`);
                }
            });

            extractionProcess.on('close', (code) => {
                if (code === 0) {
                    logger.info('ISO extraction completed successfully');
                    if (progressCallback) {
                        progressCallback(100);
                    }
                    resolve();
                } else {
                    reject(new Error(`ISO extraction failed with exit code ${code}`));
                }
            });
        });
    }
}

module.exports = new ExtractionService();