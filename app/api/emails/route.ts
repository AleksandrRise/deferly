import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'emails.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const emails = JSON.parse(fileContents);
    
    return NextResponse.json(emails);
  } catch (error) {
    console.error('Error reading emails:', error);
    return NextResponse.json({ error: 'Failed to load emails' }, { status: 500 });
  }
}