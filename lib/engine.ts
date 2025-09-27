import { Email, CalendarEvent, DeferSuggestion, UserPreferences } from './types';
import { hoursUntil, isWorkingHours, isLunchTime, getTimeSlots, getTomorrowSlots } from './time';
import { generateDraftingPrompt } from './summarizer';
import dayjs from 'dayjs';

export function computeSuggestions(
  emails: Email[],
  calendar: CalendarEvent[],
  preferences: UserPreferences
): Record<string, DeferSuggestion> {
  const suggestions: Record<string, DeferSuggestion> = {};
  
  for (const email of emails) {
    suggestions[email.id] = computeSingleSuggestion(email, calendar, preferences);
  }
  
  return suggestions;
}

function computeSingleSuggestion(
  email: Email,
  calendar: CalendarEvent[],
  preferences: UserPreferences
): DeferSuggestion {
  const urgency = calculateUrgency(email);
  
  // Quick reply logic
  if (urgency >= 0.75 && email.estimatedMinutes <= 15) {
    const nextSlot = findNextAvailableSlot(calendar, 15);
    if (nextSlot && hoursUntil(nextSlot) <= 1) {
      return {
        action: 'reply_now',
        reason: `High urgency (${(urgency * 100).toFixed(0)}%) and quick task`,
        confidence: 0.9,
        draftingPrompt: generateDraftingPrompt(email, { reason: 'replying immediately due to urgency' })
      };
    }
  }
  
  // Long task - needs scheduling
  if (email.estimatedMinutes >= 30) {
    const duration = Math.min(60, email.estimatedMinutes);
    const slot = findBestSlot(calendar, duration, preferences, urgency);
    
    if (slot) {
      return {
        action: 'schedule_block',
        suggestedTimeISO: slot,
        estimatedDuration: duration,
        reason: `${email.estimatedMinutes}min task needs dedicated time`,
        confidence: calculateConfidence(slot, urgency, preferences),
        draftingPrompt: generateDraftingPrompt(email, { 
          suggestedTimeISO: slot,
          reason: `scheduling a focused work block`
        })
      };
    }
  }
  
  // Medium urgency - snooze to today
  if (urgency >= 0.4 && urgency < 0.75) {
    const slot = findBestSlot(calendar, email.estimatedMinutes, preferences, urgency);
    
    if (slot && dayjs(slot).isSame(dayjs(), 'day')) {
      return {
        action: 'snooze_today',
        suggestedTimeISO: slot,
        reason: `Medium priority, fits in today's schedule`,
        confidence: calculateConfidence(slot, urgency, preferences),
        draftingPrompt: generateDraftingPrompt(email, { 
          suggestedTimeISO: slot,
          reason: `replying later today when I have proper focus`
        })
      };
    }
  }
  
  // Default - snooze to tomorrow
  const tomorrowSlot = getTomorrowSlots(9, 10)[0]; // 9:30 AM tomorrow
  return {
    action: 'snooze_tomorrow',
    suggestedTimeISO: tomorrowSlot,
    reason: urgency < 0.4 ? 'Low priority, defer to tomorrow' : 'No suitable slots today',
    confidence: 0.7,
    draftingPrompt: generateDraftingPrompt(email, { 
      suggestedTimeISO: tomorrowSlot,
      reason: `addressing this tomorrow morning with fresh focus`
    })
  };
}

function calculateUrgency(email: Email): number {
  let urgency = 0.4 * email.importance;
  
  // Deadline score
  if (email.deadlineISO) {
    const hoursLeft = hoursUntil(email.deadlineISO);
    const deadlineScore = Math.max(0, 1 - hoursLeft / 48);
    urgency += 0.4 * deadlineScore;
  } else {
    urgency += 0.2; // No deadline = moderate urgency
  }
  
  // Complexity score
  const complexity = Math.min(1, email.estimatedMinutes / 60);
  urgency += 0.2 * complexity;
  
  return Math.min(1, urgency);
}

function findNextAvailableSlot(calendar: CalendarEvent[], durationMinutes: number): string | null {
  const now = dayjs();
  const slots = getTimeSlots().filter(slot => dayjs(slot).isAfter(now));
  
  for (const slot of slots) {
    if (isSlotAvailable(slot, durationMinutes, calendar)) {
      return slot;
    }
  }
  
  return null;
}

function findBestSlot(
  calendar: CalendarEvent[],
  durationMinutes: number,
  preferences: UserPreferences,
  urgency: number
): string | null {
  const allSlots = [...getTimeSlots(), ...getTomorrowSlots()];
  const availableSlots = allSlots.filter(slot => 
    isSlotAvailable(slot, durationMinutes, calendar) &&
    isWorkingHours(slot) &&
    (urgency >= 0.9 || !isLunchTime(slot))
  );
  
  if (availableSlots.length === 0) return null;
  
  // Score slots based on preferences
  const scoredSlots = availableSlots.map(slot => ({
    slot,
    score: scoreSlot(slot, preferences, urgency)
  }));
  
  scoredSlots.sort((a, b) => b.score - a.score);
  return scoredSlots[0].slot;
}

function scoreSlot(slot: string, preferences: UserPreferences, urgency: number): number {
  const time = dayjs(slot);
  let score = 0.5; // Base score
  
  // Morning boost for high energy users
  if (preferences.energy >= 4 && time.hour() >= 9 && time.hour() <= 11) {
    score += 0.3;
  }
  
  // Afternoon penalty for complex tasks
  if (time.hour() >= 15) {
    score -= 0.2;
  }
  
  // Lunch time penalty unless urgent
  if (isLunchTime(slot) && urgency < 0.9) {
    score -= 0.4;
  }
  
  // Today vs tomorrow preference
  if (time.isSame(dayjs(), 'day')) {
    score += 0.2;
  }
  
  return Math.max(0, Math.min(1, score));
}

function isSlotAvailable(startISO: string, durationMinutes: number, calendar: CalendarEvent[]): boolean {
  const start = dayjs(startISO);
  const end = start.add(durationMinutes, 'minute');
  
  return !calendar.some(event => {
    const eventStart = dayjs(event.start);
    const eventEnd = dayjs(event.end);
    
    return (start.isBefore(eventEnd) && end.isAfter(eventStart));
  });
}

function calculateConfidence(slot: string, urgency: number, preferences: UserPreferences): number {
  const time = dayjs(slot);
  let confidence = 0.7; // Base confidence
  
  // Higher confidence for urgent items
  confidence += urgency * 0.2;
  
  // Higher confidence for morning slots if high energy
  if (preferences.energy >= 4 && time.hour() >= 9 && time.hour() <= 11) {
    confidence += 0.1;
  }
  
  // Lower confidence for lunch time
  if (isLunchTime(slot)) {
    confidence -= 0.1;
  }
  
  return Math.max(0.5, Math.min(1, confidence));
}