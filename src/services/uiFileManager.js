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
    
            // Split the content into lines for easier processing
            const lines = nfoContent.split('\n').map(line => line.trim());
    
            let currentSection = null;
    
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
    
                // Check for section headers
                if (lowerLine.includes('general notes')) {
                    currentSection = 'generalNotes';
                    continue;
                } else if (lowerLine.includes('install') || lowerLine.includes('unpack')) {
                    currentSection = 'installInstructions';
                    continue;
                } else if (lowerLine.includes('crack') || lowerLine.includes('copy crack')) {
                    currentSection = 'crackInstructions';
                    continue;
                }
    
                // Skip empty lines
                if (!line.trim()) continue;
    
                // Process line content
                if (currentSection) {
                    // Remove leading numbers, dashes, or dots
                    let cleanedLine = line.replace(/^[\d\s.-]+/, '').trim();
                    
                    // Skip if the line is empty after cleaning
                    if (!cleanedLine) continue;
    
                    // Add the cleaned line to the appropriate section
                    if (!parsed[currentSection].includes(cleanedLine)) {
                        parsed[currentSection].push(cleanedLine);
                    }
                } else {
                    // If no section is set but line starts with a number or dash,
                    // assume it's installation instructions
                    if (line.match(/^[\d.-]/) && line.length > 1) {
                        let cleanedLine = line.replace(/^[\d\s.-]+/, '').trim();
                        if (cleanedLine && !parsed.installInstructions.includes(cleanedLine)) {
                            parsed.installInstructions.push(cleanedLine);
                        }
                    }
                }
            }
    
            // Clean up empty sections
            for (const key in parsed) {
                parsed[key] = parsed[key].filter(line => line.length > 0);
            }
    
            // If no section was explicitly found but we have install instructions,
            // those were likely from numbered steps
            if (parsed.installInstructions.length > 0 && !currentSection) {
                currentSection = 'installInstructions';
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