// src/lib/articleDb.js
'use server';

import { getDb } from './db';

// Save a file and its articles
export async function saveFileWithArticles(fileName, fileContent, articles) {
    try {
        const db = await getDb();
        const insertFile = db.prepare(
            'INSERT INTO files (name, content) VALUES (?, ?)'
        );
        
        const insertArticle = db.prepare(
            'INSERT INTO articles (file_id, title, category, date, content) VALUES (?, ?, ?, ?, ?)'
        );

        // Use a transaction to ensure all operations succeed or fail together
        const saveTransaction = db.transaction((fileName, fileContent, articles) => {
            const fileInfo = insertFile.run(fileName, fileContent);
            const fileId = fileInfo.lastInsertRowid;
            
            for (const article of articles) {
                insertArticle.run(
                    fileId,
                    article.title,
                    article.category,
                    article.date,
                    article.content
                );
            }
            
            return fileId;
        });
        
        return saveTransaction(fileName, fileContent, articles);
    } catch (error) {
        console.error('Error saving file with articles:', error);
        throw error;
    }
}

// Get all files
export async function getAllFiles() {
    try {
        const db = await getDb();
        const query = db.prepare('SELECT id, name, created_at FROM files ORDER BY created_at DESC');
        return query.all();
    } catch (error) {
        console.error('Error fetching all files:', error);
        return [];
    }
}

// Get file by ID
export async function getFileById(fileId) {
    try {
        const db = await getDb();
        const query = db.prepare('SELECT * FROM files WHERE id = ?');
        return query.get(fileId);
    } catch (error) {
        console.error('Error getting file by ID:', error);
        return null;
    }
}

// Get articles by file ID
export async function getArticlesByFileId(fileId) {
    try {
        const db = await getDb();
        const query = db.prepare('SELECT * FROM articles WHERE file_id = ? ORDER BY id ASC');
        return query.all(fileId);
    } catch (error) {
        console.error('Error getting articles by file ID:', error);
        return [];
    }
}

// Get all articles
export async function getAllArticles() {
    try {
        const db = await getDb();
        const query = db.prepare(`
            SELECT articles.*, files.name as file_name 
            FROM articles 
            JOIN files ON articles.file_id = files.id 
            ORDER BY articles.created_at DESC
        `);
        return query.all();
    } catch (error) {
        console.error('Error getting all articles:', error);
        return [];
    }
}

// Get article by ID
export async function getArticleById(articleId) {
    try {
        const db = await getDb();
        const query = db.prepare('SELECT * FROM articles WHERE id = ?');
        return query.get(articleId);
    } catch (error) {
        console.error('Error getting article by ID:', error);
        return null;
    }
}

// Search articles
export async function searchArticles(searchTerm) {
    try {
        const db = await getDb();
        const query = db.prepare(`
            SELECT articles.*, files.name as file_name 
            FROM articles 
            JOIN files ON articles.file_id = files.id 
            WHERE articles.title LIKE ? OR articles.content LIKE ?
            ORDER BY articles.created_at DESC
        `);
        const searchPattern = `%${searchTerm}%`;
        return query.all(searchPattern, searchPattern);
    } catch (error) {
        console.error('Error searching articles:', error);
        return [];
    }
}

// Delete file and its articles (uses CASCADE constraint)
export async function deleteFile(fileId) {
    try {
        const db = await getDb();
        const query = db.prepare('DELETE FROM files WHERE id = ?');
        return query.run(fileId);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Bookmark an article
export async function bookmarkArticle(articleId, notes = '') {
    try {
        const db = await getDb();
        
        // First check if article exists
        const article = await getArticleById(articleId);
        if (!article) {
            throw new Error(`Article with ID ${articleId} not found`);
        }
        
        // Insert or replace bookmark (using the UNIQUE constraint)
        const query = db.prepare(
            'INSERT OR REPLACE INTO bookmarks (article_id, notes) VALUES (?, ?)'
        );
        
        const result = query.run(articleId, notes);
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error bookmarking article:', error);
        throw error;
    }
}

// Remove a bookmark
export async function removeBookmark(articleId) {
    try {
        const db = await getDb();
        const query = db.prepare('DELETE FROM bookmarks WHERE article_id = ?');
        const result = query.run(articleId);
        
        return { 
            success: true, 
            removed: result.changes > 0 
        };
    } catch (error) {
        console.error('Error removing bookmark:', error);
        throw error;
    }
}

// Get all bookmarked articles
export async function getBookmarkedArticles() {
    try {
        const db = await getDb();
        const query = db.prepare(`
            SELECT articles.*, bookmarks.id as bookmark_id, bookmarks.notes, bookmarks.created_at as bookmarked_at
            FROM bookmarks
            JOIN articles ON bookmarks.article_id = articles.id
            ORDER BY bookmarks.created_at DESC
        `);
        
        return query.all();
    } catch (error) {
        console.error('Error fetching bookmarked articles:', error);
        return [];
    }
}

// Check if an article is bookmarked
export async function isArticleBookmarked(articleId) {
    try {
        const db = await getDb();
        const query = db.prepare('SELECT id FROM bookmarks WHERE article_id = ?');
        const result = query.get(articleId);
        
        return !!result;
    } catch (error) {
        console.error('Error checking if article is bookmarked:', error);
        return false;
    }
}