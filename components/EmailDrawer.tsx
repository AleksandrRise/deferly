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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    generateSummary();
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

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
      // Show a beautiful error notification instead of alert
      console.log('Failed to create defer plan. Please try again.');
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
        console.log('Meeting block created successfully!');
        handleClose();
      } else {
        throw new Error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
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
        console.log('Events moved successfully!');
      } else {
        throw new Error('Failed to move events');
      }
    } catch (error) {
      console.error('Failed to move events:', error);
    }
  };

  const handleCopyMessage = () => {
    if (planResult?.deferMessage) {
      navigator.clipboard.writeText(planResult.deferMessage);
      console.log('Defer message copied to clipboard!');
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
        content: "I'm having trouble connecting to Gemini AI right now. You can use the 'Plan defer now' option for automated suggestions.",
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

  const getImportanceGradient = () => {
    const importance = calculateImportance(email).score;
    if (importance >= 0.8) return 'from-red-400 to-pink-500';
    if (importance >= 0.6) return 'from-orange-400 to-yellow-500';
    if (importance >= 0.4) return 'from-yellow-400 to-green-500';
    return 'from-blue-400 to-purple-500';
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100 backdrop-blur-sm' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div 
        className={`glass rounded-3xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] flex flex-col transform transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'
        }`}
      >
        {/* Header */}
        <div className="p-8 border-b border-white border-opacity-20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getImportanceGradient()} animate-pulse`}></div>
                <span className="text-sm font-medium text-white text-opacity-80">
                  From {email.company}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white text-shadow-lg mb-2">
                {email.subject}
              </h2>
              <p className="text-white text-opacity-80">
                From: <span className="font-semibold">{email.name}</span> &lt;{email.from}&gt;
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-red-500 bg-opacity-80 hover:bg-red-600 hover:bg-opacity-90 transition-all duration-300 transform hover:scale-110 text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Summary Card */}
          <div className="card-glass p-6 mb-8 animate-slide-in-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h3 className="text-lg font-bold text-white">Smart Summary</h3>
            </div>
            <p className="text-white text-opacity-90 leading-relaxed">
              {summary || (
                <div className="flex items-center space-x-2">
                  <div className="spinner w-4 h-4"></div>
                  <span>Analyzing email content...</span>
                </div>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          {!showChat && !planResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={handlePlanDefer}
                disabled={isPlanning}
                className="btn-primary group relative overflow-hidden"
              >
                <div className="flex items-center justify-center space-x-3">
                  {isPlanning ? (
                    <>
                      <div className="spinner"></div>
                      <span>Planning Perfect Time...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🎯</span>
                      <span className="font-bold">Plan Defer Now</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
              
              <button
                onClick={startChat}
                className="btn-ghost group relative overflow-hidden"
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <span className="font-bold">Ask Gemini AI</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
          )}

          {/* Plan Result */}
          {planResult && (
            <div className="card-glass p-6 mb-8 animate-slide-in-up">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <span>⭐</span>
                <span>Recommended Plan</span>
              </h3>
              
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white text-opacity-80 text-sm">Best Time</p>
                    <p className="text-2xl font-bold text-white">
                      {formatTime(planResult.slot.startISO)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-opacity-80 text-sm">Confidence</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(planResult.slot.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <p className="text-white text-opacity-90 text-sm">{planResult.slot.reason}</p>
                
                {planResult.slot.movedEvents && planResult.slot.movedEvents.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-400 bg-opacity-20 rounded-xl">
                    <p className="text-white font-semibold flex items-center space-x-2">
                      <span>📅</span>
                      <span>Will move: {planResult.slot.movedEvents.map(e => e.title).join(', ')}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleCreateMeeting}
                  className="btn-secondary group"
                >
                  <span className="mr-2">📅</span>
                  Create Meeting
                </button>
                
                {planResult.slot.movedEvents && planResult.slot.movedEvents.length > 0 && (
                  <button
                    onClick={handleApplyMoves}
                    className="btn-secondary group"
                  >
                    <span className="mr-2">🔄</span>
                    Apply Moves
                  </button>
                )}
                
                <button
                  onClick={handleCopyMessage}
                  className="btn-secondary group"
                >
                  <span className="mr-2">📋</span>
                  Copy Message
                </button>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          {showChat && (
            <div className="card-glass overflow-hidden animate-slide-in-up">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                <h3 className="text-white font-bold flex items-center space-x-2">
                  <span>🤖</span>
                  <span>Gemini AI Assistant</span>
                </h3>
              </div>
              
              <div className="h-80 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-800 text-white border border-gray-600'
                      } animate-slide-in-up`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 px-4 py-3 rounded-2xl border border-gray-600">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-white border-opacity-20">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Ask about timing preferences..."
                    className="input-modern flex-1"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="btn-primary px-6"
                  >
                    <span>Send</span>
                    <span className="ml-2">🚀</span>
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