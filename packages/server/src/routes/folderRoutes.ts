import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { QueryResult } from 'pg';

const router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { rows } = await pool.query('SELECT * FROM folders WHERE is_system = 0 AND user_id = $1 ORDER BY sort_order', [userId]);
    res.json(rows);
});

router.get('/trash', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { rows } = await pool.query('SELECT * FROM folders WHERE is_system = 1 AND name = $1 AND user_id = $2', ['Trash', userId]);
    res.json(rows[0]);
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { name, parent_id } = req.body;

    if (parent_id) {
        const parentFolderRes: QueryResult = await pool.query('SELECT * FROM folders WHERE id = $1 AND user_id = $2', [parent_id, userId]);
        if (parentFolderRes.rowCount !== null && parentFolderRes.rowCount > 0 && parentFolderRes.rows[0].is_system) {
            return res.status(403).json({ error: 'Cannot create subfolders in a system folder.' });
        }
    }

    let maxOrderRes;
    if (parent_id === null) {
        maxOrderRes = await pool.query('SELECT MAX(sort_order) as max FROM folders WHERE parent_id IS NULL AND user_id = $1', [userId]);
    } else {
        maxOrderRes = await pool.query('SELECT MAX(sort_order) as max FROM folders WHERE parent_id = $1 AND user_id = $2', [parent_id, userId]);
    }
    const sort_order = (maxOrderRes.rows[0].max || 0) + 1;
    const result = await pool.query('INSERT INTO folders (name, parent_id, sort_order, user_id) VALUES ($1, $2, $3, $4) RETURNING id', [name, parent_id, sort_order, userId]);
    res.json({ id: result.rows[0].id, name, parent_id, sort_order });
});

router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const folderRes: QueryResult = await pool.query('SELECT * FROM folders WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    if (folderRes.rowCount !== null && folderRes.rowCount > 0 && folderRes.rows[0].is_system) {
        return res.status(403).json({ error: 'System folders cannot be modified.' });
    }
    const { name } = req.body;
    await pool.query('UPDATE folders SET name = $1 WHERE id = $2 AND user_id = $3', [name, req.params.id, userId]);
    res.json({ id: req.params.id, name });
});

router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const trashFolderRes: QueryResult = await pool.query('SELECT id FROM folders WHERE is_system = 1 AND name = $1 AND user_id = $2', ['Trash', userId]);
    if (trashFolderRes.rowCount === 0) {
        return res.status(500).json({ error: 'Trash folder not found' });
    }
    await pool.query('UPDATE prompts SET folder_id = $1 WHERE folder_id = $2 AND user_id = $3', [trashFolderRes.rows[0].id, req.params.id, userId]);
    await pool.query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    res.json({ message: 'deleted' });
});

router.put('/:id/reorder', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { direction } = req.body; // 'up' or 'down'
    const folderId = Number(req.params.id);

    try {
        await pool.query('BEGIN');

        const folderRes: QueryResult = await pool.query('SELECT * FROM folders WHERE id = $1 AND user_id = $2', [folderId, userId]);
        if (folderRes.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Folder not found' });
        }
        const folder = folderRes.rows[0];

        let otherFolderRes: QueryResult;
        if (folder.parent_id === null) {
            if (direction === 'up') {
                otherFolderRes = await pool.query(
                    'SELECT * FROM folders WHERE parent_id IS NULL AND sort_order < $1 AND user_id = $2 ORDER BY sort_order DESC LIMIT 1',
                    [folder.sort_order, userId]
                );
            } else { // down
                otherFolderRes = await pool.query(
                    'SELECT * FROM folders WHERE parent_id IS NULL AND sort_order > $1 AND user_id = $2 ORDER BY sort_order ASC LIMIT 1',
                    [folder.sort_order, userId]
                );
            }
        } else {
            if (direction === 'up') {
                otherFolderRes = await pool.query(
                    'SELECT * FROM folders WHERE parent_id = $1 AND sort_order < $2 AND user_id = $3 ORDER BY sort_order DESC LIMIT 1',
                    [folder.parent_id, folder.sort_order, userId]
                );
            } else { // down
                otherFolderRes = await pool.query(
                    'SELECT * FROM folders WHERE parent_id = $1 AND sort_order > $2 AND user_id = $3 ORDER BY sort_order ASC LIMIT 1',
                    [folder.parent_id, folder.sort_order, userId]
                );
            }
        }
        
        if (otherFolderRes.rowCount !== null && otherFolderRes.rowCount > 0) {
            const otherFolder = otherFolderRes.rows[0];
            await pool.query('UPDATE folders SET sort_order = $1 WHERE id = $2', [otherFolder.sort_order, folder.id]);
            await pool.query('UPDATE folders SET sort_order = $1 WHERE id = $2', [folder.sort_order, otherFolder.id]);
        }

        await pool.query('COMMIT');
        res.json({ message: 'reordered' });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: 'Failed to reorder folder' });
    }
});

router.put('/:id/move', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const folderId = Number(req.params.id);
    const folderRes: QueryResult = await pool.query('SELECT * FROM folders WHERE id = $1 AND user_id = $2', [folderId, userId]);
    if (folderRes.rowCount !== null && folderRes.rowCount > 0 && folderRes.rows[0].is_system) {
        return res.status(403).json({ error: 'System folders cannot be moved.' });
    }

    const { parent_id } = req.body;

    if (folderId === Number(parent_id)) {
        return res.status(400).json({ error: "A folder cannot be moved into itself." });
    }

    if (parent_id !== null) {
        const sql = `
            WITH RECURSIVE subfolders(id) AS (
                SELECT $1::integer AS id
                UNION ALL
                SELECT f.id FROM folders f JOIN subfolders s ON f.parent_id = s.id
                WHERE f.user_id = $2
            )
            SELECT id FROM subfolders;
        `;
        const descendantsRes = await pool.query(sql, [folderId, userId]);
        const descendantIds = descendantsRes.rows.map(d => d.id);

        if (descendantIds.includes(Number(parent_id))) {
            return res.status(400).json({ error: "A folder cannot be moved into its own subfolder." });
        }
    }

    await pool.query('UPDATE folders SET parent_id = $1 WHERE id = $2 AND user_id = $3', [parent_id, folderId, userId]);
    res.json({ message: 'moved' });
});

router.get('/:id/prompts', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    try {
        const folderId = req.params.id;
        const sql = `
            WITH RECURSIVE subfolders(id) AS (
                SELECT $1::integer AS id
                UNION ALL
                SELECT f.id FROM folders f JOIN subfolders s ON f.parent_id = s.id WHERE f.user_id = $2
            )
            SELECT p.* FROM prompts p JOIN subfolders sf ON p.folder_id = sf.id WHERE p.user_id = $2;
        `;
        const { rows } = await pool.query(sql, [folderId, userId]);
        res.json(rows.map((prompt: any) => ({
            ...prompt,
            tags: typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags,
            is_favorite: !!prompt.is_favorite,
        })));
    } catch (err) {
        res.status(400).json({"error": (err as Error).message});
    }
});

export default router;
