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
            let currentNote = '';
            let isASCIIArt = false;
    
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lowerLine = line.toLowerCase();
    
                // Skip ASCII art sections
                if (line.includes('_____') || line.includes('|__|') || line.match(/^\|[\w\s|.-]+\|$/)) {
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
    
                // Check for section headers
                if (lowerLine.includes('general notes')) {
                    currentSection = 'generalNotes';
                    continue;
                } else if (lowerLine.includes('install') || lowerLine.match(/^\d+\s*[.)]?\s*unpack/)) {
                    currentSection = 'installInstructions';
                    continue;
                } else if (lowerLine.includes('crack') && !lowerLine.includes('crack instructions:')) {
                    currentSection = 'crackInstructions';
                    continue;
                }
    
                // Process line content
                if (currentSection && line) {
                    // Handle numbered or bulleted lines
                    let cleanedLine = line
                        .replace(/^\d+[.)]?\s*/, '') // Remove leading numbers
                        .replace(/^[-•]\s*/, '')     // Remove bullet points
                        .trim();
    
                    if (cleanedLine && !cleanedLine.match(/^[_|]/) && !cleanedLine.includes('ASCII by')) {
                        // If the line ends with a continuation character, start building a multi-line note
                        if (cleanedLine.endsWith('..') || cleanedLine.endsWith('...')) {
                            currentNote = cleanedLine.replace(/\.+$/, ' ');
                        } else if (currentNote) {
                            // If we have a current note, append this line and add the complete note
                            currentNote += cleanedLine;
                            if (!parsed[currentSection].includes(currentNote)) {
                                parsed[currentSection].push(currentNote);
                            }
                            currentNote = '';
                        } else {
                            // Regular single-line note
                            if (!parsed[currentSection].includes(cleanedLine)) {
                                parsed[currentSection].push(cleanedLine);
                            }
                        }
                    }
                }
            }
    
            // Add any remaining currentNote
            if (currentNote && currentSection) {
                parsed[currentSection].push(currentNote.trim());
            }
    
            // Clean up empty sections and filter out ASCII art lines
            for (const key in parsed) {
                parsed[key] = parsed[key]
                    .filter(line => 
                        line.length > 0 && 
                        !line.match(/^[_|]/) && 
                        !line.includes('ASCII by') &&
                        !line.match(/^\d+$/)
                    );
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