
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
    const goal = user.attendanceGoal;

    return { present, absent, workingDays, percentage, holidays };
  }, [dayAttendance]);

  const onTrack = stats.percentage >= user.attendanceGoal;

  return (
    <div className="space-y-8 animate-in">
      {/* Dynamic Progress Card */}
      <div className={`relative p-10 rounded-[3.5rem] overflow-hidden shadow-2xl btn-rich ${
        onTrack 
          ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-800' 
          : 'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700'
      }`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 mb-8">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Session Progress</span>
          </div>
          
          <div className="text-9xl font-black text-white tracking-tighter flex items-start drop-shadow-2xl">
            {Math.round(stats.percentage)}
            <span className="text-4xl mt-6 opacity-60 ml-1">%</span>
          </div>
          
          <div className="mt-10 w-full space-y-6">
             <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden p-1 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-white/90 to-white rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                  style={{ width: `${Math.max(stats.percentage, 5)}%` }}
                ></div>
             </div>
             
             <div className="flex justify-between items-center text-white/90 px-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Status</span>
                  <span className="text-sm font-bold uppercase tracking-tight">
                    {onTrack ? 'Excellent Pace' : 'Below Target'}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Goal</span>
                  <span className="text-sm font-bold uppercase tracking-tight">{user.attendanceGoal}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-5">
        <MetricTile label="Total Classes" value={stats.workingDays} icon="fa-layer-group" color="indigo" />
        <MetricTile label="Present" value={stats.present} icon="fa-check-circle" color="emerald" />
        <MetricTile label="Absent" value={stats.absent} icon="fa-times-circle" color="rose" />
        <MetricTile label="Free Days" value={stats.holidays} icon="fa-umbrella-beach" color="amber" />
      </div>

      {/* Subject Trend */}
      {user.useAdvancedMode && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Deep Insights</h3>
            <span className="w-10 h-1 bg-indigo-200 dark:bg-indigo-900/40 rounded-full"></span>
          </div>
          <div className="space-y-4">
            {Array.from(new Set(timetable.map(t => t.subjectName))).map(name => {
              const subName = String(name);
              const subjectRecords = attendance.filter(r => r.subjectName === subName && r.status !== 'HOLIDAY');
              const sPresent = subjectRecords.filter(r => r.status === 'PRESENT').length;
              const sTotal = subjectRecords.length;
              const sPct = sTotal > 0 ? (sPresent / sTotal) * 100 : 0;
              const subOnTrack = sPct >= user.attendanceGoal;

              return (
                <div key={subName} className="card-rich p-6 flex items-center justify-between transition-all active:scale-[0.98]">
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-2xl font-black ${
                      subOnTrack ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                    }`}>
                      {subName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg tracking-tight">{subName}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {sPresent} of {sTotal} Attended
                      </p>
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${subOnTrack ? 'text-emerald-500' : 'text-rose-500'}`}>
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

const MetricTile: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const themes: any = {
    indigo: 'bg-indigo-500 shadow-indigo-500/20',
    emerald: 'bg-emerald-500 shadow-emerald-500/20',
    rose: 'bg-rose-500 shadow-rose-500/20',
    amber: 'bg-amber-500 shadow-amber-500/20'
  };
  return (
    <div className="card-rich p-7 flex flex-col gap-4 group transition-all hover:translate-y-[-4px]">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-12 transition-transform ${themes[color]}`}>
        <i className={`fa-solid ${icon} text-lg`}></i>
      </div>
      <div>
        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-tight">{label}</div>
      </div>
    </div>
  );
};

export default Dashboard;
