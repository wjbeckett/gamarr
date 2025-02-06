const axios = require('axios');
const logger = require('../config/logger');

class MetadataService {
    constructor() {
        this.giantBombApiKey = process.env.GIANTBOMB_API_KEY;
        this.igdbClientId = process.env.IGDB_CLIENT_ID;
        this.igdbClientSecret = process.env.IGDB_CLIENT_SECRET;
        this.igdbAccessToken = null;
        this.igdbTokenExpiry = null;
    }

    async searchGameName(query) {
        try {
            const cleanQuery = this.cleanGameName(query);
            logger.info(`Searching for games with cleaned query: ${cleanQuery}`);
            
            let results = [];
            
            // Try IGDB first
            try {
                const igdbResults = await this.searchIGDB(cleanQuery);
                if (igdbResults && igdbResults.length > 0) {
                    results = igdbResults.map(game => ({
                        name: game.name,
                        releaseDate: game.first_release_date 
                            ? new Date(game.first_release_date * 1000).toISOString()
                            : null,
                        description: game.summary,
                        cover_url: game.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : null,
                        source: 'IGDB'
                    }));
                }
            } catch (error) {
                logger.error('IGDB search error:', error);
            }
            
            // If no IGDB results, try GiantBomb
            if (results.length === 0) {
                try {
                    const giantBombResults = await this.searchGiantBomb(cleanQuery);
                    if (giantBombResults && giantBombResults.length > 0) {
                        results = giantBombResults.map(game => ({
                            name: game.name,
                            releaseDate: game.original_release_date,
                            description: game.deck,
                            cover_url: game.image?.medium_url || null,
                            source: 'GiantBomb'
                        }));
                    }
                } catch (error) {
                    logger.error('GiantBomb search error:', error);
                }
            }
            
            logger.info(`Found ${results.length} games matching query: ${cleanQuery}`);
            return results;
            
        } catch (error) {
            logger.error('Error searching for games:', error);
            return [];
        }
    }

    async searchIGDB(query) {
        try {
            const token = await this.getIGDBToken();
            logger.info(`Searching IGDB for: ${query}`);
            
            const response = await axios({
                url: 'https://api.igdb.com/v4/games',
                method: 'POST',
                headers: {
                    'Client-ID': this.igdbClientId,
                    'Authorization': `Bearer ${token}`
                },
                data: `search "${query}";
                    fields name,first_release_date,summary,cover.*,category;
                    where category = 0 & version_parent = null;
                    limit 10;`
            });
            
            if (response.data && response.data.length > 0) {
                logger.info(`Received ${response.data.length} results from IGDB`);
                return response.data;
            }
            
            logger.info('No matches found in IGDB');
            return [];
        } catch (error) {
            logger.error('IGDB API error:', error.response?.data || error.message);
            return [];
        }
    }

    async searchGiantBomb(query) {
        try {
            logger.info(`Searching GiantBomb for: ${query}`);
            const response = await axios.get('https://www.giantbomb.com/api/search', {
                params: {
                    api_key: this.giantBombApiKey,
                    format: 'json',
                    query: query,
                    resources: 'game',
                    field_list: 'name,original_release_date,deck,image',
                    limit: 10
                }
            });
            
            if (response.data.results && response.data.results.length > 0) {
                logger.info(`Received ${response.data.results.length} results from GiantBomb`);
                return response.data.results;
            }
            
            logger.info('No matches found in GiantBomb');
            return [];
        } catch (error) {
            logger.error('GiantBomb API error:', error);
            return [];
        }
    }

    cleanGameName(gameName) {
        return gameName
            .replace(/[-_]/g, ' ')    // Replace dashes and underscores with spaces
            .replace(/v\d+(\.\d+)*/, '')    // Remove version numbers
            .replace(/-I_KnoW$/, '')    // Remove release group
            .replace(/\s+$/, '')    // Remove trailing spaces
            .replace(/\s{2,}/g, ' ')    // Replace multiple spaces with single space
            .trim();
    }

    async getIGDBToken() {
        try {
            // Check if we have a valid token
            if (this.igdbAccessToken && this.igdbTokenExpiry && Date.now() < this.igdbTokenExpiry) {
                return this.igdbAccessToken;
            }
            
            logger.info('Getting new IGDB access token');
            const response = await axios.post(
                'https://id.twitch.tv/oauth2/token',
                null,
                {
                    params: {
                        client_id: this.igdbClientId,
                        client_secret: this.igdbClientSecret,
                        grant_type: 'client_credentials'
                    }
                }
            );
            
            this.igdbAccessToken = response.data.access_token;
            // Set token expiry (subtract 1 hour for safety margin)
            this.igdbTokenExpiry = Date.now() + (response.data.expires_in - 3600) * 1000;
            
            logger.info('Successfully obtained new IGDB access token');
            return this.igdbAccessToken;
        } catch (error) {
            logger.error('Failed to get IGDB token:', error);
            throw error;
        }
    }
}

module.exports = new MetadataService();