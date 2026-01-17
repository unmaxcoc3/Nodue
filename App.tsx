
import React, { useState, useEffect } from 'react';
import { ViewMode, UserProfile, TimetableSlot, AttendanceRecord, AttendanceStatus, DayAttendance } from './types';
import { storage } from './services/storage';
import { STORAGE_KEYS } from './constants';
import { supabase } from './services/supabase';
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth state
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const initAppData = async () => {
      try {
        const [savedUser, savedTimetable, savedSubjectAttr, savedDayAttr] = await Promise.all([
          storage.getUser(),
          storage.getTimetable(),
          storage.getAttendance(),
          storage.getDayAttendance()
        ]);

        if (savedUser && savedUser.name && savedUser.name !== "Welcome Back") {
          setUser(savedUser);
        }
        setTimetable(savedTimetable || []);
        setSubjectAttendance(savedSubjectAttr || []);
        setDayAttendance(savedDayAttr || []);

        const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
        if (theme === 'dark') {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        } else {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      } catch (err) {
        console.error("Database failed to initialize", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAppData();
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

  const handleUpdateUser = async (updated: UserProfile) => {
    setUser(updated);
    await storage.setUser(updated);
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isSignUp) {
        const name = formData.get('name') as string;
        const institution = formData.get('institution') as string;
        const semester = formData.get('semester') as string;

        await supabase.auth.signUp(email, password);
        
        const newUser: UserProfile = {
          name,
          institutionName: institution,
          semester,
          attendanceGoal: 75,
          useAdvancedMode: true,
          email,
          isSynced: true
        };
        
        setUser(newUser);
        await storage.setUser(newUser);
      } else {
        await supabase.auth.signIn(email, password);
        const existingProfile = await storage.getUser();
        
        if (existingProfile && existingProfile.name && existingProfile.name !== "Welcome Back") {
          setUser(existingProfile);
        } else {
          alert("Profile not found. Please Sign Up to set up your account.");
          setIsSignUp(true);
        }
      }
    } catch (err) {
      alert("Auth failed. Check credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMarkDayAttendance = async (date: string, status: AttendanceStatus) => {
    const existingIndex = dayAttendance.findIndex(d => d.date === date);
    let newDayAttendance = [...dayAttendance];
    if (existingIndex > -1) {
      if (newDayAttendance[existingIndex].status === status) {
        newDayAttendance = newDayAttendance.filter(d => d.date !== date);
      } else {
        newDayAttendance[existingIndex] = { ...newDayAttendance[existingIndex], status };
      }
    } else {
      newDayAttendance.push({ date, status });
    }
    setDayAttendance(newDayAttendance);
    await storage.setDayAttendance(newDayAttendance);
  };

  const handleMarkSubjectAttendance = async (date: string, subjectName: string, status: AttendanceStatus, slotId?: string) => {
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
      newAttendance.push({ id: recordId, date, subjectId: slotId || subjectName, subjectName, status, slotId });
    }
    setSubjectAttendance(newAttendance);
    await storage.setAttendance(newAttendance);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
           <span className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.3em]">nodue loading</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 transition-colors duration-700 overflow-y-auto no-scrollbar py-8">
        <div className="w-full max-w-sm space-y-6 animate-in text-center">
          <div className="space-y-2">
             <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto text-xl shadow-2xl shadow-indigo-500/40 transform -rotate-3 btn-rich">
                <i className="fa-solid fa-graduation-cap"></i>
             </div>
             <h1 className="text-3xl font-black text-white tracking-tighter">nodue</h1>
             <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px]">Attendance Perfected</p>
          </div>

          <div className="card-rich p-6 space-y-5 dark:bg-slate-900/40 backdrop-blur-2xl border-white/5 shadow-2xl">
            <div className="flex bg-black/30 p-1 rounded-xl mb-2">
              <button 
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${!isSignUp ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
              > Login </button>
              <button 
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${isSignUp ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
              > Sign Up </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 text-left">
              {isSignUp && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 ml-2 block">Full Name</label>
                    <input name="name" required placeholder="Alex Rivers" className="w-full glass-premium border-none rounded-xl p-3 text-xs font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/20" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-2 block">Email Address</label>
                <input name="email" type="email" required placeholder="name@college.edu" className="w-full glass-premium border-none rounded-xl p-3 text-xs font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/20" />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-2 block">Password</label>
                <input name="password" type="password" required placeholder="••••••••" className="w-full glass-premium border-none rounded-xl p-3 text-xs font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/20" />
              </div>

              {isSignUp && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 ml-2 block">College / University</label>
                    <input name="institution" required placeholder="e.g. Stanford University" className="w-full glass-premium border-none rounded-xl p-3 text-xs font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/20" />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 ml-2 block">Current Semester</label>
                    <select name="semester" required className="w-full glass-premium border-none rounded-xl p-3 text-xs font-bold text-white focus:ring-2 ring-indigo-500 outline-none bg-black/20 appearance-none">
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <option key={num} value={`Semester ${num}`}>Semester {num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <button 
                disabled={authLoading}
                className="w-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black py-3.5 mt-2 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 text-xs uppercase tracking-widest btn-rich flex items-center justify-center gap-2"
              >
                {authLoading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                {isSignUp ? 'Register & Start' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeView={view} 
      setView={setView} 
      title={view === ViewMode.SETTINGS ? "Profile" : view === ViewMode.CALENDAR ? "Registry" : view === ViewMode.TIMETABLE ? "Schedule" : "Hi, " + user.name.split(' ')[0]}
    >
      {view === ViewMode.DASHBOARD && (
        <Dashboard user={user} dayAttendance={dayAttendance} attendance={subjectAttendance} timetable={timetable} />
      )}
      {view === ViewMode.CALENDAR && (
        <CalendarView user={user} attendance={subjectAttendance} dayAttendance={dayAttendance} timetable={timetable} onMarkDayAttendance={handleMarkDayAttendance} onMarkSubjectAttendance={handleMarkSubjectAttendance} />
      )}
      {view === ViewMode.TIMETABLE && (
        <TimetableSetup slots={timetable} onAddSlot={async (slot) => {
          const newSlots = [...timetable, { ...slot, id: Date.now().toString() }];
          setTimetable(newSlots);
          await storage.setTimetable(newSlots);
        }} onDeleteSlot={async (id) => {
          const newSlots = timetable.filter(s => s.id !== id);
          setTimetable(newSlots);
          await storage.setTimetable(newSlots);
        }} />
      )}
      {view === ViewMode.SETTINGS && (
        <div className="space-y-6 animate-in pb-20">
           <div className="card-rich p-8 text-center border-white/5 relative overflow-hidden">
             <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl btn-rich">
               {user.name[0] || '?'}
             </div>
             <h3 className="font-black text-2xl tracking-tight text-white">{user.name}</h3>
             <div className="flex flex-col gap-1 mt-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{user.institutionName}</p>
                <div className="mt-2 flex justify-center">
                  <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                    {user.semester}
                  </span>
                </div>
                {user.email && <p className="text-[9px] font-bold text-slate-500 lowercase tracking-tight mt-4 opacity-50">{user.email}</p>}
             </div>
             <div className="mt-8 space-y-1 text-left border-t border-white/5 pt-4">
                <SettingsToggle label="Dark Theme" active={isDarkMode} onToggle={handleToggleTheme} icon="fa-moon" />
                <SettingsToggle label="Advanced Mode" active={user.useAdvancedMode} onToggle={() => handleUpdateUser({...user, useAdvancedMode: !user.useAdvancedMode})} icon="fa-bolt" />
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <i className="fa-solid fa-bullseye text-sm"></i>
                    </div>
                    <span className="font-bold text-sm text-slate-200">Goal %</span>
                  </div>
                  <input type="number" value={user.attendanceGoal} onChange={e => handleUpdateUser({...user, attendanceGoal: parseInt(e.target.value) || 75})} className="w-12 bg-black/40 text-center font-black py-1.5 rounded-lg focus:ring-1 ring-indigo-500 outline-none text-white border border-white/5 text-xs" />
                </div>
             </div>
             <button onClick={async () => { if(confirm("Sign out?")) { await supabase.auth.signOut(); await storage.clearAll(); } }} className="w-full mt-8 py-3.5 rounded-xl bg-rose-500/10 text-rose-500 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Sign Out</button>
           </div>
        </div>
      )}
    </Layout>
  );
};

const SettingsToggle: React.FC<{ label: string; active: boolean; onToggle: () => void; icon: string }> = ({ label, active, onToggle, icon }) => (
  <div className="flex justify-between items-center py-4 border-b border-white/5">
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-800 text-slate-500'}`}>
        <i className={`fa-solid ${icon} text-xs`}></i>
      </div>
      <span className="font-bold text-sm text-slate-200">{label}</span>
    </div>
    <button onClick={onToggle} className={`w-10 h-6 rounded-full transition-all relative p-0.5 ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}>
       <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </button>
  </div>
);

export default App;
