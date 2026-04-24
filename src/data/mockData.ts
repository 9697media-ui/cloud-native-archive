import { AppEvent, AppUser } from '@/types';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

function d(day: number, hour: number, minute = 0): string {
  return new Date(year, month, day, hour, minute).toISOString();
}

export const mockEvents: AppEvent[] = [];

export const mockUsers: AppUser[] = [];
