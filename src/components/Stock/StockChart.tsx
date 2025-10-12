import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabase';

type ChartData = {
  date: Date;
  price: number;
};

type Props = {
  symbol: string;
};

export const StockChart = ({ symbol }: Props) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [range, setRange] = useState('1d');
  const [loading, setLoading] = useState(true);

  const ranges = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'max' },
  ];

  useEffect(() => {
    fetchChartData();
  }, [symbol, range]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-chart?symbol=${symbol}&range=${range}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      setChartData(result.data || []);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
              range === r.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading chart...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No chart data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const d = new Date(date);
                if (range === '1d') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={[minPrice * 0.99, maxPrice * 1.01]}
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
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(date) => new Date(date).toLocaleString()}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              dot={false}
              fill="url(#colorPrice)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
