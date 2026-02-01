
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
        forecastValue = Math.ceil((target * workingDays - present) / (1 - target));
        forecastMessage = `Attend next ${forecastValue} sessions to hit ${user.attendanceGoal}%`;
        forecastType = 'REQUIRED';
      } else {
        forecastValue = Math.floor((present / target) - workingDays);
        forecastMessage = forecastValue > 0 ? `Safe to skip next ${forecastValue} sessions` : "Perfectly on track!";
        forecastType = forecastValue > 0 ? 'BUFFER' : 'NEUTRAL';
      }
    }

    return { present, absent, workingDays, percentage, holidays, forecastValue, forecastMessage, forecastType };
  }, [dayAttendance, user.attendanceGoal]);

  const onTrack = stats.percentage >= user.attendanceGoal;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Main Stats Card */}
      <div className={`relative p-10 rounded-[3rem] overflow-hidden shadow-2xl ${
        onTrack ? 'bg-indigo-600' : 'bg-rose-600'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-8">
            <span className="text-xs font-black text-white uppercase tracking-[0.3em]">Total Attendance</span>
          </div>
          
          <div className="text-[7rem] font-black text-white tracking-tighter leading-none text-glow flex items-start">
            {Math.round(stats.percentage)}
            <span className="text-2xl mt-12 opacity-80 ml-1">%</span>
          </div>
          
          <div className="mt-10 w-full px-2">
             <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase text-white tracking-widest">Goal: {user.attendanceGoal}%</span>
                <span className="text-xs font-black uppercase text-white tracking-widest">{stats.present} / {stats.workingDays} Days</span>
             </div>
             <div className="h-4 w-full bg-black/30 rounded-full overflow-hidden p-1 border border-white/20">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-[1.5s]" 
                  style={{ width: `${Math.max(stats.percentage, 5)}%` }}
                ></div>
             </div>
          </div>
        </div>
      </div>

      {/* Insight Card */}
      <div className="card-rich p-6 flex items-center gap-5 border-white/20 bg-slate-900/60">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl ${onTrack ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <i className={`fa-solid ${onTrack ? 'fa-shield-heart' : 'fa-triangle-exclamation'}`}></i>
        </div>
        <div>
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Status Insight</p>
          <h3 className="font-black text-white text-lg tracking-tight">{stats.forecastMessage}</h3>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Working" value={stats.workingDays} icon="fa-calendar" color="indigo" />
        <MetricCard label="Present" value={stats.present} icon="fa-check-circle" color="emerald" />
        <MetricCard label="Absent" value={stats.absent} icon="fa-times-circle" color="rose" />
        <MetricCard label="Holiday" value={stats.holidays} icon="fa-couch" color="amber" />
      </div>

      {/* Subject List */}
      {user.useAdvancedMode && (
        <div className="space-y-6 pb-12">
          <div className="flex items-center gap-4 px-2">
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest">Subject Breakdown</h3>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>
          <div className="space-y-3">
            {Array.from(new Set(timetable.map(t => t.subjectName))).map((sub: string) => {
              const records = attendance.filter(r => r.subjectName === sub);
              const sPres = records.filter(r => r.status === 'PRESENT').length;
              const sTotal = records.length;
              const sPct = sTotal > 0 ? (sPres / sTotal) * 100 : 0;
              const isOk = sPct >= user.attendanceGoal;

              return (
                <div key={sub} className="card-rich p-5 flex items-center justify-between bg-slate-900/40">
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white ${isOk ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {sub.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-base tracking-tight">{sub}</h4>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {sPres}/{sTotal} Recorded
                      </p>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${isOk ? 'text-emerald-400' : 'text-rose-400'}`}>
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
  return (
    <div className="card-rich p-6 flex flex-col gap-4 bg-slate-900/60 border-white/10">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl bg-${color}-600 shadow-lg`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
        <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </div>
  );
};

export default Dashboard;
