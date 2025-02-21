const logger = require('../config/logger');
const db = require('../db');

class SearchService {
    async searchGame(query) {
        try {
            // Get the configured indexer
            const indexer = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM indexers WHERE enabled = 1 LIMIT 1',
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!indexer) {
                throw new Error('No enabled indexer found');
            }

            logger.debug('Using indexer:', {
                name: indexer.name,
                url: indexer.url,
                // Don't log the full API key
                apiKey: indexer.api_key ? '***' + indexer.api_key.slice(-4) : 'missing'
            });

            // Construct the search URL for Prowlarr
            const searchUrl = new URL('/api/v1/search', indexer.url);
            
            // Prepare the search parameters according to Prowlarr's API
            const searchParams = {
                query: query,
                type: 'search',
                categories: [], // Add specific categories if needed
                limit: 100
            };

            // Make the request to Prowlarr
            const response = await fetch(searchUrl.toString(), {
                method: 'POST', // Prowlarr expects a POST request
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': indexer.api_key
                },
                body: JSON.stringify(searchParams)
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
            
            // Log the first result for debugging
            if (results.length > 0) {
                logger.debug('First search result:', results[0]);
            }

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