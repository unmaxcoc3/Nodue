
import React, { useMemo } from 'react';
import { AttendanceRecord, TimetableSlot, UserProfile, DayAttendance } from '../types';

interface DashboardProps {
  user: UserProfile;
  attendance: AttendanceRecord[];
  dayAttendance: DayAttendance[];
  timetable: TimetableSlot[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, attendance, dayAttendance, timetable }) => {
  const stats = useMemo(() => {
    const present = dayAttendance.filter(d => d.status === 'PRESENT').length;
    const absent = dayAttendance.filter(d => d.status === 'ABSENT').length;
    const workingDays = present + absent;
    const percentage = workingDays > 0 ? (present / workingDays) * 100 : 0;
    const holidays = dayAttendance.filter(d => d.status === 'HOLIDAY').length;
    const target = user.attendanceGoal / 100;

    let forecastMessage = "Start marking attendance";
    let forecastValue = 0;
    let forecastType: 'BUFFER' | 'REQUIRED' | 'NEUTRAL' = 'NEUTRAL';

    if (workingDays > 0) {
      if (percentage < user.attendanceGoal) {
        // x = (target * total - present) / (1 - target)
        forecastValue = Math.ceil((target * workingDays - present) / (1 - target));
        forecastMessage = `Attend next ${forecastValue} ${forecastValue === 1 ? 'session' : 'sessions'} to hit ${user.attendanceGoal}%`;
        forecastType = 'REQUIRED';
      } else {
        // y = (present / target) - total
        forecastValue = Math.floor((present / target) - workingDays);
        forecastMessage = forecastValue > 0 ? `Safe to skip next ${forecastValue} ${forecastValue === 1 ? 'session' : 'sessions'}` : "Perfectly on track!";
        forecastType = forecastValue > 0 ? 'BUFFER' : 'NEUTRAL';
      }
    }

    return { present, absent, workingDays, percentage, holidays, forecastValue, forecastMessage, forecastType };
  }, [dayAttendance, user.attendanceGoal]);

  const onTrack = stats.percentage >= user.attendanceGoal;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Main Progress Ring Card */}
      <div className={`relative p-12 rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-700 ${
        onTrack 
          ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-900 shadow-indigo-500/40' 
          : 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-900 shadow-rose-500/40'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-24 -mt-24 blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/30 rounded-full -ml-20 -mb-20 blur-[60px]"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-10">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Current Standing</span>
          </div>
          
          <div className="relative">
             <div className="text-[9rem] font-black text-white tracking-tighter flex items-start drop-shadow-2xl leading-none">
                {Math.round(stats.percentage)}
                <span className="text-4xl mt-12 opacity-50 ml-1">%</span>
             </div>
             <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border shadow-2xl backdrop-blur-xl ${onTrack ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                {onTrack ? 'Target Achieved' : `Below ${user.attendanceGoal}% Target`}
             </div>
          </div>
          
          <div className="mt-14 w-full space-y-6">
             <div className="relative h-6 w-full bg-black/30 rounded-full overflow-hidden p-1 shadow-inner border border-white/5">
                {/* Progress Bar */}
                <div 
                  className={`h-full rounded-full transition-all duration-[2000ms] ease-out shadow-[0_0_25px_rgba(255,255,255,0.4)] ${onTrack ? 'bg-gradient-to-r from-emerald-300 to-white' : 'bg-gradient-to-r from-white/40 to-white'}`}
                  style={{ width: `${Math.max(stats.percentage, 4)}%` }}
                ></div>
                
                {/* Goal Marker Line */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20"
                  style={{ left: `${user.attendanceGoal}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/60 uppercase tracking-tighter">
                    Goal
                  </div>
                </div>
             </div>
             <div className="flex justify-between items-center text-white/80 px-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Min Threshold</span>
                  <span className="text-base font-black tracking-tight">{user.attendanceGoal}%</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Actual Attendance</span>
                  <span className="text-base font-black tracking-tight">{stats.present} / {stats.workingDays}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Forecast Card */}
      <div className="card-rich p-8 border border-white/5 shadow-2xl bg-slate-900/40 backdrop-blur-xl flex items-center gap-6">
        <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-inner ${
          stats.forecastType === 'REQUIRED' ? 'bg-rose-500/20 text-rose-500' : 
          stats.forecastType === 'BUFFER' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/20 text-indigo-500'
        }`}>
          <i className={`fa-solid ${stats.forecastType === 'REQUIRED' ? 'fa-triangle-exclamation' : stats.forecastType === 'BUFFER' ? 'fa-shield-heart' : 'fa-lightbulb'}`}></i>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Status Analysis</p>
          <h3 className="font-extrabold text-slate-900 dark:text-white leading-snug text-lg tracking-tight">
            {stats.forecastMessage}
          </h3>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <MetricCard label="Working Days" value={stats.workingDays} icon="fa-calendar-day" color="indigo" />
        <MetricCard label="Present" value={stats.present} icon="fa-circle-check" color="emerald" />
        <MetricCard label="Absent" value={stats.absent} icon="fa-circle-xmark" color="rose" />
        <MetricCard label="Holidays" value={stats.holidays} icon="fa-couch" color="amber" />
      </div>

      {/* Subject Insights */}
      {user.useAdvancedMode && (
        <div className="space-y-6 pt-4 pb-12">
          <div className="flex items-center gap-3 px-2">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Lecture Breakdown</h3>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
          <div className="space-y-4">
            {Array.from(new Set(timetable.map(t => t.subjectName))).map(sub => {
              const records = attendance.filter(r => r.subjectName === sub);
              const sPres = records.filter(r => r.status === 'PRESENT').length;
              const sTotal = records.length;
              const sPct = sTotal > 0 ? (sPres / sTotal) * 100 : 0;
              const isOk = sPct >= user.attendanceGoal;

              return (
                <div key={sub} className="card-rich p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform bg-slate-900/30 border-white/5">
                  <div className="flex gap-5 items-center">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl font-black shadow-inner ${
                      isOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {sub.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg tracking-tighter leading-tight">{sub}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                        {sPres} / {sTotal} Sessions
                      </p>
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${isOk ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {Math.round(sPct)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const styles: any = {
    indigo: 'bg-indigo-600/10 text-indigo-500',
    emerald: 'bg-emerald-600/10 text-emerald-500',
    rose: 'bg-rose-600/10 text-rose-500',
    amber: 'bg-amber-600/10 text-amber-500'
  };
  return (
    <div className="card-rich p-8 flex flex-col gap-6 group hover:translate-y-[-6px] transition-all bg-slate-900/40 border-white/5">
      <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center shadow-xl transition-transform group-hover:rotate-6 ${styles[color]}`}>
        <i className={`fa-solid ${icon} text-xl`}></i>
      </div>
      <div>
        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60 leading-tight">{label}</div>
      </div>
    </div>
  );
};

export default Dashboard;
