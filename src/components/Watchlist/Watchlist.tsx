import { useState, useEffect } from 'react';
import { supabase, Watchlist as WatchlistType } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Star, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { useNavigate } from '../Dashboard/useNavigate';

type StockWithPrice = WatchlistType & {
  price?: number;
  change?: number;
  changePercent?: number;
};

export const Watchlist = () => {
  const { user } = useAuth();
  const { navigateTo } = useNavigate();
  const [watchlist, setWatchlist] = useState<StockWithPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(updatePrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchWatchlist = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return;
    }

    setWatchlist(data || []);
    setLoading(false);

    if (data && data.length > 0) {
      updatePrices();
    }
  };

  const updatePrices = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    const updatedWatchlist = await Promise.all(
      watchlist.map(async (item) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-quote?symbol=${item.symbol}`,
            {
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const data = await response.json();
          return {
            ...item,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
          };
        } catch (error) {
          return item;
        }
      })
    );

    setWatchlist(updatedWatchlist);
  };

  const removeFromWatchlist = async (id: string) => {
    await supabase
      .from('watchlists')
      .delete()
      .eq('id', id);

    setWatchlist(watchlist.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          <h1 className="text-2xl font-bold">Watchlist</h1>
        </div>
        <p className="text-blue-100 text-sm">Your favorite stocks</p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Your watchlist is empty</p>
            <p className="text-sm text-gray-400">Add stocks to track them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlist.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateTo('stock', item.symbol)}
                    className="flex-1 text-left"
                  >
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                      {item.symbol}
                    </h3>
                    {item.price && (
                      <div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">
                          ${item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2">
                          {item.change && item.change >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-semibold ${
                            item.change && item.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.change && item.change >= 0 ? '+' : ''}{item.change?.toFixed(2)} ({item.changePercent?.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => removeFromWatchlist(item.id)}
                    className="p-3 hover:bg-red-50 rounded-full transition"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
