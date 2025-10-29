import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { suggestTags, refinePrompt, suggestTitle } from './services/serverAiService.js';
dotenv.config();
async function main() {
    const app = express();
    const port = 3001;
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    console.log('Database pool initialized successfully.');
    // Migration logic
    const migrate = async () => {
        // Check for is_system column in folders table
        const folderInfo = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='folders' AND column_name='is_system'
        `);
        if (folderInfo.rowCount === 0) {
            await pool.query('ALTER TABLE folders ADD COLUMN is_system INTEGER DEFAULT 0');
        }
        // Check for deleted_at column in prompts table
        const promptInfo = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='prompts' AND column_name='deleted_at'
        `);
        if (promptInfo.rowCount === 0) {
            await pool.query('ALTER TABLE prompts ADD COLUMN deleted_at TIMESTAMP');
        }
    };
    await pool.query(`CREATE TABLE IF NOT EXISTS folders (id SERIAL PRIMARY KEY, name TEXT, parent_id INTEGER, sort_order INTEGER, is_system INTEGER DEFAULT 0)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS prompts (id SERIAL PRIMARY KEY, title TEXT, prompt TEXT, tags TEXT, folder_id INTEGER, is_favorite INTEGER, deleted_at TIMESTAMP)`);
    await migrate();
    const trashFolderRes = await pool.query('SELECT * FROM folders WHERE is_system = 1 AND name = ', ['Trash']);
    if (trashFolderRes.rowCount === 0) {
        await pool.query('INSERT INTO folders (name, is_system, sort_order) VALUES (, 1, 9999)', ['Trash']);
    }
    app.use(cors());
    app.use(express.json());
    app.get('/api/folders', async (req, res) => {
        const { rows } = await pool.query('SELECT * FROM folders WHERE is_system = 0 ORDER BY sort_order');
        res.json(rows);
    });
    app.get('/api/trash-folder', async (req, res) => {
        const { rows } = await pool.query('SELECT * FROM folders WHERE is_system = 1 AND name = ', ['Trash']);
        res.json(rows[0]);
    });
    app.post('/api/folders', async (req, res) => {
        const { name, parent_id } = req.body;
        if (parent_id) {
            const parentFolderRes = await pool.query('SELECT * FROM folders WHERE id = ', [parent_id]);
            if (parentFolderRes && parentFolderRes.rowCount > 0 && parentFolderRes.rows[0].is_system) {
                return res.status(403).json({ error: 'Cannot create subfolders in a system folder.' });
            }
        }
        const parentIdCheck = parent_id === null ? "IS NULL" : "= ";
        const params = parent_id === null ? [] : [parent_id];
        const maxOrderRes = await pool.query(`SELECT MAX(sort_order) as max FROM folders WHERE parent_id ${parentIdCheck}`, params);
        const sort_order = (maxOrderRes.rows[0].max || 0) + 1;
        const result = await pool.query('INSERT INTO folders (name, parent_id, sort_order) VALUES (, $2, $3) RETURNING id', [name, parent_id, sort_order]);
        res.json({ id: result.rows[0].id, name, parent_id, sort_order });
    });
    app.put('/api/folders/:id', async (req, res) => {
        const folderRes = await pool.query('SELECT * FROM folders WHERE id = ', [req.params.id]);
        if (folderRes && folderRes.rowCount > 0 && folderRes.rows[0].is_system) {
            return res.status(403).json({ error: 'System folders cannot be modified.' });
        }
        const { name } = req.body;
        await pool.query('UPDATE folders SET name =  WHERE id = $2', [name, req.params.id]);
        res.json({ id: req.params.id, name });
    });
    app.delete('/api/folders/:id', async (req, res) => {
        const trashFolderRes = await pool.query('SELECT id FROM folders WHERE is_system = 1 AND name = ', ['Trash']);
        if (trashFolderRes.rowCount === 0) {
            return res.status(500).json({ error: 'Trash folder not found' });
        }
        await pool.query('UPDATE prompts SET folder_id =  WHERE folder_id = $2', [trashFolderRes.rows[0].id, req.params.id]);
        await pool.query('DELETE FROM folders WHERE id = ', [req.params.id]);
        res.json({ message: 'deleted' });
    });
    app.put('/api/folders/:id/reorder', async (req, res) => {
        const { direction } = req.body; // 'up' or 'down'
        const folderId = Number(req.params.id);
        try {
            await pool.query('BEGIN');
            const folderRes = await pool.query('SELECT * FROM folders WHERE id = ', [folderId]);
            if (folderRes.rowCount === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Folder not found' });
            }
            const folder = folderRes.rows[0];
            const parentIdCheck = folder.parent_id === null ? "IS NULL" : "= ";
            const params = folder.parent_id === null ? [folder.sort_order] : [folder.parent_id, folder.sort_order];
            let otherFolderRes;
            if (direction === 'up') {
                otherFolderRes = await pool.query(`SELECT * FROM folders WHERE parent_id ${parentIdCheck} AND sort_order < ${params.length + 1} ORDER BY sort_order DESC LIMIT 1`, params);
            }
            else { // down
                otherFolderRes = await pool.query(`SELECT * FROM folders WHERE parent_id ${parentIdCheck} AND sort_order > ${params.length + 1} ORDER BY sort_order ASC LIMIT 1`, params);
            }
            if (otherFolderRes && otherFolderRes.rowCount > 0) {
                const otherFolder = otherFolderRes.rows[0];
                await pool.query('UPDATE folders SET sort_order = $1 WHERE id = $2', [otherFolder.sort_order, folder.id]);
                await pool.query('UPDATE folders SET sort_order = $1 WHERE id = $2', [folder.sort_order, otherFolder.id]);
            }
            await pool.query('COMMIT');
            res.json({ message: 'reordered' });
        }
        catch (error) {
            await pool.query('ROLLBACK');
            res.status(500).json({ error: 'Failed to reorder folder' });
        }
    });
    app.put('/api/folders/:id/move', async (req, res) => {
        const folderId = Number(req.params.id);
        const folderRes = await pool.query('SELECT * FROM folders WHERE id = $1', [folderId]);
        if (folderRes && folderRes.rowCount > 0 && folderRes.rows[0].is_system) {
            return res.status(403).json({ error: 'System folders cannot be moved.' });
        }
        const { parent_id } = req.body;
        if (folderId === Number(parent_id)) {
            return res.status(400).json({ error: "A folder cannot be moved into itself." });
        }
        if (parent_id !== null) {
            const sql = `
                WITH RECURSIVE subfolders(id) AS (
                    SELECT ::integer AS id
                    UNION ALL
                    SELECT f.id FROM folders f JOIN subfolders s ON f.parent_id = s.id
                )
                SELECT id FROM subfolders;
            `;
            const descendantsRes = await pool.query(sql, [folderId]);
            const descendantIds = descendantsRes.rows.map(d => d.id);
            if (descendantIds.includes(Number(parent_id))) {
                return res.status(400).json({ error: "A folder cannot be moved into its own subfolder." });
            }
        }
        await pool.query('UPDATE folders SET parent_id =  WHERE id = $2', [parent_id, folderId]);
        res.json({ message: 'moved' });
    });
    app.get('/api/folders/:id/prompts', async (req, res) => {
        try {
            const folderId = req.params.id;
            const sql = `
                WITH RECURSIVE subfolders(id) AS (
                    SELECT ::integer AS id
                    UNION ALL
                    SELECT f.id FROM folders f JOIN subfolders s ON f.parent_id = s.id
                )
                SELECT p.* FROM prompts p JOIN subfolders sf ON p.folder_id = sf.id;
            `;
            const { rows } = await pool.query(sql, [folderId]);
            res.json(rows.map((prompt) => ({
                ...prompt,
                tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
                is_favorite: !!prompt.is_favorite,
            })));
        }
        catch (err) {
            res.status(400).json({ "error": err.message });
        }
    });
    app.get('/api/prompts', async (req, res) => {
        const { folderId } = req.query;
        let promptsRes;
        if (folderId) {
            promptsRes = await pool.query('SELECT * FROM prompts WHERE folder_id = ', [folderId]);
        }
        else {
            promptsRes = await pool.query('SELECT * FROM prompts');
        }
        res.json(promptsRes.rows);
    });
    app.get('/api/prompts/:id', async (req, res) => {
        const { rows } = await pool.query('SELECT * FROM prompts WHERE id = ', [req.params.id]);
        res.json(rows[0]);
    });
    app.post('/api/prompts', async (req, res) => {
        const { title, prompt, tags, folder_id } = req.body;
        const result = await pool.query('INSERT INTO prompts (title, prompt, tags, folder_id) VALUES (, $2, $3, $4) RETURNING id', [title, prompt, JSON.stringify(tags), folder_id]);
        res.json({ id: result.rows[0].id, ...req.body });
    });
    app.put('/api/prompts/:id', async (req, res) => {
        const { title, prompt, tags, folder_id } = req.body;
        await pool.query('UPDATE prompts SET title = , prompt = $2, tags = $3, folder_id = $4 WHERE id = $5', [title, prompt, JSON.stringify(tags), folder_id, req.params.id]);
        res.json({ message: 'updated' });
    });
    app.put('/api/prompts/:id/favorite', async (req, res) => {
        const { is_favorite } = req.body;
        await pool.query('UPDATE prompts SET is_favorite =  WHERE id = $2', [is_favorite, req.params.id]);
        res.json({ message: 'updated' });
    });
    app.put('/api/prompts/:id/move-to-trash', async (req, res) => {
        const trashFolderRes = await pool.query('SELECT id FROM folders WHERE is_system = 1 AND name = ', ['Trash']);
        if (trashFolderRes.rowCount === 0) {
            return res.status(500).json({ error: 'Trash folder not found' });
        }
        await pool.query('UPDATE prompts SET folder_id =  WHERE id = $2', [trashFolderRes.rows[0].id, req.params.id]);
        res.json({ message: 'moved to trash' });
    });
    app.delete('/api/prompts/:id', async (req, res) => {
        const result = await pool.query('DELETE FROM prompts WHERE id = ', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Prompt not found' });
        }
        res.json({ message: 'deleted' });
    });
    app.get('/api/tags/top', async (req, res) => {
        const { rows } = await pool.query('SELECT tags FROM prompts');
        const tagCounts = new Map();
        rows.forEach((row) => {
            try {
                const tags = JSON.parse(row.tags);
                if (Array.isArray(tags)) {
                    tags.forEach(tag => {
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    });
                }
            }
            catch (e) { }
        });
        const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(entry => entry[0]);
        res.json(sortedTags);
    });
    app.post('/api/ai/suggest-tags', async (req, res) => {
        try {
            const { promptContent, selectedModel } = req.body;
            const tags = await suggestTags(promptContent, selectedModel);
            res.json({ suggestedTags: tags });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get AI tag suggestions.', details: error.message });
        }
    });
    app.post('/api/ai/refine-prompt', async (req, res) => {
        try {
            const { promptContent, selectedModel, persona, task, context, format, max_tokens } = req.body;
            const refined = await refinePrompt(promptContent, selectedModel, { persona, task, context, format, max_tokens });
            res.json({ refinedPrompt: refined });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to refine prompt.', details: error.message });
        }
    });
    app.post('/api/ai/suggest-title', async (req, res) => {
        try {
            const { promptContent, selectedModel } = req.body;
            const title = await suggestTitle(promptContent, selectedModel);
            res.json({ suggestedTitle: title });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to suggest title.', details: error.message });
        }
    });
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}
main();
