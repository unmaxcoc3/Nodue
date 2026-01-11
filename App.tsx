
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
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedUser = storage.getUser();
    if (savedUser) setUser(savedUser);
    setTimetable(storage.getTimetable());
    setSubjectAttendance(storage.getAttendance());
    setDayAttendance(storage.getDayAttendance());

    const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
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
    // FIX: Ensure we are strictly targeting the specific date string "YYYY-MM-DD"
    const existingIndex = dayAttendance.findIndex(d => d.date === date);
    let newDayAttendance = [...dayAttendance];
    
    if (existingIndex > -1) {
      // If clicking the same status again, toggle it off (unmark)
      if (newDayAttendance[existingIndex].status === status) {
        newDayAttendance = newDayAttendance.filter(d => d.date !== date);
      } else {
        // Otherwise update status for ONLY this specific date
        newDayAttendance[existingIndex] = { ...newDayAttendance[existingIndex], status };
      }
    } else {
      // Create a fresh entry for this specific date only
      newDayAttendance.push({ date, status });
    }
    
    setDayAttendance(newDayAttendance);
    storage.setDayAttendance(newDayAttendance);
  };

  const handleMarkSubjectAttendance = (date: string, subjectName: string, status: AttendanceStatus, slotId?: string) => {
    const recordId = `${date}-${subjectName}-${slotId || 'manual'}`;
    const existingIndex = subjectAttendance.findIndex(a => a.id === recordId);
    let newAttendance = [...subjectAttendance];

    if (existingIndex > -1) {
      if (newAttendance[existingIndex].status === status) {
        newAttendance = newAttendance.filter(a => a.id !== recordId);
      } else {
        newAttendance[existingIndex] = { ...newAttendance[existingIndex], status };
      }
    } else {
      newAttendance.push({
        id: recordId,
        date,
        subjectId: slotId || subjectName,
        subjectName,
        status,
        slotId
      });
    }

    setSubjectAttendance(newAttendance);
    storage.setAttendance(newAttendance);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 transition-colors duration-700">
        <div className="w-full max-w-sm space-y-10 animate-in text-center">
          <div className="space-y-4">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-700 text-white rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl shadow-2xl shadow-indigo-500/40 transform -rotate-3 hover:rotate-6 transition-transform btn-rich">
                <i className="fa-solid fa-graduation-cap"></i>
             </div>
             <h1 className="text-5xl font-black text-white tracking-tighter">nodue</h1>
             <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Your Academic Companion</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleUpdateUser({
              name: formData.get('name') as string,
              collegeName: formData.get('college') as string,
              semester: formData.get('semester') as string,
              attendanceGoal: 75,
              useAdvancedMode: true
            });
          }} className="card-rich p-8 space-y-6 dark:bg-slate-900/40 backdrop-blur-2xl border-white/5">
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">Student Name</label>
                <input 
                  name="name" 
                  required 
                  placeholder="e.g. Alex Rivers" 
                  className="w-full glass-premium border-none rounded-2xl p-4 font-bold text-white placeholder:text-slate-600 focus:ring-2 ring-indigo-500 transition-all outline-none bg-black/20" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">Institution</label>
                <input 
                  name="college" 
                  required 
                  placeholder="e.g. Stanford University" 
                  className="w-full glass-premium border-none rounded-2xl p-4 font-bold text-white placeholder:text-slate-600 focus:ring-2 ring-indigo-500 transition-all outline-none bg-black/20" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">Semester</label>
                <select 
                  name="semester" 
                  required 
                  className="w-full glass-premium border-none rounded-2xl p-4 font-bold text-white appearance-none focus:ring-2 ring-indigo-500 transition-all outline-none bg-black/20"
                >
                  <option value="" disabled selected className="text-slate-900">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={`Semester ${num}`} className="text-slate-900">Semester {num}</option>
                  ))}
                  <option value="Final Year" className="text-slate-900">Final Year</option>
                </select>
              </div>
            </div>
            
            <button className="w-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-95 text-lg btn-rich">
              Create Profile
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
      title={view === ViewMode.SETTINGS ? "Profile" : view === ViewMode.CALENDAR ? "Registry" : view === ViewMode.TIMETABLE ? "Schedule" : "Hello, " + user.name.split(' ')[0]}
    >
      {view === ViewMode.DASHBOARD && (
        <Dashboard user={user} dayAttendance={dayAttendance} attendance={subjectAttendance} timetable={timetable} />
      )}
      {view === ViewMode.CALENDAR && (
        <CalendarView 
          user={user} 
          attendance={subjectAttendance} 
          dayAttendance={dayAttendance} 
          timetable={timetable}
          onMarkDayAttendance={handleMarkDayAttendance}
          onMarkSubjectAttendance={handleMarkSubjectAttendance}
        />
      )}
      {view === ViewMode.TIMETABLE && (
        <TimetableSetup 
          slots={timetable}
          onAddSlot={(slot) => {
            const newSlots = [...timetable, { ...slot, id: Date.now().toString() }];
            setTimetable(newSlots);
            storage.setTimetable(newSlots);
          }}
          onDeleteSlot={(id) => {
            const newSlots = timetable.filter(s => s.id !== id);
            setTimetable(newSlots);
            storage.setTimetable(newSlots);
          }}
        />
      )}
      {view === ViewMode.SETTINGS && (
        <div className="space-y-6 animate-in pb-20">
           <div className="card-rich p-8 text-center border-white/5">
             <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl btn-rich">
               {user.name[0]}
             </div>
             <h3 className="font-black text-2xl tracking-tight text-white">{user.name}</h3>
             <div className="flex flex-col gap-1 mt-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{user.collegeName}</p>
                <span className="text-[9px] font-bold text-indigo-400 uppercase px-3 py-1 bg-indigo-500/10 rounded-full w-fit mx-auto">
                  {user.semester}
                </span>
             </div>

             <div className="mt-10 space-y-1 text-left">
                <SettingsToggle label="Dark Theme" active={isDarkMode} onToggle={handleToggleTheme} icon="fa-moon" />
                <SettingsToggle label="Advanced Mode" active={user.useAdvancedMode} onToggle={() => handleUpdateUser({...user, useAdvancedMode: !user.useAdvancedMode})} icon="fa-bolt" />
                
                <div className="flex justify-between items-center py-5 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <i className="fa-solid fa-bullseye"></i>
                    </div>
                    <span className="font-bold text-sm text-slate-200">Goal Percentage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" value={user.attendanceGoal} 
                      onChange={e => handleUpdateUser({...user, attendanceGoal: parseInt(e.target.value) || 75})} 
                      className="w-14 bg-black/40 text-center font-black py-2 rounded-xl focus:ring-2 ring-indigo-500 outline-none text-white border border-white/5" 
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
             </div>

             {/* Developer Credits Section */}
             <div className="mt-10 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <i className="fa-solid fa-code text-[10px] text-indigo-400"></i>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Developer Information</span>
                </div>
                <h4 className="text-lg font-black text-white tracking-tight">Karan Singh</h4>
                <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mt-1">
                  Jeppiaar Engineering College
                </p>
                <div className="mt-4 flex items-center justify-center gap-1 text-[10px] font-black text-slate-600 italic">
                  <span>Built with</span>
                  <i className="fa-solid fa-heart text-rose-500 animate-pulse mx-1"></i>
                  <span>for students</span>
                </div>
             </div>

             <button 
               onClick={() => confirm("Reset all your attendance data?") && storage.clearAll()} 
               className="w-full mt-8 py-4 rounded-2xl bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
             >
               Wipe All Data
             </button>
           </div>
        </div>
      )}
    </Layout>
  );
};

const SettingsToggle: React.FC<{ label: string; active: boolean; onToggle: () => void; icon: string }> = ({ label, active, onToggle, icon }) => (
  <div className="flex justify-between items-center py-5 border-b border-white/5">
    <div className="flex items-center gap-4">
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <span className="font-bold text-sm text-slate-200">{label}</span>
    </div>
    <button onClick={onToggle} className={`w-12 h-7 rounded-full transition-all relative p-1 ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}>
       <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </button>
  </div>
);

export default App;
