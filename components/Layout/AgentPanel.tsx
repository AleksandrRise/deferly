'use client';

import { useState } from 'react';
import { Email, DeferSuggestion, UserPreferences } from '@/lib/types';
import { Send, Bot, User, CheckCircle, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  approved?: boolean;
}

interface AgentPanelProps {
  emails: Email[];
  suggestions: Record<string, DeferSuggestion>;
  userPreferences: UserPreferences;
}

export default function AgentPanel({ emails, suggestions }: AgentPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `👋 Hi! I&apos;m your email timing assistant.\n\nI&apos;ve analyzed your ${emails.length} emails and can help you plan the perfect reply schedule based on urgency, deadlines, and your energy patterns.\n\nTry asking me: "Plan my email replies for today"`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApproveButton, setShowApproveButton] = useState(false);

  const sendMessage = async (message: string, approve: boolean = false) => {
    if (!message.trim() && !approve) return;

    setIsLoading(true);
    setShowApproveButton(false);

    if (!approve) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
    }

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: approve ? '' : message, 
          approve 
        }),
      });

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
        approved: approve
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (!approve && data.response.includes('Approve')) {
        setShowApproveButton(true);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I&apos;m having trouble right now. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleApprove = () => {
    sendMessage('', true);
    setShowApproveButton(false);
  };

  const quickActions = [
    "Plan my email replies for today",
    "Show me urgent emails only",
    "Optimize my schedule for high energy",
    "What should I reply to first?"
  ];

  return (
    <div className="w-80 bg-[var(--surface)] border-l border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">AI Assistant</h3>
            <p className="text-xs text-[var(--text-secondary)]">Email timing expert</p>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[var(--bg-secondary)] p-2 rounded-lg text-center">
            <div className="font-semibold text-[var(--text-primary)]">{emails.length}</div>
            <div className="text-[var(--text-secondary)]">Emails</div>
          </div>
          <div className="bg-[var(--bg-secondary)] p-2 rounded-lg text-center">
            <div className="font-semibold text-[var(--text-primary)]">{Object.keys(suggestions).length}</div>
            <div className="text-[var(--text-secondary)]">Planned</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-b border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Quick Actions</h4>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="w-full text-left p-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                onClick={() => sendMessage(action)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-7 h-7 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
              <div
                className={`p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
              
              <div className={`text-xs text-[var(--text-tertiary)] mt-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {message.approved && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[var(--success)]">
                    <CheckCircle className="w-3 h-3" />
                    Applied
                  </span>
                )}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-7 h-7 bg-[var(--text-secondary)] rounded-full flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-[var(--primary)] to-[var(--info)] rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approve Button */}
      {showApproveButton && (
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={handleApprove}
            className="btn primary w-full"
            disabled={isLoading}
          >
            <CheckCircle className="w-4 h-4" />
            👍 Approve Plan
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your email schedule..."
            className="flex-1 form-control text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn primary px-3"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}