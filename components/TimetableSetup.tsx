
import React, { useState } from 'react';
import { TimetableSlot } from '../types';
import { DAYS, SUBJECT_COLORS } from '../constants';

interface TimetableSetupProps {
  slots: TimetableSlot[];
  onAddSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  onDeleteSlot: (id: string) => void;
}

const TimetableSetup: React.FC<TimetableSetupProps> = ({ slots, onAddSlot, onDeleteSlot }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newSlot, setNewSlot] = useState<Omit<TimetableSlot, 'id'>>({
    subjectName: '',
    day: 1,
    startTime: '09:00',
    endTime: '10:00',
    faculty: '',
    color: SUBJECT_COLORS[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.subjectName) return;
    onAddSlot(newSlot);
    setShowAdd(false);
    setNewSlot({ ...newSlot, subjectName: '' });
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Schedule</h2>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`w-12 h-12 flex items-center justify-center rounded-[1.5rem] shadow-lg transition-all active:scale-90 ${showAdd ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-indigo-600 text-white shadow-indigo-200'}`}
        >
          <i className={`fa-solid ${showAdd ? 'fa-xmark' : 'fa-plus'} text-lg`}></i>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-5 shadow-2xl">
          <h3 className="text-lg font-extrabold tracking-tight">New Class</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Subject</label>
              <input 
                type="text"
                required
                value={newSlot.subjectName}
                onChange={e => setNewSlot({...newSlot, subjectName: e.target.value})}
                placeholder="Maths, Physics, etc."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-bold focus:ring-2 ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Day</label>
                <select 
                  value={newSlot.day}
                  onChange={e => setNewSlot({...newSlot, day: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-bold outline-none"
                >
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Faculty</label>
                <input 
                  type="text"
                  placeholder="Optional"
                  value={newSlot.faculty}
                  onChange={e => setNewSlot({...newSlot, faculty: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Start Time</label>
                <input 
                  type="time"
                  value={newSlot.startTime}
                  onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">End Time</label>
                <input 
                  type="time"
                  value={newSlot.endTime}
                  onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Theme</label>
              <div className="flex flex-wrap gap-3">
                {SUBJECT_COLORS.map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setNewSlot({...newSlot, color: c})}
                    className={`w-8 h-8 rounded-full border-4 transition-all active:scale-75 ${newSlot.color === c ? 'border-white dark:border-slate-700 ring-2 ring-indigo-500 scale-125' : 'border-transparent opacity-40'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.98]">
            Add to Timetable
          </button>
        </form>
      )}

      <div className="space-y-10">
        {DAYS.map((dayName, dayIndex) => {
          const daySlots = slots.filter(s => s.day === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (daySlots.length === 0) return null;

          return (
            <div key={dayName} className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {dayName}
              </h3>
              <div className="grid gap-4">
                {daySlots.map(slot => (
                  <div key={slot.id} className="group flex bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <div className="w-3" style={{ backgroundColor: slot.color }}></div>
                    <div className="flex-1 p-5 flex justify-between items-center">
                      <div className="flex flex-col">
                        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-lg">{slot.subjectName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <i className="fa-regular fa-clock text-slate-300 text-[10px]"></i>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {slot.startTime} — {slot.endTime}
                          </p>
                          {slot.faculty && (
                            <>
                              <span className="text-slate-200">|</span>
                              <span className="text-[10px] text-indigo-500/60 font-black uppercase tracking-widest">{slot.faculty}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => onDeleteSlot(slot.id)}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-90"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {slots.length === 0 && !showAdd && (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] flex items-center justify-center text-indigo-300 text-3xl mb-6">
              <i className="fa-solid fa-calendar-xmark"></i>
            </div>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">No classes yet</h4>
            <p className="text-slate-400 text-sm font-semibold mt-2 max-w-[200px] leading-relaxed">Fill your weekly schedule to enable subject tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableSetup;
