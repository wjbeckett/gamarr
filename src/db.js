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
        // Create tasks table
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

        // Create library_locations table
        db.run(`
            CREATE TABLE IF NOT EXISTS library_locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                logger.error('Failed to create library_locations table:', err);
            } else {
                logger.info('Library locations table initialized successfully.');
            }
        });

        // Create games table with library_location_id
        db.run(`
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                release_date TEXT,
                description TEXT,
                destination_path TEXT,
                status TEXT DEFAULT 'new',
                library_location_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (library_location_id) REFERENCES library_locations(id)
            )
        `, (err) => {
            if (err) {
                logger.error('Failed to create games table:', err);
            } else {
                logger.info('Games table initialized successfully.');
                
                // Add any missing columns
                const columnsToAdd = [
                    {
                        name: 'cover_url',
                        type: 'TEXT'
                    },
                    {
                        name: 'library_location_id',
                        type: 'INTEGER REFERENCES library_locations(id)'
                    }
                ];

                columnsToAdd.forEach(column => {
                    db.get(`PRAGMA table_info(games)`, (err, rows) => {
                        if (err) {
                            logger.error(`Error checking table info for ${column.name}:`, err);
                            return;
                        }

                        // Check if column exists
                        const columnExists = rows.some(row => row.name === column.name);
                        
                        if (!columnExists) {
                            db.run(`
                                ALTER TABLE games 
                                ADD COLUMN ${column.name} ${column.type};
                            `, (err) => {
                                if (err) {
                                    if (!err.message.includes('duplicate column name')) {
                                        logger.error(`Error adding ${column.name} column:`, err);
                                    }
                                } else {
                                    logger.info(`Added ${column.name} column to games table`);
                                }
                            });
                        }
                    });
                });
            }
        });

        // Add default library location if none exists
        db.get(`SELECT COUNT(*) as count FROM library_locations`, (err, row) => {
            if (err) {
                logger.error('Error checking library locations:', err);
                return;
            }

            if (row.count === 0) {
                db.run(`
                    INSERT INTO library_locations (name, path)
                    VALUES (?, ?)
                `, ['Default Library', '/app/library'], (err) => {
                    if (err) {
                        logger.error('Error adding default library location:', err);
                    } else {
                        logger.info('Added default library location');
                    }
                });
            }
        });
    });
}

module.exports = db;