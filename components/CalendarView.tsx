
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7; 

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = useMemo(() => {
    const res = [];
    for (let i = 0; i < startDay; i++) res.push(null);
    for (let i = 1; i <= totalDays; i++) res.push(new Date(year, month, i));
    return res;
  }, [year, month]);

  const selectedStr = selectedDate.toISOString().split('T')[0];
  const activeDayStatus = dayAttendance.find(d => d.date === selectedStr)?.status;

  const daySlots = useMemo(() => {
    if (!user.useAdvancedMode) return [];
    const dow = selectedDate.getDay();
    const sched = timetable.filter(s => s.day === dow);
    const existing = attendance.filter(a => a.date === selectedStr);
    
    const res = new Map<string, { name: string; id?: string; status?: AttendanceStatus }>();
    sched.forEach(s => res.set(s.id, { name: s.subjectName, id: s.id }));
    existing.forEach(r => {
      if (r.slotId) {
        const item = res.get(r.slotId);
        if (item) item.status = r.status;
      } else {
        res.set('man-' + r.subjectName, { name: r.subjectName, status: r.status });
      }
    });
    return Array.from(res.values());
  }, [selectedDate, timetable, attendance, selectedStr, user.useAdvancedMode]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="card-rich p-8 bg-slate-900/40 backdrop-blur-2xl border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <button onClick={handlePrev} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 active:scale-90 transition-all border border-white/5">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white tracking-tighter">
              {currentDate.toLocaleString('default', { month: 'long' })}
            </h2>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">{year}</span>
          </div>
          <button onClick={handleNext} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 active:scale-90 transition-all border border-white/5">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-6">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={`e-${idx}`} className="h-12"></div>;
            const isToday = new Date().toDateString() === date.toDateString();
            const isSel = selectedDate.toDateString() === date.toDateString();
            const dStr = date.toISOString().split('T')[0];
            const rec = dayAttendance.find(d => d.date === dStr);
            const isFut = date > new Date();

            return (
              <button 
                key={date.toISOString()} onClick={() => !isFut && setSelectedDate(date)}
                className={`relative h-12 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 text-sm font-bold
                  ${isSel ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-400 hover:bg-white/5'}
                  ${isToday && !isSel ? 'ring-2 ring-indigo-500/40 text-indigo-400' : ''}
                  ${isFut ? 'opacity-10 cursor-not-allowed' : 'active:scale-90'}
                `}
              >
                {date.getDate()}
                {rec && !isSel && (
                  <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${
                    rec.status === 'PRESENT' ? 'bg-emerald-500' : 
                    rec.status === 'ABSENT' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6 pt-2">
        <div className="flex justify-between items-center px-4">
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Day Report</span>
            <h3 className="text-3xl font-black text-white tracking-tighter">
              {selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
            </h3>
          </div>
          <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
            activeDayStatus === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            activeDayStatus === 'ABSENT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
            activeDayStatus === 'HOLIDAY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
            'bg-slate-800 text-slate-500 border-white/5'
          }`}>
            {activeDayStatus || 'Pending'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 px-1">
           <ActionBtn active={activeDayStatus === 'PRESENT'} color="emerald" icon="fa-check-double" label="Present" onClick={() => onMarkDayAttendance(selectedStr, 'PRESENT')} />
           <ActionBtn active={activeDayStatus === 'ABSENT'} color="rose" icon="fa-user-slash" label="Absent" onClick={() => onMarkDayAttendance(selectedStr, 'ABSENT')} />
           <ActionBtn active={activeDayStatus === 'HOLIDAY'} color="amber" icon="fa-calendar-day" label="Holiday" onClick={() => onMarkDayAttendance(selectedStr, 'HOLIDAY')} />
        </div>

        {user.useAdvancedMode && daySlots.length > 0 && (
          <div className="space-y-5 pt-4 pb-12">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4">Lectures for {selectedDate.toLocaleDateString('default', { weekday: 'long' })}</h4>
            <div className="space-y-4">
              {daySlots.map((item, i) => (
                <div key={item.id || i} className="card-rich p-7 bg-slate-900/40 border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xl font-black text-white tracking-tighter">{item.name}</h5>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.status ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-600'}`}>
                      {item.status || 'Mark Now'}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <MiniActionBtn active={item.status === 'PRESENT'} color="emerald" icon="fa-check" onClick={() => onMarkSubjectAttendance(selectedStr, item.name, 'PRESENT', item.id)} />
                    <MiniActionBtn active={item.status === 'ABSENT'} color="rose" icon="fa-x" onClick={() => onMarkSubjectAttendance(selectedStr, item.name, 'ABSENT', item.id)} />
                    <MiniActionBtn active={item.status === 'HOLIDAY'} color="amber" icon="fa-calendar-minus" onClick={() => onMarkSubjectAttendance(selectedStr, item.name, 'HOLIDAY', item.id)} />
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
  const styles: any = {
    emerald: active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/40' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10',
    rose: active ? 'bg-rose-600 text-white shadow-xl shadow-rose-500/40' : 'bg-rose-500/5 text-rose-500 border-rose-500/10',
    amber: active ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/40' : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-8 rounded-[2.5rem] transition-all duration-300 border-2 active:scale-95 ${styles[color]}`}>
       <i className={`fa-solid ${icon} text-2xl mb-3`}></i>
       <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
};

const MiniActionBtn: React.FC<{ active: boolean; color: string; icon: string; onClick: () => void }> = ({ active, color, icon, onClick }) => {
  const styles: any = {
    emerald: active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-500/5 text-emerald-500 border-white/5 hover:border-emerald-500/30',
    rose: active ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-500/5 text-rose-500 border-white/5 hover:border-rose-500/30',
    amber: active ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-500/5 text-amber-500 border-white/5 hover:border-amber-500/30'
  };
  return (
    <button onClick={onClick} className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 active:scale-95 ${styles[color]}`}>
       <i className={`fa-solid ${icon} text-sm`}></i>
    </button>
  );
};

export default CalendarView;
