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
                requiredReleases: []
            };
    
            // Split the content into lines
            const lines = nfoContent.split('\n');
            let currentSection = null;
            let isASCIIArt = false;
    
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lowerLine = line.toLowerCase();
    
                // Skip ASCII art sections
                if (line.match(/^[\s|_]+$/) || line.match(/^\|[\w\s|.-]+\|$/)) {
                    isASCIIArt = true;
                    continue;
                }
    
                // Reset ASCII art flag if we hit a blank line
                if (line === '') {
                    isASCIIArt = false;
                    continue;
                }
    
                // Skip ASCII art lines
                if (isASCIIArt) continue;
    
                // Detect section headers
                if (lowerLine.includes('general notes')) {
                    currentSection = 'generalNotes';
                    continue;
                } else if (lowerLine.includes('install') || lowerLine.includes('unpack')) {
                    currentSection = 'installInstructions';
                    continue;
                } else if (lowerLine.includes('crack') && lowerLine.includes('instructions')) {
                    currentSection = 'crackInstructions';
                    continue;
                }
    
                // Process line content
                if (currentSection) {
                    // Remove leading numbers, dashes, or dots
                    let cleanedLine = line.replace(/^[\d\s.-]+/, '').trim();
    
                    // Skip irrelevant lines
                    if (!cleanedLine || cleanedLine.match(/^[_|]/) || cleanedLine.includes('ASCII by')) {
                        continue;
                    }
    
                    // Add the cleaned line to the current section
                    if (currentSection === 'crackInstructions') {
                        // Only add lines that look like actual crack instructions
                        if (cleanedLine.toLowerCase().includes('copy') || cleanedLine.toLowerCase().includes('crack')) {
                            parsed[currentSection].push(cleanedLine);
                        }
                    } else {
                        parsed[currentSection].push(cleanedLine);
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
                crackInstructions: [],
                requiredReleases: []
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