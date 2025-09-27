import { NextRequest, NextResponse } from 'next/server';
import { Email, CalendarEvent } from '@/lib/types';
import dayjs from 'dayjs';

interface PlanRequest {
  emailId: string;
}

interface PlanResponse {
  slot: {
    startISO: string;
    endISO: string;
    reason: string;
    confidence: number;
    movedEvents?: CalendarEvent[];
  };
  alternatives: Array<{
    startISO: string;
    endISO: string;
    reason: string;
  }>;
  deferMessage: string;
  action: 'reply_now' | 'snooze_today' | 'snooze_tomorrow' | 'schedule_block';
}

export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json() as PlanRequest;
    
    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Fetch email and calendar data
    const [emailsRes, calendarRes] = await Promise.all([
      fetch(new URL('/api/emails', request.url)),
      fetch(new URL('/api/calendar', request.url))
    ]);
    
    const emails = await emailsRes.json();
    const calendar = await calendarRes.json();
    
    const email = emails.find((e: Email) => e.id === emailId);
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    const planResult = await createPlan(email, calendar);
    return NextResponse.json(planResult);
    
  } catch (error) {
    console.error('Plan creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

async function createPlan(email: Email, calendar: CalendarEvent[]): Promise<PlanResponse> {
  // Parse requested time window from email
  const requestedWindow = parseTimeWindow(email);
  const duration = Math.min(60, email.estimatedMinutes || 30);
  
  // Try to find slot in requested window first
  if (requestedWindow) {
    const slot = findSlotInWindow(requestedWindow, duration, calendar);
    if (slot) {
      return {
        slot: {
          startISO: slot.startISO,
          endISO: slot.endISO,
          reason: `Available in requested time window`,
          confidence: 0.9,
          movedEvents: slot.movedEvents
        },
        alternatives: generateAlternatives(email, calendar, duration),
        deferMessage: generateDeferMessage(email, slot.startISO),
        action: 'schedule_block'
      };
    }
  }
  
  // Find next available slot
  const nextSlot = findNextAvailableSlot(email, calendar, duration);
  
  return {
    slot: {
      startISO: nextSlot.startISO,
      endISO: nextSlot.endISO,
      reason: nextSlot.reason,
      confidence: nextSlot.confidence,
      movedEvents: nextSlot.movedEvents
    },
    alternatives: generateAlternatives(email, calendar, duration),
    deferMessage: generateDeferMessage(email, nextSlot.startISO),
    action: determineAction(nextSlot.startISO)
  };
}

function parseTimeWindow(email: Email): { start: string; end: string } | null {
  const text = `${email.subject} ${email.body}`.toLowerCase();
  
  // Check for "today" references
  if (/\b(today|this afternoon|this morning)\b/i.test(text)) {
    const now = dayjs();
    if (/morning/i.test(text)) {
      return {
        start: now.hour(9).minute(0).toISOString(),
        end: now.hour(12).minute(0).toISOString()
      };
    } else if (/afternoon/i.test(text)) {
      return {
        start: now.hour(13).minute(0).toISOString(),
        end: now.hour(17).minute(0).toISOString()
      };
    } else {
      return {
        start: now.hour(9).minute(0).toISOString(),
        end: now.hour(17).minute(0).toISOString()
      };
    }
  }
  
  // Check for "tomorrow" references
  if (/\b(tomorrow)\b/i.test(text)) {
    const tomorrow = dayjs().add(1, 'day');
    return {
      start: tomorrow.hour(9).minute(0).toISOString(),
      end: tomorrow.hour(17).minute(0).toISOString()
    };
  }
  
  return null;
}

function findSlotInWindow(
  window: { start: string; end: string },
  duration: number,
  calendar: CalendarEvent[]
): { startISO: string; endISO: string; movedEvents?: CalendarEvent[] } | null {
  const windowStart = dayjs(window.start);
  const windowEnd = dayjs(window.end);
  
  // Try to find empty slot first
  let current = windowStart;
  while (current.add(duration, 'minute').isBefore(windowEnd)) {
    const slotEnd = current.add(duration, 'minute');
    const conflicts = findConflicts(current.toISOString(), slotEnd.toISOString(), calendar);
    
    if (conflicts.length === 0) {
      return {
        startISO: current.toISOString(),
        endISO: slotEnd.toISOString()
      };
    }
    
    current = current.add(15, 'minute'); // 15-minute increments
  }
  
  // Try moving flexible events
  current = windowStart;
  while (current.add(duration, 'minute').isBefore(windowEnd)) {
    const slotEnd = current.add(duration, 'minute');
    const conflicts = findConflicts(current.toISOString(), slotEnd.toISOString(), calendar);
    
    const movableEvents = conflicts.filter(event => isMovable(event));
    if (movableEvents.length === conflicts.length && movableEvents.length > 0) {
      // All conflicting events are movable
      const movedEvents = moveEvents(movableEvents, calendar);
      if (movedEvents) {
        return {
          startISO: current.toISOString(),
          endISO: slotEnd.toISOString(),
          movedEvents
        };
      }
    }
    
    current = current.add(15, 'minute');
  }
  
  return null;
}

function findNextAvailableSlot(
  email: Email,
  calendar: CalendarEvent[],
  duration: number
): { startISO: string; endISO: string; reason: string; confidence: number; movedEvents?: CalendarEvent[] } {
  const now = dayjs();
  
  // Try today first (before 17:00)
  let current = now.add(15, 'minute').startOf('minute');
  const endOfDay = now.hour(17).minute(0);
  
  while (current.add(duration, 'minute').isBefore(endOfDay)) {
    if (isWorkingHour(current)) {
      const slotEnd = current.add(duration, 'minute');
      const conflicts = findConflicts(current.toISOString(), slotEnd.toISOString(), calendar);
      
      if (conflicts.length === 0) {
        return {
          startISO: current.toISOString(),
          endISO: slotEnd.toISOString(),
          reason: 'Next available slot today',
          confidence: 0.85
        };
      }
      
      // Try moving events if all are movable
      const movableEvents = conflicts.filter(event => isMovable(event));
      if (movableEvents.length === conflicts.length && movableEvents.length > 0) {
        const movedEvents = moveEvents(movableEvents, calendar);
        if (movedEvents) {
          return {
            startISO: current.toISOString(),
            endISO: slotEnd.toISOString(),
            reason: `Available after moving ${movableEvents.length} flexible event(s)`,
            confidence: 0.75,
            movedEvents
          };
        }
      }
    }
    
    current = current.add(15, 'minute');
  }
  
  // Try tomorrow starting at 9:30
  const tomorrow = now.add(1, 'day').hour(9).minute(30);
  const tomorrowEnd = tomorrow.hour(17).minute(0);
  
  current = tomorrow;
  while (current.add(duration, 'minute').isBefore(tomorrowEnd)) {
    const slotEnd = current.add(duration, 'minute');
    const conflicts = findConflicts(current.toISOString(), slotEnd.toISOString(), calendar);
    
    if (conflicts.length === 0) {
      return {
        startISO: current.toISOString(),
        endISO: slotEnd.toISOString(),
        reason: 'Next available slot tomorrow',
        confidence: 0.8
      };
    }
    
    current = current.add(15, 'minute');
  }
  
  // Fallback - tomorrow at 9:30 regardless of conflicts
  const fallbackStart = now.add(1, 'day').hour(9).minute(30);
  return {
    startISO: fallbackStart.toISOString(),
    endISO: fallbackStart.add(duration, 'minute').toISOString(),
    reason: 'Scheduled for tomorrow morning (may have conflicts)',
    confidence: 0.6
  };
}

function isMovable(event: CalendarEvent): boolean {
  let score = 0;
  
  // No attendees = more movable
  if (!event.attendees || event.attendees.length === 0) {
    score += 0.6;
  }
  
  // Flexible event types
  if (/focus|hold|buffer|deep work/i.test(event.title)) {
    score += 0.3;
  }
  
  // Short events are easier to move
  const duration = dayjs(event.end).diff(dayjs(event.start), 'minute');
  if (duration <= 30) {
    score += 0.1;
  }
  
  // Penalize important events
  if (/client|interview|1:1|standup|review/i.test(event.title) || 
      (event.attendees && event.attendees.length > 0)) {
    score -= 0.7;
  }
  
  return score >= 0.4;
}

function moveEvents(events: CalendarEvent[], calendar: CalendarEvent[]): CalendarEvent[] | null {
  const movedEvents: CalendarEvent[] = [];
  
  for (const event of events) {
    const originalStart = dayjs(event.start);
    const duration = dayjs(event.end).diff(originalStart, 'minute');
    
    // Try to find a new slot on the same day
    const dayStart = originalStart.startOf('day').hour(9);
    const dayEnd = originalStart.startOf('day').hour(18);
    
    let newStart = dayStart;
    let found = false;
    
    while (newStart.add(duration, 'minute').isBefore(dayEnd) && !found) {
      const newEnd = newStart.add(duration, 'minute');
      const conflicts = findConflicts(newStart.toISOString(), newEnd.toISOString(), 
        [...calendar, ...movedEvents]);
      
      if (conflicts.length === 0 && isWorkingHour(newStart)) {
        movedEvents.push({
          ...event,
          start: newStart.toISOString(),
          end: newEnd.toISOString()
        });
        found = true;
      }
      
      newStart = newStart.add(15, 'minute');
    }
    
    if (!found) {
      return null; // Cannot move all events
    }
  }
  
  return movedEvents;
}

function findConflicts(startISO: string, endISO: string, calendar: CalendarEvent[]): CalendarEvent[] {
  const start = dayjs(startISO);
  const end = dayjs(endISO);
  
  return calendar.filter(event => {
    const eventStart = dayjs(event.start);
    const eventEnd = dayjs(event.end);
    
    return start.isBefore(eventEnd) && end.isAfter(eventStart);
  });
}

function isWorkingHour(time: dayjs.Dayjs): boolean {
  const hour = time.hour();
  return hour >= 9 && hour < 18 && time.day() >= 1 && time.day() <= 5;
}

function generateAlternatives(email: Email, calendar: CalendarEvent[], duration: number) {
  const alternatives = [];
  const now = dayjs();
  
  // Tomorrow morning
  const tomorrowMorning = now.add(1, 'day').hour(10).minute(0);
  alternatives.push({
    startISO: tomorrowMorning.toISOString(),
    endISO: tomorrowMorning.add(duration, 'minute').toISOString(),
    reason: 'Tomorrow morning with fresh focus'
  });
  
  // Today afternoon if available
  const todayAfternoon = now.hour(14).minute(0);
  if (todayAfternoon.isAfter(now)) {
    alternatives.push({
      startISO: todayAfternoon.toISOString(),
      endISO: todayAfternoon.add(duration, 'minute').toISOString(),
      reason: 'This afternoon'
    });
  }
  
  return alternatives.slice(0, 2);
}

function generateDeferMessage(email: Email, suggestedTime: string): string {
  const time = dayjs(suggestedTime);
  const timeStr = time.format('h:mm A');
  const dayStr = time.isSame(dayjs(), 'day') ? 'today' : time.format('dddd');
  
  const senderName = email.name.split(' ')[0]; // First name only
  
  return `Hi ${senderName} — I'm booked at that time. I can make ${timeStr} ${dayStr} work. If that doesn't work, I can shift a flexible block to accommodate your preferred window. Let me know what you prefer, and I'll send the invite. Thanks!`;
}

function determineAction(suggestedTime: string): 'reply_now' | 'snooze_today' | 'snooze_tomorrow' | 'schedule_block' {
  const time = dayjs(suggestedTime);
  const now = dayjs();
  
  if (time.isSame(now, 'day')) {
    const hoursUntil = time.diff(now, 'hour');
    if (hoursUntil <= 1) {
      return 'reply_now';
    }
    return 'snooze_today';
  }
  
  if (time.isSame(now.add(1, 'day'), 'day')) {
    return 'snooze_tomorrow';
  }
  
  return 'schedule_block';
}