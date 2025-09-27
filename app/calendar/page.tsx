'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/lib/types';
import Link from 'next/link';
import dayjs from 'dayjs';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  useEffect(() => {
    loadCalendar();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const loadCalendar = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/calendar');
      const eventsData = await response.json();
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventsForDay = (date: dayjs.Dayjs) => {
    return events.filter(event => 
      dayjs(event.start).isSame(date, 'day')
    ).sort((a, b) => 
      dayjs(a.start).diff(dayjs(b.start))
    );
  };

  const getEventColor = (event: CalendarEvent) => {
    const isHovered = hoveredEventId === event.id;
    const baseColors = {
      suggestion: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg',
      meeting: event.title.includes('(moved)') 
        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
        : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg',
      focus: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg',
      break: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg'
    };
    
    const color = baseColors[event.type] || baseColors.break;
    
    if (isHovered) {
      return color + ' ring-2 ring-white ring-opacity-50 scale-105';
    }
    
    return color;
  };

  const formatTime = (time: string) => {
    return dayjs(time).format('h:mm A');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = selectedDate.hour(hour).minute(minute);
        slots.push(time);
      }
    }
    return slots;
  };

  const getEventAtTime = (time: dayjs.Dayjs) => {
    return events.find(event => {
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      return (time.isSame(eventStart) || time.isAfter(eventStart)) && time.isBefore(eventEnd);
    });
  };

  const handleClearDynamic = async () => {
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_dynamic' })
      });
      await loadCalendar();
    } catch (error) {
      console.error('Failed to clear dynamic events:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Calendar</h2>
          <p className="text-white text-opacity-80">Organizing your perfect schedule...</p>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();
  const todayEvents = getEventsForDay(selectedDate);

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
                  <Link href="/" className="nav-link">
                    <span className="mr-2">📧</span>
                    Inbox
                  </Link>
                  <div className="nav-link active">
                    <span className="mr-2">📅</span>
                    Calendar
                  </div>
                </nav>
              </div>
              
              {/* Right side info */}
              <div className="flex items-center space-x-6">
                {/* Time and date */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-white text-shadow">
                    {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                  <div className="text-white text-opacity-80 text-sm">
                    {formatDate(currentTime)}
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-white font-semibold">{todayEvents.length}</span>
                    <span className="text-white text-opacity-70 text-xs">events</span>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="glass-dark border-b border-white border-opacity-20 px-8 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}
            className="btn-ghost px-4 py-2 text-sm"
          >
            ← Previous Day
          </button>
          
          <h2 className="text-xl font-bold text-white text-shadow-lg">
            {selectedDate.format('dddd, MMMM D, YYYY')}
          </h2>
          
          <button
            onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}
            className="btn-ghost px-4 py-2 text-sm"
          >
            Next Day →
          </button>
        </div>
        
        <div className="flex justify-center mt-3 space-x-4">
          <button
            onClick={() => setSelectedDate(dayjs())}
            className="btn-primary px-4 py-2 text-sm"
          >
            Today
          </button>
          <button
            onClick={handleClearDynamic}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Clear Dynamic Events
          </button>
          <button
            onClick={() => alert('Google Calendar integration coming soon! This will sync your events automatically.')}
            className="btn-ghost px-4 py-2 text-sm"
          >
            📅 Connect Google Calendar
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="max-w-6xl mx-auto p-8 relative z-10">
          {/* Legend */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center glass-dark px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded mr-2"></div>
              <span className="text-white">Reply Blocks</span>
            </div>
            <div className="flex items-center glass-dark px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded mr-2"></div>
              <span className="text-white">Meetings</span>
            </div>
            <div className="flex items-center glass-dark px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded mr-2"></div>
              <span className="text-white">Moved Events</span>
            </div>
            <div className="flex items-center glass-dark px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded mr-2"></div>
              <span className="text-white">Focus Time</span>
            </div>
          </div>

          {/* Time Grid - FIXED MULTI-BOX HOVER */}
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-white divide-opacity-10">
              {Array.from({ length: 10 }, (_, hourIndex) => {
                const hour = hourIndex + 9; // 9 AM to 6 PM
                const hourSlots = timeSlots.filter(slot => slot.hour() === hour);
                
                return (
                  <div key={hour} className="flex">
                    {/* Time Label */}
                    <div className="w-24 p-4 glass-dark text-sm font-bold text-white text-center border-r border-white border-opacity-10">
                      {dayjs().hour(hour).format('h A')}
                    </div>
                    
                    {/* Hour Slots */}
                    <div className="flex-1 grid grid-cols-4 divide-x divide-white divide-opacity-10">
                      {hourSlots.map((slot, slotIndex) => {
                        const event = getEventAtTime(slot);
                        const isFirstSlotOfEvent = event && 
                          !getEventAtTime(slot.subtract(15, 'minute'));
                        const isHovered = hoveredEventId === event?.id;
                        
                        return (
                          <div 
                            key={slotIndex}
                            className={`relative h-16 transition-all duration-200 ${
                              isHovered 
                                ? 'bg-white bg-opacity-15' 
                                : 'hover:bg-white hover:bg-opacity-5'
                            }`}
                            onMouseEnter={() => event && setHoveredEventId(event.id)}
                            onMouseLeave={() => setHoveredEventId(null)}
                          >
                            {isFirstSlotOfEvent && (
                              <div 
                                className={`absolute inset-x-1 top-1 p-2 text-xs rounded-lg transition-all duration-200 ${getEventColor(event)}`}
                                style={{
                                  height: `${Math.min(64 * 4, dayjs(event.end).diff(dayjs(event.start), 'minute') / 15 * 64)}px`,
                                  zIndex: 10
                                }}
                              >
                                <div className="font-bold truncate">
                                  {event.title}
                                </div>
                                <div className="text-xs opacity-90 mt-1">
                                  {formatTime(event.start)} - {formatTime(event.end)}
                                </div>
                                {event.confidence && (
                                  <div className="text-xs opacity-90 mt-1">
                                    {Math.round(event.confidence * 100)}% confidence
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Time marker for current time */}
                            {slot.isSame(dayjs(), 'hour') && slot.isSame(dayjs(), 'day') && (
                              <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 z-20 shadow-lg animate-pulse" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events Summary */}
          {todayEvents.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white text-shadow-lg mb-4">
                Events for {selectedDate.format('MMMM D')}
              </h3>
              <div className="grid gap-4">
                {todayEvents.map((event, index) => (
                  <div 
                    key={index}
                    className={`card-glass p-4 rounded-xl animate-slide-in-up ${getEventColor(event)}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onMouseEnter={() => setHoveredEventId(event.id)}
                    onMouseLeave={() => setHoveredEventId(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">{event.title}</div>
                        <div className="text-sm opacity-90 mt-1">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        {event.description && (
                          <div className="text-sm opacity-75 mt-2">
                            {event.description}
                          </div>
                        )}
                      </div>
                      {event.confidence && (
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {Math.round(event.confidence * 100)}%
                          </div>
                          <div className="text-xs opacity-75">confidence</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
