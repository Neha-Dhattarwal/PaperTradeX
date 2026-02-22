
import React from 'react';
import { useTrading } from '../context/TradingContext';

const Orders: React.FC = () => {
  const { state, mode } = useTrading();
  // Technically our engine auto-triggers SL/TP from positions, 
  // but if we had a separate pending orders table, it would go here.
  const activePositionsWithTriggers = state.positions.filter(p => p.mode === mode && (p.stopLoss || p.takeProfit));

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h2 className="text-2xl font-black text-white mb-6 tracking-tighter uppercase">Pending Triggers</h2>
      <div className="bg-[#0d111c] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#161b26] text-slate-500 uppercase font-black">
            <tr>
              <th className="p-5">Asset</th>
              <th className="p-5">Stop Loss</th>
              <th className="p-5">Take Profit</th>
              <th className="p-5">Current Avg</th>
              <th className="p-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {activePositionsWithTriggers.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest">No pending triggers</td></tr>
            ) : (
              activePositionsWithTriggers.map(pos => (
                <tr key={pos.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-5 font-black text-white">{pos.symbol}</td>
                  <td className="p-5 font-mono text-red-500">{pos.stopLoss ? `₹${pos.stopLoss}` : '--'}</td>
                  <td className="p-5 font-mono text-green-500">{pos.takeProfit ? `₹${pos.takeProfit}` : '--'}</td>
                  <td className="p-5 font-mono text-slate-400">₹{pos.avgPrice.toFixed(2)}</td>
                  <td className="p-5"><span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded font-black text-[9px] uppercase">Active</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
