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
                    sort_order INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES folders(id)
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS prompts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    prompt TEXT,
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

                        // Migration: Add sort_order column to folders if it doesn't exist
                        db.all("PRAGMA table_info(folders)", (err, columns) => {
                            if (err) {
                                console.error("Error checking table info for sort_order column:", err);
                                callback(err);
                                return;
                            }
                            const hasSortOrderColumn = columns.some((col: any) => col.name === 'sort_order');
                            if (!hasSortOrderColumn) {
                                db.run("ALTER TABLE folders ADD COLUMN sort_order INTEGER", (err) => {
                                    if (err) {
                                        console.error("Error adding sort_order column:", err);
                                        callback(err);
                                    }
                                });
                            }

                            // Populate sort_order for existing rows
                            db.all("SELECT id FROM folders WHERE sort_order IS NULL", [], (err, rows: any[]) => {
                                if (err) {
                                    console.error("Error selecting folders to update sort_order:", err);
                                    callback(err);
                                    return;
                                }
                                db.serialize(() => {
                                    rows.forEach(row => {
                                        db.run("UPDATE folders SET sort_order = ? WHERE id = ?", [row.id, row.id]);
                                    });
                                });
                            });
                        });
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
