
import React, { useMemo } from 'react';
import { AttendanceRecord, TimetableSlot, UserProfile, DayAttendance } from '../types';
import { getPercentageColor } from '../constants';

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

    let insightMessage = "";
    if (workingDays === 0) {
      insightMessage = "Mark your first day to see insights!";
    } else if (percentage < goal) {
      // Formula: (Goal * Total - 100 * Present) / (100 - Goal)
      const required = Math.ceil((goal * workingDays - 100 * present) / (100 - goal));
      insightMessage = `Attend ${required} more days to reach ${goal}%`;
    } else {
      // Formula: floor((100 * present - goal * workingDays) / goal)
      const canMiss = Math.floor((100 * present - goal * workingDays) / goal);
      insightMessage = canMiss > 0 
        ? `You can safely miss ${canMiss} day${canMiss > 1 ? 's' : ''}` 
        : "You are exactly on track! Don't miss today.";
    }

    return { present, absent, workingDays, percentage, holidays, insightMessage };
  }, [dayAttendance, user.attendanceGoal]);

  return (
    <div className="space-y-6 pb-6">
      {/* Percentage Card */}
      <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${stats.percentage >= user.attendanceGoal ? 'bg-indigo-600' : 'bg-rose-600'}`}>
        <div className="relative z-10">
          <h2 className="text-white/70 text-xs font-black uppercase tracking-widest mb-2">Total Attendance</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black">{Math.round(stats.percentage)}%</span>
            <span className="text-white/60 font-bold">Goal: {user.attendanceGoal}%</span>
          </div>
          
          <div className="mt-6 space-y-3">
             <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${Math.min(stats.percentage, 100)}%` }}></div>
             </div>
             <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl py-2 px-4 w-fit">
                <i className={`fa-solid ${stats.percentage >= user.attendanceGoal ? 'fa-fire' : 'fa-circle-info'} text-white`}></i>
                <p className="text-xs font-black text-white uppercase tracking-tight">
                  {stats.insightMessage}
                </p>
             </div>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Working Days" value={stats.workingDays} icon="fa-briefcase" color="blue" />
        <StatCard label="Present" value={stats.present} icon="fa-check-circle" color="green" />
        <StatCard label="Absent" value={stats.absent} icon="fa-times-circle" color="red" />
        <StatCard label="Holidays" value={stats.holidays} icon="fa-umbrella-beach" color="yellow" />
      </div>

      {/* Advanced Mode Subject Breakdown */}
      {user.useAdvancedMode && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-black px-1 tracking-tight">Subject Breakdown</h3>
          {timetable.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
               <p className="text-slate-400 text-sm font-medium">Add subjects in the Timetable tab to track individual classes.</p>
            </div>
          ) : (
            <div className="grid gap-3">
               {Array.from(new Set(timetable.map(t => t.subjectName))).map(name => {
                 const subjectRecords = attendance.filter(r => r.subjectName === name && r.status !== 'HOLIDAY');
                 const sPresent = subjectRecords.filter(r => r.status === 'PRESENT').length;
                 const sConducted = subjectRecords.length;
                 const sPct = sConducted > 0 ? (sPresent / sConducted) * 100 : 0;
                 return (
                   <div key={name} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{sPresent}/{sConducted} Classes</span>
                          <div className={`w-1 h-1 rounded-full ${sPct >= user.attendanceGoal ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${getPercentageColor(sPct)}`}>{Math.round(sPct)}%</span>
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
  };
  return (
    <div className={`p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800 shadow-sm transition-transform active:scale-95`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <span className="text-2xl font-black block text-slate-800 dark:text-white">{value}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
};

export default Dashboard;
