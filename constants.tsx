
import React from 'react';

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SUBJECT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f43f5e'
];

export const STORAGE_KEYS = {
  USER: 'nodue_user',
  TIMETABLE: 'nodue_timetable',
  ATTENDANCE: 'nodue_attendance',
  THEME: 'nodue_theme'
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'PRESENT': return 'text-green-600 bg-green-50 border-green-200';
    case 'ABSENT': return 'text-red-600 bg-red-50 border-red-200';
    case 'HOLIDAY': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export const getPercentageColor = (pct: number) => {
  if (pct >= 75) return 'text-green-600';
  if (pct >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getPercentageBg = (pct: number) => {
  if (pct >= 75) return 'bg-green-100';
  if (pct >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
};
