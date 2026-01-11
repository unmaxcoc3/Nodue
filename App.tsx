
import React, { useState, useEffect } from 'react';
import { ViewMode, UserProfile, TimetableSlot, AttendanceRecord, AttendanceStatus, DayAttendance } from './types';
import { storage } from './services/storage';
import { STORAGE_KEYS } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import TimetableSetup from './components/TimetableSetup';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<AttendanceRecord[]>([]);
  const [dayAttendance, setDayAttendance] = useState<DayAttendance[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedUser = storage.getUser();
    const savedTimetable = storage.getTimetable();
    const savedSubjectAttendance = storage.getAttendance();
    const savedDayAttendance = storage.getDayAttendance();
    
    if (savedUser) setUser(savedUser);
    setTimetable(savedTimetable);
    setSubjectAttendance(savedSubjectAttendance);
    
    // Data Sanitization: Ensure no duplicate dates in dayAttendance
    const uniqueDaysMap = new Map();
    savedDayAttendance.forEach(d => {
        if (d && d.date) uniqueDaysMap.set(d.date, d);
    });
    const sanitizedDays = Array.from(uniqueDaysMap.values());
    setDayAttendance(sanitizedDays as DayAttendance[]);

    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    storage.setUser(updated);
  };

  const handleMarkDayAttendance = (date: string, status: AttendanceStatus) => {
    setDayAttendance(prev => {
      const filtered = prev.filter(d => d.date !== date);
      const existing = prev.find(d => d.date === date);
      
      let updated;
      if (existing && existing.status === status) {
        updated = filtered;
      } else {
        updated = [...filtered, { date, status }];
      }
      
      storage.setDayAttendance(updated);
      return updated;
    });
  };

  const handleMarkSubjectAttendance = (date: string, subjectName: string, status: AttendanceStatus, slotId?: string) => {
    setSubjectAttendance(prev => {
      const existingIndex = prev.findIndex(a => a.date === date && (slotId ? a.slotId === slotId : a.subjectName === subjectName));
      let updated;

      if (existingIndex > -1) {
        if (prev[existingIndex].status === status) {
          updated = prev.filter((_, i) => i !== existingIndex);
        } else {
          updated = prev.map((item, i) => i === existingIndex ? { ...item, status } : item);
        }
      } else {
        updated = [...prev, {
          id: Date.now().toString(),
          date,
          subjectName,
          status,
          subjectId: subjectName,
          slotId
        }];
      }
      
      storage.setAttendance(updated);
      return updated;
    });
  };

  const handleAddTimetableSlot = (slot: Omit<TimetableSlot, 'id'>) => {
    const newSlot = { ...slot, id: Date.now().toString() };
    const updated = [...timetable, newSlot];
    setTimetable(updated);
    storage.setTimetable(updated);
  };

  const handleDeleteTimetableSlot = (id: string) => {
    const updated = timetable.filter(s => s.id !== id);
    setTimetable(updated);
    storage.setTimetable(updated);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
             <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl mb-6 shadow-2xl shadow-indigo-200 dark:shadow-none rotate-6">
                <i className="fa-solid fa-graduation-cap"></i>
             </div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">No Due</h1>
             <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Personalize your student tracker</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleUpdateUser({
              name: formData.get('name') as string,
              collegeName: formData.get('college') as string,
              semester: formData.get('semester') as string,
              attendanceGoal: 75,
              useAdvancedMode: false
            });
          }} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-white dark:border-slate-800 space-y-5">
            <input name="name" required placeholder="Full Name" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 ring-indigo-500 outline-none" />
            <input name="college" required placeholder="College" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 ring-indigo-500 outline-none" />
            <input name="semester" required placeholder="Semester" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 ring-indigo-500 outline-none" />
            <button className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-lg shadow-indigo-100 hover:shadow-indigo-300 transition-all active:scale-95">
              Start Tracking
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeView={view} 
      setView={setView} 
      title={view === ViewMode.SETTINGS ? "Settings" : "No Due"}
    >
      {view === ViewMode.DASHBOARD && (
        <Dashboard user={user} dayAttendance={dayAttendance} attendance={subjectAttendance} timetable={timetable} />
      )}
      {view === ViewMode.CALENDAR && (
        <CalendarView user={user} dayAttendance={dayAttendance} attendance={subjectAttendance} timetable={timetable} onMarkDayAttendance={handleMarkDayAttendance} onMarkSubjectAttendance={handleMarkSubjectAttendance} />
      )}
      {view === ViewMode.TIMETABLE && (
        <TimetableSetup slots={timetable} onAddSlot={handleAddTimetableSlot} onDeleteSlot={handleDeleteTimetableSlot} />
      )}
      {view === ViewMode.SETTINGS && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center text-2xl font-black">{user.name ? user.name[0] : 'U'}</div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">{user.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.collegeName}</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <ToggleItem label="Dark Mode" active={isDarkMode} onToggle={handleToggleTheme} icon="fa-moon" />
                <ToggleItem label="Advanced Mode" active={user.useAdvancedMode} onToggle={() => handleUpdateUser({...user, useAdvancedMode: !user.useAdvancedMode})} icon="fa-bolt" />
                
                <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-bullseye text-indigo-500"></i>
                    <span className="font-bold text-sm">Attendance Goal</span>
                  </div>
                  <input 
                    type="number" value={user.attendanceGoal} 
                    onChange={e => handleUpdateUser({...user, attendanceGoal: parseInt(e.target.value) || 75})} 
                    className="w-16 bg-slate-50 dark:bg-slate-900 text-center font-black py-2 rounded-xl border-none outline-none focus:ring-2 ring-indigo-500" 
                  />
                </div>
             </div>

             <button 
               onClick={() => confirm("Wipe all data?") && storage.clearAll()} 
               className="w-full mt-8 py-4 rounded-2xl border-2 border-rose-50 dark:border-rose-900/20 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-colors"
             >
               Reset App
             </button>
           </div>
           
           <div className="text-center pb-10">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No Due v2.0</p>
           </div>
        </div>
      )}
    </Layout>
  );
};

const ToggleItem: React.FC<{ label: string; active: boolean; onToggle: () => void; icon: string }> = ({ label, active, onToggle, icon }) => (
  <div className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-slate-700/50">
    <div className="flex items-center gap-3">
      <i className={`fa-solid ${icon} text-slate-400`}></i>
      <span className="font-bold text-sm">{label}</span>
    </div>
    <button onClick={onToggle} className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`}></div>
    </button>
  </div>
);

export default App;
