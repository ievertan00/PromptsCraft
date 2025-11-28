import { pool } from './db.js';
import bcrypt from 'bcrypt';
import { QueryResult } from 'pg';

export const initDb = async () => {
    console.log('Initializing database schema...');

    // Create users table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    `);

    // Create folders table
    await pool.query(`CREATE TABLE IF NOT EXISTS folders (id SERIAL PRIMARY KEY, name TEXT, parent_id INTEGER, sort_order INTEGER, is_system INTEGER DEFAULT 0, user_id INTEGER)`);

    // Create prompts table
    await pool.query(`CREATE TABLE IF NOT EXISTS prompts (id SERIAL PRIMARY KEY, title TEXT, prompt TEXT, tags TEXT, folder_id INTEGER, is_favorite INTEGER, deleted_at TIMESTAMP, user_id INTEGER)`);

    // Add user_id to folders if missing
    const folderInfo = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='folders' AND column_name='user_id'
    `);
    if (folderInfo.rowCount === 0) {
        await pool.query('ALTER TABLE folders ADD COLUMN user_id INTEGER REFERENCES users(id)');
    }

    // Add user_id to prompts if missing
    const promptInfo = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='prompts' AND column_name='user_id'
    `);
    if (promptInfo.rowCount === 0) {
        await pool.query('ALTER TABLE prompts ADD COLUMN user_id INTEGER REFERENCES users(id)');
    }
    
    // Check for is_system column in folders table
    const folderSystemInfo = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='folders' AND column_name='is_system'
    `);
    if (folderSystemInfo.rowCount === 0) {
        await pool.query('ALTER TABLE folders ADD COLUMN is_system INTEGER DEFAULT 0');
    }

    // Check for deleted_at column in prompts table
    const promptDeletedInfo = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='prompts' AND column_name='deleted_at'
    `);
    if (promptDeletedInfo.rowCount === 0) {
        await pool.query('ALTER TABLE prompts ADD COLUMN deleted_at TIMESTAMP');
    }

    // Create default user and migrate existing data
    const defaultUserRes = await pool.query('SELECT * FROM users WHERE username = $1', ['evertan']);
    let userId;
    if (defaultUserRes.rowCount === 0) {
        const hashedPassword = await bcrypt.hash('1234abcd', 10);
        const newUserRes = await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id', ['evertan', hashedPassword]);
        userId = newUserRes.rows[0].id;

        // Update existing folders and prompts to belong to the default user
        await pool.query('UPDATE folders SET user_id = $1 WHERE user_id IS NULL', [userId]);
        await pool.query('UPDATE prompts SET user_id = $1 WHERE user_id IS NULL', [userId]);
    } else {
        userId = defaultUserRes.rows[0].id;
    }

    const trashFolderRes: QueryResult = await pool.query('SELECT * FROM folders WHERE is_system = 1 AND name = $1 AND user_id = $2', ['Trash', userId]);
    if (trashFolderRes.rowCount === 0) {
        await pool.query('INSERT INTO folders (name, is_system, sort_order, user_id) VALUES ($1, $2, $3, $4)', ['Trash', 1, 9999, userId]);
    }

    console.log('Database initialization complete.');
};
