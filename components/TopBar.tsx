'use client';

import { ChevronLeft, ChevronRight, Search, Zap, Clock, RefreshCw, Mail } from 'lucide-react';

interface TopBarProps {
  energy: number;
  onEnergyChange: (energy: number) => void;
  focusBlockMins: number;
  onFocusBlockChange: (mins: number) => void;
  onRecompute: () => void;
  onToggleInbox: () => void;
  emailCount: number;
}

export default function TopBar({
  energy,
  onEnergyChange,
  focusBlockMins,
  onFocusBlockChange,
  onRecompute,
  onToggleInbox,
  emailCount
}: TopBarProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="panel h-16 flex items-center justify-between px-6 mb-6">
      {/* Left - Logo and title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">Deferly</h1>
          <p className="text-sm text-[var(--muted)]">Personal workspace</p>
        </div>
      </div>

      {/* Center - Date navigation */}
      <div className="flex items-center space-x-4">
        <button className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <ChevronLeft className="w-5 h-5 text-[var(--muted)]" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text)]">{today}</p>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
        </button>
        <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Today
        </button>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Search className="w-5 h-5 text-[var(--muted)]" />
        </button>

        {/* Energy selector */}
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-[var(--muted)]" />
          <select
            value={energy}
            onChange={(e) => onEnergyChange(Number(e.target.value))}
            className="text-sm border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
          >
            {[1, 2, 3, 4, 5].map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Focus block duration */}
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[var(--muted)]" />
          <select
            value={focusBlockMins}
            onChange={(e) => onFocusBlockChange(Number(e.target.value))}
            className="text-sm border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
          >
            <option value={15}>15m</option>
            <option value={30}>30m</option>
            <option value={45}>45m</option>
            <option value={60}>60m</option>
          </select>
        </div>

        <button
          onClick={onRecompute}
          className="p-2 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Recompute suggestions"
        >
          <RefreshCw className="w-5 h-5 text-[var(--muted)]" />
        </button>

        <button
          onClick={onToggleInbox}
          className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Mail className="w-5 h-5 text-[var(--muted)]" />
          <span className="text-sm font-medium text-[var(--text)]">Inbox</span>
          {emailCount > 0 && (
            <span className="chip chip-blue text-xs">
              {emailCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}