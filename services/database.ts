import sqlite3 from 'sqlite3';

const sqlite3Verbose = sqlite3.verbose();

const DBSOURCE = "prompts.db";

let db: sqlite3.Database;

export const initDB = (callback: (err: Error | null) => void) => {
    db = new sqlite3Verbose.Database(DBSOURCE, (err) => {
        if (err) {
            console.error(err.message);
            callback(err);
        } else {
            console.log('Connected to the SQLite database.');
            db.configure('busyTimeout', 3000); // Wait 3 seconds if database is busy
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS folders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    parent_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES folders(id)
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS prompts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    prompt TEXT,
                    description TEXT,
                    tags TEXT,
                    folder_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (folder_id) REFERENCES folders(id)
                )`, (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    // Migration: Remove context column from prompts table if it exists
                    db.all("PRAGMA table_info(prompts)", (err, columns) => {
                        if (err) {
                            console.error("Error checking table info for context column removal:", err);
                            callback(err);
                            return;
                        }
                        const hasContextColumn = columns.some((col: any) => col.name === 'context');

                        if (hasContextColumn) {
                            console.log('Migrating prompts table: removing context column.');
                            db.serialize(() => {
                                db.run(`CREATE TABLE prompts_new (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    title TEXT,
                                    prompt TEXT,
                                    description TEXT,
                                    tags TEXT,
                                    folder_id INTEGER,
                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    FOREIGN KEY (folder_id) REFERENCES folders(id)
                                )`);
                                
                                const cols = (columns as any[]).filter(c => c.name !== 'context').map(c => c.name).join(', ');
                                db.run(`INSERT INTO prompts_new (${cols}) SELECT ${cols} FROM prompts`);
                                
                                db.run(`DROP TABLE prompts`);
                                db.run(`ALTER TABLE prompts_new RENAME TO prompts`, (err) => {
                                    if (err) {
                                        console.error("Error finishing prompts table migration:", err);
                                        callback(err);
                                    } else {
                                        console.log('Prompts table migration successful.');
                                        createSettingsTable(callback);
                                    }
                                });
                            });
                        } else {
                            // If column doesn't exist, just proceed
                            createSettingsTable(callback);
                        }
                    });
                });
            });
        }
    });
};

const createSettingsTable = (callback: (err: Error | null) => void) => {
    getDB().run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT
    )`, (err) => {
        callback(err);
    });
}

export const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized!');
    }
    return db;
};
