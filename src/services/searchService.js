const logger = require('../config/logger');
const db = require('../db');

class SearchService {
    async searchGame(query) {
        try {
            // Get the first enabled indexer from the database
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

            // Construct the search URL
            const searchUrl = new URL(`${indexer.url}/api/v1/search`);
            searchUrl.searchParams.append('query', query);
            searchUrl.searchParams.append('apikey', indexer.apiKey);

            // Perform the search
            const response = await fetch(searchUrl.toString());
            if (!response.ok) {
                throw new Error(`Indexer search failed: ${response.statusText}`);
            }

            const results = await response.json();
            
            // Transform the results to a more usable format
            return results.map(result => ({
                title: result.title,
                size: result.size,
                seeders: result.seeders,
                leechers: result.leechers,
                downloadUrl: result.downloadUrl,
                protocol: result.protocol,
                indexer: indexer.name,
                publishDate: result.publishDate
            }));
        } catch (error) {
            logger.error('Search error:', error);
            throw error;
        }
    }
}

module.exports = new SearchService();