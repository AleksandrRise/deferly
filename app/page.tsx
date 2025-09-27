'use client';

import { useState, useEffect } from 'react';
import { Email } from '@/lib/types';
import EmailList from '@/components/EmailList';
import EmailDrawer from '@/components/EmailDrawer';
import Link from 'next/link';

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadEmails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/emails');
        const emailsData = await response.json();
        setEmails(emailsData);
      } catch (error) {
        console.error('Failed to load emails:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEmails();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const selectedEmail = selectedEmailId ? emails.find(e => e.id === selectedEmailId) || null : null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Deferly</h2>
          <p className="text-white text-opacity-80">Preparing your smart inbox...</p>
          <div className="flex justify-center space-x-1 mt-4">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-primary overflow-hidden">
      {/* Header with floating glass effect */}
      <div className="relative">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-white bg-opacity-10 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-20 -left-10 w-48 h-48 bg-purple-300 bg-opacity-20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-10 right-20 w-32 h-32 bg-pink-300 bg-opacity-20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="glass backdrop-blur-lg border-b border-white border-opacity-20 relative z-10">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                {/* Logo and Brand */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-white to-purple-200 rounded-2xl flex items-center justify-center transform rotate-12 animate-glow">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">D</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white text-shadow-lg">Deferly</h1>
                    <p className="text-white text-opacity-70 text-sm">Smart Email Timing</p>
                  </div>
                </div>
                
                {/* Navigation */}
                <nav className="flex space-x-2">
                  <div className="nav-link active">
                    <span className="mr-2">📧</span>
                    Inbox
                  </div>
                  <Link href="/calendar" className="nav-link">
                    <span className="mr-2">📅</span>
                    Calendar
                  </Link>
                </nav>
              </div>
              
              {/* Right side info */}
              <div className="flex items-center space-x-6">
                {/* Time and date */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-white text-shadow">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-white text-opacity-80 text-sm">
                    {formatDate(currentTime)}
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-white font-semibold">{emails.length}</span>
                    <span className="text-white text-opacity-70 text-xs">emails</span>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                </div>
              </div>
            </div>
            
            {/* Greeting and stats */}
            <div className="mt-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white text-shadow">
                  {getGreeting()}! Ready to tackle your inbox?
                </h2>
                <p className="text-white text-opacity-80">
                  Let's find the perfect time to handle your emails
                </p>
              </div>
              
              {/* Quick stats */}
              <div className="flex space-x-4">
                <div className="glass-dark rounded-xl px-4 py-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {emails.filter(e => !e.status || e.status === 'inbox').length}
                    </div>
                    <div className="text-white text-opacity-70 text-xs">Unread</div>
                  </div>
                </div>
                <div className="glass-dark rounded-xl px-4 py-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {emails.filter(e => e.deadlineISO).length}
                    </div>
                    <div className="text-white text-opacity-70 text-xs">Urgent</div>
                  </div>
                </div>
                <div className="glass-dark rounded-xl px-4 py-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {Math.round(emails.reduce((sum, e) => sum + (e.estimatedMinutes || 0), 0) / 60)}h
                    </div>
                    <div className="text-white text-opacity-70 text-xs">Est. Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Email List */}
        <div className="relative z-10">
          <EmailList 
            emails={emails}
            selectedEmailId={selectedEmailId}
            onSelectEmail={setSelectedEmailId}
          />
        </div>
        
        {/* Right side content area */}
        <div className="flex-1 flex items-center justify-center p-8">
          {!selectedEmail ? (
            <div className="text-center max-w-md">
              <div className="text-8xl mb-6 animate-float">📬</div>
              <h3 className="text-2xl font-bold text-white text-shadow-lg mb-4">
                Select an email to get started
              </h3>
              <p className="text-white text-opacity-80 text-lg leading-relaxed">
                Choose an email from your inbox and I'll help you find the perfect time to respond with smart scheduling suggestions.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <div className="glass-dark rounded-xl px-4 py-3 animate-pulse">
                  <span className="text-white text-opacity-80 text-sm">💡 Smart Planning</span>
                </div>
                <div className="glass-dark rounded-xl px-4 py-3 animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <span className="text-white text-opacity-80 text-sm">🤖 AI Assistant</span>
                </div>
                <div className="glass-dark rounded-xl px-4 py-3 animate-pulse" style={{ animationDelay: '1s' }}>
                  <span className="text-white text-opacity-80 text-sm">📅 Calendar Sync</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Email Drawer */}
      {selectedEmail && (
        <EmailDrawer 
          email={selectedEmail}
          onClose={() => setSelectedEmailId(null)}
        />
      )}
      
      {/* Floating action hints */}
      <div className="fixed bottom-6 right-6 space-y-3 z-40">
        <div className="glass-dark rounded-full p-3 animate-bounce">
          <span className="text-white text-opacity-80 text-sm">💡</span>
        </div>
      </div>
    </div>
  );
}