// src/lib/db.js
'use server';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

let db = null;
let dbWrapper = null;

// Create a wrapper for sqlite3 with promise-based methods
function createDbWrapper(sqliteDb) {
  return {
    // Wrap run to return a promise
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function(err) {
          if (err) return reject(err);
          resolve({ 
            lastID: this.lastID, 
            changes: this.changes 
          });
        });
      });
    },
    
    // Wrap get to return a promise
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    },
    
    // Wrap all to return a promise
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    },
    
    // Wrap exec to return a promise
    exec: (sql) => {
      return new Promise((resolve, reject) => {
        sqliteDb.exec(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    
    // Prepare a statement (for more efficient repeated operations)
    prepare: (sql) => {
      const stmt = sqliteDb.prepare(sql);
      
      return {
        run: (params = []) => {
          return new Promise((resolve, reject) => {
            stmt.run(params, function(err) {
              if (err) return reject(err);
              resolve({ 
                lastInsertRowid: this.lastID, 
                changes: this.changes 
              });
            });
          });
        },
        get: (params = []) => {
          return new Promise((resolve, reject) => {
            stmt.get(params, (err, row) => {
              if (err) return reject(err);
              resolve(row);
            });
          });
        },
        all: (params = []) => {
          return new Promise((resolve, reject) => {
            stmt.all(params, (err, rows) => {
              if (err) return reject(err);
              resolve(rows);
            });
          });
        },
        finalize: promisify(stmt.finalize.bind(stmt))
      };
    }
  };
}

// This function initializes the database lazily - only when needed
export async function getDb() {
  if (dbWrapper) return dbWrapper;

  try {
    // Dynamically import sqlite3
    const sqlite3 = await import('sqlite3');
    const { Database } = sqlite3.default.verbose();

    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Path to the database file
    const dbPath = path.join(dataDir, 'eco-text.db');
    console.log('Database path:', dbPath);

    // Create/connect to the database
    db = new Database(dbPath);
    
    // Create a wrapper with promise-based methods
    dbWrapper = createDbWrapper(db);

    // Set pragmas for better performance and create tables
    await dbWrapper.exec('PRAGMA journal_mode = WAL;');
    await dbWrapper.exec('PRAGMA synchronous = NORMAL;');
    
    // Initialize database tables
    await dbWrapper.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT,
        date TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
        UNIQUE(article_id)
      );
    `);
    
    console.log('Database initialized successfully');
    return dbWrapper;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}