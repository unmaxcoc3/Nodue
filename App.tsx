
import React, { useState, useEffect } from 'react';
import { ViewMode, UserProfile, TimetableSlot, AttendanceRecord, AttendanceStatus, DayAttendance } from './types';
import { storage } from './services/storage';
import { STORAGE_KEYS } from './constants';
import { supabase, syncWithSupabase } from './services/supabase';
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
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    const initAppData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const [profileRes, timetableRes, attRes, dayAttRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
            supabase.from('timetable').select('*').eq('user_id', session.user.id),
            supabase.from('attendance').select('*').eq('user_id', session.user.id),
            supabase.from('day_attendance').select('*').eq('user_id', session.user.id)
          ]);

          if (profileRes.data) {
            const mappedUser: UserProfile = {
              name: profileRes.data.full_name || "Scholar",
              institutionName: profileRes.data.institution_name || "Institution",
              semester: profileRes.data.semester || "Semester 1",
              attendanceGoal: profileRes.data.attendance_goal ?? 75,
              useAdvancedMode: profileRes.data.use_advanced_mode ?? true,
              email: profileRes.data.email,
              isSynced: true
            };
            setUser(mappedUser);
            await storage.setUser(mappedUser);
          } else {
            const savedUser = await storage.getUser();
            if (savedUser) setUser(savedUser);
          }

          if (timetableRes.data) {
            const mappedTimetable = timetableRes.data.map(t => ({
              id: t.id,
              subjectName: t.subject_name,
              day: t.day,
              startTime: t.start_time,
              endTime: t.end_time,
              faculty: t.faculty,
              color: t.color
            }));
            setTimetable(mappedTimetable);
            await storage.setTimetable(mappedTimetable);
          }

          if (attRes.data) {
            const mappedAttendance = attRes.data.map(a => ({
              id: a.id.split('-').slice(1).join('-'),
              date: a.date,
              subjectId: a.subject_id,
              subjectName: a.subject_name,
              status: a.status as AttendanceStatus,
              slotId: a.slot_id
            }));
            setSubjectAttendance(mappedAttendance);
            await storage.setAttendance(mappedAttendance);
          }

          if (dayAttRes.data) {
            const mappedDayAtt = dayAttRes.data.map(d => ({
              date: d.date,
              status: d.status as AttendanceStatus
            }));
            setDayAttendance(mappedDayAtt);
            await storage.setDayAttendance(mappedDayAtt);
          }
          
          setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          const savedUser = await storage.getUser();
          if (savedUser && savedUser.name) {
            setUser(savedUser);
          }
        }

        const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
        if (theme === 'dark') {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        } else {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      } catch (err) {
        console.error("Initialization error", err);
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
    const finalUser = {
      ...updated,
      attendanceGoal: Math.min(100, Math.max(0, updated.attendanceGoal))
    };
    setUser(finalUser);
    await storage.setUser(finalUser);
    if (finalUser.email) await syncWithSupabase(finalUser.email, finalUser, 'profile');
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
        const goal = parseInt(formData.get('goal') as string) || 75;
        
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        const newUser: UserProfile = {
          name,
          institutionName: institution,
          semester,
          attendanceGoal: goal,
          useAdvancedMode: true,
          email,
          isSynced: true
        };
        
        await storage.setUser(newUser);
        setUser(newUser);
        
        if (data.session) {
          await syncWithSupabase(email, newUser, 'profile');
        } else {
          alert("Account created! If you have email confirmation enabled, verify it, then sign in. Otherwise, just try signing in now.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === "Invalid login credentials") {
            throw new Error("Invalid email or password. If you haven't created an account yet, please use 'Sign Up' first.");
          }
          throw error;
        }
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fa-solid fa-graduation-cap text-indigo-500 text-xl animate-pulse"></i>
          </div>
        </div>
        <p className="mt-8 text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em]">nodue security</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>

        <div className="w-full max-w-sm space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="text-center space-y-4">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 text-white rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl shadow-[0_32px_64px_-12px_rgba(79,70,229,0.5)] transform -rotate-6 transition-transform hover:rotate-3 btn-rich">
                <i className="fa-solid fa-graduation-cap"></i>
             </div>
             <div>
               <h1 className="text-5xl font-black text-white tracking-tighter">nodue</h1>
               <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 opacity-60">The Platinum Tracker</p>
             </div>
          </div>

          <div className="card-rich p-8 space-y-6 bg-slate-900/40 backdrop-blur-3xl border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex bg-black/40 p-1.5 rounded-2xl">
              <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isSignUp ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>Sign In</button>
              <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isSignUp ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>Sign Up</button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 text-left">
              {isSignUp && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-2 block">Full Name</label>
                  <input name="name" required placeholder="Alex Rivers" className="w-full glass-premium border-none rounded-2xl p-4 text-sm font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/30" />
                </div>
              )}

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-2 block">Email Address</label>
                <input name="email" type="email" required placeholder="name@college.edu" className="w-full glass-premium border-none rounded-2xl p-4 text-sm font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/30" />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-2 block">Password</label>
                <input name="password" type="password" required placeholder="••••••••" className="w-full glass-premium border-none rounded-2xl p-4 text-sm font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/30" />
              </div>

              {isSignUp && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-700">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-2 block">Institution</label>
                    <input name="institution" required placeholder="e.g. Stanford University" className="w-full glass-premium border-none rounded-2xl p-4 text-sm font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-2 block">Semester</label>
                      <select name="semester" className="w-full glass-premium border-none rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 ring-indigo-500 outline-none bg-black/30 appearance-none">
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={`Semester ${n}`}>Semester {n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-2 block">Goal %</label>
                      <input name="goal" type="number" defaultValue="75" min="0" max="100" className="w-full glass-premium border-none rounded-2xl p-4 text-sm font-bold text-white placeholder:text-slate-700 focus:ring-2 ring-indigo-500 outline-none bg-black/30" />
                    </div>
                  </div>
                </div>
              )}
              
              <button disabled={authLoading} className="w-full bg-indigo-600 text-white font-black py-5 mt-4 rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-95 text-xs uppercase tracking-[0.2em] btn-rich flex items-center justify-center gap-3">
                {authLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={view} setView={setView} title={view === ViewMode.SETTINGS ? "Profile" : view === ViewMode.CALENDAR ? "Registry" : view === ViewMode.TIMETABLE ? "Schedule" : "Hello, " + user.name.split(' ')[0]}>
      {view === ViewMode.DASHBOARD && <Dashboard user={user} dayAttendance={dayAttendance} attendance={subjectAttendance} timetable={timetable} />}
      {view === ViewMode.CALENDAR && (
        <CalendarView 
          user={user} attendance={subjectAttendance} dayAttendance={dayAttendance} timetable={timetable} 
          onMarkDayAttendance={async (date, status) => {
            const existing = dayAttendance.findIndex(d => d.date === date);
            let next = [...dayAttendance];
            if (existing > -1) next[existing].status === status ? next.splice(existing, 1) : next[existing].status = status;
            else next.push({ date, status });
            setDayAttendance(next);
            await storage.setDayAttendance(next);
            if (user.email) await syncWithSupabase(user.email, next, 'day_attendance');
          }}
          onMarkSubjectAttendance={async (date, sub, status, id) => {
            const rid = `${date}-${sub}-${id || 'man'}`;
            const existing = subjectAttendance.findIndex(a => a.id === rid);
            let next = [...subjectAttendance];
            if (existing > -1) next[existing].status === status ? next.splice(existing, 1) : next[existing].status = status;
            else next.push({ id: rid, date, subjectId: id || sub, subjectName: sub, status, slotId: id });
            setSubjectAttendance(next);
            await storage.setAttendance(next);
            if (user.email) await syncWithSupabase(user.email, next, 'attendance');
          }}
        />
      )}
      {view === ViewMode.TIMETABLE && (
        <TimetableSetup slots={timetable} onAddSlot={async (s) => {
          const next = [...timetable, { ...s, id: Date.now().toString() }];
          setTimetable(next);
          await storage.setTimetable(next);
          if (user.email) await syncWithSupabase(user.email, next, 'timetable');
        }} onDeleteSlot={async (id) => {
          const next = timetable.filter(s => s.id !== id);
          setTimetable(next);
          await storage.setTimetable(next);
          if (user.email) await syncWithSupabase(user.email, next, 'timetable');
        }} />
      )}
      {view === ViewMode.SETTINGS && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
          <div className="card-rich p-10 text-center relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border-white/5">
             <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-2xl border border-white/20">
               {user.name[0]}
             </div>
             <h3 className="font-black text-3xl tracking-tight text-white">{user.name}</h3>
             <div className="flex flex-col gap-3 mt-4 items-center">
                <span className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                   {user.institutionName}
                </span>
                <div className="flex gap-2">
                  <span className="bg-slate-800/80 text-slate-400 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">{user.semester}</span>
                  <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5">
                    <i className="fa-solid fa-cloud-bolt text-[8px]"></i> Realtime Sync
                  </span>
                </div>
             </div>
             <div className="mt-12 space-y-2 text-left border-t border-white/5 pt-8">
                <SettingsToggle label="Dark Interface" active={isDarkMode} onToggle={handleToggleTheme} icon="fa-moon" />
                <SettingsToggle label="Advanced Analytics" active={user.useAdvancedMode} onToggle={() => handleUpdateUser({...user, useAdvancedMode: !user.useAdvancedMode})} icon="fa-chart-pie" />
                
                <div className="py-6 border-b border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><i className="fa-solid fa-bullseye"></i></div>
                      <div>
                        <span className="font-bold text-sm text-slate-200 block">Attendance Goal</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Threshold for Safe status</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={user.attendanceGoal} 
                        onChange={e => handleUpdateUser({...user, attendanceGoal: parseInt(e.target.value) || 0})} 
                        className="w-16 bg-black/40 text-center font-black py-2 rounded-xl ring-1 ring-white/10 text-white text-sm" 
                      />
                      <span className="text-xs font-black text-slate-600">%</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={user.attendanceGoal} 
                    onChange={e => handleUpdateUser({...user, attendanceGoal: parseInt(e.target.value)})} 
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
             </div>
             <div className="mt-8 flex justify-between items-center px-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Session Updated</span>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{lastSynced || 'Just now'}</span>
             </div>
             <button onClick={async () => { if(confirm("Sign out? Local cache will be cleared.")) { await supabase.auth.signOut(); await storage.clearAll(); } }} className="w-full mt-10 py-5 rounded-2xl bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all hover:bg-rose-500/20">Secure Sign Out</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

const SettingsToggle: React.FC<{ label: string; active: boolean; onToggle: () => void; icon: string }> = ({ label, active, onToggle, icon }) => (
  <div className="flex justify-between items-center py-5 border-b border-white/5">
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <span className="font-bold text-sm text-slate-200">{label}</span>
    </div>
    <button onClick={onToggle} className={`w-14 h-8 rounded-full transition-all relative p-1.5 ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}>
       <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </button>
  </div>
);

export default App;
