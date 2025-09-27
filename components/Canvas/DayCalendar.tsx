'use client';

import { CalendarEvent } from '@/lib/types';
import { formatTime } from '@/lib/time';
import dayjs from 'dayjs';

interface DayCalendarProps {
  events: CalendarEvent[];
  suggestions: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export default function DayCalendar({ events, suggestions, onEventClick }: DayCalendarProps) {
  const timeSlots = generateTimeSlots();
  const allEvents = [...events, ...suggestions];

  function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = dayjs().hour(hour).minute(minute).second(0);
        slots.push(time.format('HH:mm'));
      }
    }
    return slots;
  }

  function getEventStyle(event: CalendarEvent) {
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    const startMinutes = start.hour() * 60 + start.minute();
    const endMinutes = end.hour() * 60 + end.minute();
    const duration = endMinutes - startMinutes;
    
    // Calculate position (9 AM = 0)
    const top = ((startMinutes - 9 * 60) / 15) * 24; // 24px per 15min slot
    const height = (duration / 15) * 24;

    const baseClasses = "absolute left-0 right-0 mx-1 rounded-lg p-2 text-xs border";
    
    if (event.type === 'suggestion') {
      return {
        style: { top: `${top}px`, height: `${height}px` },
        className: `${baseClasses} bg-blue-50 border-blue-200 text-blue-800 cursor-pointer hover:bg-blue-100 transition-colors`
      };
    }
    
    const typeColors = {
      meeting: 'bg-purple-100 border-purple-200 text-purple-800',
      focus: 'bg-green-100 border-green-200 text-green-800',
      break: 'bg-gray-100 border-gray-200 text-gray-600'
    };
    
    return {
      style: { top: `${top}px`, height: `${height}px` },
      className: `${baseClasses} ${typeColors[event.type] || typeColors.meeting}`
    };
  }

  return (
    <div className="panel flex-1 p-4">
      <h2 className="text-lg font-semibold mb-4 text-[var(--text)]">Today&apos;s Schedule</h2>
      
      <div className="relative">
        {/* Time grid */}
        <div className="space-y-0">
          {timeSlots.map((time, index) => (
            <div key={time} className="flex items-center h-6 border-b border-gray-100 last:border-b-0">
              <div className="w-16 text-sm text-[var(--muted)] shrink-0">
                {index % 4 === 0 ? time : ''}
              </div>
              <div className="flex-1 relative">
                {/* Events positioned absolutely */}
                {index === 0 && allEvents.map((event) => {
                  const { style, className } = getEventStyle(event);
                  return (
                    <div
                      key={event.id}
                      style={style}
                      className={className}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.type === 'suggestion' && event.confidence && (
                        <div className="text-xs opacity-75 mt-1">
                          {formatTime(event.start)}–{formatTime(event.end)} • 
                          Confidence {Math.round(event.confidence * 100)}%
                        </div>
                      )}
                      {event.type !== 'suggestion' && (
                        <div className="text-xs opacity-75">
                          {formatTime(event.start)}–{formatTime(event.end)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}