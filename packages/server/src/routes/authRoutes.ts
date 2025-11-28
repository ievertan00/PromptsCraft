import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import 'dotenv/config';

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error("SECRET_KEY is not set in the environment variables.");
}

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserRes = await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username', [username, hashedPassword]);
        const userId = newUserRes.rows[0].id;
        // Create a default "Trash" folder for the new user
        await pool.query('INSERT INTO folders (name, is_system, sort_order, user_id) VALUES ($1, $2, $3, $4)', ['Trash', 1, 9999, userId]);

        res.status(201).json(newUserRes.rows[0]);
    } catch (error) {
        if ((error as any).code === '23505') { // unique_violation
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to register user', details: (error as Error).message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rowCount === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token, username: user.username });
});

export default router;
