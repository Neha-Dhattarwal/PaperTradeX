import React, { useState, useEffect } from 'react';
import { WATCHLIST } from '../constants';
import { MarketMode } from '../types';
import { api } from '../services/api';

interface SidebarProps {
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  setActiveTab: (t: any) => void;
  marketMode: MarketMode;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedSymbol, setSelectedSymbol, setActiveTab, marketMode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await api.searchStocks(searchQuery);
        setSearchResults(results);
      } catch (err) {}
      finally { setIsSearching(false); }
    };
    const debounce = setTimeout(search, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <aside className="w-80 border-r border-white/5 bg-slate-900/10 flex flex-col shrink-0 p-6">
      <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Stock Explorer</h2>
      <div className="relative mb-6">
         <input 
           type="text" 
           placeholder="Search Symbols..." 
           value={searchQuery} 
           onChange={(e) => setSearchQuery(e.target.value)} 
           className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white focus:border-indigo-500 outline-none transition-all pl-11" 
         />
         <div className="absolute left-4 top-4 text-slate-500">
            {isSearching ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2} /></svg>}
         </div>
      </div>
      <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar">
        {searchResults.length > 0 ? (
          searchResults.map(stock => (
            <button key={stock.symbol} onClick={() => { setSelectedSymbol(stock.symbol); setSearchQuery(""); setSearchResults([]); setActiveTab('dashboard'); }} className="w-full p-4 rounded-3xl flex items-center justify-between transition-all hover:bg-indigo-600/10 mb-2 group border border-transparent hover:border-indigo-500/20">
              <div className="text-left">
                <p className="font-black text-xs text-white uppercase">{stock.symbol}</p>
                <p className="text-[9px] text-slate-500 font-bold truncate w-32 uppercase">{stock.name}</p>
              </div>
              <span className="text-[8px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-lg uppercase">{stock.exchange}</span>
            </button>
          ))
        ) : (
          <>
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Quick Access</h3>
            {WATCHLIST.map(stock => (
              <button 
                key={stock.symbol} 
                onClick={() => { setSelectedSymbol(stock.symbol); setActiveTab('dashboard'); }} 
                className={`w-full p-4 rounded-3xl flex items-center justify-between transition-all mb-2 ${selectedSymbol === stock.symbol ? (marketMode === MarketMode.LIVE ? 'bg-emerald-600 shadow-xl text-white' : 'bg-indigo-600 shadow-xl text-white') : 'bg-white/5 border border-white/5'}`}
              >
                <p className="font-black text-xs uppercase">{stock.symbol}</p>
                <p className={`text-[9px] font-bold ${selectedSymbol === stock.symbol ? 'text-indigo-100' : 'text-slate-500'}`}>{stock.symbol.includes('.NS') ? 'NSE' : 'GLOB'}</p>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
};