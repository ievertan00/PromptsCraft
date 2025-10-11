import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// This is a placeholder as we are now using a different strategy.
// The actual implementation will be in server.ts to handle async initialization.

export const getDB = () => {
  // This function will be replaced by a direct variable access in server.ts
  throw new Error('getDB is deprecated. Access the db instance directly.');
};

export const initDB = async () => {
  // This function is deprecated in favor of the new async initialization in server.ts
  throw new Error('initDB is deprecated.');
};
