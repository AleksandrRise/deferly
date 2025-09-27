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
        // Fallback to mock data
        const mockEmails = [
          {
            id: '1',
            name: 'Sarah Chen',
            company: 'TechCorp',
            from: 'sarah@techcorp.com',
            subject: 'Urgent: Project deadline moved to tomorrow',
            preview: 'Hi there! I wanted to let you know that we need to move the project deadline up by a week. This will require us to prioritize...',
            body: 'Hi there! I wanted to let you know that we need to move the project deadline up by a week. This will require us to prioritize several key features and may impact the timeline for other projects. Please let me know if this causes any issues on your end and how we can best coordinate this change.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            importance: 0.9,
            deadlineISO: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            estimatedMinutes: 15,
            hasAttachment: true,
            tags: ['urgent', 'deadline', 'project']
          },
          {
            id: '2',
            name: 'Mike Johnson',
            company: 'Design Studio',
            from: 'mike@designstudio.com',
            subject: 'New mockups for review',
            preview: 'I have completed the new UI mockups for the mobile app. Could you please review them when you have a chance? I think you will...',
            body: 'I have completed the new UI mockups for the mobile app. Could you please review them when you have a chance? I think you will be pleased with the direction we have taken. The new design incorporates all the feedback from the last review session.',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            importance: 0.6,
            estimatedMinutes: 30,
            hasAttachment: true,
            tags: ['design', 'review', 'mockups']
          },
          {
            id: '3',
            name: 'Lisa Park',
            company: 'Marketing Pro',
            from: 'lisa@marketingpro.com',
            subject: 'Weekly sync meeting notes',
            preview: 'Thanks for joining the weekly sync today. Here are the key takeaways and action items we discussed during the meeting...',
            body: 'Thanks for joining the weekly sync today. Here are the key takeaways and action items we discussed during the meeting. Please review and let me know if I missed anything important.',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            importance: 0.3,
            estimatedMinutes: 10,
            tags: ['meeting', 'notes', 'weekly']
          },
          {
            id: '4',
            name: 'David Wilson',
            company: 'Startup Inc',
            from: 'david@startup.com',
            subject: 'Investment opportunity discussion',
            preview: 'I hope this email finds you well. I wanted to reach out regarding a potential investment opportunity that might interest you...',
            body: 'I hope this email finds you well. I wanted to reach out regarding a potential investment opportunity that might interest you. We are looking for strategic partners for our next funding round.',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            importance: 0.8,
            estimatedMinutes: 45,
            tags: ['investment', 'opportunity', 'business']
          },
          {
            id: '5',
            name: 'Emma Thompson',
            company: 'HR Solutions',
            from: 'emma@hrsolutions.com',
            subject: 'Team building event planning',
            preview: 'Hope you are doing well! I am organizing our quarterly team building event and would love to get your input on activities and venue...',
            body: 'Hope you are doing well! I am organizing our quarterly team building event and would love to get your input on activities and venue options. Please let me know your availability for a planning call.',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            importance: 0.4,
            estimatedMinutes: 20,
            tags: ['hr', 'team-building', 'planning']
          },
          {
            id: '6',
            name: 'Alex Rodriguez',
            company: 'Tech Consulting',
            from: 'alex@techconsulting.com',
            subject: 'Code review feedback',
            preview: 'I have reviewed the latest code changes and have some feedback. Overall the implementation looks good, but there are a few areas...',
            body: 'I have reviewed the latest code changes and have some feedback. Overall the implementation looks good, but there are a few areas that could be improved for better performance and maintainability.',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            importance: 0.5,
            estimatedMinutes: 25,
            hasAttachment: false,
            tags: ['code-review', 'feedback', 'development']
          }
        ];
        setEmails(mockEmails);
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
          <h2 className="text-2xl font-bold text-white mb-2 text-shadow-lg">Loading Deferly</h2>
          <p className="text-white text-opacity-80 text-shadow">Preparing your smart inbox...</p>
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
                  Let&apos;s find the perfect time to handle your emails
                </p>
              </div>
              
              {/* Quick stats */}
              <div className="flex space-x-4">
                <div className="glass-dark rounded-xl px-4 py-3 transform hover:scale-105 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white text-shadow">
                      {emails.filter(e => !e.status || e.status === 'inbox').length}
                    </div>
                    <div className="text-white text-opacity-70 text-xs">Unread</div>
                  </div>
                </div>
                <div className="glass-dark rounded-xl px-4 py-3 transform hover:scale-105 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white text-shadow">
                      {emails.filter(e => e.deadlineISO).length}
                    </div>
                    <div className="text-white text-opacity-70 text-xs">Urgent</div>
                  </div>
                </div>
                <div className="glass-dark rounded-xl px-4 py-3 transform hover:scale-105 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white text-shadow">
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
      <div className="flex-1 flex relative min-h-0">
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
              <p className="text-white text-opacity-90 text-lg leading-relaxed text-shadow">
                Choose an email from your inbox and I&apos;ll help you find the perfect time to respond with smart scheduling suggestions.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <div className="glass-dark rounded-xl px-4 py-3 animate-pulse transform hover:scale-105 transition-all duration-300">
                  <span className="text-white text-opacity-90 text-sm font-medium">💡 Smart Planning</span>
                </div>
                <div className="glass-dark rounded-xl px-4 py-3 animate-pulse transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.5s' }}>
                  <span className="text-white text-opacity-90 text-sm font-medium">🤖 AI Assistant</span>
                </div>
                <div className="glass-dark rounded-xl px-4 py-3 animate-pulse transform hover:scale-105 transition-all duration-300" style={{ animationDelay: '1s' }}>
                  <span className="text-white text-opacity-90 text-sm font-medium">📅 Calendar Sync</span>
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
        <div className="glass-dark rounded-full p-3 animate-bounce transform hover:scale-110 transition-all duration-300 cursor-pointer" 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-white text-opacity-80 text-xl">💡</span>
        </div>
      </div>
    </div>
  );
}
