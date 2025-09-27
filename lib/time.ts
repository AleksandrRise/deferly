import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const TIMEZONE = 'America/Los_Angeles';

export function formatTime(iso: string): string {
  return dayjs(iso).tz(TIMEZONE).format('h:mm A');
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).tz(TIMEZONE).format('MMM D, h:mm A');
}

export function formatTimeRange(start: string, end: string): string {
  const startTime = dayjs(start).tz(TIMEZONE);
  const endTime = dayjs(end).tz(TIMEZONE);
  
  if (startTime.isSame(endTime, 'day')) {
    return `${startTime.format('h:mm A')}–${endTime.format('h:mm A')}`;
  }
  
  return `${startTime.format('MMM D, h:mm A')}–${endTime.format('MMM D, h:mm A')}`;
}

export function hoursUntil(iso: string): number {
  return dayjs(iso).diff(dayjs(), 'hour', true);
}

export function isWorkingHours(iso: string): boolean {
  const time = dayjs(iso).tz(TIMEZONE);
  const hour = time.hour();
  return hour >= 9 && hour < 18;
}

export function isLunchTime(iso: string): boolean {
  const time = dayjs(iso).tz(TIMEZONE);
  const hour = time.hour();
  return hour >= 12 && hour < 13;
}

export function addMinutes(iso: string, minutes: number): string {
  return dayjs(iso).add(minutes, 'minute').toISOString();
}

export function roundToNext15Min(iso: string): string {
  const time = dayjs(iso);
  const minutes = time.minute();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  return time.minute(roundedMinutes).second(0).millisecond(0).toISOString();
}

export function getTimeSlots(startHour: number = 9, endHour: number = 18): string[] {
  const slots: string[] = [];
  const today = dayjs().tz(TIMEZONE).hour(startHour).minute(0).second(0);
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(today.hour(hour).minute(minute).toISOString());
    }
  }
  
  return slots;
}

export function getTomorrowSlots(startHour: number = 9, endHour: number = 18): string[] {
  const slots: string[] = [];
  const tomorrow = dayjs().tz(TIMEZONE).add(1, 'day').hour(startHour).minute(0).second(0);
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(tomorrow.hour(hour).minute(minute).toISOString());
    }
  }
  
  return slots;
}