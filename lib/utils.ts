// lib/utils.ts

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DayOfWeek, DailySchedule } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

export function parseDuration(duration: string): string {
  if (!duration) return '0:00';

  // Handle ISO 8601 duration format (PT1H2M3S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    if (duration.includes(':')) return duration;
    return '0:00';
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function durationToSeconds(duration: string): number {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToReadable(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function secondsToTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function minutesToReadable(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function getProgressColor(percentage: number): string {
  if (percentage < 25) return 'bg-red-500';
  if (percentage < 50) return 'bg-orange-500';
  if (percentage < 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

export function getDaysUntil(targetDate: Date | string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysOverdue(targetDate: Date | string): number {
  const days = getDaysUntil(targetDate);
  return days < 0 ? Math.abs(days) : 0;
}

export function isOverdue(targetDate: Date | string): boolean {
  return getDaysUntil(targetDate) < 0;
}

export function calculateDailyTarget(
  remainingMinutes: number,
  remainingDays: number,
  dailySchedule?: DailySchedule | null
): number {
  if (remainingDays <= 0) return remainingMinutes;
  
  if (!dailySchedule) {
    // Simple division if no schedule set
    return Math.ceil(remainingMinutes / remainingDays);
  }

  // Calculate based on available hours in remaining days
  const today = new Date();
  let totalAvailableMinutes = 0;
  
  for (let i = 0; i < remainingDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as DayOfWeek;
    totalAvailableMinutes += dailySchedule[dayName] || 60; // Default 1 hour
  }

  // Calculate what percentage of today's available time should be spent
  const todayDay = getTodayDayOfWeek();
  const todayAvailable = dailySchedule[todayDay] || 60;
  
  return Math.ceil((remainingMinutes / totalAvailableMinutes) * todayAvailable);
}

export function calculateTargetVideos(
  remainingVideos: number,
  remainingDays: number
): number {
  if (remainingDays <= 0) return remainingVideos;
  return Math.ceil(remainingVideos / remainingDays);
}

// Export DEFAULT_DAILY_SCHEDULE
export const DEFAULT_DAILY_SCHEDULE: DailySchedule = {
  monday: 60,
  tuesday: 60,
  wednesday: 60,
  thursday: 60,
  friday: 60,
  saturday: 120,
  sunday: 120,
};

export function formatDeadlineStatus(targetDate: Date | string): {
  text: string;
  color: string;
  urgent: boolean;
} {
  const days = getDaysUntil(targetDate);

  if (days < 0) {
    return {
      text: `${Math.abs(days)} days overdue`,
      color: 'text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400',
      urgent: true,
    };
  }
  if (days === 0) {
    return {
      text: 'Due today!',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400',
      urgent: true,
    };
  }
  if (days === 1) {
    return {
      text: 'Due tomorrow',
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400',
      urgent: true,
    };
  }
  if (days <= 3) {
    return {
      text: `${days} days left`,
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50 dark:text-yellow-400',
      urgent: true,
    };
  }
  if (days <= 7) {
    return {
      text: `${days} days left`,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
      urgent: false,
    };
  }
  return {
    text: `${days} days left`,
    color: 'text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400',
    urgent: false,
  };
}