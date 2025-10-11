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
    await db.exec(`CREATE TABLE IF NOT EXISTS folders (id INTEGER PRIMARY KEY, name TEXT, parent_id INTEGER, sort_order INTEGER)`);
    await db.exec(`CREATE TABLE IF NOT EXISTS prompts (id INTEGER PRIMARY KEY, title TEXT, prompt TEXT, tags TEXT, folder_id INTEGER, is_favorite INTEGER)`);
    app.use(cors());
    app.use(express.json());
    app.get('/api/folders', async (req, res) => {
        const folders = await db.all('SELECT * FROM folders ORDER BY sort_order');
        res.json(folders);
    });
    app.post('/api/folders', async (req, res) => {
        const { name, parent_id } = req.body;
        const result = await db.run('INSERT INTO folders (name, parent_id) VALUES (?, ?)', name, parent_id);
        res.json({ id: result.lastID, name, parent_id });
    });
    app.put('/api/folders/:id', async (req, res) => {
        const { name } = req.body;
        await db.run('UPDATE folders SET name = ? WHERE id = ?', name, req.params.id);
        res.json({ id: req.params.id, name });
    });
    app.delete('/api/folders/:id', async (req, res) => {
        await db.run('DELETE FROM prompts WHERE folder_id = ?', req.params.id);
        await db.run('DELETE FROM folders WHERE id = ?', req.params.id);
        res.json({ message: 'deleted' });
    });
    app.put('/api/folders/:id/move', async (req, res) => {
        const { parent_id } = req.body;
        await db.run('UPDATE folders SET parent_id = ? WHERE id = ?', parent_id, req.params.id);
        res.json({ message: 'moved' });
    });
    app.get('/api/prompts', async (req, res) => {
        const { folderId } = req.query;
        let prompts;
        if (folderId) {
            prompts = await db.all('SELECT * FROM prompts WHERE folder_id = ?', folderId);
        }
        else {
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
