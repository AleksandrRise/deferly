'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/lib/types';
import Link from 'next/link';
import dayjs from 'dayjs';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
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
    switch (event.type) {
      case 'suggestion':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'meeting':
        return event.title.includes('(moved)') 
          ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
          : 'bg-blue-100 border-blue-300 text-blue-800';
      case 'focus':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'break':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    return dayjs(time).format('h:mm A');
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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Calendar...</p>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();
  const todayEvents = getEventsForDay(selectedDate);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Deferly</h1>
            <nav className="flex space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Inbox
              </Link>
              <span className="text-blue-600 font-medium">Calendar</span>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => alert('Google Calendar integration coming soon! This will sync your events automatically.')}
              className="text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium"
            >
              📅 Connect Google Calendar
            </button>
            <button
              onClick={handleClearDynamic}
              className="text-sm px-3 py-1 text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
            >
              Clear Dynamic
            </button>
            <div className="text-sm text-gray-500">
              {todayEvents.length} events today
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            ← Previous Day
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate.format('dddd, MMMM D, YYYY')}
          </h2>
          
          <button
            onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            Next Day →
          </button>
        </div>
        
        <div className="flex justify-center mt-2">
          <button
            onClick={() => setSelectedDate(dayjs())}
            className="text-sm px-3 py-1 text-blue-600 hover:text-blue-800"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>Reply Blocks</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span>Meetings</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
              <span>Moved Events</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded mr-2"></div>
              <span>Focus Time</span>
            </div>
          </div>

          {/* Time Grid */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {Array.from({ length: 10 }, (_, hourIndex) => {
                const hour = hourIndex + 9; // 9 AM to 6 PM
                const hourSlots = timeSlots.filter(slot => slot.hour() === hour);
                
                return (
                  <div key={hour} className="flex">
                    {/* Time Label */}
                    <div className="w-20 p-3 bg-gray-50 text-sm font-medium text-gray-700 text-center">
                      {dayjs().hour(hour).format('h A')}
                    </div>
                    
                    {/* Hour Slots */}
                    <div className="flex-1 grid grid-cols-4 divide-x divide-gray-100">
                      {hourSlots.map((slot, slotIndex) => {
                        const event = getEventAtTime(slot);
                        const isFirstSlotOfEvent = event && 
                          !getEventAtTime(slot.subtract(15, 'minute'));
                        
                        return (
                          <div 
                            key={slotIndex}
                            className="relative h-12 border-r border-gray-100 last:border-r-0"
                          >
                            {isFirstSlotOfEvent && (
                              <div 
                                className={`absolute inset-x-0 top-0 p-1 text-xs border rounded-r ${getEventColor(event)}`}
                                style={{
                                  height: `${dayjs(event.end).diff(dayjs(event.start), 'minute') / 15 * 48}px`,
                                  zIndex: 10
                                }}
                              >
                                <div className="font-medium truncate">
                                  {event.title}
                                </div>
                                <div className="text-xs opacity-75">
                                  {formatTime(event.start)} - {formatTime(event.end)}
                                </div>
                                {event.confidence && (
                                  <div className="text-xs opacity-75">
                                    {Math.round(event.confidence * 100)}% confidence
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Time marker for current time */}
                            {slot.isSame(dayjs(), 'hour') && slot.isSame(dayjs(), 'day') && (
                              <div className="absolute top-0 left-0 w-full h-px bg-red-500 z-20" />
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
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Events for {selectedDate.format('MMMM D')}
              </h3>
              <div className="space-y-2">
                {todayEvents.map((event, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getEventColor(event)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm opacity-75">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        {event.description && (
                          <div className="text-sm opacity-75 mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                      {event.confidence && (
                        <div className="text-sm font-medium">
                          {Math.round(event.confidence * 100)}%
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