
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center px-4">
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Weekly</span>
          <h2 className="text-4xl font-black text-white tracking-tighter">Schedule</h2>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`w-14 h-14 flex items-center justify-center rounded-[1.8rem] shadow-2xl transition-all active:scale-90 ${showAdd ? 'bg-rose-600 text-white rotate-45' : 'bg-indigo-600 text-white shadow-indigo-500/30'}`}
        >
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
           <form onSubmit={handleSubmit} className="w-full max-w-sm card-rich p-8 bg-slate-900 border-white/10 space-y-6 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black text-white tracking-tighter">New Lecture</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">Subject Name</label>
                <input required type="text" value={newSlot.subjectName} onChange={e => setNewSlot({...newSlot, subjectName: e.target.value})} placeholder="e.g. Data Structures" className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-bold text-white focus:ring-2 ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">Day</label>
                  <select value={newSlot.day} onChange={e => setNewSlot({...newSlot, day: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-bold text-white outline-none appearance-none">
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">Faculty</label>
                  <input type="text" placeholder="Optional" value={newSlot.faculty} onChange={e => setNewSlot({...newSlot, faculty: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-bold text-white outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">Start</label>
                  <input type="time" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-bold text-white outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-2 block">End</label>
                  <input type="time" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-bold text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2 block">Accent Color</label>
                <div className="flex flex-wrap gap-3 px-1">
                  {SUBJECT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewSlot({...newSlot, color: c})} className={`w-8 h-8 rounded-full border-2 transition-all active:scale-75 ${newSlot.color === c ? 'border-white ring-2 ring-indigo-500 scale-125' : 'border-transparent opacity-40'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] mt-4">Save Session</button>
          </form>
        </div>
      )}

      <div className="space-y-12 pb-24">
        {DAYS.map((dayName, dayIdx) => {
          const daySlots = slots.filter(s => s.day === dayIdx).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (daySlots.length === 0) return null;
          return (
            <div key={dayName} className="space-y-6">
              <div className="flex items-center gap-4 px-4">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-500">{dayName}</h3>
                 <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="space-y-4 px-2">
                {daySlots.map(slot => (
                  <div key={slot.id} className="group card-rich p-6 flex bg-slate-900/30 border-white/5 hover:border-white/10 transition-all overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: slot.color }}></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex-1 flex justify-between items-center ml-4">
                      <div>
                        <h4 className="font-black text-white tracking-tighter text-xl">{slot.subjectName}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-xl border border-white/5">
                            <i className="fa-regular fa-clock text-indigo-500 text-[10px]"></i>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{slot.startTime} — {slot.endTime}</span>
                          </div>
                          {slot.faculty && (
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">{slot.faculty}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => onDeleteSlot(slot.id)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90 border border-white/5">
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
          <div className="text-center py-24 bg-slate-900/40 rounded-[3rem] border border-white/5 flex flex-col items-center mx-4">
            <div className="w-24 h-24 bg-indigo-500/5 rounded-[2.5rem] flex items-center justify-center text-indigo-500/40 text-4xl mb-8 border border-white/5">
              <i className="fa-solid fa-calendar-plus"></i>
            </div>
            <h4 className="text-2xl font-black text-white tracking-tighter">Your Schedule is Clear</h4>
            <p className="text-slate-500 text-sm font-bold mt-3 max-w-[220px] leading-relaxed opacity-60">Add your lectures to start tracking session-wise progress.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableSetup;
