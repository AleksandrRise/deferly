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
  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);

  useEffect(() => {
    const sorted = sortMode === 'importance' 
      ? sortEmailsByImportance(emails)
      : sortEmailsByRecency(emails);
    setSortedEmails(sorted);
  }, [emails, sortMode]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    } else if (diffMinutes < 2880) { // 48 hours
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getImportanceGradient = (email: Email) => {
    const importance = calculateImportance(email).score;
    if (importance >= 0.8) return 'from-red-400 to-pink-500';
    if (importance >= 0.6) return 'from-orange-400 to-yellow-500';
    if (importance >= 0.4) return 'from-yellow-400 to-green-500';
    return 'from-blue-400 to-purple-500';
  };

  const getImportanceIcon = (email: Email) => {
    const importance = calculateImportance(email).score;
    if (importance >= 0.8) return '🔥';
    if (importance >= 0.6) return '⚡';
    if (importance >= 0.4) return '📌';
    return '💬';
  };

  const getCompanyInitials = (company: string) => {
    return company.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-96 h-full glass-dark backdrop-blur-lg flex flex-col animate-slide-in-left">
      {/* Header with toggle */}
      <div className="p-6 border-b border-white border-opacity-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white text-shadow-lg">✉️ Inbox</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white text-opacity-80 font-medium">{emails.length} emails</span>
          </div>
        </div>
        
        {/* Sort toggle - COMPLETELY FIXED HOVER */}
        <div className="glass rounded-xl p-1 backdrop-blur-md">
          <div className="flex">
            <button
              onClick={() => setSortMode('importance')}
              className={`flex-1 px-4 py-3 text-sm font-bold rounded-lg transition-all duration-300 transform relative ${
                sortMode === 'importance'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-25 hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <span>🎯</span>
                <span>Importance</span>
              </div>
            </button>
            <button
              onClick={() => setSortMode('recency')}
              className={`flex-1 px-4 py-3 text-sm font-bold rounded-lg transition-all duration-300 transform relative ${
                sortMode === 'recency'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-25 hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <span>⏰</span>
                <span>Recency</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedEmails.map((email, index) => {
          const isSelected = email.id === selectedEmailId;
          const isHovered = hoveredEmail === email.id;
          const importance = calculateImportance(email);
          
          return (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email.id)}
              onMouseEnter={() => setHoveredEmail(email.id)}
              onMouseLeave={() => setHoveredEmail(null)}
              className={`card-glass p-4 cursor-pointer transition-all duration-500 transform animate-slide-in-up relative overflow-hidden ${
                isSelected
                  ? 'scale-105 ring-2 ring-purple-400 ring-opacity-70 shadow-2xl'
                  : isHovered
                  ? 'scale-102 shadow-xl'
                  : 'hover:shadow-lg'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Hover glow effect */}
              {(isHovered || isSelected) && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-10 rounded-lg"></div>
              )}
              
              <div className="flex items-start space-x-4 relative z-10">
                {/* Company Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-r ${getImportanceGradient(email)} animate-glow shadow-lg`}>
                  {getCompanyInitials(email.company)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg animate-bounce-slow">{getImportanceIcon(email)}</span>
                      <p className="text-sm font-bold text-white truncate text-shadow">
                        {email.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-white bg-opacity-60 rounded-full"></div>
                      <p className="text-xs text-white text-opacity-70 font-medium">
                        {formatTime(email.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Subject */}
                  <h3 className="text-white font-bold mb-2 line-clamp-1 text-shadow">
                    {email.subject}
                  </h3>
                  
                  {/* Preview */}
                  <p className="text-white text-opacity-90 text-sm mb-3 line-clamp-2 text-shadow">
                    {email.preview}
                  </p>
                  
                  {/* Metadata badges */}
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    {sortMode === 'importance' && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getImportanceGradient(email)} text-white shadow-lg`}>
                        {Math.round(importance.score * 100)}%
                      </span>
                    )}
                    
                    {email.deadlineISO && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-lg">
                        <span className="mr-1">⚠️</span>
                        Deadline
                      </span>
                    )}
                    
                    {email.hasAttachment && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                        <span className="mr-1">📎</span>
                        File
                      </span>
                    )}
                    
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white backdrop-blur-sm shadow-lg">
                      {email.estimatedMinutes}min
                    </span>
                  </div>
                </div>

                {/* Action indicator */}
                {isSelected && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse shadow-lg"></div>
                  </div>
                )}
              </div>

              {/* Bottom accent line */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-b-lg animate-pulse"></div>
              )}
            </div>
          );
        })}
        
        {/* Empty state */}
        {sortedEmails.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-float">📭</div>
            <h3 className="text-xl font-bold text-white mb-2 text-shadow-lg">No emails found</h3>
            <p className="text-white text-opacity-70 text-shadow">Your inbox is empty or all emails are filtered out.</p>
          </div>
        )}
      </div>
    </div>
  );
}
