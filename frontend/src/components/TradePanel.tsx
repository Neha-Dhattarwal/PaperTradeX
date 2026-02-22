
import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { OrderType, MarketMode } from '../types';

const TradePanel: React.FC<{ currentPrice: number }> = ({ currentPrice }) => {
  const { currentSymbol, executeTrade, mode } = useTrading();
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [takeProfit, setTakeProfit] = useState<number | ''>('');

  useEffect(() => {
    if (orderType === 'MARKET') setLimitPrice(currentPrice);
  }, [currentPrice, orderType]);

  const priceToUse = orderType === 'MARKET' ? currentPrice : limitPrice;

  const handleExecute = (type: OrderType) => {
    executeTrade(
      currentSymbol, 
      type, 
      priceToUse, 
      qty, 
      stopLoss === '' ? undefined : stopLoss, 
      takeProfit === '' ? undefined : takeProfit
    );
    // Reset secondary fields
    setStopLoss('');
    setTakeProfit('');
  };

  return (
    <div className="h-full bg-slate-900 border-l border-slate-800 flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Order Ticket</h3>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${mode === MarketMode.LIVE ? 'bg-green-900 text-green-300' : 'bg-amber-900 text-amber-300'}`}>
          {mode}
        </span>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <div className="flex justify-between items-end">
             <div>
               <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">Ticker</label>
               <div className="text-2xl font-black text-white leading-none">{currentSymbol}</div>
             </div>
             <div className="text-right">
                <div className="text-sm font-bold text-slate-300">₹{currentPrice.toFixed(2)}</div>
                <div className="text-[10px] text-green-500 font-bold">+0.45%</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg">
          <button 
            onClick={() => setOrderType('MARKET')}
            className={`py-1.5 rounded-md text-[10px] font-bold transition-all ${orderType === 'MARKET' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
          >
            Market
          </button>
          <button 
            onClick={() => setOrderType('LIMIT')}
            className={`py-1.5 rounded-md text-[10px] font-bold transition-all ${orderType === 'LIMIT' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
          >
            Limit
          </button>
        </div>

        <div className="space-y-3">
          {orderType === 'LIMIT' && (
            <div>
              <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">Limit Price</label>
              <input 
                type="number" 
                value={limitPrice} 
                onChange={(e) => setLimitPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white font-mono text-sm focus:border-blue-500 outline-none"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">Quantity</label>
              <input 
                type="number" 
                min="1" 
                value={qty} 
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-white font-mono text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col justify-end">
               <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Value</div>
               <div className="text-sm font-mono text-slate-200">₹{(qty * priceToUse).toLocaleString()}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-[9px] text-slate-500 font-bold mb-1 block uppercase">Stop Loss</label>
                   <input 
                    type="number" 
                    placeholder="None"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-3 text-white font-mono text-xs focus:border-red-500 outline-none"
                   />
                </div>
                <div>
                   <label className="text-[9px] text-slate-500 font-bold mb-1 block uppercase">Take Profit</label>
                   <input 
                    type="number" 
                    placeholder="None"
                    value={takeProfit}
                    onChange={e => setTakeProfit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-3 text-white font-mono text-xs focus:border-green-500 outline-none"
                   />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button 
          onClick={() => handleExecute(OrderType.BUY)}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/10 active:scale-95 transition-all text-xs"
        >
          BUY / LONG
        </button>
        <button 
          onClick={() => handleExecute(OrderType.SELL)}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/10 active:scale-95 transition-all text-xs"
        >
          SELL / SHORT
        </button>
      </div>
    </div>
  );
};

export default TradePanel;
