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
        // Check if tables exist before creating them
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'", (err, row) => {
            if (!row) {
                db.run(`
                    CREATE TABLE tasks (
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
            }
        });

        // Check root_folders table
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='root_folders'", (err, row) => {
            if (!row) {
                db.run(`
                    CREATE TABLE root_folders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        path TEXT NOT NULL UNIQUE,
                        free_space INTEGER,
                        unmapped_folders INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        logger.error('Failed to create root_folders table:', err);
                    } else {
                        logger.info('Root folders table initialized successfully.');
                        // Only insert default root folder if table was just created
                        db.run(`INSERT INTO root_folders (path) VALUES (?)`, 
                            ['/app/library'], 
                            (err) => {
                                if (err && err.code !== 'SQLITE_CONSTRAINT') {
                                    logger.error('Error adding default root folder:', err);
                                } else {
                                    logger.info('Added default root folder');
                                }
                            }
                        );
                    }
                });
            }
        });

        // Check games table
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games'", (err, row) => {
            if (!row) {
                db.run(`
                    CREATE TABLE games (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        release_date TEXT,
                        description TEXT,
                        destination_path TEXT,
                        root_folder_id INTEGER,
                        cover_url TEXT,
                        metadata TEXT,
                        latest_version TEXT,
                        status TEXT DEFAULT 'pending',
                        nfo_content TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(root_folder_id) REFERENCES root_folders(id)
                    )
                `, (err) => {
                    if (err) logger.error('Failed to create games table:', err);
                    else logger.info('Games table initialized successfully.');
                });
            }
        });

        // Check indexers table
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='indexers'", (err, row) => {
            if (!row) {
                db.run(`
                    CREATE TABLE indexers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        url TEXT NOT NULL,
                        api_key TEXT NOT NULL,
                        enabled BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) logger.error('Failed to create indexers table:', err);
                    else logger.info('Indexers table initialized successfully.');
                });
            }
        });

        // Check download_clients table
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='download_clients'", (err, row) => {
            if (!row) {
                db.run(`
                    CREATE TABLE download_clients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        type TEXT NOT NULL,
                        url TEXT NOT NULL,
                        username TEXT,
                        password TEXT,
                        api_key TEXT,
                        category TEXT,
                        enabled BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) logger.error('Failed to create download_clients table:', err);
                    else logger.info('Download clients table initialized successfully.');
                });
            }
        });

        // Check general_settings table
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='general_settings'", (err, row) => {
            if (!row) {
                db.run(`
                    CREATE TABLE general_settings (
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
                        // Insert default settings only if table was just created
                        const defaultSettings = [
                            { key: 'default_download_path', value: '/app/downloads' },
                            { key: 'default_root_folder', value: '/app/library' },
                            { key: 'igdb_client_id', value: '' },
                            { key: 'igdb_access_token', value: '' }
                        ];

                        defaultSettings.forEach(setting => {
                            db.run(`
                                INSERT INTO general_settings (key, value)
                                VALUES (?, ?)
                            `, [setting.key, setting.value], (err) => {
                                if (err) logger.error(`Error adding default setting ${setting.key}:`, err);
                                else logger.info(`Default setting ${setting.key} initialized`);
                            });
                        });
                    }
                });
            }
        });
    });
}

module.exports = db;