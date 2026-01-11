
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
    <div className="space-y-8 animate-slide-up">
      {/* Calendar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 active:scale-90 transition-all">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long' })}
            </h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentDate.getFullYear()}</span>
          </div>
          <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 active:scale-90 transition-all">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthData.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-11"></div>;
            
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dStr = date.toISOString().split('T')[0];
            const dRecord = dayAttendance.find(d => d.date === dStr);
            const isFuture = date > new Date();

            let stateClass = "text-slate-600 dark:text-slate-400 bg-transparent";
            let indicator = null;

            if (dRecord?.status === 'PRESENT') indicator = "bg-emerald-500";
            if (dRecord?.status === 'ABSENT') indicator = "bg-rose-500";
            if (dRecord?.status === 'HOLIDAY') indicator = "bg-amber-500";

            if (isSelected) stateClass = "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none font-black";
            else if (isToday) stateClass = "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-bold";

            return (
              <button 
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                disabled={isFuture}
                className={`relative h-11 flex flex-col items-center justify-center rounded-2xl transition-all duration-200 text-sm
                  ${stateClass} ${isFuture ? 'opacity-20' : 'active:scale-90 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                `}
              >
                {date.getDate()}
                {indicator && !isSelected && (
                  <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${indicator}`}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry for</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
            </h3>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm border ${
            dayStatus === 'PRESENT' ? 'bg-emerald-500 text-white border-emerald-400' :
            dayStatus === 'ABSENT' ? 'bg-rose-500 text-white border-rose-400' :
            dayStatus === 'HOLIDAY' ? 'bg-amber-500 text-white border-amber-400' :
            'bg-slate-100 text-slate-400 border-slate-100 dark:bg-slate-800 dark:border-slate-800'
          }`}>
            {dayStatus || 'Unmarked'}
          </div>
        </div>

        {/* Action Grid */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
           <ActionBtn active={dayStatus === 'PRESENT'} color="emerald" icon="fa-check" label="Present" onClick={() => onMarkDayAttendance(selectedDateStr, 'PRESENT')} />
           <ActionBtn active={dayStatus === 'ABSENT'} color="rose" icon="fa-xmark" label="Absent" onClick={() => onMarkDayAttendance(selectedDateStr, 'ABSENT')} />
           <ActionBtn active={dayStatus === 'HOLIDAY'} color="amber" icon="fa-umbrella-beach" label="Holiday" onClick={() => onMarkDayAttendance(selectedDateStr, 'HOLIDAY')} />
        </div>

        {/* Subject wise for day */}
        {user.useAdvancedMode && scheduledClasses.length > 0 && (
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Lectures Today</h4>
            <div className="grid gap-3">
              {scheduledClasses.map((item, idx) => (
                <div key={item.slotId || idx} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{item.subjectName}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${item.status ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-300'}`}>
                      {item.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <MiniActionBtn active={item.status === 'PRESENT'} color="emerald" icon="fa-check" onClick={() => onMarkSubjectAttendance(selectedDateStr, item.subjectName, 'PRESENT', item.slotId)} />
                    <MiniActionBtn active={item.status === 'ABSENT'} color="rose" icon="fa-xmark" onClick={() => onMarkSubjectAttendance(selectedDateStr, item.subjectName, 'ABSENT', item.slotId)} />
                    <MiniActionBtn active={item.status === 'HOLIDAY'} color="amber" icon="fa-mug-hot" onClick={() => onMarkSubjectAttendance(selectedDateStr, item.subjectName, 'HOLIDAY', item.slotId)} />
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

const ActionBtn: React.FC<{ active: boolean; color: string; icon: string; label: string; onClick: () => void }> = ({ active, color, icon, label, onClick }) => {
  const colors: any = {
    emerald: active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20',
    rose: active ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-rose-600 bg-rose-50/50 dark:bg-rose-950/20',
    amber: active ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-6 rounded-[2rem] transition-all active:scale-95 border-2 ${active ? 'border-transparent' : 'border-transparent'} ${colors[color]}`}>
       <i className={`fa-solid ${icon} text-lg mb-2`}></i>
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};

const MiniActionBtn: React.FC<{ active: boolean; color: string; icon: string; onClick: () => void }> = ({ active, color, icon, onClick }) => {
  const colors: any = {
    emerald: active ? 'bg-emerald-500 text-white border-emerald-500' : 'text-emerald-500 border-emerald-100 dark:border-emerald-900/30',
    rose: active ? 'bg-rose-500 text-white border-rose-500' : 'text-rose-500 border-rose-100 dark:border-rose-900/30',
    amber: active ? 'bg-amber-500 text-white border-amber-500' : 'text-amber-500 border-amber-100 dark:border-amber-900/30'
  };
  return (
    <button onClick={onClick} className={`flex-1 h-11 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${colors[color]} ${!active && 'bg-slate-50 dark:bg-slate-950'}`}>
       <i className={`fa-solid ${icon}`}></i>
    </button>
  );
};

export default CalendarView;
