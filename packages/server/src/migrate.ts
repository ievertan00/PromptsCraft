
import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs/promises';
import initSqlJs, { Statement } from 'sql.js';

// Helper function to convert SQL.js output to a more usable array of objects
const execToObjects = (stmt: Statement) => {
  const objects = [];
  while (stmt.step()) {
    objects.push(stmt.getAsObject());
  }
  return objects;
};

const migrate = async () => {
  console.log('Starting migration from SQLite to PostgreSQL...');

  let postgresClient;

  try {
    // 1. Initialize sql.js and load the SQLite database file from disk
    console.log('Loading SQLite database file into memory...');
    const SQL = await initSqlJs({
      locateFile: (file) => `node_modules/sql.js/dist/${file}`,
    });
    const fileBuffer = await fs.readFile('packages/server/prompts.db');
    const sqliteDb = new SQL.Database(fileBuffer);
    console.log('SQLite database loaded successfully.');

    // 2. Connect to PostgreSQL
    const postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    postgresClient = await postgresPool.connect();
    console.log('Connected to PostgreSQL.');

    await postgresClient.query('BEGIN');
    console.log('PostgreSQL transaction started.');

    // 3. Migrate Folders
    console.log('Migrating folders...');
    const folderStmt = sqliteDb.prepare('SELECT * FROM folders');
    const folders = execToObjects(folderStmt);
    folderStmt.free();
    
    const folderIdMap = new Map<number, number>(); // Map<old_sqlite_id, new_postgres_id>

    for (const folder of folders) {
      const oldId = folder.id as number;
      const { name, is_system = 0, sort_order } = folder;
      
      const result = await postgresClient.query(
        'INSERT INTO folders (name, is_system, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [name, is_system, sort_order]
      );
      const newId = result.rows[0].id;
      folderIdMap.set(oldId, newId);
      console.log(`  Migrated folder: "${name}" (Old ID: ${oldId} -> New ID: ${newId})`);
    }

    // 4. Update parent_id for folders
    console.log('Updating folder parent relationships...');
    for (const folder of folders) {
        if (folder.parent_id) {
            const oldParentId = folder.parent_id as number;
            const newParentId = folderIdMap.get(oldParentId);
            const newId = folderIdMap.get(folder.id as number);

            if (newId && newParentId) {
                await postgresClient.query(
                    'UPDATE folders SET parent_id = $1 WHERE id = $2',
                    [newParentId, newId]
                );
                console.log(`  Updated parent for folder ID ${newId} to ${newParentId}`);
            }
        }
    }

    // 5. Migrate Prompts
    console.log('Migrating prompts...');
    const promptStmt = sqliteDb.prepare('SELECT * FROM prompts');
    const prompts = execToObjects(promptStmt);
    promptStmt.free();

    for (const prompt of prompts) {
      const { title, prompt: content, tags, folder_id, is_favorite, deleted_at } = prompt;
      const newFolderId = folder_id ? folderIdMap.get(folder_id as number) : null;

      if (folder_id && !newFolderId) {
          console.warn(`  - WARNING: Could not find new PostgreSQL folder_id for old folder_id: ${folder_id}. Skipping prompt: "${title}"`);
          continue;
      }
      
      await postgresClient.query(
        'INSERT INTO prompts (title, prompt, tags, folder_id, is_favorite, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [title, content, tags, newFolderId, (is_favorite as number) || 0, deleted_at]
      );
      console.log(`  Migrated prompt: "${title}"`);
    }

    // 6. Commit transaction
    await postgresClient.query('COMMIT');
    console.log('PostgreSQL transaction committed.');
    console.log('Migration completed successfully!');

  } catch (error) {
    if (postgresClient) {
      await postgresClient.query('ROLLBACK');
      console.error('Migration failed. Transaction has been rolled back.', error);
    } else {
      console.error('Migration failed before PostgreSQL transaction could start.', error);
    }
  } finally {
    if (postgresClient) {
      postgresClient.release();
    }
    // sql.js is in-memory, no need to close the connection in the same way
    console.log('Database connections closed.');
  }
};

migrate();
