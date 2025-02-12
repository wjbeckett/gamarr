// src/services/indexer.js
const axios = require('axios');
const logger = require('../config/logger');

class IndexerService {
    constructor() {
        this.prowlarrUrl = process.env.PROWLARR_URL;
        this.apiKey = process.env.PROWLARR_API_KEY;
    }

    async searchGame(query) {
        try {
            const response = await axios.get(`${this.prowlarrUrl}/api/v1/search`, {
                params: {
                    query,
                    apikey: this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Prowlarr search failed:', error);
            throw error;
        }
    }
}

module.exports = new IndexerService();