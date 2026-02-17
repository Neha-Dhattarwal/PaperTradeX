import React from 'react';
import { MarketMode, Trade } from '../types';
import { Icons } from '../constants';

interface OrderTerminalProps {
  marketMode: MarketMode;
  filteredTrades: Trade[];
  executeTrade: (type: 'BUY' | 'SELL', qty: number) => void;
  currencySymbol: string;
}

export const OrderTerminal: React.FC<OrderTerminalProps> = ({ marketMode, filteredTrades, executeTrade, currencySymbol }) => {
  return (
    <div className={`glass rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl h-full overflow-hidden transition-all duration-500 ${marketMode === MarketMode.LIVE ? 'border-emerald-500/20 ring-1 ring-emerald-500/10' : 'border-indigo-500/20 ring-1 ring-indigo-500/10'}`}>
       <div className="flex items-center justify-between">
         <h3 className={`text-[11px] font-black uppercase tracking-widest ${marketMode === MarketMode.LIVE ? 'text-emerald-500' : 'text-indigo-400'}`}>
           {marketMode} Terminal
         </h3>
         <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${marketMode === MarketMode.LIVE ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
           {marketMode === MarketMode.LIVE ? 'RT-Feed' : 'Simulation'}
         </span>
       </div>

       <div className="space-y-5">
          <div className="relative">
            <label className="absolute -top-2 left-4 bg-[#020617] px-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Unit Quantity</label>
            <input id="q-inp" type="number" defaultValue={10} min={1} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-5 text-3xl font-black mono text-center text-white outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => executeTrade('BUY', parseInt((document.getElementById('q-inp') as any).value))} className={`py-6 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xl bg-emerald-600 shadow-emerald-900/20`}>BUY</button>
            <button onClick={() => executeTrade('SELL', parseInt((document.getElementById('q-inp') as any).value))} className={`py-6 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xl bg-rose-600 shadow-rose-900/20`}>SELL</button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              {marketMode} History
            </h4>
            <span className="text-[8px] font-bold text-slate-500">{filteredTrades.length} Trades</span>
          </div>
          
          {filteredTrades.slice(0, 10).map(t => {
            const sym = t.currency === 'USD' ? '$' : (t.currency === 'INR' ? '₹' : '₹');
            return (
              <div key={t.id} className={`p-3 rounded-xl border flex justify-between items-center group transition-all ${marketMode === MarketMode.LIVE ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30'}`}>
                <div>
                    <p className="font-black text-[10px] text-white uppercase">{t.symbol}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black ${t.side === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.side} {t.quantity} U</span>
                      <span className="text-[7px] text-slate-600 font-bold">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <p className="font-black mono text-[11px] text-slate-400 group-hover:text-white transition-colors">{sym}{t.price.toFixed(1)}</p>
              </div>
            );
          })}
          {filteredTrades.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <Icons.Chart />
              <p className="text-[9px] font-black uppercase tracking-widest mt-2">No {marketMode} Trades</p>
            </div>
          )}
       </div>
    </div>
  );
};
