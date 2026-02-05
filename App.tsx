
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
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
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

  const handleManualSync = async () => {
    if (!user || !user.email) return;
    setSyncLoading(true);
    setSyncSuccess(false);
    
    try {
      // Sync everything in sequence
      await syncWithSupabase(user.email, user, 'profile');
      await syncWithSupabase(user.email, timetable, 'timetable');
      await syncWithSupabase(user.email, subjectAttendance, 'attendance');
      await syncWithSupabase(user.email, dayAttendance, 'day_attendance');
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      setSyncSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      alert("Manual sync failed. Please check your connection.");
    } finally {
      setSyncLoading(false);
    }
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
          alert("Success! Check your email or try signing in if verification is disabled.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || "Authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-center">
        <div className="relative mb-10">
          <div className="w-20 h-20 border-8 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fa-solid fa-graduation-cap text-white text-2xl"></i>
          </div>
        </div>
        <p className="text-white font-black text-sm uppercase tracking-[0.4em]">nodue security</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-950/40 to-black pointer-events-none"></div>

        <div className="w-full max-sm space-y-12 relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-4">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 text-white rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl shadow-2xl border border-white/20">
                <i className="fa-solid fa-graduation-cap"></i>
             </div>
             <div>
               <h1 className="text-6xl font-black text-white tracking-tighter text-glow">nodue</h1>
             </div>
          </div>

          <div className="glass-premium p-8 space-y-6 rounded-[2.5rem] border-white/30">
            <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/10">
              <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${!isSignUp ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Sign In</button>
              <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isSignUp ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>Sign Up</button>
            </div>

            <form onSubmit={handleAuth} className="space-y-6 text-left">
              {isSignUp && (
                <div className="animate-in slide-in-from-top-4">
                  <label className="text-xs font-black text-white uppercase tracking-widest mb-2 ml-2 block">Full Name</label>
                  <input name="name" required placeholder="John Doe" className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-base font-bold text-white placeholder:text-slate-500 focus:ring-2 ring-indigo-500 outline-none transition-all" />
                </div>
              )}

              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest mb-2 ml-2 block">Email Address</label>
                <input name="email" type="email" required placeholder="you@college.edu" className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-base font-bold text-white placeholder:text-slate-500 focus:ring-2 ring-indigo-500 outline-none transition-all" />
              </div>

              <div>
                <label className="text-xs font-black text-white uppercase tracking-widest mb-2 ml-2 block">Password</label>
                <input name="password" type="password" required placeholder="••••••••" className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-base font-bold text-white placeholder:text-slate-500 focus:ring-2 ring-indigo-500 outline-none transition-all" />
              </div>

              {isSignUp && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div>
                    <label className="text-xs font-black text-white uppercase tracking-widest mb-2 ml-2 block">Institution</label>
                    <input name="institution" required placeholder="University Name" className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-base font-bold text-white placeholder:text-slate-500 focus:ring-2 ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-black text-white uppercase tracking-widest mb-2 ml-2 block">Semester</label>
                      <select name="semester" className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 ring-indigo-500 outline-none appearance-none">
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={`Semester ${n}`} className="bg-slate-900">Sem {n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black text-white uppercase tracking-widest mb-2 ml-2 block">Goal %</label>
                      <input name="goal" type="number" defaultValue="75" min="0" max="100" className="w-full bg-black/60 border border-white/20 rounded-2xl p-4 text-base font-bold text-white focus:ring-2 ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              )}
              
              <button disabled={authLoading} className="w-full bg-indigo-600 text-white font-black py-5 mt-6 rounded-2xl shadow-xl shadow-indigo-500/40 active:scale-95 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-white/20">
                {authLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : (isSignUp ? 'Create Vault' : 'Secure Entry')}
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
        <TimetableSetup 
          slots={timetable} 
          onAddSlot={async (s) => {
            const next = [...timetable, { ...s, id: Date.now().toString() }];
            setTimetable(next);
            await storage.setTimetable(next);
            if (user.email) await syncWithSupabase(user.email, next, 'timetable');
          }} 
          onDeleteSlot={async (id) => {
            const next = timetable.filter(s => s.id !== id);
            setTimetable(next);
            await storage.setTimetable(next);
            if (user.email) await syncWithSupabase(user.email, next, 'timetable');
          }}
          onBulkAddSlots={async (newSlots) => {
            const slotsWithIds = newSlots.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
            const next = [...timetable, ...slotsWithIds];
            setTimetable(next);
            await storage.setTimetable(next);
            if (user.email) await syncWithSupabase(user.email, next, 'timetable');
          }}
        />
      )}
      {view === ViewMode.SETTINGS && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
          <div className="card-rich p-10 text-center relative overflow-hidden bg-slate-900/60 border-white/20">
             <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-2xl border border-white/30">
               {user.name[0]}
             </div>
             <h3 className="font-black text-3xl tracking-tight text-white">{user.name}</h3>
             <div className="flex flex-col gap-3 mt-4 items-center">
                <span className="bg-indigo-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                   {user.institutionName}
                </span>
                <div className="flex gap-2">
                  <span className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10">{user.semester}</span>
                  <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md border border-white/10">
                    <i className="fa-solid fa-cloud-bolt text-[10px]"></i> Active Sync
                  </span>
                </div>
             </div>
             
             <div className="mt-12 space-y-2 text-left border-t border-white/10 pt-8">
                {/* MANUAL SAVE BUTTON */}
                <div className="mb-8">
                  <button 
                    onClick={handleManualSync}
                    disabled={syncLoading}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl border border-white/20 active:scale-95 ${
                      syncSuccess 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 text-white shadow-indigo-500/40'
                    }`}
                  >
                    {syncLoading ? (
                      <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                    ) : syncSuccess ? (
                      <i className="fa-solid fa-circle-check text-lg"></i>
                    ) : (
                      <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
                    )}
                    {syncLoading ? 'Securing Data...' : syncSuccess ? 'Vault Secured' : 'Sync to Cloud Vault'}
                  </button>
                  {lastSynced && (
                    <p className="text-center text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-3">
                      Last encrypted backup: {lastSynced}
                    </p>
                  )}
                </div>

                <SettingsToggle label="Dark Interface" active={isDarkMode} onToggle={handleToggleTheme} icon="fa-moon" />
                <SettingsToggle label="Analytics Mode" active={user.useAdvancedMode} onToggle={() => handleUpdateUser({...user, useAdvancedMode: !user.useAdvancedMode})} icon="fa-chart-pie" />
                
                <div className="py-8 border-b border-white/10 space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><i className="fa-solid fa-bullseye"></i></div>
                      <div>
                        <span className="font-black text-sm text-white block">Attendance Goal</span>
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Global Safety Threshold</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={user.attendanceGoal} 
                        onChange={e => handleUpdateUser({...user, attendanceGoal: parseInt(e.target.value) || 0})} 
                        className="w-20 bg-black/60 border border-white/20 text-center font-black py-3 rounded-2xl text-white text-base focus:ring-2 ring-indigo-500 outline-none" 
                      />
                      <span className="text-xs font-black text-white">%</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={user.attendanceGoal} 
                    onChange={e => handleUpdateUser({...user, attendanceGoal: parseInt(e.target.value)})} 
                    className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-white/10"
                  />
                </div>
             </div>
             
             <div className="mt-10 flex justify-between items-center px-2">
                <span className="text-xs font-black text-indigo-200 uppercase tracking-widest">Storage Status</span>
                <span className="text-xs font-black text-white uppercase tracking-widest">Secured</span>
             </div>
             
             <button onClick={async () => { if(confirm("Terminate session? Data is safely stored in the vault.")) { await supabase.auth.signOut(); await storage.clearAll(); } }} className="w-full mt-10 py-5 rounded-2xl bg-rose-600 text-white font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-rose-500/40 border border-white/20">Secure Sign Out</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

const SettingsToggle: React.FC<{ label: string; active: boolean; onToggle: () => void; icon: string }> = ({ label, active, onToggle, icon }) => (
  <div className="flex justify-between items-center py-6 border-b border-white/10">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${active ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
        <i className={`fa-solid ${icon} text-lg`}></i>
      </div>
      <span className="font-black text-base text-white">{label}</span>
    </div>
    <button onClick={onToggle} className={`w-16 h-9 rounded-full transition-all relative p-1.5 ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}>
       <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 transform ${active ? 'translate-x-7' : 'translate-x-0'}`}></div>
    </button>
  </div>
);

export default App;
