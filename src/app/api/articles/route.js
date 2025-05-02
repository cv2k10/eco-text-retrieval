// src/app/api/articles/route.js
import { NextResponse } from 'next/server';
import { getAllArticles, getArticlesByFileId, searchArticles } from '@/lib/articleDb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const searchTerm = searchParams.get('search');
    
    try {
      let results;
      
      if (searchTerm) {
        results = await searchArticles(searchTerm);
      } else if (fileId) {
        results = await getArticlesByFileId(fileId);
      } else {
        results = await getAllArticles();
      }
      
      return NextResponse.json(results);
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles: ' + error.message },
      { status: 500 }
    );
  }
}