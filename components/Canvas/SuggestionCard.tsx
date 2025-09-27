'use client';

import { DeferSuggestion, Email } from '@/lib/types';
import { formatDateTime } from '@/lib/time';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface SuggestionCardProps {
  email: Email;
  suggestion: DeferSuggestion;
  onApply?: () => void;
  onOverride?: () => void;
}

export default function SuggestionCard({ email, suggestion, onApply, onOverride }: SuggestionCardProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'reply_now': return 'chip-green';
      case 'snooze_today': return 'chip-blue';
      case 'snooze_tomorrow': return 'chip-purple';
      case 'schedule_block': return 'chip-orange';
      default: return 'chip-blue';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'reply_now': return 'Reply Now';
      case 'snooze_today': return 'Snooze Today';
      case 'snooze_tomorrow': return 'Snooze Tomorrow';
      case 'schedule_block': return 'Schedule Block';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'reply_now': return <AlertCircle className="w-4 h-4" />;
      case 'schedule_block': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="panel p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text)] mb-1">{email.subject}</h3>
          <p className="text-sm text-[var(--muted)] mb-2">
            From {email.name} ({email.company})
          </p>
          
          <div className={`chip ${getActionColor(suggestion.action)} inline-flex items-center space-x-1`}>
            {getActionIcon(suggestion.action)}
            <span>{getActionLabel(suggestion.action)}</span>
          </div>
        </div>
        
        <div className="text-right text-sm text-[var(--muted)]">
          <div>Confidence</div>
          <div className="font-semibold text-[var(--text)]">
            {Math.round(suggestion.confidence * 100)}%
          </div>
        </div>
      </div>

      {suggestion.suggestedTimeISO && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-[var(--text)] mb-1">
            Suggested Time
          </div>
          <div className="text-sm text-[var(--muted)]">
            {formatDateTime(suggestion.suggestedTimeISO)}
          </div>
          {suggestion.estimatedDuration && (
            <div className="text-xs text-[var(--muted)] mt-1">
              Duration: {suggestion.estimatedDuration} minutes
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 rounded-lg p-3">
        <div className="text-sm font-medium text-amber-800 mb-1">Reasoning</div>
        <p className="text-sm text-amber-700">{suggestion.reason}</p>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-[var(--text)]">Drafting Prompt</div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-[var(--text)] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
          {suggestion.draftingPrompt}
        </div>
        <button 
          className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-[var(--text)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={() => navigator.clipboard.writeText(suggestion.draftingPrompt)}
        >
          Copy Prompt
        </button>
      </div>

      <div className="flex space-x-2 pt-2">
        <button
          onClick={onApply}
          className="flex-1 btn btn-primary"
        >
          Apply {getActionLabel(suggestion.action)}
        </button>
        <button
          onClick={onOverride}
          className="px-4 btn btn-secondary"
        >
          Override Time
        </button>
      </div>
    </div>
  );
}