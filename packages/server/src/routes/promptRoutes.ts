import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { QueryResult } from 'pg';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { folderId } = req.query;
    let promptsRes;
    if (folderId) {
        promptsRes = await pool.query('SELECT * FROM prompts WHERE folder_id = $1 AND user_id = $2', [folderId, userId]);
    } else {
        promptsRes = await pool.query('SELECT * FROM prompts WHERE user_id = $1', [userId]);
    }
    res.json(promptsRes.rows);
});

router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { rows } = await pool.query('SELECT * FROM prompts WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    res.json(rows[0]);
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { title, prompt, tags, folder_id } = req.body;
    const result = await pool.query('INSERT INTO prompts (title, prompt, tags, folder_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id', [title, prompt, JSON.stringify(tags), folder_id, userId]);
    res.json({ id: result.rows[0].id, ...req.body });
});

router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { title, prompt, tags, folder_id } = req.body;
    const result = await pool.query('UPDATE prompts SET title = $1, prompt = $2, tags = $3, folder_id = $4 WHERE id = $5 AND user_id = $6 RETURNING *', [title, prompt, JSON.stringify(tags), folder_id, req.params.id, userId]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(result.rows[0]);
});

router.put('/:id/favorite', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { is_favorite } = req.body;
    await pool.query('UPDATE prompts SET is_favorite = $1 WHERE id = $2 AND user_id = $3', [is_favorite, req.params.id, userId]);
    res.json({ message: 'updated' });
});

router.put('/:id/move-to-trash', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const trashFolderRes: QueryResult = await pool.query('SELECT id FROM folders WHERE is_system = 1 AND name = $1 AND user_id = $2', ['Trash', userId]);
    if (trashFolderRes.rowCount === 0) {
        return res.status(500).json({ error: 'Trash folder not found' });
    }
    await pool.query('UPDATE prompts SET folder_id = $1 WHERE id = $2 AND user_id = $3', [trashFolderRes.rows[0].id, req.params.id, userId]);
    res.json({ message: 'moved to trash' });
});

router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const result = await pool.query('DELETE FROM prompts WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json({ message: 'deleted' });
});

export default router;
