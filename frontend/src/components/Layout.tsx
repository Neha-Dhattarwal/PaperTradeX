
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import { MarketMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { authState, logout } = useAuth();
  const { mode, setMode, state } = useTrading();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-500 tracking-tighter">PaperTradeX</h1>
          <div className="hidden md:flex bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setMode(MarketMode.LIVE)}
              className={`px-3 py-1 rounded-md text-sm transition-all ${mode === MarketMode.LIVE ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Live
            </button>
            <button 
              onClick={() => setMode(MarketMode.PRACTICE)}
              className={`px-3 py-1 rounded-md text-sm transition-all ${mode === MarketMode.PRACTICE ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Practice
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs text-slate-400 uppercase font-medium">Virtual Balance</span>
            <span className={`text-sm font-bold ${mode === MarketMode.LIVE ? 'text-green-400' : 'text-amber-400'}`}>
              ₹{(mode === MarketMode.LIVE ? state.balance : state.practiceBalance).toLocaleString()}
            </span>
          </div>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar Nav */}
        <aside className="hidden md:flex flex-col w-16 border-r border-slate-800 bg-slate-900 py-4 items-center gap-8">
          <NavItem icon="chart" active={activeTab === 'chart'} onClick={() => setActiveTab('chart')} label="Chart" />
          <NavItem icon="portfolio" active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} label="Assets" />
          <NavItem icon="history" active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-slate-950 overflow-hidden relative">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <footer className="md:hidden h-16 border-t border-slate-800 bg-slate-900 flex items-center justify-around px-2 pb-safe">
        <NavItem icon="chart" active={activeTab === 'chart'} onClick={() => setActiveTab('chart')} label="Chart" />
        <NavItem icon="portfolio" active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} label="Assets" />
        <NavItem icon="history" active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
      </footer>
    </div>
  );
};

const NavItem = ({ icon, active, onClick, label }: { icon: string; active: boolean; onClick: () => void; label: string }) => {
  const getIcon = () => {
    switch (icon) {
      case 'chart': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
      case 'portfolio': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12s-3-7-10-7-10 7-10 7 3 7 10 7 10-7 10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
      case 'history': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
      default: return null;
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
    >
      {getIcon()}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

export default Layout;
