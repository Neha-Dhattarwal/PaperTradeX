
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MarketMode, Position, Trade, OrderType, UserState, ReplayState, CandleData } from '../types';

interface TradingContextType {
  mode: MarketMode;
  setMode: (mode: MarketMode) => void;
  state: UserState;
  executeTrade: (symbol: string, type: OrderType, price: number, qty: number, sl?: number, tp?: number) => void;
  currentSymbol: string;
  setCurrentSymbol: (symbol: string) => void;
  replay: ReplayState;
  setReplay: React.Dispatch<React.SetStateAction<ReplayState>>;
  startPractice: (symbol: string, date: string, data: CandleData[]) => void;
  checkTriggers: (price: number) => void;
  syncWithBackend: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const INITIAL_USER_STATE: UserState = {
  balance: 100000,
  practiceBalance: 100000,
  positions: [],
  history: [],
  pendingOrders: []
};

const INITIAL_REPLAY_STATE: ReplayState = {
  symbol: 'AAPL',
  date: new Date().toISOString().split('T')[0],
  currentIndex: 0,
  allCandles: [],
  isPlaying: false,
  speed: 1
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<MarketMode>(MarketMode.LIVE);
  const [currentSymbol, setCurrentSymbol] = useState('AAPL');
  const [replay, setReplay] = useState<ReplayState>(INITIAL_REPLAY_STATE);
  
  const [state, setState] = useState<UserState>(() => {
    const saved = localStorage.getItem('paperTradeX_v3_state');
    return saved ? JSON.parse(saved) : INITIAL_USER_STATE;
  });

  const syncWithBackend = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/user/state', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setState({
          balance: data.balance,
          practiceBalance: data.practiceBalance,
          positions: data.positions,
          history: data.history,
          pendingOrders: []
        });
      }
    } catch (e) {
      console.warn("Sync failed, using local cache");
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  useEffect(() => {
    localStorage.setItem('paperTradeX_v3_state', JSON.stringify(state));
  }, [state]);

  const startPractice = (symbol: string, date: string, data: CandleData[]) => {
    setReplay({
      symbol,
      date,
      allCandles: data,
      currentIndex: 0,
      isPlaying: true,
      speed: 1
    });
    setMode(MarketMode.PRACTICE);
    setCurrentSymbol(symbol);
  };

  const executeTrade = useCallback(async (symbol: string, type: OrderType, price: number, qty: number, sl?: number, tp?: number) => {
    const token = localStorage.getItem('token');
    
    // Optimistic Local Update
    const totalValue = price * qty;
    if (type === OrderType.BUY && (mode === MarketMode.LIVE ? state.balance : state.practiceBalance) < totalValue) {
      alert("Insufficient Balance!");
      return;
    }

    if (token) {
      try {
        const res = await fetch('http://localhost:5000/trade/execute', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ symbol, type, price, qty, sl, tp, mode })
        });
        if (res.ok) {
          await syncWithBackend();
          return;
        }
      } catch (e) {
        console.error("Backend trade failed:", e);
      }
    }

    // Fallback/Demo Logic (Local Only)
    setState(prev => {
      const isLive = mode === MarketMode.LIVE;
      const balanceField = isLive ? 'balance' : 'practiceBalance';
      const existingPosIndex = prev.positions.findIndex(p => p.symbol === symbol && p.mode === mode);
      let updatedPositions = [...prev.positions];
      let realizedPnL: number | undefined;

      if (type === OrderType.BUY) {
        if (existingPosIndex > -1) {
          const pos = updatedPositions[existingPosIndex];
          const newQty = pos.qty + qty;
          const newAvg = (pos.avgPrice * pos.qty + totalValue) / newQty;
          updatedPositions[existingPosIndex] = { ...pos, qty: newQty, avgPrice: newAvg, stopLoss: sl || pos.stopLoss, takeProfit: tp || pos.takeProfit };
        } else {
          updatedPositions.push({ id: Math.random().toString(36).substr(2, 9), symbol, qty, avgPrice: price, mode, stopLoss: sl, takeProfit: tp });
        }
      } else {
        if (existingPosIndex === -1 || updatedPositions[existingPosIndex].qty < qty) {
          alert("Insufficient shares!");
          return prev;
        }
        const pos = updatedPositions[existingPosIndex];
        realizedPnL = (price - pos.avgPrice) * qty;
        pos.qty -= qty;
        if (pos.qty === 0) updatedPositions.splice(existingPosIndex, 1);
      }

      const newTrade: Trade = {
        id: Math.random().toString(36).substr(2, 9),
        symbol, type, price, qty, timestamp: Date.now(), mode, pnl: realizedPnL
      };

      return {
        ...prev,
        [balanceField]: isLive ? 
          (type === OrderType.BUY ? prev.balance - totalValue : prev.balance + totalValue) : 
          (type === OrderType.BUY ? prev.practiceBalance - totalValue : prev.practiceBalance + totalValue),
        positions: updatedPositions,
        history: [newTrade, ...prev.history]
      };
    });
  }, [mode, state, syncWithBackend]);

  const checkTriggers = useCallback((price: number) => {
    state.positions.forEach(pos => {
      if (pos.mode !== mode || pos.symbol !== currentSymbol) return;
      const isLong = pos.qty > 0;
      const hitSL = pos.stopLoss && (isLong ? price <= pos.stopLoss : price >= pos.stopLoss);
      const hitTP = pos.takeProfit && (isLong ? price >= pos.takeProfit : price <= pos.takeProfit);

      if (hitSL || hitTP) {
        executeTrade(pos.symbol, OrderType.SELL, price, pos.qty);
      }
    });
  }, [mode, currentSymbol, state.positions, executeTrade]);

  return (
    <TradingContext.Provider value={{ 
      mode, setMode, state, executeTrade, currentSymbol, setCurrentSymbol, 
      replay, setReplay, startPractice, checkTriggers, syncWithBackend
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within TradingProvider');
  return context;
};
