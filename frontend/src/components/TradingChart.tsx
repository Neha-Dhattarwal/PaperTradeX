
import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line } from 'recharts';
import { OHLC } from '../types';

interface TradingChartProps {
  data: OHLC[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-white font-bold">O: {data.open.toFixed(2)}</p>
        <p className="text-white font-bold">H: {data.high.toFixed(2)}</p>
        <p className="text-white font-bold">L: {data.low.toFixed(2)}</p>
        <p className="text-white font-bold">C: {data.close.toFixed(2)}</p>
        <p className="text-slate-400 mt-1">Vol: {data.volume.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export const TradingChart: React.FC<TradingChartProps> = ({ data }) => {
  // Prep data for Recharts to simulate candlesticks
  const chartData = data.map(d => ({
    ...d,
    candle: [d.open, d.close],
    wick: [d.low, d.high],
    color: d.close >= d.open ? '#22c55e' : '#ef4444'
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="time" 
            hide={true} 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Using Bar for the Candle Body */}
          <Bar dataKey="candle" fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
          {/* Using Line for close price trend */}
          <Line type="monotone" dataKey="close" stroke="#6366f1" dot={false} strokeWidth={1.5} opacity={0.6} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
