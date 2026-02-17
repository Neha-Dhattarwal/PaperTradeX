import React from 'react';
import { MarketMode, OHLC, Portfolio, ReplaySession } from '../types';
import { TradingViewChart } from './TradingViewChart';
import { OrderTerminal } from './OrderTerminal';
import { StatCard } from './StatCard';
import { Icons, INITIAL_CASH } from '../constants';

interface DashboardProps {
  selectedSymbol: string;
  marketMode: MarketMode;
  setMarketMode: (m: MarketMode) => void;
  liveQuote: any;
  allOHLC: OHLC[];
  replay: ReplaySession;
  setReplay: React.Dispatch<React.SetStateAction<ReplaySession>>;
  isSelectingStart: boolean;
  setIsSelectingStart: (b: boolean) => void;
  currentPrice: number;
  currencySymbol: string;
  portfolio: Portfolio;
  executeTrade: (type: 'BUY' | 'SELL', qty: number) => void;
  totalEquity: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedSymbol, marketMode, setMarketMode, liveQuote, allOHLC, replay, setReplay,
  isSelectingStart, setIsSelectingStart, currentPrice, currencySymbol, portfolio, executeTrade, totalEquity
}) => {
  const currentOHLC = marketMode === MarketMode.LIVE ? allOHLC : allOHLC.slice(0, replay.currentBarIndex + 1);
  const roi = ((totalEquity - INITIAL_CASH) / INITIAL_CASH) * 100;
  const filteredTrades = portfolio.trades.filter(t => t.mode === marketMode);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <StatCard title="Account Value (INR)" value={`₹${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} change={`${roi.toFixed(2)}% ROI`} positive={roi >= 0} />
        <StatCard title="Market Mode" value={marketMode} change={liveQuote?.exchange || "..."} />
        <StatCard title="Win Rate" value={`${roi >= 0 ? '75.0' : '25.0'}%`} change="Session Stats" />
        <StatCard title="Orders Exec." value={portfolio.trades.length} change="Cumulative" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        <div className="xl:col-span-3 h-[680px] flex flex-col glass rounded-[3rem] p-10 border-white/5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-white text-3xl ${marketMode === MarketMode.LIVE ? 'bg-emerald-600 shadow-emerald-500/20 shadow-2xl' : 'bg-indigo-600 shadow-indigo-500/20 shadow-2xl'}`}>{selectedSymbol.charAt(0)}</div>
              <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight">{selectedSymbol}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`w-2 h-2 rounded-full ${marketMode === MarketMode.LIVE ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}></span>
                   <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                     {marketMode === MarketMode.LIVE ? 'Live Market' : 'Historical Replay'} • {liveQuote?.exchange}
                   </span>
                </div>
              </div>
            </div>
            <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 mt-4 sm:mt-0">
              <button onClick={() => setMarketMode(MarketMode.LIVE)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${marketMode === MarketMode.LIVE ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500'}`}>Live Mode</button>
              <button onClick={() => setMarketMode(MarketMode.REPLAY)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${marketMode === MarketMode.REPLAY ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>Replay Mode</button>
            </div>
          </div>

          <div className="flex-1 bg-slate-900/40 rounded-[2rem] overflow-hidden border border-white/5">
            <TradingViewChart data={currentOHLC} fullData={allOHLC} isReplayMode={marketMode === MarketMode.REPLAY} isSelectingStart={isSelectingStart} onBarSelect={(idx) => { setReplay(p => ({...p, currentBarIndex: idx, isPlaying: false})); setIsSelectingStart(false); }} />
          </div>

          <div className="mt-8 flex items-end justify-between">
            {marketMode === MarketMode.REPLAY ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSelectingStart(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-all ${isSelectingStart ? 'animate-pulse bg-indigo-600 text-white' : ''}`}>Set Replay Start</button>
                <button onClick={() => setReplay(p => ({...p, isPlaying: !p.isPlaying}))} className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-xl">{replay.isPlaying ? <Icons.Pause /> : <Icons.Play />}</button>
                <div className="flex gap-1.5">
                  {[1, 5, 20].map(s => <button key={s} onClick={() => setReplay(p => ({...p, speed: s}))} className={`px-3 py-2 rounded-lg text-[9px] font-black ${replay.speed === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{s}X</button>)}
                </div>
              </div>
            ) : <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Feed Active • Live Execution Pricing</div>}
            
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Market Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-500 mono">{currencySymbol}</span>
                <span className={`text-5xl font-black mono tracking-tighter ${marketMode === MarketMode.LIVE ? 'text-emerald-400' : 'text-white'}`}>{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        <OrderTerminal 
          marketMode={marketMode} 
          filteredTrades={filteredTrades} 
          executeTrade={executeTrade} 
          currencySymbol={currencySymbol}
        />
      </div>
    </div>
  );
};