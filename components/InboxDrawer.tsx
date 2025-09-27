'use client';

import { useState } from 'react';
import { Email, DeferSuggestion } from '@/lib/types';
import { X } from 'lucide-react';
import EmailRow from './EmailRow';
import SuggestionCard from './Canvas/SuggestionCard';

interface InboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  emails: Email[];
  suggestions: Record<string, DeferSuggestion>;
  onApplySuggestion?: (emailId: string, suggestion: DeferSuggestion) => void;
}

export default function InboxDrawer({ 
  isOpen, 
  onClose, 
  emails, 
  suggestions,
  onApplySuggestion 
}: InboxDrawerProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  const selectedEmail = selectedEmailId ? emails.find(e => e.id === selectedEmailId) : null;
  const selectedSuggestion = selectedEmailId ? suggestions[selectedEmailId] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-[var(--text)]">Inbox</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="w-5 h-5 text-[var(--muted)]" />
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Email list */}
        <div className={`${selectedEmail ? 'w-full lg:w-1/2' : 'w-full'} border-r border-gray-100 overflow-y-auto`}>
          {emails.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              suggestion={suggestions[email.id]}
              isSelected={selectedEmailId === email.id}
              onClick={() => setSelectedEmailId(
                selectedEmailId === email.id ? null : email.id
              )}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selectedEmail && selectedSuggestion && (
          <div className="hidden lg:block w-1/2 overflow-y-auto">
            <div className="p-4">
              <SuggestionCard
                email={selectedEmail}
                suggestion={selectedSuggestion}
                onApply={() => {
                  onApplySuggestion?.(selectedEmail.id, selectedSuggestion);
                  setSelectedEmailId(null);
                }}
                onOverride={() => {
                  // TODO: Implement time override
                  console.log('Override time for', selectedEmail.id);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile detail view */}
      {selectedEmail && selectedSuggestion && (
        <div className="lg:hidden border-t border-gray-100">
          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[var(--text)]">Suggestion</h3>
              <button
                onClick={() => setSelectedEmailId(null)}
                className="text-sm text-[var(--muted)] hover:text-[var(--text)]"
              >
                Close
              </button>
            </div>
            <SuggestionCard
              email={selectedEmail}
              suggestion={selectedSuggestion}
              onApply={() => {
                onApplySuggestion?.(selectedEmail.id, selectedSuggestion);
                setSelectedEmailId(null);
              }}
              onOverride={() => {
                console.log('Override time for', selectedEmail.id);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}