// src/app/api/test/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    // This will initialize the database if it doesn't exist
    const db = await getDb();
    
    // A simple query to test the database
    const result = db.prepare('SELECT sqlite_version() as version').get();
    
    return NextResponse.json({ 
      message: 'Database initialized successfully', 
      version: result.version,
      dbPath: process.cwd() + '/data/eco-text.db'
    });
  } catch (error) {
    console.error('Error testing database:', error);
    return NextResponse.json({ 
      error: 'Database test failed: ' + error.message 
    }, { status: 500 });
  }
}