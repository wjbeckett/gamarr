const fs = require('fs-extra');
const path = require('path');
const logger = require('../config/logger');
const iconv = require('iconv-lite');

class UIFileManager {
    async fetchNfoContent(nfoPath) {
        if (!nfoPath || !fs.existsSync(nfoPath)) {
            throw new Error('NFO file not found');
        }
        try {
            // Read the raw buffer and decode with CP437
            const buffer = await fs.readFile(nfoPath);
            const content = iconv.decode(buffer, 'cp437'); // Use CP437 encoding for NFO files
            logger.debug(`Fetched NFO content from: ${nfoPath}`);
            
            // Clean up the content by stripping non-printable characters
            const cleanedContent = content.replace(/[^\x20-\x7E\n\r]/g, ''); // Keep printable ASCII characters only
            
            // Parse the cleaned content
            const parsed = this.parseNfoContent(cleanedContent);
            
            // Return both raw and parsed content
            return {
                raw: cleanedContent,
                parsed: parsed
            };
        } catch (error) {
            logger.error(`Error reading NFO file at ${nfoPath}:`, error);
            throw new Error('Failed to fetch NFO content');
        }
    }

    parseNfoContent(nfoContent) {
        try {
            logger.debug('Parsing NFO content:', nfoContent);
    
            // Detect numbered lists or bullet points for installation instructions
            const installInstructionsMatch = nfoContent.match(/^\s*[\d\-\*]+\s+(unpack|install|burn|mount|run|play).+/gim);
    
            // Extract patch notes
            const patchNotesMatch = nfoContent.match(/Patch Notes:\s*([\s\S]+?)(?=\n\n|\n[A-Z])/i);
    
            // Extract required releases
            const requiredReleasesMatch = nfoContent.match(/The following releases are required:\s*([\s\S]+?)(?=\n\n|\n[A-Z])/i);
    
            return {
                patchNotes: patchNotesMatch ? patchNotesMatch[1].trim() : null,
                requiredReleases: requiredReleasesMatch
                    ? requiredReleasesMatch[1].split('\n').map(line => line.trim())
                    : [],
                installInstructions: installInstructionsMatch
                    ? installInstructionsMatch.map(line => line.trim())
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