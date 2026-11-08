import { DEFAULT_DISPLAY_NAME } from '@/lib/db/settings';

export function getTimeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatHomeGreeting(displayName?: string | null, date = new Date()): string {
  const name = displayName?.trim() || DEFAULT_DISPLAY_NAME;
  return `${getTimeOfDayGreeting(date)}, ${name}`;
}
