'use client';

import { UserPreferences } from '@/lib/types';
import { Mail, Zap, Clock, Settings, RefreshCw } from 'lucide-react';

interface HeaderProps {
  userPreferences: UserPreferences;
  onPreferenceChange: (key: string, value: number) => void;
  emailCount: number;
}

export default function Header({ userPreferences, onPreferenceChange, emailCount }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="h-[var(--header-height)] bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-6">
      {/* Left - Logo and Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Deferly</h1>
            <p className="text-sm text-[var(--text-secondary)]">Smart email timing</p>
          </div>
        </div>
        
        <div className="h-8 w-px bg-[var(--border)] mx-2"></div>
        
        <div className="text-sm text-[var(--text-secondary)]">
          {today} • {emailCount} emails
        </div>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center gap-4">
        {/* Energy Level */}
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)] min-w-[60px]">Energy</span>
          <select
            value={userPreferences.energy}
            onChange={(e) => onPreferenceChange('energy', Number(e.target.value))}
            className="form-control text-sm min-w-[60px]"
          >
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>
                {level}/5
              </option>
            ))}
          </select>
        </div>

        {/* Focus Block Duration */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm text-[var(--text-secondary)] min-w-[80px]">Focus</span>
          <select
            value={userPreferences.focusBlockMins}
            onChange={(e) => onPreferenceChange('focusBlockMins', Number(e.target.value))}
            className="form-control text-sm min-w-[70px]"
          >
            <option value={15}>15m</option>
            <option value={30}>30m</option>
            <option value={45}>45m</option>
            <option value={60}>60m</option>
          </select>
        </div>

        <div className="h-6 w-px bg-[var(--border)]"></div>

        {/* Action Buttons */}
        <button className="btn ghost">
          <RefreshCw className="w-4 h-4" />
          Recompute
        </button>
        
        <button className="btn ghost">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}