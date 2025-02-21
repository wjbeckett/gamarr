const logger = require('../config/logger');
const db = require('../db');

class SearchService {
    async searchGame(query) {
        try {
            // Fetch the Prowlarr configuration from the database
            const prowlarrConfig = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM indexers WHERE name = ? AND enabled = 1',
                    ['Prowlarr'], // Assuming the indexer is named "Prowlarr"
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!prowlarrConfig) {
                throw new Error('No enabled Prowlarr configuration found in the database.');
            }

            logger.debug('Using Prowlarr configuration:', {
                name: prowlarrConfig.name,
                url: prowlarrConfig.url,
                apiKey: prowlarrConfig.api_key ? '***' + prowlarrConfig.api_key.slice(-4) : 'missing'
            });

            // Construct the search URL for Prowlarr
            const searchUrl = new URL('/api/v1/search', prowlarrConfig.url);
            searchUrl.searchParams.append('query', query);
            searchUrl.searchParams.append('type', 'search'); // Ensure both Torrent and NZB results are included
            searchUrl.searchParams.append('limit', '100'); // Set a limit for the number of results
            searchUrl.searchParams.append('offset', '0'); // Start from the first result
            searchUrl.searchParams.append('apikey', prowlarrConfig.api_key);

            // Make the request to Prowlarr
            const response = await fetch(searchUrl.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('Prowlarr API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`Indexer search failed: ${response.statusText}`);
            }

            const results = await response.json();

            // Map the results
            return results.map(result => ({
                title: result.title,
                size: result.size,
                seeders: result.seeders || 0,
                leechers: result.leechers || 0,
                protocol: result.protocol || 'torrent',
                indexer: result.indexer,
                publishDate: result.publishDate,
                downloadUrl: result.downloadUrl,
                age: this._calculateAge(result.publishDate)
            }));
        } catch (error) {
            logger.error('Error in searchGame:', error);
            throw error;
        }
    }

    _calculateAge(publishDate) {
        if (!publishDate) return null;
        const published = new Date(publishDate);
        const now = new Date();
        const diffTime = Math.abs(now - published);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}

module.exports = new SearchService();
