import React from 'react';
import { WATCHLIST } from '../constants';

interface MarketViewProps {
  watchlistQuotes: Record<string, any>;
  setSelectedSymbol: (s: string) => void;
  setActiveTab: (t: any) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({ watchlistQuotes, setSelectedSymbol, setActiveTab }) => (
  <div className="p-12 max-w-7xl mx-auto space-y-12 animate-fade-in">
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-5xl font-black text-white tracking-tighter">Market Pulse</h1>
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2">Real-time quotes across global exchanges</p>
      </div>
      <div className="px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Live Feed Active</div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {WATCHLIST.map(stock => {
        const quote = watchlistQuotes[stock.symbol];
        const isIndia = stock.symbol.includes('.NS') || stock.symbol.includes('.BO');
        const sym = quote?.currency === 'USD' ? '$' : (quote?.currency === 'INR' ? '₹' : (isIndia ? '₹' : '$'));
        
        return (
          <div key={stock.symbol} className="glass p-8 rounded-[2.5rem] border-white/5 shadow-xl group hover:border-indigo-500/40 transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-indigo-400">{stock.symbol.charAt(0)}</div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{quote?.exchange || "Loading..."}</p>
                <p className={`text-[11px] font-black ${quote?.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quote ? `${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)}%` : '---'}
                </p>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white uppercase mb-1">{stock.symbol}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase truncate mb-8">{stock.name}</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-black mono text-white">
                <span className="text-sm text-slate-500 mr-2">{sym}</span>
                {quote?.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
              </p>
              <button 
                onClick={() => { setSelectedSymbol(stock.symbol); setActiveTab('dashboard'); }}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Trade
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);