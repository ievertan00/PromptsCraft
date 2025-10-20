import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { suggestTags, refinePrompt, suggestTitle } from './services/serverAiService.js';

dotenv.config();

async function main() {
    const app = express();
    const port = 3001;

    const db = await open({
        filename: './prompts.db',
        driver: sqlite3.Database
    });

    console.log('Database initialized successfully.');

    // Migration logic
    const migrate = async () => {
        const folderInfo = await db.all("PRAGMA table_info(folders)");
        const folderColumns = folderInfo.map(c => c.name);
        if (!folderColumns.includes('is_system')) {
            await db.exec('ALTER TABLE folders ADD COLUMN is_system INTEGER DEFAULT 0');
        }

        const promptInfo = await db.all("PRAGMA table_info(prompts)");
        const promptColumns = promptInfo.map(c => c.name);
        if (!promptColumns.includes('deleted_at')) {
            await db.exec('ALTER TABLE prompts ADD COLUMN deleted_at DATETIME');
        }
    };

    await migrate();

    await db.exec(`CREATE TABLE IF NOT EXISTS folders (id INTEGER PRIMARY KEY, name TEXT, parent_id INTEGER, sort_order INTEGER)`);
    await db.exec(`CREATE TABLE IF NOT EXISTS prompts (id INTEGER PRIMARY KEY, title TEXT, prompt TEXT, tags TEXT, folder_id INTEGER, is_favorite INTEGER)`);

    const trashFolder = await db.get('SELECT * FROM folders WHERE is_system = 1 AND name = ?', 'Trash');
    if (!trashFolder) {
        await db.run('INSERT INTO folders (name, is_system, sort_order) VALUES (?, 1, 9999)', 'Trash');
    }

    app.use(cors());
    app.use(express.json());

    app.get('/api/folders', async (req, res) => {
        const folders = await db.all('SELECT * FROM folders WHERE is_system = 0 ORDER BY sort_order');
        res.json(folders);
    });

    app.get('/api/trash-folder', async (req, res) => {
        const trashFolder = await db.get('SELECT * FROM folders WHERE is_system = 1 AND name = ?', 'Trash');
        res.json(trashFolder);
    });

    app.post('/api/folders', async (req, res) => {
        const { name, parent_id } = req.body;

        if (parent_id) {
            const parentFolder = await db.get('SELECT * FROM folders WHERE id = ?', parent_id);
            if (parentFolder && parentFolder.is_system) {
                return res.status(403).json({ error: 'Cannot create subfolders in a system folder.' });
            }
        }

        const parentIdCheck = parent_id === null ? "IS NULL" : "= ?";
        const params = parent_id === null ? [] : [parent_id];
        const maxOrder = await db.get(`SELECT MAX(sort_order) as max FROM folders WHERE parent_id ${parentIdCheck}`, ...params);
        const sort_order = (maxOrder.max || 0) + 1;
        const result = await db.run('INSERT INTO folders (name, parent_id, sort_order) VALUES (?, ?, ?)', name, parent_id, sort_order);
        res.json({ id: result.lastID, name, parent_id, sort_order });
    });

    app.put('/api/folders/:id', async (req, res) => {
        const folder = await db.get('SELECT * FROM folders WHERE id = ?', req.params.id);
        if (folder && folder.is_system) {
            return res.status(403).json({ error: 'System folders cannot be modified.' });
        }
        const { name } = req.body;
        await db.run('UPDATE folders SET name = ? WHERE id = ?', name, req.params.id);
        res.json({ id: req.params.id, name });
    });

    app.delete('/api/folders/:id', async (req, res) => {
        const trashFolder = await db.get('SELECT id FROM folders WHERE is_system = 1 AND name = ?', 'Trash');
        if (!trashFolder) {
            return res.status(500).json({ error: 'Trash folder not found' });
        }
        await db.run('UPDATE prompts SET folder_id = ? WHERE folder_id = ?', trashFolder.id, req.params.id);
        await db.run('DELETE FROM folders WHERE id = ?', req.params.id);
        res.json({ message: 'deleted' });
    });

    app.put('/api/folders/:id/reorder', async (req, res) => {
        const { direction } = req.body; // 'up' or 'down'
        const folderId = Number(req.params.id);

        try {
            await db.exec('BEGIN TRANSACTION');

            const folder = await db.get('SELECT * FROM folders WHERE id = ?', folderId);
            if (!folder) {
                await db.exec('ROLLBACK');
                return res.status(404).json({ error: 'Folder not found' });
            }

            const parentIdCheck = folder.parent_id === null ? "IS NULL" : "= ?";
            const params = folder.parent_id === null ? [folder.sort_order] : [folder.parent_id, folder.sort_order];

            let otherFolder;
            if (direction === 'up') {
                otherFolder = await db.get(
                    `SELECT * FROM folders WHERE parent_id ${parentIdCheck} AND sort_order < ? ORDER BY sort_order DESC LIMIT 1`,
                    ...params
                );
            } else { // down
                otherFolder = await db.get(
                    `SELECT * FROM folders WHERE parent_id ${parentIdCheck} AND sort_order > ? ORDER BY sort_order ASC LIMIT 1`,
                    ...params
                );
            }

            if (otherFolder) {
                await db.run('UPDATE folders SET sort_order = ? WHERE id = ?', otherFolder.sort_order, folder.id);
                await db.run('UPDATE folders SET sort_order = ? WHERE id = ?', folder.sort_order, otherFolder.id);
            }

            await db.exec('COMMIT');
            res.json({ message: 'reordered' });
        } catch (error) {
            await db.exec('ROLLBACK');
            res.status(500).json({ error: 'Failed to reorder folder' });
        }
    });

    app.put('/api/folders/:id/move', async (req, res) => {
        const folderId = Number(req.params.id);
        const folder = await db.get('SELECT * FROM folders WHERE id = ?', folderId);
        if (folder && folder.is_system) {
            return res.status(403).json({ error: 'System folders cannot be moved.' });
        }

        const { parent_id } = req.body;

        if (folderId === Number(parent_id)) {
            return res.status(400).json({ error: "A folder cannot be moved into itself." });
        }

        if (parent_id !== null) {
            const sql = `
                WITH RECURSIVE subfolders(id) AS (
                    SELECT ?
                    UNION ALL
                    SELECT f.id FROM folders f JOIN subfolders s ON f.parent_id = s.id
                )
                SELECT id FROM subfolders;
            `;
            const descendants = await db.all(sql, folderId);
            const descendantIds = descendants.map(d => d.id);

            if (descendantIds.includes(Number(parent_id))) {
                return res.status(400).json({ error: "A folder cannot be moved into its own subfolder." });
            }
        }

        await db.run('UPDATE folders SET parent_id = ? WHERE id = ?', parent_id, folderId);
        res.json({ message: 'moved' });
    });

    app.get('/api/folders/:id/prompts', async (req, res) => {
        try {
            const folderId = req.params.id;
            const sql = `
                WITH RECURSIVE subfolders(id) AS (
                    SELECT ?
                    UNION ALL
                    SELECT f.id FROM folders f JOIN subfolders s ON f.parent_id = s.id
                )
                SELECT p.* FROM prompts p JOIN subfolders sf ON p.folder_id = sf.id;
            `;
            const prompts = await db.all(sql, folderId);
            res.json(prompts.map((prompt: any) => ({
                ...prompt,
                tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
                is_favorite: !!prompt.is_favorite,
            })));
        } catch (err) {
            res.status(400).json({"error": (err as Error).message});
        }
    });

    app.get('/api/prompts', async (req, res) => {
        const { folderId } = req.query;
        let prompts;
        if (folderId) {
            prompts = await db.all('SELECT * FROM prompts WHERE folder_id = ?', folderId);
        } else {
            prompts = await db.all('SELECT * FROM prompts');
        }
        res.json(prompts);
    });

    app.get('/api/prompts/:id', async (req, res) => {
        const prompt = await db.get('SELECT * FROM prompts WHERE id = ?', req.params.id);
        res.json(prompt);
    });

    app.post('/api/prompts', async (req, res) => {
        const { title, prompt, tags, folder_id } = req.body;
        const result = await db.run('INSERT INTO prompts (title, prompt, tags, folder_id) VALUES (?, ?, ?, ?)', title, prompt, JSON.stringify(tags), folder_id);
        res.json({ id: result.lastID, ...req.body });
    });

    app.put('/api/prompts/:id', async (req, res) => {
        const { title, prompt, tags, folder_id } = req.body;
        await db.run('UPDATE prompts SET title = ?, prompt = ?, tags = ?, folder_id = ? WHERE id = ?', title, prompt, JSON.stringify(tags), folder_id, req.params.id);
        res.json({ message: 'updated' });
    });

    app.put('/api/prompts/:id/favorite', async (req, res) => {
        const { is_favorite } = req.body;
        await db.run('UPDATE prompts SET is_favorite = ? WHERE id = ?', is_favorite, req.params.id);
        res.json({ message: 'updated' });
    });

    app.put('/api/prompts/:id/move-to-trash', async (req, res) => {
        const trashFolder = await db.get('SELECT id FROM folders WHERE is_system = 1 AND name = ?', 'Trash');
        if (!trashFolder) {
            return res.status(500).json({ error: 'Trash folder not found' });
        }
        await db.run('UPDATE prompts SET folder_id = ? WHERE id = ?', trashFolder.id, req.params.id);
        res.json({ message: 'moved to trash' });
    });

    app.delete('/api/prompts/:id', async (req, res) => {
        const result = await db.run('DELETE FROM prompts WHERE id = ?', req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Prompt not found' });
        }
        res.json({ message: 'deleted' });
    });

    app.get('/api/tags/top', async (req, res) => {
        const rows = await db.all('SELECT tags FROM prompts');
        const tagCounts = new Map();
        rows.forEach((row: any) => {
            try {
                const tags = JSON.parse(row.tags);
                if (Array.isArray(tags)) {
                    tags.forEach(tag => {
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    });
                }
            } catch (e) {}
        });
        const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(entry => entry[0]);
        res.json(sortedTags);
    });

    app.post('/api/ai/suggest-tags', async (req, res) => {
        try {
            const { promptContent, selectedModel } = req.body;
            const tags = await suggestTags(promptContent, selectedModel);
            res.json({ suggestedTags: tags });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get AI tag suggestions.', details: (error as Error).message });
        }
    });

    app.post('/api/ai/refine-prompt', async (req, res) => {
        try {
            const { promptContent, selectedModel, persona, task, context, format, max_tokens } = req.body;
            const refined = await refinePrompt(promptContent, selectedModel, { persona, task, context, format, max_tokens });
            res.json({ refinedPrompt: refined });
        } catch (error) {
            res.status(500).json({ error: 'Failed to refine prompt.', details: (error as Error).message });
        }
    });

    app.post('/api/ai/suggest-title', async (req, res) => {
        try {
            const { promptContent, selectedModel } = req.body;
            const title = await suggestTitle(promptContent, selectedModel);
            res.json({ suggestedTitle: title });
        } catch (error) {
            res.status(500).json({ error: 'Failed to suggest title.', details: (error as Error).message });
        }
    });

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

main();