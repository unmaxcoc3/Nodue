
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
    <div className="flex flex-col min-h-screen pb-20 max-w-md mx-auto bg-white shadow-xl dark:bg-slate-900 dark:text-white transition-colors">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {title}
        </h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setView(ViewMode.SETTINGS)}
            className={`p-2 rounded-full transition-colors ${activeView === ViewMode.SETTINGS ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around items-center z-50">
        <NavButton 
          active={activeView === ViewMode.DASHBOARD} 
          onClick={() => setView(ViewMode.DASHBOARD)} 
          icon="fa-chart-pie" 
          label="Dashboard" 
        />
        <NavButton 
          active={activeView === ViewMode.CALENDAR} 
          onClick={() => setView(ViewMode.CALENDAR)} 
          icon="fa-calendar-days" 
          label="Calendar" 
        />
        <NavButton 
          active={activeView === ViewMode.TIMETABLE} 
          onClick={() => setView(ViewMode.TIMETABLE)} 
          icon="fa-clock" 
          label="Timetable" 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-xl ${active ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 dark:text-slate-500'}`}
  >
    <i className={`fa-solid ${icon} text-lg`}></i>
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

export default Layout;
