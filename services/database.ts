import sqlite3 from 'sqlite3';

const DBSOURCE = "prompts.db";

let db: sqlite3.Database;

export const initDB = (callback: (err: Error | null) => void) => {
    db = new sqlite3.Database(DBSOURCE, (err) => {
        if (err) {
            console.error(err.message);
            callback(err);
        } else {
            console.log('Connected to the SQLite database.');
            db.serialize(() => {
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
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS folders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    parent_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES folders(id)
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE,
                    value TEXT
                )`, (err) => {
                    callback(err);
                });
            });
        }
    });
};

export const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized!');
    }
    return db;
};
