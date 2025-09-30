import sqlite3 from 'sqlite3';

const sqlite3Verbose = sqlite3.verbose();

const DBSOURCE = "prompts.db";

let db: sqlite3.Database;

export const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized!');
    }
    return db;
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
                    is_favorite INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (folder_id) REFERENCES folders(id)
                )`, (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }

                    // Migration: Add is_favorite column if it doesn't exist
                    db.all("PRAGMA table_info(prompts)", (err, columns) => {
                        if (err) {
                            console.error("Error checking table info for is_favorite column:", err);
                            callback(err);
                            return;
                        }
                        const hasIsFavoriteColumn = columns.some((col: any) => col.name === 'is_favorite');

                        if (!hasIsFavoriteColumn) {
                            console.log('Migrating prompts table: adding is_favorite column.');
                            db.run(`ALTER TABLE prompts ADD COLUMN is_favorite INTEGER DEFAULT 0`, (err) => {
                                if (err) {
                                    console.error("Error adding is_favorite column:", err);
                                    callback(err);
                                } else {
                                    console.log('is_favorite column added to prompts table.');
                                    // Proceed with context column migration or create settings table
                                    handleContextColumnMigration(callback, columns);
                                }
                            });
                        } else {
                            // If column already exists, just proceed
                            handleContextColumnMigration(callback, columns);
                        }
                    });
                });
            });
        }
    });
};

export const updatePromptFavoriteStatus = (promptId: string, isFavorite: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
        const db = getDB();
        db.run(
            `UPDATE prompts SET is_favorite = ? WHERE id = ?`,
            [isFavorite ? 1 : 0, promptId],
            function (err) {
                if (err) {
                    console.error("Error updating prompt favorite status:", err.message);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
};

const handleContextColumnMigration = (callback: (err: Error | null) => void, columns: any[]) => {
    const hasContextColumn = columns.some((col: any) => col.name === 'context');

    if (hasContextColumn) {
        console.log('Migrating prompts table: removing context column.');
        getDB().serialize(() => {
            getDB().run(`CREATE TABLE prompts_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                prompt TEXT,
                description TEXT,
                tags TEXT,
                folder_id INTEGER,
                is_favorite INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (folder_id) REFERENCES folders(id)
            )`);
            
            const cols = columns.filter(c => c.name !== 'context').map(c => c.name).join(', ');
            getDB().run(`INSERT INTO prompts_new (${cols}) SELECT ${cols} FROM prompts`);
            
            getDB().run(`DROP TABLE prompts`);
            getDB().run(`ALTER TABLE prompts_new RENAME TO prompts`, (err) => {
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
};