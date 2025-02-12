const fs = require('fs/promises');
const path = require('path');
const logger = require('../config/logger');
const { libraryDir } = require('../config/paths');

class FileManager {
    async moveFiles(sourcePath, gameName, version) {
        const libraryPath = path.join('/app/library', gameName, version);
        logger.info(`Moving files to: ${libraryPath}`);

        try {
            await fs.mkdir(libraryPath, { recursive: true });

            // Get all files and directories in the source path
            const items = await fs.readdir(sourcePath, { withFileTypes: true });
            
            for (const item of items) {
                const sourceItem = path.join(sourcePath, item.name);
                
                // If it's a directory, check its contents
                if (item.isDirectory()) {
                    const dirContents = await fs.readdir(sourceItem);
                    // If this directory contains game files (.exe, .bin, etc.), move its contents
                    if (dirContents.some(file => /\.(exe|bin|dll)$/i.test(file))) {
                        logger.debug(`Found game files in directory: ${item.name}`);
                        // Move contents of this directory
                        for (const file of dirContents) {
                            const sourceFile = path.join(sourceItem, file);
                            const destFile = path.join(libraryPath, file);
                            await this.copyFile(sourceFile, destFile);
                        }
                    }
                } else {
                    // Direct file in source directory
                    const destItem = path.join(libraryPath, item.name);
                    await this.copyFile(sourceItem, destItem);
                }
            }

            // Clean up source directory after successful move
            await this.cleanUpTempDir(sourcePath);
            return libraryPath;
        } catch (error) {
            logger.error('Error moving files:', error);
            throw error;
        }
    }

    async copyFile(source, dest) {
        try {
            await fs.copyFile(source, dest);
            logger.debug(`Copied: ${path.basename(source)} -> ${dest}`);
        } catch (error) {
            logger.error(`Error copying file ${source}:`, error);
            throw error;
        }
    }

    async cleanUpTempDir(dirPath) {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
            logger.debug(`Cleaned up temporary directory: ${dirPath}`);
        } catch (error) {
            logger.warn(`Error cleaning up directory ${dirPath}:`, error);
        }
    }
}

module.exports = new FileManager();