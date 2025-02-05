const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./config/logger');

const dbPath = path.resolve(__dirname, '..', 'data', 'gamarr.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Failed to connect to the database:', err);
    } else {
        logger.info('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create tasks table (already exists)
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INTEGER DEFAULT 0,
                error TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                logger.error('Failed to create tasks table:', err);
            } else {
                logger.info('Tasks table initialized successfully.');
            }
        });

        // Create games table
        db.run(`
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                release_date TEXT,
                description TEXT,
                destination_path TEXT,
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                logger.error('Failed to create games table:', err);
            } else {
                logger.info('Games table initialized successfully.');
            }
        });
    });
}

module.exports = db;