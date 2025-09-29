"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var database_1 = require("./services/database");
var cors_1 = require("cors");
var app = (0, express_1.default)();
var port = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize the database
(0, database_1.initDB)(function (err) {
    if (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
    else {
        console.log('Database initialized successfully.');
    }
});
// Folder API endpoints
app.get('/api/folders', function (req, res) {
    var db = (0, database_1.getDB)();
    db.all("SELECT * FROM folders", [], function (err, rows) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});
app.post('/api/folders', function (req, res) {
    var db = (0, database_1.getDB)();
    var _a = req.body, name = _a.name, parent_id = _a.parent_id;
    var sql = "INSERT INTO folders (name, parent_id) VALUES (?, ?)";
    db.run(sql, [name, parent_id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ id: this.lastID, name: name, parent_id: parent_id });
    });
});
app.put('/api/folders/:id', function (req, res) {
    var db = (0, database_1.getDB)();
    var name = req.body.name;
    var sql = "UPDATE folders SET name = ? WHERE id = ?";
    db.run(sql, [name, req.params.id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ id: req.params.id, name: name });
    });
});
app.delete('/api/folders/:id', function (req, res) {
    var db = (0, database_1.getDB)();
    var sql = "DELETE FROM folders WHERE id = ?";
    db.run(sql, [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        // Also delete prompts in this folder
        var deletePromptsSql = "DELETE FROM prompts WHERE folder_id = ?";
        db.run(deletePromptsSql, [req.params.id], function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({ message: 'deleted' });
        });
    });
});
app.put('/api/folders/:id/move', function (req, res) {
    var db = (0, database_1.getDB)();
    var parent_id = req.body.parent_id;
    var sql = "UPDATE folders SET parent_id = ? WHERE id = ?";
    db.run(sql, [parent_id, req.params.id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ message: 'moved' });
    });
});
// Prompt API endpoints
app.get('/api/prompts', function (req, res) {
    var db = (0, database_1.getDB)();
    var folderId = req.query.folderId;
    var sql = "SELECT * FROM prompts";
    var params = [];
    if (folderId) {
        sql += " WHERE folder_id = ?";
        params.push(folderId);
    }
    db.all(sql, params, function (err, rows) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});
app.get('/api/prompts/:id', function (req, res) {
    var db = (0, database_1.getDB)();
    var sql = "SELECT * FROM prompts WHERE id = ?";
    db.get(sql, [req.params.id], function (err, row) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(row);
    });
});
app.post('/api/prompts', function (req, res) {
    var db = (0, database_1.getDB)();
    var _a = req.body, title = _a.title, prompt = _a.prompt, context = _a.context, description = _a.description, tags = _a.tags, folder_id = _a.folder_id;
    var sql = "INSERT INTO prompts (title, prompt, context, description, tags, folder_id) VALUES (?, ?, ?, ?, ?, ?)";
    var params = [title, prompt, context, description, JSON.stringify(tags), folder_id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(__assign({ id: this.lastID }, req.body));
    });
});
app.put('/api/prompts/:id', function (req, res) {
    var db = (0, database_1.getDB)();
    var _a = req.body, title = _a.title, prompt = _a.prompt, context = _a.context, description = _a.description, tags = _a.tags, folder_id = _a.folder_id;
    var sql = "UPDATE prompts SET title = ?, prompt = ?, context = ?, description = ?, tags = ?, folder_id = ? WHERE id = ?";
    var params = [title, prompt, context, description, JSON.stringify(tags), folder_id, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ message: 'updated' });
    });
});
app.listen(port, function () {
    console.log("Server is running on http://localhost:".concat(port));
});
