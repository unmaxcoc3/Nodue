
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HOLIDAY';

export interface TimetableSlot {
  id: string;
  subjectName: string;
  day: number; // 0-6 (Sun-Sat)
  startTime: string; // "HH:mm"
  endTime: string;
  faculty?: string;
  color: string;
}

export interface DayAttendance {
  date: string; // ISO string YYYY-MM-DD
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  subjectId: string;
  subjectName: string;
  status: AttendanceStatus;
  slotId?: string;
}

export interface UserProfile {
  name: string;
  collegeName: string;
  semester: string;
  attendanceGoal: number;
  useAdvancedMode: boolean; // Toggle for subject-wise vs full-day
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  TIMETABLE = 'TIMETABLE',
  SETTINGS = 'SETTINGS'
}
