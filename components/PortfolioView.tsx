import React from 'react';
import { Portfolio } from '../types';

interface PortfolioViewProps {
  portfolio: Portfolio;
  totalEquity: number;
  watchlistQuotes: Record<string, any>;
  executeTrade: (type: 'SELL', qty: number, symbol: string, price: number) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ portfolio, totalEquity, watchlistQuotes, executeTrade }) => (
  <div className="p-12 max-w-7xl mx-auto animate-fade-in space-y-12">
     <div className="flex items-end justify-between">
       <div>
         <h1 className="text-5xl font-black text-white tracking-tight">Consolidated Asset View</h1>
         <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2">Combined holdings from both Live and Replay modes</p>
       </div>
       <div className="text-right">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Portfolio Valuation</p>
          <p className="text-4xl font-black text-white mono">₹{totalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
       </div>
     </div>
     
     <div className="glass rounded-[3rem] overflow-hidden border-white/5 shadow-2xl">
        <table className="w-full text-left border-collapse">
           <thead className="bg-white/[0.03] text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <tr>
                 <th className="px-10 py-8">Security</th>
                 <th className="px-10 py-8 text-right">Qty</th>
                 <th className="px-10 py-8 text-right">Avg Entry</th>
                 <th className="px-10 py-8 text-right">Current LTP</th>
                 <th className="px-10 py-8 text-right">Unrealized P/L</th>
                 <th className="px-10 py-8 text-right">Action</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
              {portfolio.holdings.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-10 py-24 text-center text-slate-700 font-black uppercase tracking-widest text-xs">No active positions detected</td>
                 </tr>
              ) : portfolio.holdings.map((h, i) => {
                const quote = watchlistQuotes[h.symbol];
                const curPrice = quote?.price || h.avgPrice;
                const pnl = (curPrice - h.avgPrice) * h.quantity;
                const sym = quote?.currency === 'USD' ? '$' : (quote?.currency === 'INR' ? '₹' : '₹');
                
                return (
                  <tr key={h.symbol} className="hover:bg-white/[0.02] transition-all group">
                     <td className="px-10 py-10">
                        <p className="font-black text-white uppercase tracking-wider">{h.symbol}</p>
                        <p className="text-[8px] text-slate-600 font-black uppercase mt-1">{quote?.exchange || 'MARKET'}</p>
                     </td>
                     <td className="px-10 py-10 text-right font-black mono text-slate-300">{h.quantity}</td>
                     <td className="px-10 py-10 text-right mono text-slate-500">{sym}{h.avgPrice.toFixed(2)}</td>
                     <td className="px-10 py-10 text-right mono font-black text-white">{sym}{curPrice.toFixed(2)}</td>
                     <td className={`px-10 py-10 text-right font-black mono ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                     </td>
                     <td className="px-10 py-10 text-right">
                        <button 
                          onClick={() => executeTrade('SELL', h.quantity, h.symbol, curPrice)}
                          className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          Exit Holding
                        </button>
                     </td>
                  </tr>
                )
              })}
           </tbody>
        </table>
     </div>
  </div>
);
