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
  }, []);

  const selectedEmail = selectedEmailId ? emails.find(e => e.id === selectedEmailId) || null : null;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Deferly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Deferly</h1>
            <nav className="flex space-x-4">
              <span className="text-blue-600 font-medium">Inbox</span>
              <Link 
                href="/calendar" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Calendar
              </Link>
            </nav>
          </div>
          <div className="text-sm text-gray-500">
            {emails.length} emails
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 flex justify-center">
        <EmailList 
          emails={emails}
          selectedEmailId={selectedEmailId}
          onSelectEmail={setSelectedEmailId}
        />
      </div>

      {/* Email Drawer */}
      {selectedEmail && (
        <EmailDrawer 
          email={selectedEmail}
          onClose={() => setSelectedEmailId(null)}
        />
      )}
    </div>
  );
}