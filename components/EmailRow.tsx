'use client';

import { Email, DeferSuggestion } from '@/lib/types';
import { formatTime } from '@/lib/time';
import { Paperclip, Clock } from 'lucide-react';

interface EmailRowProps {
  email: Email;
  suggestion?: DeferSuggestion;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function EmailRow({ email, suggestion, isSelected, onClick }: EmailRowProps) {
  const getChipForAction = (action: string) => {
    switch (action) {
      case 'reply_now': return { className: 'chip-green', label: 'Reply Now' };
      case 'snooze_today': return { className: 'chip-blue', label: 'Today' };
      case 'snooze_tomorrow': return { className: 'chip-purple', label: 'Tomorrow' };
      case 'schedule_block': return { className: 'chip-orange', label: 'Block' };
      default: return { className: 'chip-blue', label: 'Pending' };
    }
  };

  const chip = suggestion ? getChipForAction(suggestion.action) : null;

  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-[var(--text)] truncate">
              {email.name}
            </h3>
            <span className="text-xs text-[var(--muted)]">
              {email.company}
            </span>
            {email.hasAttachment && (
              <Paperclip className="w-3 h-3 text-[var(--muted)]" />
            )}
          </div>
          
          <p className="text-sm font-medium text-[var(--text)] mb-1 truncate">
            {email.subject}
          </p>
          
          <p className="text-sm text-[var(--muted)] line-clamp-2">
            {email.preview}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-2 ml-3">
          <span className="text-xs text-[var(--muted)]">
            {formatTime(email.timestamp)}
          </span>
          
          {chip && (
            <div className={`chip ${chip.className}`}>
              {chip.label}
            </div>
          )}
          
          {suggestion && (
            <div className="text-xs text-[var(--muted)] flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{Math.round(suggestion.confidence * 100)}%</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <div className="flex items-center space-x-3">
          <span>~{email.estimatedMinutes}min</span>
          {email.importance > 0.7 && (
            <span className="text-red-600 font-medium">High Priority</span>
          )}
          {email.deadlineISO && (
            <span className="text-orange-600">
              Due {new Date(email.deadlineISO).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {suggestion?.reason && (
          <div 
            className="max-w-48 truncate"
            title={suggestion.reason}
          >
            {suggestion.reason}
          </div>
        )}
      </div>
    </div>
  );
}