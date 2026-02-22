
import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { CandleData } from '../types';

const PracticeSelector: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { startPractice } = useTrading();
  const [symbol, setSymbol] = useState('AAPL');
  const [date, setDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Fallback generator for Demo Mode
  const generateMockReplayData = (symbol: string, dateStr: string): CandleData[] => {
    const data: CandleData[] = [];
    const basePrice = Math.random() * 200 + 50;
    let current = basePrice;
    
    // Generate ~390 minutes (one market day)
    const startDate = new Date(dateStr);
    startDate.setHours(9, 30, 0, 0);

    for (let i = 0; i < 390; i++) {
      const open = current;
      const change = (Math.random() - 0.5) * (current * 0.005);
      const close = current + change;
      const high = Math.max(open, close) + Math.random() * (current * 0.002);
      const low = Math.min(open, close) - Math.random() * (current * 0.002);
      
      const time = new Date(startDate.getTime() + i * 60000);
      
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 500000) + 100000,
        timestamp: time.getTime()
      });
      current = close;
    }
    return data;
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/replay-data?symbol=${symbol}&date=${date}`);
      if (!response.ok) throw new Error("Offline");
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        startPractice(symbol, date, data);
        onClose();
      } else {
        throw new Error("No data found");
      }
    } catch (e) {
      console.warn("Using simulated replay data due to connectivity issue");
      const mockData = generateMockReplayData(symbol, date);
      startPractice(symbol, date, mockData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
      <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">Market Replay</h2>
      <p className="text-slate-500 text-sm mb-6 uppercase font-bold text-[10px] tracking-widest">Strategy Backtesting Lab</p>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Ticker Symbol</label>
          <input 
            type="text" 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none uppercase font-bold"
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
          />
        </div>
        
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Start Date</label>
          <input 
            type="date" 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none font-mono"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all text-xs"
          >
            Cancel
          </button>
          <button 
            disabled={loading}
            onClick={handleStart}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all text-xs uppercase"
          >
            {loading ? 'Initializing...' : 'Start Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSelector;
