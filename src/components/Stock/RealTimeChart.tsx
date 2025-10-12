import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabase';
import { Activity, Clock, BarChart3, Loader2 } from 'lucide-react';

type ChartMode = 'live' | 'historical' | 'compare';

type PriceData = {
  time: string;
  price: number;
  timestamp: number;
};

type Props = {
  symbol: string;
};

export const RealTimeChart = ({ symbol }: Props) => {
  const [mode, setMode] = useState<ChartMode>('live');
  const [liveData, setLiveData] = useState<PriceData[]>([]);
  const [yesterdayData, setYesterdayData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_LIVE_POINTS = 60;

  useEffect(() => {
    fetchYesterdayData();
    if (mode === 'live' || mode === 'compare') {
      startLivePolling();
    }
    return () => stopLivePolling();
  }, [symbol, mode]);

  const fetchYesterdayData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-chart?symbol=${symbol}&mode=yesterday`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.data) {
        const formattedData = result.data.map((item: any) => ({
          time: new Date(item.date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          price: item.price,
          timestamp: new Date(item.date).getTime(),
        }));
        setYesterdayData(formattedData);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching yesterday data:', err);
      setError('Failed to load historical data');
      setLoading(false);
    }
  };

  const fetchLivePrice = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-price?symbol=${symbol}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.price) {
        const newPoint: PriceData = {
          time: new Date(result.time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          price: result.price,
          timestamp: new Date(result.time).getTime(),
        };

        setLiveData((prev) => {
          const updated = [...prev, newPoint];
          return updated.slice(-MAX_LIVE_POINTS);
        });
      }
    } catch (err) {
      console.error('Error fetching live price:', err);
    }
  };

  const startLivePolling = () => {
    stopLivePolling();
    fetchLivePrice();
    intervalRef.current = setInterval(fetchLivePrice, 10000);
  };

  const stopLivePolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleModeChange = (newMode: ChartMode) => {
    setMode(newMode);
    if (newMode === 'historical') {
      stopLivePolling();
    }
  };

  const getChartData = () => {
    if (mode === 'live') {
      return liveData.map(d => ({ time: d.time, livePrice: d.price }));
    } else if (mode === 'historical') {
      return yesterdayData.map(d => ({ time: d.time, yesterdayPrice: d.price }));
    } else {
      const maxLength = Math.max(liveData.length, yesterdayData.length);
      const combined = [];
      for (let i = 0; i < maxLength; i++) {
        combined.push({
          time: liveData[i]?.time || yesterdayData[i]?.time || '',
          livePrice: liveData[i]?.price,
          yesterdayPrice: yesterdayData[i]?.price,
        });
      }
      return combined;
    }
  };

  const chartData = getChartData();
  const allPrices = chartData.flatMap(d => [d.livePrice, d.yesterdayPrice].filter(Boolean) as number[]);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 100;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => handleModeChange('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
            mode === 'live'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live
        </button>
        <button
          onClick={() => handleModeChange('historical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
            mode === 'historical'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Historical
        </button>
        <button
          onClick={() => handleModeChange('compare')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
            mode === 'compare'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Compare
        </button>
      </div>

      {mode === 'live' && liveData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Fetching live data...</p>
          </div>
        </div>
      ) : mode === 'historical' && yesterdayData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No historical data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => {
                const parts = value.split(':');
                return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value;
              }}
            />
            <YAxis
              domain={[minPrice * 0.995, maxPrice * 1.005]}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
            />
            {mode !== 'historical' && (
              <Legend />
            )}
            {(mode === 'live' || mode === 'compare') && (
              <Line
                type="monotone"
                dataKey="livePrice"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                name="Live Price"
                isAnimationActive={true}
                animationDuration={500}
              />
            )}
            {(mode === 'historical' || mode === 'compare') && (
              <Line
                type="monotone"
                dataKey="yesterdayPrice"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Yesterday"
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          {mode === 'live' && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              Live - Updates every 10s
            </span>
          )}
          {mode === 'historical' && (
            <span>Yesterday's Trading Session</span>
          )}
          {mode === 'compare' && (
            <span>Live vs Yesterday Comparison</span>
          )}
        </div>
        <div>
          {liveData.length > 0 && mode !== 'historical' && (
            <span>{liveData.length} / {MAX_LIVE_POINTS} points</span>
          )}
        </div>
      </div>
    </div>
  );
};
