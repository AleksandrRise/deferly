'use client';

import { useState, useEffect } from 'react';
import { Email, CalendarEvent, AgentMessage } from '@/lib/types';
import { calculateImportance } from '@/lib/importance';

interface EmailDrawerProps {
  email: Email;
  onClose: () => void;
}

interface PlanResult {
  slot: {
    startISO: string;
    endISO: string;
    reason: string;
    confidence: number;
    movedEvents?: CalendarEvent[];
  };
  alternatives: Array<{
    startISO: string;
    endISO: string;
    reason: string;
  }>;
  deferMessage: string;
  action: 'reply_now' | 'snooze_today' | 'snooze_tomorrow' | 'schedule_block';
}

export default function EmailDrawer({ email, onClose }: EmailDrawerProps) {
  const [summary, setSummary] = useState<string>('');
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<AgentMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    generateSummary();
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateSummary = async () => {
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        // Fallback to local summary
        const importance = calculateImportance(email);
        setSummary(`${importance.reasoning.join('. ')}. Estimated ${email.estimatedMinutes} minutes to handle.`);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary(`Email from ${email.name} about ${email.subject.toLowerCase()}.`);
    }
  };

  const handlePlanDefer = async () => {
    setIsPlanning(true);
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email.id })
      });
      
      if (response.ok) {
        const result = await response.json();
        setPlanResult(result);
      } else {
        throw new Error('Failed to create plan');
      }
    } catch (error) {
      console.error('Planning error:', error);
      alert('Failed to create defer plan. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!planResult) return;
    
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_block',
          emailId: email.id,
          slot: planResult.slot
        })
      });
      
      if (response.ok) {
        alert('Meeting block created successfully!');
        onClose();
      } else {
        throw new Error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  const handleApplyMoves = async () => {
    if (!planResult?.slot.movedEvents) return;
    
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_moves',
          movedEvents: planResult.slot.movedEvents
        })
      });
      
      if (response.ok) {
        alert('Events moved successfully!');
      } else {
        throw new Error('Failed to move events');
      }
    } catch (error) {
      console.error('Failed to move events:', error);
      alert('Failed to move events. Please try again.');
    }
  };

  const handleCopyMessage = () => {
    if (planResult?.deferMessage) {
      navigator.clipboard.writeText(planResult.deferMessage);
      alert('Defer message copied to clipboard!');
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: AgentMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          email,
          context: { messages: chatMessages }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const assistantMessage: AgentMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          actions: data.actions
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Agent request failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: AgentMessage = {
        role: 'assistant',
        content: "I'm having trouble right now. You can use the 'Plan defer now' option for automated suggestions.",
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const startChat = () => {
    setShowChat(true);
    if (chatMessages.length === 0) {
      const initialMessage: AgentMessage = {
        role: 'assistant',
        content: `I can help you find the best time to handle "${email.subject}". What are your scheduling preferences or constraints?`,
        timestamp: new Date().toISOString()
      };
      setChatMessages([initialMessage]);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {email.subject}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            From: {email.name} &lt;{email.from}&gt;
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Summary</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {summary || 'Generating summary...'}
            </p>
          </div>

          {/* Action Buttons */}
          {!showChat && !planResult && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={handlePlanDefer}
                disabled={isPlanning}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isPlanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Planning...
                  </>
                ) : (
                  'Plan defer now'
                )}
              </button>
              
              <button
                onClick={startChat}
                className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Ask AI
              </button>
            </div>
          )}

          {/* Plan Result */}
          {planResult && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Recommended Plan</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Best Time: {formatTime(planResult.slot.startISO)}
                  </span>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {Math.round(planResult.slot.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm text-blue-800">{planResult.slot.reason}</p>
                
                {planResult.slot.movedEvents && planResult.slot.movedEvents.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded">
                    <p className="text-sm text-yellow-800">
                      Will move: {planResult.slot.movedEvents.map(e => e.title).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handleCreateMeeting}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Create meeting
                </button>
                
                {planResult.slot.movedEvents && planResult.slot.movedEvents.length > 0 && (
                  <button
                    onClick={handleApplyMoves}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                  >
                    Apply moves
                  </button>
                )}
              </div>

              <button
                onClick={handleCopyMessage}
                className="w-full px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Copy defer message
              </button>
            </div>
          )}

          {/* Chat Interface */}
          {showChat && (
            <div className="border rounded-lg">
              <div className="h-64 overflow-y-auto p-4 bg-gray-50">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-3 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="text-left mb-3">
                    <div className="inline-block px-3 py-2 rounded-lg bg-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Ask about timing..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}