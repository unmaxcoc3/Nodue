
import React from 'react';
import { ViewMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewMode;
  setView: (view: ViewMode) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, title }) => {
  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto relative overflow-hidden">
      <header className="pt-16 pb-4 px-8 flex justify-between items-center z-40">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-0.5">
            Campus Pulse
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter">
            {title}
          </h1>
        </div>
        <button 
          onClick={() => setView(ViewMode.SETTINGS)}
          className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all btn-rich ${
            activeView === ViewMode.SETTINGS 
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white' 
              : 'glass-premium text-slate-500 dark:text-slate-300'
          }`}
        >
          <i className="fa-solid fa-user-circle text-xl"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40 pt-4">
        {children}
      </main>

      <div className="absolute bottom-10 left-0 right-0 z-50 flex justify-center px-8 pointer-events-none">
        <nav className="glass-premium w-full pointer-events-auto rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl">
          <NavButton 
            active={activeView === ViewMode.DASHBOARD} 
            onClick={() => setView(ViewMode.DASHBOARD)} 
            icon="fa-grip" 
            label="Overview" 
          />
          <NavButton 
            active={activeView === ViewMode.CALENDAR} 
            onClick={() => setView(ViewMode.CALENDAR)} 
            icon="fa-calendar-check" 
            label="Registry" 
          />
          <NavButton 
            active={activeView === ViewMode.TIMETABLE} 
            onClick={() => setView(ViewMode.TIMETABLE)} 
            icon="fa-list-ul" 
            label="Plan" 
          />
        </nav>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-3.5 rounded-[2rem] transition-all duration-300 ${
      active 
        ? 'text-white bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 shadow-xl shadow-indigo-500/30' 
        : 'text-slate-400 dark:text-slate-500'
    }`}
  >
    <i className={`fa-solid ${icon} text-lg ${active ? 'scale-110 drop-shadow-md' : ''}`}></i>
    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
  </button>
);

export default Layout;
