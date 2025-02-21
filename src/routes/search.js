const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const logger = require('../config/logger');

router.get('/', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = await searchService.searchGame(query);
        res.json(results);
    } catch (error) {
        logger.error('Search route error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;