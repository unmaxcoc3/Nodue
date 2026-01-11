
import { STORAGE_KEYS } from '../constants';
import { UserProfile, TimetableSlot, AttendanceRecord, DayAttendance } from '../types';

const KEYS = {
  ...STORAGE_KEYS,
  DAY_ATTENDANCE: 'nodue_day_attendance'
};

export const storage = {
  getUser: (): UserProfile | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: UserProfile) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  getTimetable: (): TimetableSlot[] => {
    const data = localStorage.getItem(KEYS.TIMETABLE);
    return data ? JSON.parse(data) : [];
  },
  setTimetable: (slots: TimetableSlot[]) => {
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(slots));
  },
  getAttendance: (): AttendanceRecord[] => {
    const data = localStorage.getItem(KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },
  setAttendance: (records: AttendanceRecord[]) => {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  },
  getDayAttendance: (): DayAttendance[] => {
    const data = localStorage.getItem(KEYS.DAY_ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },
  setDayAttendance: (records: DayAttendance[]) => {
    localStorage.setItem(KEYS.DAY_ATTENDANCE, JSON.stringify(records));
  },
  clearAll: () => {
    localStorage.clear();
    window.location.reload();
  }
};
