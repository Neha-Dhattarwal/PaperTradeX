
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './Layout';
import StockChart from './StockChart';
import TradePanel from './TradePanel';
import Watchlist from './Watchlist';
import Portfolio from './Portfolio';
import ReplayControls from './ReplayControls';
import PracticeSelector from './PracticeSelector';
import Orders from './Orders';
import { useTrading } from '../context/TradingContext';
import { MarketMode, CandleData } from '../types';

// Utility to generate realistic mock data for demo/fallback purposes
const generateSyntheticData = (count: number, basePrice: number = 150): CandleData[] => {
  const data: CandleData[] = [];
  let current = basePrice;
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const open = current;
    const volatility = current * 0.004; // 0.4% volatility per candle
    const change = (Math.random() - 0.5) * volatility;
    const close = current + change;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    const time = new Date(now.getTime() - (count - i) * 60000);
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume,
      timestamp: time.getTime()
    });
    current = close;
  }
  return data;
};

const Dashboard: React.FC<{ onLogout: () => void }> = () => {
  const [activeTab, setActiveTab] = useState('chart');
  const { mode, currentSymbol, replay, setReplay, state, checkTriggers } = useTrading();
  
  const [liveCandles, setLiveCandles] = useState<CandleData[]>([]);
  const [yesterdayCandles, setYesterdayCandles] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showPracticeSelector, setShowPracticeSelector] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const API_BASE = "http://localhost:5000";

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const histRes = await fetch(`${API_BASE}/historical?symbol=${currentSymbol}`);
      if (!histRes.ok) throw new Error("Offline");
      
      const histData = await histRes.json();
      const priceRes = await fetch(`${API_BASE}/live-price?symbol=${currentSymbol}`);
      const priceData = await priceRes.json();

      if (Array.isArray(histData)) setLiveCandles(histData);
      if (priceData.price) setCurrentPrice(priceData.price);
      
      const compData = generateSyntheticData(100, (priceData.price || 150) * 0.98);
      setYesterdayCandles(compData);
      setIsDemoMode(false);
    } catch (e) {
      console.warn("Backend offline: Switching to Simulator");
      setIsDemoMode(true);
      const mockData = generateSyntheticData(150, 185);
      setLiveCandles(mockData);
      setCurrentPrice(mockData[mockData.length - 1].close);
      setYesterdayCandles(generateSyntheticData(150, 182));
    } finally {
      setLoading(false);
    }
  }, [currentSymbol]);

  useEffect(() => {
    if (mode === MarketMode.LIVE) {
      fetchInitialData();
    } else {
      setLoading(false);
      if (replay.allCandles.length > 0) {
        setCurrentPrice(replay.allCandles[replay.currentIndex].close);
      }
    }
  }, [currentSymbol, mode, fetchInitialData, replay.allCandles.length]);

  // LIVE TICKER ENGINE
  useEffect(() => {
    if (mode !== MarketMode.LIVE) return;

    const interval = setInterval(async () => {
      if (isDemoMode) {
        setCurrentPrice(prev => {
          const next = prev + (Math.random() - 0.5) * (prev * 0.001);
          checkTriggers(next);
          setLiveCandles(cands => {
            if (cands.length === 0) return cands;
            const last = { ...cands[cands.length - 1] };
            last.close = next;
            last.high = Math.max(last.high, next);
            last.low = Math.min(last.low, next);
            return [...cands.slice(0, -1), last];
          });
          return next;
        });
      } else {
        try {
          const res = await fetch(`${API_BASE}/live-price?symbol=${currentSymbol}`);
          const data = await res.json();
          if (data.price) {
            setCurrentPrice(data.price);
            checkTriggers(data.price);
            setLiveCandles(prev => {
              if (prev.length === 0) return prev;
              const last = prev[prev.length - 1];
              const newCandle = { ...last, close: data.price, high: Math.max(last.high, data.price), low: Math.min(last.low, data.price) };
              return [...prev.slice(0, -1), newCandle];
            });
          }
        } catch (e) {
          setIsDemoMode(true);
        }
      }
    }, isDemoMode ? 2000 : 10000);

    return () => clearInterval(interval);
  }, [mode, currentSymbol, checkTriggers, isDemoMode]);

  // REPLAY PLAYBACK ENGINE
  useEffect(() => {
    if (mode !== MarketMode.PRACTICE || !replay.isPlaying || replay.allCandles.length === 0) return;

    const interval = setInterval(() => {
      setReplay(prev => {
        if (prev.currentIndex >= prev.allCandles.length - 1) return { ...prev, isPlaying: false };
        const nextIndex = prev.currentIndex + 1;
        const price = prev.allCandles[nextIndex].close;
        setCurrentPrice(price);
        checkTriggers(price);
        return { ...prev, currentIndex: nextIndex };
      });
    }, 1000 / (replay.speed || 1));

    return () => clearInterval(interval);
  }, [mode, replay.isPlaying, replay.speed, replay.allCandles.length, checkTriggers, setReplay]);

  const visibleData = useMemo(() => {
    if (mode === MarketMode.LIVE) return liveCandles;
    return replay.allCandles.slice(0, replay.currentIndex + 1).slice(-150);
  }, [mode, liveCandles, replay.allCandles, replay.currentIndex]);

  const stats = useMemo(() => {
    const isLive = mode === MarketMode.LIVE;
    const balance = isLive ? state.balance : state.practiceBalance;
    const positions = state.positions.filter(p => p.mode === mode);
    const unrealized = positions.reduce((acc, p) => acc + (currentPrice - p.avgPrice) * p.qty, 0);
    return { balance, unrealized, total: balance + unrealized };
  }, [state, mode, currentPrice]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex h-full w-full relative bg-[#080c14] overflow-hidden font-inter">
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Dashboard Context Bar */}
          <div className="h-14 border-b border-slate-800 bg-[#0d111c] flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${mode === MarketMode.LIVE ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'}`}></div>
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{mode} ENGINE</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
                <button onClick={() => setShowPracticeSelector(true)} className="text-[9px] font-black uppercase px-3 py-1 text-white hover:bg-slate-800 rounded transition-all">Replay</button>
                <button onClick={() => setIsCompareMode(!isCompareMode)} className={`text-[9px] font-black uppercase px-3 py-1 rounded transition-all ${isCompareMode ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Compare</button>
              </div>
              
              {isDemoMode && (
                <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Simulator
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-8">
               <div className="text-right">
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">Net Floating P&L</p>
                  <p className={`text-xs font-black font-mono ${stats.unrealized >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {loading ? '---' : `₹${stats.unrealized.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </p>
               </div>
            </div>
          </div>

          {/* Main Workspace Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden h-full min-h-0">
            {activeTab === 'chart' ? (
              <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <div className="flex-1 min-h-0 bg-[#0b0f19] relative overflow-hidden">
                  <StockChart 
                    data={visibleData} 
                    symbol={currentSymbol} 
                    comparisonData={yesterdayCandles} 
                    isCompareMode={isCompareMode} 
                  />
                  {mode === MarketMode.PRACTICE && replay.allCandles.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                      <ReplayControls 
                        isPlaying={replay.isPlaying} 
                        onTogglePlay={() => setReplay(p => ({...p, isPlaying: !p.isPlaying}))} 
                        speed={replay.speed} 
                        setSpeed={(s) => setReplay(p => ({...p, speed: s}))} 
                        currentIndex={replay.currentIndex} 
                        maxIndex={replay.allCandles.length} 
                        onSeek={(idx) => setReplay(p => ({...p, currentIndex: idx}))} 
                      />
                    </div>
                  )}
                </div>
                
                <div className="hidden lg:block h-[220px] border-t border-slate-800 shrink-0 bg-[#0d111c] overflow-hidden">
                   <Portfolio currentPrice={currentPrice} />
                </div>
              </div>
            ) : activeTab === 'portfolio' ? (
              <Portfolio currentPrice={currentPrice} />
            ) : activeTab === 'history' ? (
              <HistoryView />
            ) : (
              <Orders />
            )}
          </div>
        </div>

        {/* Right Sidebar for Watchlist and Trade Panel */}
        <div className="hidden lg:flex flex-col w-[300px] border-l border-slate-800 bg-[#0d111c] shrink-0 h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Watchlist />
          </div>
          <div className="h-[420px] border-t border-slate-800 shrink-0 bg-slate-900">
            <TradePanel currentPrice={currentPrice} />
          </div>
        </div>

        {showPracticeSelector && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <PracticeSelector onClose={() => setShowPracticeSelector(false)} />
          </div>
        )}
      </div>
    </Layout>

  );
};

const HistoryView = () => {
  const { state, mode } = useTrading();
  const history = useMemo(() => state.history.filter(t => t.mode === mode), [state.history, mode]);
  return (
    <div className="p-8 h-full overflow-y-auto bg-[#080c14]">
      <h2 className="text-2xl font-black text-white tracking-tighter mb-8 uppercase">Execution Log</h2>
      <div className="bg-[#0d111c] rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#161b26] text-slate-500 uppercase font-black">
            <tr><th className="p-5">Asset</th><th className="p-5">Side</th><th className="p-5">Price</th><th className="p-5">Size</th><th className="p-5">P&L</th><th className="p-5">Time</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {history.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-600 uppercase font-black">No trades yet</td></tr>
            ) : (
              history.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/20">
                  <td className="p-5 font-black text-white">{t.symbol}</td>
                  <td className="p-5"><span className={`px-2 py-1 rounded font-black text-[9px] ${t.type === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{t.type}</span></td>
                  <td className="p-5 font-mono">₹{t.price.toFixed(2)}</td>
                  <td className="p-5 font-mono">{t.qty}</td>
                  <td className={`p-5 font-black font-mono ${t.pnl && t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{t.pnl !== undefined ? `₹${t.pnl.toFixed(2)}` : '--'}</td>
                  <td className="p-5 text-slate-500 font-mono">{new Date(t.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
