// ESM packages are still imported with a dynamic import()
const dotenvPromise = import('dotenv/config');
const sqlJsPromise = import('sql.js');

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const execToObjects = (stmt) => {
  const objects = [];
  while (stmt.step()) {
    objects.push(stmt.getAsObject());
  }
  return objects;
};

const migrate = async () => {
  console.log('Starting migration from SQLite to PostgreSQL...');

  // Wait for ESM imports
  const [_, { default: initSqlJs }] = await Promise.all([
      dotenvPromise, 
      sqlJsPromise
  ]);

  let postgresClient;

  try {
    console.log('Loading SQLite database file into memory...');
    const SQL = await initSqlJs({
        locateFile: (file) => path.join(path.dirname(require.resolve('sql.js')), file)
    });
    const fileBuffer = await fs.readFile(path.join(__dirname, 'prompts.db'));
    const sqliteDb = new SQL.Database(fileBuffer);
    console.log('SQLite database loaded successfully.');

    const postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    postgresClient = await postgresPool.connect();
    console.log('Connected to PostgreSQL.');

    await postgresClient.query('BEGIN');
    console.log('PostgreSQL transaction started.');

    console.log('Migrating folders...');
    const folderStmt = sqliteDb.prepare('SELECT * FROM folders');
    const folders = execToObjects(folderStmt);
    folderStmt.free();
    
    const folderIdMap = new Map();

    for (const folder of folders) {
      const oldId = folder.id;
      const name = folder.name;
      const is_system = Number.isInteger(folder.is_system) ? folder.is_system : 0;
      const sort_order = Number.isInteger(folder.sort_order) ? folder.sort_order : null;
      
      const result = await postgresClient.query(
        'INSERT INTO folders (name, is_system, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [name, is_system, sort_order]
      );
      const newId = result.rows[0].id;
      folderIdMap.set(oldId, newId);
      console.log(`  Migrated folder: "${name}" (Old ID: ${oldId} -> New ID: ${newId})`);
    }

    console.log('Updating folder parent relationships...');
    for (const folder of folders) {
        const oldParentId = Number(folder.parent_id);
        if (Number.isInteger(oldParentId) && oldParentId > 0) {
            const newParentId = folderIdMap.get(oldParentId);
            const newId = folderIdMap.get(folder.id);

            if (newId && newParentId) {
                await postgresClient.query(
                    'UPDATE folders SET parent_id = $1 WHERE id = $2',
                    [newParentId, newId]
                );
                console.log(`  Updated parent for folder ID ${newId} to ${newParentId}`);
            } else {
                console.warn(`  - WARNING: Could not map parent/child relationship for old folder ID ${folder.id}`);
            }
        }
    }

    console.log('Migrating prompts...');
    const promptStmt = sqliteDb.prepare('SELECT * FROM prompts');
    const prompts = execToObjects(promptStmt);
    promptStmt.free();

    for (const prompt of prompts) {
      const { title, prompt: content, tags, deleted_at } = prompt;
      const old_folder_id = Number(prompt.folder_id);
      const is_favorite = Number.isInteger(prompt.is_favorite) ? prompt.is_favorite : 0;
      const newFolderId = Number.isInteger(old_folder_id) ? folderIdMap.get(old_folder_id) : null;

      if (prompt.folder_id && !newFolderId) {
          console.warn(`  - WARNING: Could not find new PostgreSQL folder_id for old folder_id: ${prompt.folder_id}. Skipping prompt: "${title}"`);
          continue;
      }
      
      await postgresClient.query(
        'INSERT INTO prompts (title, prompt, tags, folder_id, is_favorite, deleted_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [title, content, tags, newFolderId, is_favorite, deleted_at]
      );
      console.log(`  Migrated prompt: "${title}"`);
    }

    await postgresClient.query('COMMIT');
    console.log('PostgreSQL transaction committed.');
    console.log('Migration completed successfully!');

  } catch (error) {
    if (postgresClient) {
      await postgresClient.query('ROLLBACK');
    }
    console.error('Migration failed.', error);
  } finally {
    if (postgresClient) {
      postgresClient.release();
    }
    console.log('Database connections closed.');
    process.exit(0);
  }
};

migrate();