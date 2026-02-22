
import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Ind.' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
];

const Watchlist: React.FC = () => {
  const { currentSymbol, setCurrentSymbol } = useTrading();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchWatchlistPrices = async () => {
      const newPrices: Record<string, number> = {};
      let anyRealData = false;

      for (const stock of STOCKS) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${baseUrl}/api/market/quote?symbol=${stock.symbol}`);
          if (res.ok) {
            const data = await res.json();
            if (data.price) {
              newPrices[stock.symbol] = data.price;
              anyRealData = true;
            }
          }
        } catch (e) {
          // Swallow error to fallback
        }
      }

      if (!anyRealData) {
        setIsDemo(true);
        STOCKS.forEach(s => {
          const base = prices[s.symbol] || (Math.random() * 200 + 50);
          newPrices[s.symbol] = base + (Math.random() - 0.5);
        });
      } else {
        setIsDemo(false);
      }

      setPrices(newPrices);
    };

    fetchWatchlistPrices();
    const interval = setInterval(fetchWatchlistPrices, 10000);
    return () => clearInterval(interval);
  }, [prices]);

  return (
    <div className="w-full bg-slate-900 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Markets</h3>
        <span className={`text-[8px] font-black uppercase ${isDemo ? 'text-blue-500' : 'text-green-500'}`}>
          {isDemo ? 'Simulated' : 'Live'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {STOCKS.map(stock => (
          <button
            key={stock.symbol}
            onClick={() => setCurrentSymbol(stock.symbol)}
            className={`w-full flex items-center justify-between p-4 border-b border-slate-800 transition-all text-left ${currentSymbol === stock.symbol ? 'bg-blue-600/10 border-r-2 border-r-blue-500' : 'hover:bg-slate-800/30'}`}
          >
            <div>
              <div className="font-black text-slate-100 text-sm tracking-tighter">{stock.symbol}</div>
              <div className="text-[9px] text-slate-500 uppercase font-bold truncate max-w-[100px]">{stock.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black font-mono text-slate-300">
                {prices[stock.symbol] ? `₹${prices[stock.symbol].toFixed(2)}` : '...'}
              </div>
              <div className="text-[8px] text-green-500/80 font-black tracking-tighter uppercase mt-0.5">Active</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
