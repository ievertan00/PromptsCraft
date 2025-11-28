import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/top', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { rows } = await pool.query('SELECT tags FROM prompts WHERE user_id = $1', [userId]);
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

export default router;
