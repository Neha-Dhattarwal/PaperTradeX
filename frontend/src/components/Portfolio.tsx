
import React, { useMemo } from 'react';
import { useTrading } from '../context/TradingContext';

const Portfolio: React.FC<{ currentPrice: number }> = ({ currentPrice }) => {
  const { state, mode } = useTrading();
  const filteredPositions = useMemo(() => state.positions.filter(p => p.mode === mode), [state.positions, mode]);

  const totalInvested = useMemo(() => filteredPositions.reduce((acc, p) => acc + (p.avgPrice * p.qty), 0), [filteredPositions]);
  const netPnL = useMemo(() => filteredPositions.reduce((acc, p) => acc + (currentPrice - p.avgPrice) * p.qty, 0), [filteredPositions, currentPrice]);

  return (
    <div className="p-6 h-full flex flex-col bg-[#0d111c]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex gap-8">
           <div>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Exposure</p>
              <p className="text-sm font-black text-white font-mono">₹{totalInvested.toLocaleString()}</p>
           </div>
           <div>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Open Profit</p>
              <p className={`text-sm font-black font-mono ${netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netPnL >= 0 ? '+' : ''}₹{netPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
           </div>
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-[8px] text-slate-600 font-black uppercase">Live Calc</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredPositions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-950/30 rounded-2xl border border-slate-800/50 border-dashed">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-tighter">No active inventory in {mode} mode</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredPositions.map(pos => {
              const pnl = (currentPrice - pos.avgPrice) * pos.qty;
              const isProfit = pnl >= 0;

              return (
                <div key={pos.id} className="bg-[#161b26] border border-slate-800 p-4 rounded-xl flex flex-col justify-between group hover:border-blue-500/50 transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{pos.symbol}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">{pos.qty} SHARES</span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">AVG ₹{pos.avgPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className={`text-xs font-black font-mono ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                         {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
                       </div>
                       <div className={`text-[8px] font-black ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                         {((pnl / (pos.avgPrice * pos.qty)) * 100).toFixed(2)}%
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 border-t border-slate-800 pt-3">
                    <div className="flex-1 bg-slate-950/50 rounded p-1.5 flex flex-col">
                       <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest">Stop Loss</span>
                       <span className="text-[9px] text-red-500 font-black font-mono">{pos.stopLoss ? `₹${pos.stopLoss}` : 'NONE'}</span>
                    </div>
                    <div className="flex-1 bg-slate-950/50 rounded p-1.5 flex flex-col">
                       <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest">Take Profit</span>
                       <span className="text-[9px] text-green-500 font-black font-mono">{pos.takeProfit ? `₹${pos.takeProfit}` : 'NONE'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
