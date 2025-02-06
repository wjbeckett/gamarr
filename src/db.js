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
                    db.all(`PRAGMA table_info(games)`, (err, rows) => {
                        if (err) {
                            logger.error(`Error checking table info for ${column.name}:`, err);
                            return;
                        }

                        // Check if column exists
                        const columnExists = rows.some(row => row.name === column.name);
                        
                        if (!columnExists) {
                            db.run(`
                                ALTER TABLE games 
                                ADD COLUMN ${column.name} ${column.type}
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

        // Create indexers table
        db.run(`
            CREATE TABLE IF NOT EXISTS indexers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                api_key TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                logger.error('Failed to create indexers table:', err);
            } else {
                logger.info('Indexers table initialized successfully.');
            }
        });

        // Create download_clients table
        db.run(`
            CREATE TABLE IF NOT EXISTS download_clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                url TEXT NOT NULL,
                username TEXT,
                password TEXT,
                api_key TEXT,
                category TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                logger.error('Failed to create download_clients table:', err);
            } else {
                logger.info('Download clients table initialized successfully.');
            }
        });

        // Create general_settings table
        db.run(`
            CREATE TABLE IF NOT EXISTS general_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                logger.error('Failed to create general_settings table:', err);
            } else {
                logger.info('General settings table initialized successfully.');

                // Add default settings if they don't exist
                const defaultSettings = [
                    { key: 'default_download_path', value: '/app/downloads' },
                    { key: 'default_library_path', value: '/app/library' }
                ];

                defaultSettings.forEach(setting => {
                    db.run(`
                        INSERT OR IGNORE INTO general_settings (key, value)
                        VALUES (?, ?)
                    `, [setting.key, setting.value], (err) => {
                        if (err) {
                            logger.error(`Error adding default setting ${setting.key}:`, err);
                        } else {
                            logger.info(`Default setting ${setting.key} initialized`);
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