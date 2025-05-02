// src/app/api/files/route.js
import { NextResponse } from 'next/server';
import { saveFileWithArticles, getAllFiles } from '@/lib/articleDb';

export async function POST(request) {
  try {
    const data = await request.json();
    const { fileName, fileContent, articles } = data;
    
    if (!fileName || !fileContent || !articles) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    try {
      const fileId = await saveFileWithArticles(fileName, fileContent, articles);
      return NextResponse.json({ success: true, fileId });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const files = await getAllFiles();
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files: ' + error.message },
      { status: 500 }
    );
  }
}