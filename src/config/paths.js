const path = require('path');

module.exports = {
    downloadsDir: process.env.DOWNLOADS_DIR || '/app/downloads',
    libraryDir: process.env.LIBRARY_DIR || '/app/library',
    tempDir: process.env.TEMP_DIR || '/app/temp',
    extractDir: process.env.EXTRACT_DIR || '/app/temp/extracted'
};