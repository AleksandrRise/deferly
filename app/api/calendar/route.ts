import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CalendarEvent } from '@/lib/types';

// In-memory stores for dynamic calendar events
let replyBlocks: CalendarEvent[] = [];
let movedEvents: CalendarEvent[] = [];

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'calendar.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const baseEvents = JSON.parse(fileContents);
    
    // Combine base events with dynamic events
    const allEvents = [
      ...baseEvents,
      ...replyBlocks,
      ...movedEvents
    ];
    
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error('Error reading calendar:', error);
    return NextResponse.json({ error: 'Failed to load calendar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'create_block':
        return handleCreateBlock(body);
      case 'apply_moves':
        return handleApplyMoves(body);
      case 'clear_dynamic':
        return handleClearDynamic();
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Calendar POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process calendar action' },
      { status: 500 }
    );
  }
}

function handleCreateBlock(body: { emailId: string; slot: { startISO: string; endISO: string; confidence: number } }): NextResponse {
  const { emailId, slot } = body;
  
  if (!emailId || !slot) {
    return NextResponse.json(
      { error: 'emailId and slot are required' },
      { status: 400 }
    );
  }
  
  const newBlock: CalendarEvent = {
    id: `reply-block-${Date.now()}`,
    title: `Reply time (Email response)`,
    start: slot.startISO,
    end: slot.endISO,
    type: 'suggestion',
    description: `Scheduled time to respond to email`,
    emailId,
    confidence: slot.confidence
  };
  
  // Remove any existing reply block for this email
  replyBlocks = replyBlocks.filter(block => block.emailId !== emailId);
  
  // Add new block
  replyBlocks.push(newBlock);
  
  return NextResponse.json({ 
    success: true, 
    block: newBlock,
    message: 'Reply block created successfully'
  });
}

function handleApplyMoves(body: { movedEvents: CalendarEvent[] }): NextResponse {
  const { movedEvents: newMovedEvents } = body;
  
  if (!Array.isArray(newMovedEvents)) {
    return NextResponse.json(
      { error: 'movedEvents must be an array' },
      { status: 400 }
    );
  }
  
  // Update moved events
  for (const movedEvent of newMovedEvents) {
    // Remove any existing moved version of this event
    movedEvents = movedEvents.filter(event => event.id !== movedEvent.id);
    
    // Add the moved event with a special marker
    movedEvents.push({
      ...movedEvent,
      title: `${movedEvent.title} (moved)`,
      type: 'meeting' as const
    });
  }
  
  return NextResponse.json({ 
    success: true, 
    movedEvents: newMovedEvents,
    message: `${newMovedEvents.length} event(s) moved successfully`
  });
}

function handleClearDynamic(): NextResponse {
  replyBlocks = [];
  movedEvents = [];
  
  return NextResponse.json({ 
    success: true, 
    message: 'Dynamic events cleared'
  });
}

