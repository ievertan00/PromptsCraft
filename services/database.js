"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDB = exports.initDB = void 0;
var sqlite3 = require("sqlite3");
var DBSOURCE = "prompts.db";
var db;
var initDB = function (callback) {
    db = new sqlite3.Database(DBSOURCE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX, function (err) {
        if (err) {
            console.error(err.message);
            callback(err);
        }
        else {
            console.log('Connected to the SQLite database.');
            db.configure('busyTimeout', 3000); // Wait 3 seconds if database is busy
            db.serialize(function () {
                db.run("CREATE TABLE IF NOT EXISTS folders (\n                    id INTEGER PRIMARY KEY AUTOINCREMENT,\n                    name TEXT NOT NULL,\n                    parent_id INTEGER,\n                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                    FOREIGN KEY (parent_id) REFERENCES folders(id)\n                )");
                db.run("CREATE TABLE IF NOT EXISTS prompts (\n                    id INTEGER PRIMARY KEY AUTOINCREMENT,\n                    title TEXT,\n                    prompt TEXT,\n                    description TEXT,\n                    tags TEXT,\n                    folder_id INTEGER,\n                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                    FOREIGN KEY (folder_id) REFERENCES folders(id)\n                )", function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    // Add context column to prompts table if it doesn't exist
                    db.all("PRAGMA table_info(prompts)", function (err, columns) {
                        if (err) {
                            console.error("Error checking table info:", err);
                            callback(err);
                            return;
                        }
                        var hasContextColumn = columns.some(function (col) { return col.name === 'context'; });
                        if (!hasContextColumn) {
                            db.run("ALTER TABLE prompts ADD COLUMN context TEXT", function (err) {
                                if (err) {
                                    console.error("Error adding context column:", err);
                                    callback(err);
                                }
                                else {
                                    createSettingsTable(callback);
                                }
                            });
                        }
                        else {
                            createSettingsTable(callback);
                        }
                    });
                });
            });
        }
    });
};
exports.initDB = initDB;
var createSettingsTable = function (callback) {
    (0, exports.getDB)().run("CREATE TABLE IF NOT EXISTS settings (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        key TEXT UNIQUE,\n        value TEXT\n    )", function (err) {
        callback(err);
    });
};
var getDB = function () {
    if (!db) {
        throw new Error('Database not initialized!');
    }
    return db;
};
exports.getDB = getDB;
