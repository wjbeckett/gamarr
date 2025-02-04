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

    async searchGameName(gameName) {
        try {
            const cleanGameName = this.cleanGameName(gameName);
            logger.info(`Searching for game with cleaned name: ${cleanGameName}`);

            // Try IGDB first for more accurate results
            const igdbResult = await this.searchIGDB(cleanGameName);
            if (igdbResult) {
                logger.info(`Found match on IGDB: ${igdbResult.name}`);
                return igdbResult;
            }

            // Fallback to GiantBomb
            const giantBombResult = await this.searchGiantBomb(cleanGameName);
            if (giantBombResult) {
                logger.info(`Found match on GiantBomb: ${giantBombResult.name}`);
                return giantBombResult;
            }

            logger.warn(`No matches found for: ${cleanGameName}`);
            return null;
        } catch (error) {
            logger.error('Error searching for game metadata:', error);
            throw error;
        }
    }

    cleanGameName(gameName) {
        return gameName
            .replace(/[-_]/g, ' ')           // Replace dashes and underscores with spaces
            .replace(/v\d+(\.\d+)*/, '')     // Remove version numbers
            .replace(/-I_KnoW$/, '')         // Remove release group
            .replace(/\s+$/, '')             // Remove trailing spaces
            .replace(/\s{2,}/g, ' ')         // Replace multiple spaces with single space
            .trim();
    }

    calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        
        // Check for exact match
        if (s1 === s2) return 1;
        
        // Check for one string containing the other
        if (s1.includes(s2) || s2.includes(s1)) return 0.9;
        
        // Calculate word match score
        const words1 = s1.split(' ');
        const words2 = s2.split(' ');
        const commonWords = words1.filter(word => words2.includes(word));
        
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    findBestMatch(searchName, results, threshold = 0.8) {
        let bestMatch = null;
        let bestScore = 0;

        for (const result of results) {
            const score = this.calculateSimilarity(searchName, result.name);
            
            // Log matching scores for debugging
            logger.debug(`Match score for "${result.name}": ${score}`);

            if (score > bestScore && score >= threshold) {
                bestScore = score;
                bestMatch = result;
            }
        }

        if (bestMatch) {
            logger.info(`Best match found: "${bestMatch.name}" with score: ${bestScore}`);
        }

        return bestMatch;
    }

    async searchIGDB(gameName) {
        try {
            const token = await this.getIGDBToken();
            logger.info(`Searching IGDB for: ${gameName}`);

            const response = await axios({
                url: 'https://api.igdb.com/v4/games',
                method: 'POST',
                headers: {
                    'Client-ID': this.igdbClientId,
                    'Authorization': `Bearer ${token}`
                },
                data: `search "${gameName}";
                       fields name,first_release_date,summary,category;
                       where category = 0 & version_parent = null;
                       limit 20;`
            });

            if (response.data && response.data.length > 0) {
                logger.info(`Received ${response.data.length} results from IGDB`);
                logger.debug(`IGDB Results: ${JSON.stringify(response.data.map(r => r.name))}`);

                const bestMatch = this.findBestMatch(gameName, response.data);
                if (bestMatch) {
                    return {
                        name: bestMatch.name,
                        releaseDate: bestMatch.first_release_date 
                            ? new Date(bestMatch.first_release_date * 1000).toISOString()
                            : null,
                        description: bestMatch.summary,
                        source: 'IGDB'
                    };
                }
            }
            logger.info('No suitable matches found in IGDB');
            return null;
        } catch (error) {
            logger.error('IGDB API error:', error.response?.data || error.message);
            return null;
        }
    }

    async searchGiantBomb(gameName) {
        try {
            logger.info(`Searching GiantBomb with query: "${gameName}"`);
            const response = await axios.get('https://www.giantbomb.com/api/search', {
                params: {
                    api_key: this.giantBombApiKey,
                    format: 'json',
                    query: gameName,
                    resources: 'game',
                    limit: 20
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                logger.info(`Received ${response.data.results.length} results from GiantBomb`);
                logger.debug(`Results: ${JSON.stringify(response.data.results.map(r => r.name))}`);

                const bestMatch = this.findBestMatch(gameName, response.data.results);
                if (bestMatch) {
                    return {
                        name: bestMatch.name,
                        releaseDate: bestMatch.original_release_date,
                        description: bestMatch.deck,
                        source: 'GiantBomb'
                    };
                }
            }
            logger.info('No suitable matches found in GiantBomb');
            return null;
        } catch (error) {
            logger.error('GiantBomb API error:', error);
            return null;
        }
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