'use client';

import { CalendarEvent, DeferSuggestion, Email, UserPreferences } from '@/lib/types';
import { formatTime, formatDateTime } from '@/lib/time';
import { Calendar, Clock, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import dayjs from 'dayjs';

interface MainContentProps {
  calendar: CalendarEvent[];
  suggestions: Record<string, DeferSuggestion>;
  emails: Email[];
  selectedEmail: Email | null;
  selectedSuggestion: DeferSuggestion | null;
  userPreferences: UserPreferences;
  onApplySuggestion: (emailId: string, suggestion: DeferSuggestion) => void;
}

export default function MainContent({ 
  calendar, 
  suggestions, 
  emails,
  selectedEmail, 
  selectedSuggestion, 
  userPreferences,
  onApplySuggestion 
}: MainContentProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Generate suggestion events for calendar
  const suggestionEvents: CalendarEvent[] = Object.entries(suggestions)
    .filter(([, suggestion]) => 
      suggestion.suggestedTimeISO && 
      (suggestion.action === 'schedule_block' || suggestion.action === 'snooze_today')
    )
    .map(([emailId, suggestion]) => {
      const email = emails.find(e => e.id === emailId);
      const duration = suggestion.estimatedDuration || userPreferences.focusBlockMins;
      
      return {
        id: `suggestion-${emailId}`,
        title: `Reply: ${email?.subject || 'Email'}`,
        start: suggestion.suggestedTimeISO!,
        end: new Date(new Date(suggestion.suggestedTimeISO!).getTime() + duration * 60000).toISOString(),
        type: 'suggestion' as const,
        emailId,
        confidence: suggestion.confidence
      };
    });

  const allEvents = [...calendar, ...suggestionEvents];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getActionColor = (action: string) => {
    const colors = {
      'reply_now': 'var(--reply-now)',
      'snooze_today': 'var(--snooze-today)', 
      'snooze_tomorrow': 'var(--snooze-tomorrow)',
      'schedule_block': 'var(--schedule-block)'
    };
    return colors[action as keyof typeof colors] || 'var(--text-secondary)';
  };

  const getActionLabel = (action: string) => {
    const labels = {
      'reply_now': 'Reply Immediately',
      'snooze_today': 'Snooze Until Today',
      'snooze_tomorrow': 'Snooze Until Tomorrow', 
      'schedule_block': 'Schedule Focus Block'
    };
    return labels[action as keyof typeof labels] || action;
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Calendar View */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Today&apos;s Schedule</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <CalendarView events={allEvents} />
        </div>
      </div>

      {/* Email Detail Panel */}
      {selectedEmail && (
        <div className="w-96 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col">
          {/* Email Header */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                  {selectedEmail.subject}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  From {selectedEmail.name} • {selectedEmail.company}
                </p>
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">
                {formatTime(selectedEmail.timestamp)}
              </span>
            </div>

            {/* Email stats */}
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span>~{selectedEmail.estimatedMinutes}min</span>
              <span>Priority: {Math.round(selectedEmail.importance * 100)}%</span>
              {selectedEmail.deadlineISO && (
                <span className="text-[var(--warning)]">
                  Due {formatDateTime(selectedEmail.deadlineISO)}
                </span>
              )}
            </div>
          </div>

          {/* Email Body */}
          <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="prose prose-sm max-w-none">
              {selectedEmail.body.split('\\n').map((paragraph, index) => (
                <p key={index} className="text-[var(--text-primary)] mb-3 last:mb-0 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Suggestion */}
          {selectedSuggestion && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Action */}
                <div>
                  <h4 className="font-medium text-[var(--text-primary)] mb-3">Suggested Action</h4>
                  <div className="surface-elevated p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getActionColor(selectedSuggestion.action) }}
                        ></div>
                        <span className="font-medium text-[var(--text-primary)]">
                          {getActionLabel(selectedSuggestion.action)}
                        </span>
                      </div>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {Math.round(selectedSuggestion.confidence * 100)}% confident
                      </span>
                    </div>

                    {selectedSuggestion.suggestedTimeISO && (
                      <div className="text-sm text-[var(--text-secondary)] mb-3">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        {formatDateTime(selectedSuggestion.suggestedTimeISO)}
                        {selectedSuggestion.estimatedDuration && (
                          <span className="ml-2">
                            ({selectedSuggestion.estimatedDuration}min)
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-[var(--text-secondary)]">
                      {selectedSuggestion.reason}
                    </p>
                  </div>
                </div>

                {/* Drafting Prompt */}
                <div>
                  <h4 className="font-medium text-[var(--text-primary)] mb-3">Drafting Prompt</h4>
                  <div className="surface-elevated p-4">
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-lg font-mono text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed mb-4 max-h-48 overflow-y-auto">
                      {selectedSuggestion.draftingPrompt}
                    </div>
                    <button 
                      className={`btn ${copiedPrompt ? 'secondary' : 'ghost'} w-full`}
                      onClick={() => copyToClipboard(selectedSuggestion.draftingPrompt)}
                    >
                      {copiedPrompt ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Prompt
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    className="btn primary w-full"
                    onClick={() => onApplySuggestion(selectedEmail.id, selectedSuggestion)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Apply {getActionLabel(selectedSuggestion.action)}
                  </button>
                  <button className="btn secondary w-full">
                    <Clock className="w-4 h-4" />
                    Override Time
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple calendar view component
function CalendarView({ events }: { events: CalendarEvent[] }) {
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return (
    <div className="space-y-1">
      {timeSlots.map((time) => {
        const hour = parseInt(time.split(':')[0]);
        const slotEvents = events.filter(event => {
          const eventHour = dayjs(event.start).hour();
          return eventHour === hour;
        });

        return (
          <div key={time} className="flex items-start gap-4 min-h-[60px]">
            <div className="w-16 text-sm text-[var(--text-secondary)] pt-1">
              {time}
            </div>
            <div className="flex-1 min-h-[60px] border-l border-[var(--border-light)] pl-4 relative">
              {slotEvents.map(event => (
                <div
                  key={event.id}
                  className={`mb-2 p-3 rounded-lg border-l-4 ${
                    event.type === 'suggestion' 
                      ? 'bg-[var(--primary-light)] border-l-[var(--primary)]' 
                      : 'bg-[var(--bg-secondary)] border-l-[var(--text-tertiary)]'
                  }`}
                >
                  <div className="font-medium text-sm text-[var(--text-primary)] mb-1">
                    {event.title}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {formatTime(event.start)}–{formatTime(event.end)}
                    {event.confidence && (
                      <span className="ml-2">• {Math.round(event.confidence * 100)}% confidence</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}