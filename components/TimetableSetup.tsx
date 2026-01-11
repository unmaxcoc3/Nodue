
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
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Timetable</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg transition-transform active:scale-95"
        >
          <i className={`fa-solid ${showAdd ? 'fa-minus' : 'fa-plus'}`}></i>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border-2 border-blue-50 dark:border-blue-900/30 space-y-4 shadow-xl">
          <h3 className="font-bold text-lg mb-2">Add New Slot</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Subject Name</label>
              <input 
                type="text"
                required
                value={newSlot.subjectName}
                onChange={e => setNewSlot({...newSlot, subjectName: e.target.value})}
                placeholder="e.g. Mathematics"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 rounded-xl focus:ring-2 ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Day</label>
                <select 
                  value={newSlot.day}
                  onChange={e => setNewSlot({...newSlot, day: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 rounded-xl outline-none"
                >
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Faculty (Optional)</label>
                <input 
                  type="text"
                  value={newSlot.faculty}
                  onChange={e => setNewSlot({...newSlot, faculty: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Starts</label>
                <input 
                  type="time"
                  value={newSlot.startTime}
                  onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ends</label>
                <input 
                  type="time"
                  value={newSlot.endTime}
                  onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Card Color</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setNewSlot({...newSlot, color: c})}
                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${newSlot.color === c ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent opacity-60'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
            Save Subject
          </button>
        </form>
      )}

      <div className="space-y-8">
        {DAYS.map((dayName, dayIndex) => {
          const daySlots = slots.filter(s => s.day === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (daySlots.length === 0) return null;

          return (
            <div key={dayName} className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">{dayName}</h3>
              <div className="grid gap-3">
                {daySlots.map(slot => (
                  <div key={slot.id} className="flex bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="w-1.5" style={{ backgroundColor: slot.color }}></div>
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{slot.subjectName}</h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {slot.startTime} - {slot.endTime} {slot.faculty && `• ${slot.faculty}`}
                          </p>
                        </div>
                        <button 
                          onClick={() => onDeleteSlot(slot.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {slots.length === 0 && !showAdd && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <i className="fa-solid fa-clock-rotate-left text-slate-200 text-5xl mb-4"></i>
            <p className="text-slate-500 text-sm px-12">Your weekly timetable is empty. Add subjects to start tracking!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableSetup;
