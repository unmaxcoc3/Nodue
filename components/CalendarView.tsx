
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, TimetableSlot, AttendanceStatus, DayAttendance, UserProfile } from '../types';

interface CalendarViewProps {
  user: UserProfile;
  attendance: AttendanceRecord[];
  dayAttendance: DayAttendance[];
  timetable: TimetableSlot[];
  onMarkDayAttendance: (date: string, status: AttendanceStatus) => void;
  onMarkSubjectAttendance: (date: string, subjectName: string, status: AttendanceStatus, slotId?: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user, attendance, dayAttendance, timetable, onMarkDayAttendance, onMarkSubjectAttendance }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = (firstDayOfMonth(year, month) + 6) % 7; 
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dayStatus = dayAttendance.find(d => d.date === selectedDateStr)?.status;

  const scheduledClasses = useMemo(() => {
    if (!user.useAdvancedMode) return [];
    const dayOfWeek = selectedDate.getDay();
    const fromTimetable = timetable.filter(slot => slot.day === dayOfWeek);
    const existing = attendance.filter(a => a.date === selectedDateStr);
    
    const subjects = new Map<string, { subjectName: string; slotId?: string; status?: AttendanceStatus }>();
    fromTimetable.forEach(slot => subjects.set(slot.id, { subjectName: slot.subjectName, slotId: slot.id }));
    existing.forEach(record => {
      if (record.slotId) {
        const item = subjects.get(record.slotId);
        if (item) item.status = record.status;
      } else {
        subjects.set('manual-' + record.subjectName, { subjectName: record.subjectName, status: record.status });
      }
    });
    return Array.from(subjects.values());
  }, [selectedDate, timetable, attendance, selectedDateStr, user.useAdvancedMode]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Monthly Calendar Card */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-8">
          <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-600 transition-all">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long' })}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{currentDate.getFullYear()}</p>
          </div>
          <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-600 transition-all">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthData.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-10"></div>;
            
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dStr = date.toISOString().split('T')[0];
            const dRecord = dayAttendance.find(d => d.date === dStr);
            const isFuture = date > new Date();

            let bgClass = "bg-slate-50 dark:bg-slate-900/50";
            let textClass = "text-slate-600 dark:text-slate-400";

            if (dRecord?.status === 'PRESENT') { bgClass = "bg-green-100 dark:bg-green-900/30"; textClass = "text-green-600"; }
            if (dRecord?.status === 'ABSENT') { bgClass = "bg-red-100 dark:bg-red-900/30"; textClass = "text-red-600"; }
            if (dRecord?.status === 'HOLIDAY') { bgClass = "bg-yellow-100 dark:bg-yellow-900/30"; textClass = "text-yellow-600"; }
            if (isSelected) { bgClass = "!bg-indigo-600"; textClass = "!text-white"; }

            return (
              <button 
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                disabled={isFuture}
                className={`relative h-11 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 font-bold text-sm
                  ${bgClass} ${textClass}
                  ${isToday && !isSelected ? 'ring-2 ring-indigo-200 ring-offset-2 dark:ring-offset-slate-800' : ''}
                  ${isFuture ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Actions Bottom Sheet Area */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mark Attendance</p>
          </div>
          {dayStatus && (
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              dayStatus === 'PRESENT' ? 'bg-green-500 text-white' :
              dayStatus === 'ABSENT' ? 'bg-red-500 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              {dayStatus}
            </div>
          )}
        </div>

        {/* Full Day Options */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-4">
           <MarkBtn label="Present" icon="fa-check" color="green" active={dayStatus === 'PRESENT'} onClick={() => onMarkDayAttendance(selectedDateStr, 'PRESENT')} />
           <MarkBtn label="Absent" icon="fa-xmark" color="red" active={dayStatus === 'ABSENT'} onClick={() => onMarkDayAttendance(selectedDateStr, 'ABSENT')} />
           <MarkBtn label="Holiday" icon="fa-umbrella-beach" color="yellow" active={dayStatus === 'HOLIDAY'} onClick={() => onMarkDayAttendance(selectedDateStr, 'HOLIDAY')} />
        </div>

        {/* Advanced Subject Mode */}
        {user.useAdvancedMode && scheduledClasses.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Subject Breakdown</h4>
            <div className="grid gap-3">
              {scheduledClasses.map((item, idx) => (
                <div key={item.slotId || idx} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.subjectName}</span>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tight">{item.status || 'Pending'}</span>
                  </div>
                  <div className="flex gap-2">
                    <MiniMarkBtn active={item.status === 'PRESENT'} color="green" onClick={() => onMarkSubjectAttendance(selectedDateStr, item.subjectName, 'PRESENT', item.slotId)} />
                    <MiniMarkBtn active={item.status === 'ABSENT'} color="red" onClick={() => onMarkSubjectAttendance(selectedDateStr, item.subjectName, 'ABSENT', item.slotId)} />
                    <MiniMarkBtn active={item.status === 'HOLIDAY'} color="yellow" onClick={() => onMarkSubjectAttendance(selectedDateStr, item.subjectName, 'HOLIDAY', item.slotId)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MarkBtn: React.FC<{ label: string; icon: string; color: string; active: boolean; onClick: () => void }> = ({ label, icon, color, active, onClick }) => {
  const themes: any = {
    green: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 dark:bg-green-900/20',
    red: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 dark:bg-red-900/20',
    yellow: active ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-5 rounded-[2rem] transition-all active:scale-95 ${themes[color]}`}>
       <i className={`fa-solid ${icon} text-xl mb-2`}></i>
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};

const MiniMarkBtn: React.FC<{ active: boolean; color: string; onClick: () => void }> = ({ active, color, onClick }) => {
  const themes: any = {
    green: active ? 'bg-green-600 border-green-600' : 'border-green-100 text-green-600',
    red: active ? 'bg-red-600 border-red-600' : 'border-red-100 text-red-600',
    yellow: active ? 'bg-yellow-500 border-yellow-500' : 'border-yellow-100 text-yellow-600'
  };
  return (
    <button onClick={onClick} className={`flex-1 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${themes[color]} ${active ? 'text-white shadow-lg' : 'bg-white/50 dark:bg-slate-900/30'}`}>
       <i className={`fa-solid ${color === 'green' ? 'fa-check' : color === 'red' ? 'fa-xmark' : 'fa-umbrella-beach'} text-sm`}></i>
    </button>
  );
};

export default CalendarView;
