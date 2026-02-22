
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MarketMode, Portfolio, OHLC, Trade, Holding, ReplaySession, User } from './types';
import { WATCHLIST, INITIAL_CASH, Icons } from './constants';
import { TradingViewChart } from './components/TradingViewChart';
import { api } from './services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket: Socket = io(SOCKET_URL);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'market' | 'portfolio' | 'analytics'>('dashboard');
  const [marketMode, setMarketMode] = useState<MarketMode>(MarketMode.LIVE);
  const [selectedSymbol, setSelectedSymbol] = useState(WATCHLIST[0].symbol);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelectingStart, setIsSelectingStart] = useState(false);

  const [allOHLC, setAllOHLC] = useState<OHLC[]>([]);
  const [liveQuote, setLiveQuote] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, any>>({});

  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    const saved = localStorage.getItem('tp_portfolio_v9');
    return saved ? JSON.parse(saved) : {
      cash: INITIAL_CASH,
      holdings: [],
      trades: [],
      initialBalance: INITIAL_CASH
    };
  });

  const [replay, setReplay] = useState<ReplaySession>({
    id: 'session_' + Date.now(),
    symbol: WATCHLIST[0].symbol,
    currentBarIndex: 0,
    isPlaying: false,
    speed: 1,
  });

  useEffect(() => {
    localStorage.setItem('tp_portfolio_v9', JSON.stringify(portfolio));
  }, [portfolio]);

  const loadMarketData = useCallback(async (symbol: string) => {
    setIsLoadingData(true);
    try {
      const [history, quote] = await Promise.all([
        api.getHistorical(symbol),
        api.getQuote(symbol)
      ]);
      setAllOHLC(history);
      setLiveQuote(quote);
      setReplay(prev => ({
        ...prev,
        currentBarIndex: history.length - 1,
        isPlaying: false,
        symbol
      }));
    } catch (err) {
      console.error("Market data sync error:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData(selectedSymbol);
  }, [selectedSymbol, loadMarketData]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      const quotes: Record<string, any> = {};
      await Promise.all(WATCHLIST.map(async (stock) => {
        try {
          const q = await api.getQuote(stock.symbol);
          quotes[stock.symbol] = q;
        } catch (e) { }
      }));
      setWatchlistQuotes(quotes);
    };

    fetchWatchlist();
    const interval = setInterval(async () => {
      fetchWatchlist();
      if (marketMode === MarketMode.LIVE) {
        try {
          const quote = await api.getQuote(selectedSymbol);
          setLiveQuote(quote);
        } catch (e) { }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedSymbol, marketMode]);

  useEffect(() => {
    if (marketMode === MarketMode.LIVE && selectedSymbol) {
      socket.emit('subscribe_price', selectedSymbol);
      socket.on('price_update', (quote: any) => {
        if (quote.symbol === selectedSymbol) {
          setLiveQuote(quote);
        }
      });
      return () => {
        socket.emit('unsubscribe_price', selectedSymbol);
        socket.off('price_update');
      };
    }
  }, [selectedSymbol, marketMode]);

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
      } catch (err) { }
      finally { setIsSearching(false); }
    };
    const debounce = setTimeout(search, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    let timer: any;
    if (marketMode === MarketMode.REPLAY && replay.isPlaying) {
      timer = setInterval(() => {
        setReplay(prev => {
          if (prev.currentBarIndex >= allOHLC.length - 1) return { ...prev, isPlaying: false };
          return { ...prev, currentBarIndex: prev.currentBarIndex + 1 };
        });
      }, 1000 / replay.speed);
    }
    return () => clearInterval(timer);
  }, [marketMode, replay.isPlaying, replay.speed, allOHLC.length]);

  const currencySymbol = useMemo(() => {
    if (liveQuote?.currency === 'INR') return '₹';
    if (liveQuote?.currency === 'USD') return '$';
    return liveQuote?.currency || '₹';
  }, [liveQuote]);

  const currentPrice = useMemo(() => {
    if (marketMode === MarketMode.LIVE) return liveQuote?.price || (allOHLC.length > 0 ? allOHLC[allOHLC.length - 1].close : 0);
    if (allOHLC.length === 0) return 0;
    return allOHLC[replay.currentBarIndex]?.close || 0;
  }, [allOHLC, marketMode, replay.currentBarIndex, liveQuote]);

  const currentOHLC = useMemo(() => {
    if (marketMode === MarketMode.LIVE) return allOHLC;
    return allOHLC.slice(0, replay.currentBarIndex + 1);
  }, [allOHLC, marketMode, replay.currentBarIndex]);

  const totalEquity = useMemo(() => {
    const holdingsVal = portfolio.holdings.reduce((acc, h) => {
      const price = h.symbol === selectedSymbol ? currentPrice : h.avgPrice;
      return acc + (h.quantity * price);
    }, 0);
    return portfolio.cash + holdingsVal;
  }, [portfolio, currentPrice, selectedSymbol]);

  // Mode-specific trades for the sidebar log
  const filteredTrades = useMemo(() => {
    return portfolio.trades.filter(t => t.mode === marketMode);
  }, [portfolio.trades, marketMode]);

  const stats = useMemo(() => {
    const sellTrades = portfolio.trades.filter(t => t.side === 'SELL');
    let wins = 0;
    sellTrades.forEach(st => wins++);
    const roi = ((totalEquity - INITIAL_CASH) / INITIAL_CASH) * 100;
    return {
      roi,
      winRate: sellTrades.length > 0 ? (wins / sellTrades.length) * 100 : 0,
      totalTrades: portfolio.trades.length,
      profit: totalEquity - INITIAL_CASH
    };
  }, [portfolio, totalEquity]);

  const executeTrade = async (type: 'BUY' | 'SELL', qty: number, overrideSymbol?: string, overridePrice?: number) => {
    if (qty <= 0) return;
    const symbol = overrideSymbol || selectedSymbol;
    const price = overridePrice || (symbol === selectedSymbol ? currentPrice : (watchlistQuotes[symbol]?.price || 0));

    if (price <= 0) {
      alert("Market price not available for " + symbol);
      return;
    }

    const cost = qty * price;

    setPortfolio(prev => {
      const newHoldings = [...prev.holdings];
      const hIdx = newHoldings.findIndex(h => h.symbol === symbol);

      if (type === 'BUY') {
        if (prev.cash < cost) {
          alert("Insufficient capital for this trade.");
          return prev;
        }
        if (hIdx > -1) {
          const h = newHoldings[hIdx];
          newHoldings[hIdx] = { ...h, quantity: h.quantity + qty, avgPrice: (h.avgPrice * h.quantity + cost) / (h.quantity + qty) };
        } else {
          newHoldings.push({ symbol, quantity: qty, avgPrice: price });
        }
        return {
          ...prev,
          cash: prev.cash - cost,
          holdings: newHoldings,
          trades: [{ id: Math.random().toString(), symbol, side: 'BUY', price, quantity: qty, timestamp: Date.now(), mode: marketMode, totalValue: cost }, ...prev.trades]
        };
      } else {
        if (hIdx === -1 || newHoldings[hIdx].quantity < qty) {
          alert("Insufficient holdings to sell.");
          return prev;
        }
        newHoldings[hIdx].quantity -= qty;
        const updatedHoldings = newHoldings[hIdx].quantity <= 0 ? newHoldings.filter((_, i) => i !== hIdx) : newHoldings;
        return {
          ...prev,
          cash: prev.cash + cost,
          holdings: updatedHoldings,
          trades: [{ id: Math.random().toString(), symbol, side: 'SELL', price, quantity: qty, timestamp: Date.now(), mode: marketMode, totalValue: cost }, ...prev.trades]
        };
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 overflow-hidden">
      <nav className="h-16 border-b border-white/5 glass flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg">TP</div>
            <span className="font-extrabold tracking-tighter text-lg hidden sm:inline">TradePulse <span className="text-indigo-400">PRO</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl">
            {['dashboard', 'market', 'portfolio', 'analytics'].map(t => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Available Liquidity</span>
            <span className={`text-sm font-black mono ${marketMode === MarketMode.LIVE ? 'text-emerald-400' : 'text-indigo-400'}`}>₹{portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-xs">TR</div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-white/5 bg-slate-900/10 flex flex-col shrink-0 p-6">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Stock Explorer</h2>
          <div className="relative mb-6">
            <input type="text" placeholder="Search Symbols..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white focus:border-indigo-500 outline-none transition-all pl-11" />
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
                  <button key={stock.symbol} onClick={() => { setSelectedSymbol(stock.symbol); setActiveTab('dashboard'); }} className={`w-full p-4 rounded-3xl flex items-center justify-between transition-all mb-2 ${selectedSymbol === stock.symbol ? (marketMode === MarketMode.LIVE ? 'bg-emerald-600 shadow-xl text-white' : 'bg-indigo-600 shadow-xl text-white') : 'bg-white/5 border border-white/5'}`}>
                    <p className="font-black text-xs uppercase">{stock.symbol}</p>
                    <p className={`text-[9px] font-bold ${selectedSymbol === stock.symbol ? 'text-indigo-100' : 'text-slate-500'}`}>{stock.symbol.includes('.NS') ? 'NSE' : 'GLOB'}</p>
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>

        <div className="flex-1 overflow-y-auto bg-[#020617]">
          {activeTab === 'dashboard' && (
            <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <StatCard title="Account Value" value={`₹${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} change={`${stats.roi.toFixed(2)}% ROI`} positive={stats.roi >= 0} />
                <StatCard title="Market Mode" value={marketMode} change={liveQuote?.exchange || "..."} />
                <StatCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} change="Session Stats" />
                <StatCard title="Orders Exec." value={stats.totalTrades} change="Cumulative" />
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
                    <TradingViewChart data={currentOHLC} fullData={allOHLC} isReplayMode={marketMode === MarketMode.REPLAY} isSelectingStart={isSelectingStart} onBarSelect={(idx) => { setReplay(p => ({ ...p, currentBarIndex: idx, isPlaying: false })); setIsSelectingStart(false); }} />
                  </div>

                  <div className="mt-8 flex items-end justify-between">
                    {marketMode === MarketMode.REPLAY ? (
                      <div className="flex items-center gap-4">
                        <button onClick={() => setIsSelectingStart(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-all ${isSelectingStart ? 'animate-pulse bg-indigo-600 text-white' : ''}`}>Set Replay Start</button>
                        <button onClick={() => setReplay(p => ({ ...p, isPlaying: !p.isPlaying }))} className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-xl">{replay.isPlaying ? <Icons.Pause /> : <Icons.Play />}</button>
                        <div className="flex gap-1.5">
                          {[1, 5, 20].map(s => <button key={s} onClick={() => setReplay(p => ({ ...p, speed: s }))} className={`px-3 py-2 rounded-lg text-[9px] font-black ${replay.speed === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{s}X</button>)}
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

                {/* MODE SEPARATED TERMINAL */}
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
                      <button onClick={() => executeTrade('BUY', parseInt((document.getElementById('q-inp') as any).value))} className={`py-6 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xl ${marketMode === MarketMode.LIVE ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-emerald-600 shadow-emerald-900/20'}`}>BUY</button>
                      <button onClick={() => executeTrade('SELL', parseInt((document.getElementById('q-inp') as any).value))} className={`py-6 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xl ${marketMode === MarketMode.LIVE ? 'bg-rose-600 shadow-rose-900/20' : 'bg-rose-600 shadow-rose-900/20'}`}>SELL</button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        {marketMode} History
                      </h4>
                      <span className="text-[8px] font-bold text-slate-500">{filteredTrades.length} Trades</span>
                    </div>

                    {filteredTrades.slice(0, 10).map(t => (
                      <div key={t.id} className={`p-3 rounded-xl border flex justify-between items-center group transition-all ${marketMode === MarketMode.LIVE ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30'}`}>
                        <div>
                          <p className="font-black text-[10px] text-white uppercase">{t.symbol}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black ${t.side === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.side} {t.quantity} U</span>
                            <span className="text-[7px] text-slate-600 font-bold">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <p className="font-black mono text-[11px] text-slate-400 group-hover:text-white transition-colors">{currencySymbol}{t.price.toFixed(1)}</p>
                      </div>
                    ))}
                    {filteredTrades.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <Icons.Chart />
                        <p className="text-[9px] font-black uppercase tracking-widest mt-2">No {marketMode} Trades</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'market' && (
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
                          <span className="text-sm text-slate-500 mr-2">{quote?.currency === 'USD' ? '$' : '₹'}</span>
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
          )}

          {activeTab === 'portfolio' && (
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
                      return (
                        <tr key={h.symbol} className="hover:bg-white/[0.02] transition-all group">
                          <td className="px-10 py-10">
                            <p className="font-black text-white uppercase tracking-wider">{h.symbol}</p>
                            <p className="text-[8px] text-slate-600 font-black uppercase mt-1">{quote?.exchange || 'MARKET'}</p>
                          </td>
                          <td className="px-10 py-10 text-right font-black mono text-slate-300">{h.quantity}</td>
                          <td className="px-10 py-10 text-right mono text-slate-500">₹{h.avgPrice.toFixed(2)}</td>
                          <td className="px-10 py-10 text-right mono font-black text-white">₹{curPrice.toFixed(2)}</td>
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
          )}

          {activeTab === 'analytics' && (
            <div className="p-12 max-w-7xl mx-auto space-y-12 animate-fade-in">
              <h1 className="text-5xl font-black text-white tracking-tight">Account Performance</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass p-10 rounded-[2.5rem] border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Realized P/L</p>
                  <p className={`text-4xl font-black mono ${stats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stats.profit >= 0 ? '+' : ''}₹{stats.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="glass p-10 rounded-[2.5rem] border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Strategy Win Rate</p>
                  <p className="text-4xl font-black text-white">{stats.winRate.toFixed(1)}%</p>
                </div>
                <div className="glass p-10 rounded-[2.5rem] border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Executed Orders</p>
                  <p className="text-4xl font-black text-white">{stats.totalTrades}</p>
                </div>
              </div>

              <div className="glass p-12 rounded-[3.5rem] border-white/5">
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Historical Replay Session Report</h3>
                  <button
                    onClick={() => {
                      const headers = ['Symbol', 'Side', 'Price', 'Quantity', 'Total Value', 'Mode', 'Timestamp'];
                      const rows = portfolio.trades.map(t => [
                        t.symbol, t.side, t.price, t.quantity, t.totalValue, t.mode, new Date(t.timestamp).toLocaleString()
                      ]);
                      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.setAttribute('hidden', '');
                      a.setAttribute('href', url);
                      a.setAttribute('download', `trades_${Date.now()}.csv`);
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:underline"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-bold uppercase">Simulation Starting Balance</span>
                    <span className="text-white font-black mono">₹{INITIAL_CASH.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-bold uppercase">Simulation Net Yield</span>
                    <span className={`font-black mono ${stats.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{stats.roi.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-bold uppercase">Exposure to Market Risk</span>
                    <span className="text-indigo-400 font-black mono">{((totalEquity - portfolio.cash) / totalEquity * 100).toFixed(1)}% Allocated</span>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-4">Pro Strategy Tips</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Risk Management</p>
                        <p className="text-[9px] text-slate-400 leading-relaxed">Always set a Stop Loss before executing a trade to protect your capital from unexpected volatility.</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Trend Analysis</p>
                        <p className="text-[9px] text-slate-400 leading-relaxed">Wait for a clear trend confirmation on the Replay chart before scaling into a large position.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

const StatCard = ({ title, value, change, positive }: any) => (
  <div className="glass p-8 rounded-[2rem] border-white/5 shadow-xl">
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{title}</p>
    <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    {change && (
      <div className={`mt-3 inline-block px-3 py-1.5 rounded-lg bg-white/[0.03] text-[8px] font-black uppercase tracking-widest border border-white/5 ${positive === undefined ? 'text-slate-500' : positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {change}
      </div>
    )}
  </div>
);

export default App;
