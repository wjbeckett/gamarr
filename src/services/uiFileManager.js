const fs = require('fs-extra');
const path = require('path');
const logger = require('../config/logger');

class UIFileManager {
    async fetchNfoContent(nfoPath) {
        try {
            const content = await fs.readFile(nfoPath, 'utf-8');
            logger.debug(`Fetched NFO content from: ${nfoPath}`);
            return content;
        } catch (error) {
            logger.error(`Error reading NFO file at ${nfoPath}:`, error);
            throw new Error('Failed to fetch NFO content');
        }
    }

    parseNfoContent(nfoContent) {
        try {
            const patchNotesMatch = nfoContent.match(/PatchNotes:\s*(.+)/i);
            const requiredReleasesMatch = nfoContent.match(/The following releases are required for this update:\s*([\s\S]+?)\n\n/i);
            const installInstructionsMatch = nfoContent.match(/\d+\.\s*([\s\S]+?)(?=\n\n|\n[A-Z]|$)/);

            return {
                patchNotes: patchNotesMatch ? patchNotesMatch[1].trim() : null,
                requiredReleases: requiredReleasesMatch
                    ? requiredReleasesMatch[1].split('\n').map(line => line.trim())
                    : [],
                installInstructions: installInstructionsMatch
                    ? installInstructionsMatch[1].split('\n').map(line => line.trim())
                    : []
            };
        } catch (error) {
            logger.error('Error parsing NFO content:', error);
            return {
                patchNotes: null,
                requiredReleases: [],
                installInstructions: []
            };
        }
    }

    getFolderSize(folderPath) {
        let totalSize = 0;
        try {
            const files = fs.readdirSync(folderPath);
            files.forEach(file => {
                const filePath = path.join(folderPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                } else if (stats.isDirectory()) {
                    totalSize += this.getFolderSize(filePath); // Recursively calculate size for subdirectories
                }
            });
        } catch (error) {
            logger.error(`Error calculating folder size for ${folderPath}:`, error);
        }
        return totalSize;
    }
}

module.exports = new UIFileManager();