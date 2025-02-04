const path = require('path');
const { downloadsDir } = require('../config/paths');

function normalizeDownloadPath(inputPath) {
    const fullPath = path.isAbsolute(inputPath)
        ? inputPath
        : path.join(downloadsDir, inputPath);
    return path.normalize(fullPath);
}

module.exports = {
    normalizeDownloadPath
};