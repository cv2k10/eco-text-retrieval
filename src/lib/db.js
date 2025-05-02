// src/lib/db.js
'use server';

import fs from 'fs';
import path from 'path';

let db = null;

// This function initializes the database lazily - only when needed
export async function getDb() {
    if (db) return db;

    try {
        // Dynamically import better-sqlite3
        const Database = (await import('better-sqlite3')).default;

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

        // Set pragmas for better performance
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');

// ... rest of your function
    
    // Initialize database tables
    db.exec(`
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
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}