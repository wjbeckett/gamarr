// src/services/downloader.js
const axios = require('axios');
const logger = require('../config/logger');

class DownloaderService {
    constructor() {
        this.clientUrl = process.env.DOWNLOAD_CLIENT_URL;
        this.apiKey = process.env.DOWNLOAD_CLIENT_API_KEY;
    }

    async addDownload(magnetLink) {
        try {
            const response = await axios.post(`${this.clientUrl}/api/v2/torrents/add`, {
                urls: [magnetLink]
            }, {
                headers: {
                    'X-Api-Key': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Failed to add download:', error);
            throw error;
        }
    }
}

module.exports = new DownloaderService();