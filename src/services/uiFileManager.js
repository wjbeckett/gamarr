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
            
            const parsed = {
                installInstructions: [],
                generalNotes: [],
                crackInstructions: [],
            };

            // Split the content into lines for easier processing
            const lines = nfoContent.split('\n').map(line => line.trim());

            let currentSection = null;

            for (const line of lines) {
                if (line.toLowerCase().includes('install instructions') || line.toLowerCase().includes('extract')) {
                    currentSection = 'installInstructions';
                } else if (line.toLowerCase().includes('general notes')) {
                    currentSection = 'generalNotes';
                } else if (line.toLowerCase().includes('crack') || line.toLowerCase().includes('copy crack')) {
                    currentSection = 'crackInstructions';
                } else if (line === '' || line.startsWith('-')) {
                    // Add the line to the current section if it matches
                    if (currentSection) {
                        parsed[currentSection].push(line.replace(/^-/, '').trim());
                    }
                }
            }

            // Clean up empty sections
            for (const key in parsed) {
                parsed[key] = parsed[key].filter(line => line.length > 0);
            }

            return parsed;
        } catch (error) {
            logger.error('Error parsing NFO content:', error);
            return {
                installInstructions: [],
                generalNotes: [],
                crackInstructions: []
            };
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = new UIFileManager();