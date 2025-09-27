'use client';

import { useState, useEffect } from 'react';
import { Email } from '@/lib/types';
import { sortEmailsByImportance, sortEmailsByRecency, calculateImportance } from '@/lib/importance';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (emailId: string) => void;
}

type SortMode = 'importance' | 'recency';

export default function EmailList({ emails, selectedEmailId, onSelectEmail }: EmailListProps) {
  const [sortMode, setSortMode] = useState<SortMode>('importance');
  const [sortedEmails, setSortedEmails] = useState<Email[]>([]);

  useEffect(() => {
    const sorted = sortMode === 'importance' 
      ? sortEmailsByImportance(emails)
      : sortEmailsByRecency(emails);
    setSortedEmails(sorted);
  }, [emails, sortMode]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getImportanceColor = (email: Email) => {
    const importance = calculateImportance(email).score;
    if (importance >= 0.8) return 'bg-red-500';
    if (importance >= 0.6) return 'bg-orange-500';
    if (importance >= 0.4) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header with toggle */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
          <span className="text-sm text-gray-500">{emails.length} emails</span>
        </div>
        
        {/* Sort toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSortMode('importance')}
            className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              sortMode === 'importance'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Importance
          </button>
          <button
            onClick={() => setSortMode('recency')}
            className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              sortMode === 'recency'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recency
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {sortedEmails.map((email) => {
          const isSelected = email.id === selectedEmailId;
          const importance = calculateImportance(email);
          
          return (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Importance indicator */}
                <div className={`w-2 h-2 rounded-full mt-2 ${getImportanceColor(email)}`} />
                
                <div className="flex-1 min-w-0">
                  {/* Sender */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {email.name}
                    </p>
                    <p className="text-xs text-gray-500 ml-2">
                      {formatTime(email.timestamp)}
                    </p>
                  </div>
                  
                  {/* Subject */}
                  <p className="text-sm text-gray-900 font-medium mt-1 truncate">
                    {email.subject}
                  </p>
                  
                  {/* Preview */}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {email.preview}
                  </p>
                  
                  {/* Metadata */}
                  <div className="flex items-center mt-2 space-x-2">
                    {sortMode === 'importance' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {Math.round(importance.score * 100)}% important
                      </span>
                    )}
                    
                    {email.deadlineISO && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Deadline
                      </span>
                    )}
                    
                    {email.hasAttachment && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        📎
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}