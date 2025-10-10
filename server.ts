import express from 'express';
import { initDB, getDB } from './services/database.js';
import cors from 'cors';
import { suggestTags, refinePrompt, suggestTitle } from './services/serverAiService.js';
import dotenv from 'dotenv';

dotenv.config();

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
    db.all("SELECT * FROM folders ORDER BY sort_order", [], (err, rows) => {
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
    const query = parent_id === null
        ? "SELECT MAX(sort_order) as max_sort_order FROM folders WHERE parent_id IS NULL"
        : "SELECT MAX(sort_order) as max_sort_order FROM folders WHERE parent_id = ?";
    const params = parent_id === null ? [] : [parent_id];

    db.get(query, params, (err, row: any) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        const newSortOrder = (row.max_sort_order || 0) + 1;
        const sql = `INSERT INTO folders (name, parent_id, sort_order) VALUES (?, ?, ?)`;
        db.run(sql, [name, parent_id, newSortOrder], function(err) {
            if (err) {
                res.status(400).json({"error":err.message});
                return;
            }
            res.json({ id: this.lastID, name, parent_id, sort_order: newSortOrder });
        });
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

app.put('/api/folders/:id/move-up', (req, res) => {
    const db = getDB();
    const folderId = req.params.id;
    db.get("SELECT * FROM folders WHERE id = ?", [folderId], (err, folder: any) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        if (!folder) {
            res.status(404).json({"error":"Folder not found"});
            return;
        }
        const parentId = folder.parent_id;
        const currentSortOrder = folder.sort_order;
        const query = parentId === null 
            ? "SELECT * FROM folders WHERE parent_id IS NULL AND sort_order < ? ORDER BY sort_order DESC LIMIT 1"
            : "SELECT * FROM folders WHERE parent_id = ? AND sort_order < ? ORDER BY sort_order DESC LIMIT 1";
        const params = parentId === null ? [currentSortOrder] : [parentId, currentSortOrder];
        
        db.get(query, params, (err, sibling: any) => {
            if (err) {
                res.status(400).json({"error":err.message});
                return;
            }
            if (sibling) {
                db.serialize(() => {
                    db.run("UPDATE folders SET sort_order = ? WHERE id = ?", [sibling.sort_order, folderId]);
                    db.run("UPDATE folders SET sort_order = ? WHERE id = ?", [currentSortOrder, sibling.id]);
                });
            }
            res.json({ message: 'moved up' });
        });
    });
});

app.put('/api/folders/:id/move-down', (req, res) => {
    const db = getDB();
    const folderId = req.params.id;
    db.get("SELECT * FROM folders WHERE id = ?", [folderId], (err, folder: any) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        if (!folder) {
            res.status(404).json({"error":"Folder not found"});
            return;
        }
        const parentId = folder.parent_id;
        const currentSortOrder = folder.sort_order;
        const query = parentId === null
            ? "SELECT * FROM folders WHERE parent_id IS NULL AND sort_order > ? ORDER BY sort_order ASC LIMIT 1"
            : "SELECT * FROM folders WHERE parent_id = ? AND sort_order > ? ORDER BY sort_order ASC LIMIT 1";
        const params = parentId === null ? [currentSortOrder] : [parentId, currentSortOrder];

        db.get(query, params, (err, sibling: any) => {
            if (err) {
                res.status(400).json({"error":err.message});
                return;
            }
            if (sibling) {
                db.serialize(() => {
                    db.run("UPDATE folders SET sort_order = ? WHERE id = ?", [sibling.sort_order, folderId]);
                    db.run("UPDATE folders SET sort_order = ? WHERE id = ?", [currentSortOrder, sibling.id]);
                });
            }
            res.json({ message: 'moved down' });
        });
    });
});


app.get('/api/folders/:id/prompts', (req, res) => {
    const db = getDB();
    const folderId = req.params.id;

    const sql = `
        WITH RECURSIVE subfolders(id) AS (
            SELECT ?
            UNION ALL
            SELECT f.id FROM folders f JOIN subfolders s ON f.parent_id = s.id
        )
        SELECT p.* FROM prompts p JOIN subfolders sf ON p.folder_id = sf.id;
    `;

    db.all(sql, [folderId], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json(rows);
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
    const { title, prompt, tags, folder_id } = req.body;
    const sql = `INSERT INTO prompts (title, prompt, tags, folder_id) VALUES (?, ?, ?, ?)`;
    const params = [title, prompt, JSON.stringify(tags), folder_id];
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
    const { title, prompt, tags, folder_id } = req.body;
    const sql = `UPDATE prompts SET title = ?, prompt = ?, tags = ?, folder_id = ? WHERE id = ?`;
    const params = [title, prompt, JSON.stringify(tags), folder_id, req.params.id];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({ message: 'updated' });
    });
});

app.put('/api/prompts/:id/favorite', (req, res) => {
    const db = getDB();
    const { is_favorite } = req.body;
    const sql = `UPDATE prompts SET is_favorite = ? WHERE id = ?`;
    db.run(sql, [is_favorite, req.params.id], function(err) {
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

// Tag API endpoints
app.get('/api/tags/top', (req, res) => {
    const db = getDB();
    db.all("SELECT tags FROM prompts", [], (err, rows: { tags: string }[]) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }

        const tagCounts = new Map<string, number>();
        rows.forEach(row => {
            try {
                const tags = JSON.parse(row.tags);
                if (Array.isArray(tags)) {
                    tags.forEach(tag => {
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    });
                }
            } catch (e) {
                // Ignore prompts with invalid tag formats
            }
        });

        const sortedTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(entry => entry[0]);

        res.json(sortedTags);
    });
});


// AI Service Endpoints
app.post('/api/ai/suggest-tags', async (req, res) => {
    try {
        const { promptContent, selectedModel } = req.body;
        const tags = await suggestTags(promptContent, selectedModel);
        res.json({ suggestedTags: tags });
    } catch (error) {
        console.error('Error in /api/ai/suggest-tags:', error);
        res.status(500).json({ error: 'Failed to get AI tag suggestions.', details: error.message });
    }
});

app.post('/api/ai/refine-prompt', async (req, res) => {
    try {
        const { promptContent, selectedModel, persona, task, context, format, max_tokens } = req.body;
        const refined = await refinePrompt(promptContent, selectedModel, { persona, task, context, format, max_tokens });
        res.json({ refinedPrompt: refined });
    } catch (error) {
        console.error('Error in /api/ai/refine-prompt:', error);
        res.status(500).json({ error: 'Failed to refine prompt.', details: error.message });
    }
});

app.post('/api/ai/suggest-title', async (req, res) => {
    try {
        const { promptContent, selectedModel } = req.body;
        const title = await suggestTitle(promptContent, selectedModel);
        res.json({ suggestedTitle: title });
    } catch (error) {
        console.error('Error in /api/ai/suggest-title:', error);
        res.status(500).json({ error: 'Failed to suggest title.', details: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
