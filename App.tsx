
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MarketMode, Portfolio, OHLC, ReplaySession } from './types';
import { WATCHLIST, INITIAL_CASH } from './constants';
import { api } from './services/api';

// Modular Component Imports
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MarketView } from './components/MarketView';
import { PortfolioView } from './components/PortfolioView';
import { AnalyticsView } from './components/AnalyticsView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'market' | 'portfolio' | 'analytics'>('dashboard');
  const [marketMode, setMarketMode] = useState<MarketMode>(MarketMode.LIVE);
  const [selectedSymbol, setSelectedSymbol] = useState(WATCHLIST[0].symbol);
  
  const [allOHLC, setAllOHLC] = useState<OHLC[]>([]);
  const [liveQuote, setLiveQuote] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, any>>({});
  const [isSelectingStart, setIsSelectingStart] = useState(false);

  // Moved replay state declaration up to fix block-scoped variable usage errors
  const [replay, setReplay] = useState<ReplaySession>({
    id: 'session_' + Date.now(),
    symbol: WATCHLIST[0].symbol,
    currentBarIndex: 0,
    isPlaying: false,
    speed: 1,
  });

  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    const saved = localStorage.getItem('tp_portfolio_v11');
    return saved ? JSON.parse(saved) : {
      cash: INITIAL_CASH,
      holdings: [],
      trades: [],
      initialBalance: INITIAL_CASH
    };
  });

  useEffect(() => {
    localStorage.setItem('tp_portfolio_v11', JSON.stringify(portfolio));
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
        } catch (e) {}
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
        } catch (e) {}
      }
    }, 15000); 
    return () => clearInterval(interval);
  }, [selectedSymbol, marketMode]);

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
    if (liveQuote?.currency === 'USD') return '$';
    if (liveQuote?.currency === 'INR') return '₹';
    // Logic for other currencies or defaults
    if (selectedSymbol.includes('.NS') || selectedSymbol.includes('.BO')) return '₹';
    return liveQuote?.currency || '$';
  }, [liveQuote, selectedSymbol]);

  const currentPrice = useMemo(() => {
    if (marketMode === MarketMode.LIVE) return liveQuote?.price || (allOHLC.length > 0 ? allOHLC[allOHLC.length - 1].close : 0);
    if (allOHLC.length === 0) return 0;
    return allOHLC[replay.currentBarIndex]?.close || 0;
  }, [allOHLC, marketMode, replay.currentBarIndex, liveQuote]);

  const totalEquity = useMemo(() => {
    const holdingsVal = portfolio.holdings.reduce((acc, h) => {
      // In a real app, you'd convert USD holdings to INR for total equity if the base is INR.
      // For this simulator, we treat the values as "units" relative to the initial 1M cash.
      const price = h.symbol === selectedSymbol ? currentPrice : h.avgPrice; 
      return acc + (h.quantity * price);
    }, 0);
    return portfolio.cash + holdingsVal;
  }, [portfolio, currentPrice, selectedSymbol]);

  const executeTrade = async (type: 'BUY' | 'SELL', qty: number, overrideSymbol?: string, overridePrice?: number) => {
    if (qty <= 0) return;
    const symbol = overrideSymbol || selectedSymbol;
    const price = overridePrice || (symbol === selectedSymbol ? currentPrice : (watchlistQuotes[symbol]?.price || 0));
    const currency = symbol === selectedSymbol ? liveQuote?.currency : (watchlistQuotes[symbol]?.currency || (symbol.includes('.NS') ? 'INR' : 'USD'));
    
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
          newHoldings.push({ symbol, quantity: qty, avgPrice: price, currency });
        }
        return { 
          ...prev, 
          cash: prev.cash - cost, 
          holdings: newHoldings, 
          trades: [{ id: Math.random().toString(), symbol, side: 'BUY', price, quantity: qty, timestamp: Date.now(), mode: marketMode, totalValue: cost, currency }, ...prev.trades] 
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
          trades: [{ id: Math.random().toString(), symbol, side: 'SELL', price, quantity: qty, timestamp: Date.now(), mode: marketMode, totalValue: cost, currency }, ...prev.trades] 
        };
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 overflow-hidden">
      {/* Navbar */}
      <nav className="h-16 border-b border-white/5 glass flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg">PT</div>
            <span className="font-extrabold tracking-tighter text-lg hidden sm:inline">Paper<span className="text-indigo-400">TradeX</span></span>
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
            <span className="text-sm font-black mono text-indigo-400">₹{portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-xs">TR</div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        <Sidebar 
          selectedSymbol={selectedSymbol} 
          setSelectedSymbol={setSelectedSymbol} 
          setActiveTab={setActiveTab} 
          marketMode={marketMode} 
        />

        <div className="flex-1 overflow-y-auto bg-[#020617]">
          {activeTab === 'dashboard' && (
            <Dashboard 
              selectedSymbol={selectedSymbol}
              marketMode={marketMode}
              setMarketMode={setMarketMode}
              liveQuote={liveQuote}
              allOHLC={allOHLC}
              replay={replay}
              setReplay={setReplay}
              isSelectingStart={isSelectingStart}
              setIsSelectingStart={setIsSelectingStart}
              currentPrice={currentPrice}
              currencySymbol={currencySymbol}
              portfolio={portfolio}
              executeTrade={executeTrade}
              totalEquity={totalEquity}
            />
          )}

          {activeTab === 'market' && (
            <MarketView watchlistQuotes={watchlistQuotes} setSelectedSymbol={setSelectedSymbol} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioView portfolio={portfolio} totalEquity={totalEquity} watchlistQuotes={watchlistQuotes} executeTrade={executeTrade} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView portfolio={portfolio} totalEquity={totalEquity} />
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

export default App;
