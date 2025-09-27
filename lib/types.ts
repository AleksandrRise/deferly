export interface Email {
  id: string;
  from: string;
  name: string;
  company: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  importance: number;
  estimatedMinutes: number;
  deadlineISO?: string;
  tags: string[];
  hasAttachment: boolean;
  status?: 'inbox' | 'snoozed' | 'replied';
  snoozeUntil?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'meeting' | 'focus' | 'break' | 'suggestion';
  description?: string;
  attendees?: string[];
  emailId?: string;
  confidence?: number;
}

export interface DeferSuggestion {
  action: 'reply_now' | 'snooze_today' | 'snooze_tomorrow' | 'schedule_block';
  suggestedTimeISO?: string;
  reason: string;
  confidence: number;
  draftingPrompt: string;
  estimatedDuration?: number;
}

export interface PlanResult {
  emailId: string;
  suggestion: DeferSuggestion;
}

export interface UserPreferences {
  energy: number; // 1-5
  focusBlockMins: number; // 15, 30, 45, 60
  workingHours: {
    start: number; // 9
    end: number; // 18
    lunchStart: number; // 12
    lunchEnd: number; // 13
  };
  timezone: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: AgentAction[];
}

export interface AgentAction {
  type: 'create_calendar_block' | 'snooze_email' | 'generate_draft';
  params: Record<string, unknown>;
  result?: Record<string, unknown>;
}