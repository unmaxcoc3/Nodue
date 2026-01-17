
import { STORAGE_KEYS } from '../constants';
import { UserProfile, TimetableSlot, AttendanceRecord, DayAttendance } from '../types';
import { db } from './database';

export const storage = {
  getUser: async (): Promise<UserProfile | null> => {
    return await db.get('profile', 'current');
  },

  setUser: async (user: UserProfile) => {
    await db.set('profile', 'current', user);
  },

  getTimetable: async (): Promise<TimetableSlot[]> => {
    return await db.get('timetable');
  },

  setTimetable: async (slots: TimetableSlot[]) => {
    const transaction = (db as any).db.transaction(['timetable'], 'readwrite');
    const store = transaction.objectStore('timetable');
    store.clear();
    slots.forEach(s => store.add(s));
  },

  getAttendance: async (): Promise<AttendanceRecord[]> => {
    return await db.get('attendance');
  },

  setAttendance: async (records: AttendanceRecord[]) => {
    const transaction = (db as any).db.transaction(['attendance'], 'readwrite');
    const store = transaction.objectStore('attendance');
    store.clear();
    records.forEach(r => store.add(r));
  },

  getDayAttendance: async (): Promise<DayAttendance[]> => {
    return await db.get('day_attendance');
  },

  setDayAttendance: async (records: DayAttendance[]) => {
    const transaction = (db as any).db.transaction(['day_attendance'], 'readwrite');
    const store = transaction.objectStore('day_attendance');
    store.clear();
    records.forEach(r => store.add(r));
  },
  
  clearAll: async () => {
    await db.clearAll();
    localStorage.clear();
    window.location.reload();
  }
};
