
import React, { useState, useRef } from 'react';
import { TimetableSlot } from '../types';
import { DAYS, SUBJECT_COLORS } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface TimetableSetupProps {
  slots: TimetableSlot[];
  onAddSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  onDeleteSlot: (id: string) => void;
  onBulkAddSlots?: (slots: Omit<TimetableSlot, 'id'>[]) => void;
}

const TimetableSetup: React.FC<TimetableSetupProps> = ({ slots, onAddSlot, onDeleteSlot, onBulkAddSlots }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const extractJson = (text: string) => {
    try {
      // Find the first [ and last ] to extract array
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start === -1 || end === -1) return [];
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Manual JSON extraction failed", e);
      return [];
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (rough limit 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Please upload an image under 10MB.");
      return;
    }

    setIsScanning(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Use gemini-3-pro-preview for high reasoning quality OCR
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { text: "Extract the weekly university timetable from this image. RETURN ONLY A JSON ARRAY of objects. Each object must have: subjectName, day (0-6 where 0 is Sunday, 1 is Monday, etc), startTime (HH:mm), endTime (HH:mm), faculty (string or null). Do not include markdown code blocks or explanations." },
            { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Data } }
          ]
        }
      });

      const responseText = response.text || "[]";
      const extracted = extractJson(responseText);
      
      if (Array.isArray(extracted) && onBulkAddSlots) {
        if (extracted.length === 0) {
          alert("AI couldn't find any timetable data in this image. Try a clearer shot.");
        } else {
          const slotsWithColors = extracted.map((s: any, idx: number) => ({
            subjectName: s.subjectName || "Unknown Lecture",
            day: typeof s.day === 'number' ? s.day : 1,
            startTime: s.startTime || "09:00",
            endTime: s.endTime || "10:00",
            faculty: s.faculty || "",
            color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
          }));
          onBulkAddSlots(slotsWithColors);
        }
      } else {
        throw new Error("Invalid format received from AI");
      }
    } catch (err: any) {
      console.error("Scanning error details:", err);
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('permission')) {
        alert("Access Denied: The AI service for multimodal scanning is restricted. Please try adding your timetable manually.");
      } else {
        alert("Could not process image. Please ensure it's a clear photo of a timetable.");
      }
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center px-4">
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Weekly</span>
          <h2 className="text-4xl font-black text-white tracking-tighter">Schedule</h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-14 h-14 flex items-center justify-center rounded-[1.8rem] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 transition-all active:scale-90 hover:bg-indigo-500/20"
            title="Upload Image"
          >
            {isScanning ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : <i className="fa-solid fa-image-polaroid text-xl"></i>}
          </button>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className={`w-14 h-14 flex items-center justify-center rounded-[1.8rem] shadow-2xl transition-all active:scale-90 ${showAdd ? 'bg-rose-600 text-white rotate-45' : 'bg-indigo-600 text-white shadow-indigo-500/30'}`}
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {isScanning && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl p-10 text-center">
           <div className="relative mb-10">
              <div className="w-32 h-32 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <i className="fa-solid fa-wand-magic-sparkles text-white text-4xl animate-pulse"></i>
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_ease-in-out_infinite]"></div>
           </div>
           <h3 className="text-2xl font-black text-white tracking-tight mb-2">AI Intelligence Scanning</h3>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest opacity-60">Decrypting Timetable Data...</p>
           
           <style>{`
             @keyframes scan {
               0% { transform: translateY(0); }
               50% { transform: translateY(128px); }
               100% { transform: translateY(0); }
             }
           `}</style>
        </div>
      )}

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

        {slots.length === 0 && !showAdd && !isScanning && (
          <div className="text-center py-24 bg-slate-900/40 rounded-[3rem] border border-white/5 flex flex-col items-center mx-4">
            <div className="w-24 h-24 bg-indigo-500/5 rounded-[2.5rem] flex items-center justify-center text-indigo-500/40 text-4xl mb-8 border border-white/5">
              <i className="fa-solid fa-calendar-plus"></i>
            </div>
            <h4 className="text-2xl font-black text-white tracking-tighter">Your Schedule is Clear</h4>
            <p className="text-slate-500 text-sm font-bold mt-3 max-w-[220px] leading-relaxed opacity-60">Add manually or select from gallery to populate your lectures.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableSetup;
