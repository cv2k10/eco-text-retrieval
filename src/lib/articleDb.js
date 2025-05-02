// src/lib/articleDb.js
'use server';

import { getDb } from './db';

// Save a file and its articles
export async function saveFileWithArticles(fileName, fileContent, articles) {
    try {
        const db = await getDb();
        
        // With sqlite3, we need to manually manage transactions
        await db.run('BEGIN TRANSACTION');
        
        try {
            // Insert file
            const fileInfo = await db.run(
                'INSERT INTO files (name, content) VALUES (?, ?)',
                [fileName, fileContent]
            );
            
            const fileId = fileInfo.lastID;
            
            // Insert articles
            const insertArticle = db.prepare(
                'INSERT INTO articles (file_id, title, category, date, content) VALUES (?, ?, ?, ?, ?)'
            );
            
            for (const article of articles) {
                await insertArticle.run([
                    fileId,
                    article.title,
                    article.category,
                    article.date,
                    article.content
                ]);
            }
            
            // Commit transaction if all operations succeed
            await db.run('COMMIT');
            return fileId;
        } catch (err) {
            // Roll back transaction if any operation fails
            await db.run('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error saving file with articles:', error);
        throw error;
    }
}

// Get all files
export async function getAllFiles() {
    try {
        const db = await getDb();
        return await db.all('SELECT id, name, created_at FROM files ORDER BY created_at DESC');
    } catch (error) {
        console.error('Error fetching all files:', error);
        return [];
    }
}

// Get file by ID
export async function getFileById(fileId) {
    try {
        const db = await getDb();
        return await db.get('SELECT * FROM files WHERE id = ?', [fileId]);
    } catch (error) {
        console.error('Error getting file by ID:', error);
        return null;
    }
}

// Get articles by file ID
export async function getArticlesByFileId(fileId) {
    try {
        const db = await getDb();
        return await db.all('SELECT * FROM articles WHERE file_id = ? ORDER BY id ASC', [fileId]);
    } catch (error) {
        console.error('Error getting articles by file ID:', error);
        return [];
    }
}

// Get all articles
export async function getAllArticles() {
    try {
        const db = await getDb();
        return await db.all(`
            SELECT articles.*, files.name as file_name 
            FROM articles 
            JOIN files ON articles.file_id = files.id 
            ORDER BY articles.created_at DESC
        `);
    } catch (error) {
        console.error('Error getting all articles:', error);
        return [];
    }
}

// Get article by ID
export async function getArticleById(articleId) {
    try {
        const db = await getDb();
        return await db.get('SELECT * FROM articles WHERE id = ?', [articleId]);
    } catch (error) {
        console.error('Error getting article by ID:', error);
        return null;
    }
}

// Search articles
export async function searchArticles(searchTerm) {
    try {
        const db = await getDb();
        const searchPattern = `%${searchTerm}%`;
        return await db.all(`
            SELECT articles.*, files.name as file_name 
            FROM articles 
            JOIN files ON articles.file_id = files.id 
            WHERE articles.title LIKE ? OR articles.content LIKE ?
            ORDER BY articles.created_at DESC
        `, [searchPattern, searchPattern]);
    } catch (error) {
        console.error('Error searching articles:', error);
        return [];
    }
}

// Delete file and its articles (uses CASCADE constraint)
export async function deleteFile(fileId) {
    try {
        const db = await getDb();
        return await db.run('DELETE FROM files WHERE id = ?', [fileId]);
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
        const result = await db.run(
            'INSERT OR REPLACE INTO bookmarks (article_id, notes) VALUES (?, ?)',
            [articleId, notes]
        );
        
        return { success: true, id: result.lastID };
    } catch (error) {
        console.error('Error bookmarking article:', error);
        throw error;
    }
}

// Remove a bookmark
export async function removeBookmark(articleId) {
    try {
        const db = await getDb();
        const result = await db.run('DELETE FROM bookmarks WHERE article_id = ?', [articleId]);
        
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
        return await db.all(`
            SELECT articles.*, bookmarks.id as bookmark_id, bookmarks.notes, bookmarks.created_at as bookmarked_at
            FROM bookmarks
            JOIN articles ON bookmarks.article_id = articles.id
            ORDER BY bookmarks.created_at DESC
        `);
    } catch (error) {
        console.error('Error fetching bookmarked articles:', error);
        return [];
    }
}

// Check if an article is bookmarked
export async function isArticleBookmarked(articleId) {
    try {
        const db = await getDb();
        const result = await db.get('SELECT id FROM bookmarks WHERE article_id = ?', [articleId]);
        
        return !!result;
    } catch (error) {
        console.error('Error checking if article is bookmarked:', error);
        return false;
    }
}