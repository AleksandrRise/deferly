import { NextRequest, NextResponse } from 'next/server';
import { computeSuggestions } from '@/lib/engine';
import { UserPreferences } from '@/lib/types';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { userPreferences } = await request.json();
    
    // Load data
    const emailsPath = join(process.cwd(), 'data', 'emails.json');
    const calendarPath = join(process.cwd(), 'data', 'calendar.json');
    
    const emails = JSON.parse(readFileSync(emailsPath, 'utf8'));
    const calendar = JSON.parse(readFileSync(calendarPath, 'utf8'));
    
    // Default preferences if not provided
    const preferences: UserPreferences = {
      energy: 4,
      focusBlockMins: 30,
      workingHours: {
        start: 9,
        end: 18,
        lunchStart: 12,
        lunchEnd: 13
      },
      timezone: 'America/Los_Angeles',
      ...userPreferences
    };
    
    const suggestions = computeSuggestions(emails, calendar, preferences);
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error computing suggestions:', error);
    return NextResponse.json({ error: 'Failed to compute suggestions' }, { status: 500 });
  }
}