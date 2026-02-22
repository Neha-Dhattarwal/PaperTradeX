
import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Line,
  Legend
} from 'recharts';
import { CandleData } from '../types';

interface StockChartProps {
  data: CandleData[];
  comparisonData?: CandleData[];
  symbol: string;
  isCompareMode?: boolean;
}

const StockChart: React.FC<StockChartProps> = ({ data, comparisonData, symbol, isCompareMode }) => {
  const { minPrice, maxPrice } = useMemo(() => {
    if (!data || data.length === 0) return { minPrice: 0, maxPrice: 100 };
    const lows = data.map(d => d.low);
    const highs = data.map(d => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const buffer = (max - min) * 0.1 || 1; // 10% buffer for breathing room
    return { minPrice: min - buffer, maxPrice: max + buffer };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-[10px] z-[100] backdrop-blur-md">
          <p className="font-black text-slate-400 mb-2 uppercase tracking-widest border-b border-slate-800 pb-1">{label}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono">
            <span className="text-slate-500 uppercase">Open:</span> <span className="text-white font-bold">{d.open?.toFixed(2)}</span>
            <span className="text-slate-500 uppercase">High:</span> <span className="text-green-400 font-bold">{d.high?.toFixed(2)}</span>
            <span className="text-slate-500 uppercase">Low:</span> <span className="text-red-400 font-bold">{d.low?.toFixed(2)}</span>
            <span className="text-slate-500 uppercase">Close:</span> <span className="text-white font-bold">{d.close?.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const processedData = useMemo(() => {
    return data.map((d, idx) => ({
      ...d,
      candleRange: [d.low, d.high],
      candleBody: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
      isUp: d.close >= d.open,
      comparePrice: comparisonData && comparisonData[idx] ? comparisonData[idx].close : null
    }));
  }, [data, comparisonData]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b0f19]">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Initializing Data Feed...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0b0f19] relative">
      <div className="absolute top-6 left-8 z-20 pointer-events-none select-none">
        <div className="flex items-center gap-4">
           <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
             {symbol}
             <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded uppercase">1m</span>
           </h2>
        </div>
        <div className="flex gap-5 mt-2">
          <span className="text-[11px] font-black text-green-400 uppercase drop-shadow-sm">O {data[data.length-1]?.open.toFixed(2)}</span>
          <span className="text-[11px] font-black text-red-400 uppercase drop-shadow-sm">L {data[data.length-1]?.low.toFixed(2)}</span>
          <span className="text-[11px] font-black text-white uppercase drop-shadow-sm">C {data[data.length-1]?.close.toFixed(2)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData} margin={{ top: 100, right: 60, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15}/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#161b26" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#1e293b" 
            fontSize={9} 
            tickMargin={12} 
            minTickGap={80}
            axisLine={false}
          />
          <YAxis 
            yAxisId="price"
            domain={[minPrice, maxPrice]} 
            orientation="right" 
            stroke="#1e293b" 
            fontSize={10}
            tickFormatter={(v) => v.toFixed(2)}
            axisLine={false}
            tickMargin={10}
          />
          <YAxis 
            yAxisId="volume"
            orientation="left"
            hide={true}
            domain={[0, (data: any) => Math.max(...processedData.map(d => d.volume)) * 5]}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3' }} 
            isAnimationActive={false}
          />
          <Bar yAxisId="volume" dataKey="volume" fill="url(#volGradient)" barSize={6} isAnimationActive={false} />
          <Bar yAxisId="price" dataKey="candleRange" fill="#475569" barSize={1} isAnimationActive={false}>
            {processedData.map((entry, index) => <Cell key={`wick-${index}`} fill={entry.isUp ? '#10b981' : '#f43f5e'} />)}
          </Bar>
          <Bar yAxisId="price" dataKey="candleBody" barSize={6} isAnimationActive={false}>
            {processedData.map((entry, index) => <Cell key={`body-${index}`} fill={entry.isUp ? '#10b981' : '#f43f5e'} />)}
          </Bar>
          <Line 
            yAxisId="price" 
            type="monotone" 
            dataKey="close" 
            stroke="#3b82f6" 
            strokeWidth={1.5} 
            dot={false} 
            isAnimationActive={false}
          />
          {isCompareMode && (
            <Line 
              yAxisId="price" 
              type="monotone" 
              dataKey="comparePrice" 
              stroke="#f97316" 
              strokeWidth={1.2} 
              dot={false} 
              strokeDasharray="5 5" 
              connectNulls 
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
