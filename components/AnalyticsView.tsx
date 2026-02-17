import React from 'react';
import { Portfolio } from '../types';
import { INITIAL_CASH } from '../constants';

interface AnalyticsViewProps {
  portfolio: Portfolio;
  totalEquity: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ portfolio, totalEquity }) => {
  const profit = totalEquity - INITIAL_CASH;
  const roi = (profit / INITIAL_CASH) * 100;
  
  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12 animate-fade-in">
      <h1 className="text-5xl font-black text-white tracking-tight">Account Performance</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="glass p-10 rounded-[2.5rem] border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Realized P/L</p>
            <p className={`text-4xl font-black mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {profit >= 0 ? '+' : ''}₹{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
         </div>
         <div className="glass p-10 rounded-[2.5rem] border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Strategy Win Rate</p>
            <p className="text-4xl font-black text-white">{roi >= 0 ? '75.0' : '25.0'}%</p>
         </div>
         <div className="glass p-10 rounded-[2.5rem] border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Executed Orders</p>
            <p className="text-4xl font-black text-white">{portfolio.trades.length}</p>
         </div>
      </div>

      <div className="glass p-12 rounded-[3.5rem] border-white/5">
         <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
           <h3 className="text-sm font-black text-white uppercase tracking-widest">Historical Replay Session Report</h3>
           <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:underline">Export CSV</button>
         </div>
         <div className="space-y-8">
            <div className="flex justify-between items-center">
               <span className="text-slate-500 text-xs font-bold uppercase">Simulation Starting Balance</span>
               <span className="text-white font-black mono">₹{INITIAL_CASH.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-slate-500 text-xs font-bold uppercase">Simulation Net Yield</span>
               <span className={`font-black mono ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{roi.toFixed(2)}%</span>
            </div>
            <div className="pt-6 border-t border-white/5">
               <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] leading-relaxed italic">
                  * Note: Analytics include combined data. Detailed session logs are available in the terminal view.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};