'use client';

import { Email, DeferSuggestion } from '@/lib/types';
import { formatTime } from '@/lib/time';
import { Paperclip, Clock, AlertCircle, Calendar } from 'lucide-react';

interface SidebarProps {
  emails: Email[];
  suggestions: Record<string, DeferSuggestion>;
  selectedEmailId: string | null;
  onSelectEmail: (emailId: string) => void;
}

export default function Sidebar({ emails, suggestions, selectedEmailId, onSelectEmail }: SidebarProps) {
  const getStatusChip = (action: string) => {
    const chipClasses = {
      'reply_now': 'status-chip reply-now',
      'snooze_today': 'status-chip snooze-today', 
      'snooze_tomorrow': 'status-chip snooze-tomorrow',
      'schedule_block': 'status-chip schedule-block'
    };

    const labels = {
      'reply_now': 'Reply Now',
      'snooze_today': 'Today',
      'snooze_tomorrow': 'Tomorrow', 
      'schedule_block': 'Schedule'
    };

    return {
      className: chipClasses[action as keyof typeof chipClasses] || 'status-chip snooze-today',
      label: labels[action as keyof typeof labels] || 'Pending'
    };
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'reply_now': return <AlertCircle className="w-3 h-3" />;
      case 'schedule_block': return <Calendar className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="w-[var(--sidebar-width)] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Inbox</h2>
        <p className="text-sm text-[var(--text-secondary)]">{emails.length} emails need attention</p>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => {
          const suggestion = suggestions[email.id];
          const isSelected = selectedEmailId === email.id;
          const chip = suggestion ? getStatusChip(suggestion.action) : null;

          return (
            <div
              key={email.id}
              className={`p-4 border-b border-[var(--border-light)] cursor-pointer transition-colors hover:bg-[var(--bg-secondary)] ${
                isSelected ? 'bg-[var(--primary-light)] border-l-2 border-l-[var(--primary)]' : ''
              }`}
              onClick={() => onSelectEmail(email.id)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--text-primary)] text-sm">
                        {email.name}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {email.company}
                      </span>
                      {email.hasAttachment && (
                        <Paperclip className="w-3 h-3 text-[var(--text-tertiary)]" />
                      )}
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)] text-sm leading-tight mb-1 line-clamp-1">
                      {email.subject}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3">
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatTime(email.timestamp)}
                    </span>
                    {chip && (
                      <div className={chip.className}>
                        {getActionIcon(suggestion?.action || '')}
                        {chip.label}
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {email.preview}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
                    <span>~{email.estimatedMinutes}min</span>
                    {email.importance > 0.7 && (
                      <span className="text-[var(--error)] font-medium">High Priority</span>
                    )}
                    {email.deadlineISO && (
                      <span className="text-[var(--warning)]">
                        Due {new Date(email.deadlineISO).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {suggestion && (
                    <span className="text-[var(--text-tertiary)]">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}