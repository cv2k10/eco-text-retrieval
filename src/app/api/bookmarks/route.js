// src/app/api/bookmarks/route.js
import { NextResponse } from 'next/server';
import { 
  bookmarkArticle, 
  removeBookmark, 
  getBookmarkedArticles, 
  isArticleBookmarked 
} from '@/lib/articleDb';

// Add or update a bookmark
export async function POST(request) {
  try {
    const data = await request.json();
    const { articleId, notes } = data;
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }
    
    const result = await bookmarkArticle(articleId, notes || '');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error bookmarking article:', error);
    return NextResponse.json(
      { error: 'Failed to bookmark article: ' + error.message },
      { status: 500 }
    );
  }
}

// Get all bookmarked articles
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    
    // If articleId is provided, check if it's bookmarked
    if (articleId) {
      const isBookmarked = await isArticleBookmarked(articleId);
      return NextResponse.json({ isBookmarked });
    }
    
    // Otherwise return all bookmarked articles
    const bookmarks = await getBookmarkedArticles();
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks: ' + error.message },
      { status: 500 }
    );
  }
}

// Delete a bookmark
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }
    
    const result = await removeBookmark(articleId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to remove bookmark: ' + error.message },
      { status: 500 }
    );
  }
}
