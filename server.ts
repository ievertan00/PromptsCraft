import express from 'express';
import { initDB, getDB } from './services/database.js';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize the database
initDB((err) => {
    if (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    } else {
        console.log('Database initialized successfully.');
    }
});

// Folder API endpoints
app.get('/api/folders', (req, res) => {
    const db = getDB();
    db.all("SELECT * FROM folders", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json(rows);
    });
});

app.post('/api/folders', (req, res) => {
    const db = getDB();
    const { name, parent_id } = req.body;
    const sql = `INSERT INTO folders (name, parent_id) VALUES (?, ?)`;
    db.run(sql, [name, parent_id], function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({ id: this.lastID, name, parent_id });
    });
});

app.put('/api/folders/:id', (req, res) => {
    const db = getDB();
    const { name } = req.body;
    const sql = `UPDATE folders SET name = ? WHERE id = ?`;
    db.run(sql, [name, req.params.id], function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({ id: req.params.id, name });
    });
});

app.delete('/api/folders/:id', (req, res) => {
    const db = getDB();
    const sql = `DELETE FROM folders WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        // Also delete prompts in this folder
        const deletePromptsSql = `DELETE FROM prompts WHERE folder_id = ?`;
        db.run(deletePromptsSql, [req.params.id], function(err) {
            if (err) {
                res.status(400).json({"error":err.message});
                return;
            }
            res.json({ message: 'deleted' });
        });
    });
});

app.put('/api/folders/:id/move', (req, res) => {
    const db = getDB();
    const { parent_id } = req.body;
    const sql = `UPDATE folders SET parent_id = ? WHERE id = ?`;
    db.run(sql, [parent_id, req.params.id], function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({ message: 'moved' });
    });
});


// Prompt API endpoints
app.get('/api/prompts', (req, res) => {
    const db = getDB();
    const folderId = req.query.folderId;
    let sql = "SELECT * FROM prompts";
    let params = [];
    if (folderId) {
        sql += " WHERE folder_id = ?";
        params.push(folderId);
    }
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json(rows);
    });
});

app.get('/api/prompts/:id', (req, res) => {
    const db = getDB();
    const sql = "SELECT * FROM prompts WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json(row);
    });
});

app.post('/api/prompts', (req, res) => {
    const db = getDB();
    const { title, prompt, description, tags, folder_id } = req.body;
    const sql = `INSERT INTO prompts (title, prompt, description, tags, folder_id) VALUES (?, ?, ?, ?, ?)`;
    const params = [title, prompt, description, JSON.stringify(tags), folder_id];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/prompts/:id', (req, res) => {
    const db = getDB();
    const { title, prompt, description, tags, folder_id } = req.body;
    const sql = `UPDATE prompts SET title = ?, prompt = ?, description = ?, tags = ?, folder_id = ? WHERE id = ?`;
    const params = [title, prompt, description, JSON.stringify(tags), folder_id, req.params.id];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({ message: 'updated' });
    });
});

app.delete('/api/prompts/:id', (req, res) => {
    const db = getDB();
    const id = parseInt(req.params.id, 10);
    const sql = `DELETE FROM prompts WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "error": "Prompt not found" });
            return;
        }
        res.json({ message: 'deleted' });
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
