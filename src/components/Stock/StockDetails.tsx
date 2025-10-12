import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Star, StarOff, Clock, Zap } from 'lucide-react';
import { useNavigate } from '../Dashboard/useNavigate';
import { StockChart } from './StockChart';
import { RealTimeChart } from './RealTimeChart';
import { TradeModal } from './TradeModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useMarketMode } from '../../lib/marketMode';

type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
};

type Props = {
  symbol: string;
};

export const StockDetails = ({ symbol }: Props) => {
  const { navigateTo } = useNavigate();
  const { user } = useAuth();
  const { mode, setMode } = useMarketMode();
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    fetchQuote();
    checkWatchlist();
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, [symbol, mode]);

  const fetchQuote = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-quote-historical?symbol=${symbol}&mode=${mode}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setQuote(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('symbol', symbol)
      .maybeSingle();

    setIsInWatchlist(!!data);
  };

  const toggleWatchlist = async () => {
    if (!user) return;

    if (isInWatchlist) {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);
      setIsInWatchlist(false);
    } else {
      await supabase
        .from('watchlists')
        .insert({ user_id: user.id, symbol });
      setIsInWatchlist(true);
    }
  };

  const openTradeModal = (type: 'buy' | 'sell') => {
    setTradeType(type);
    setShowTradeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Stock not found</div>
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigateTo('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === 'live' ? 'previous' : 'live')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                mode === 'live'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {mode === 'live' ? (
                <><Zap className="w-4 h-4" />Live</>
              ) : (
                <><Clock className="w-4 h-4" />Previous</>
              )}
            </button>
            <button
              onClick={toggleWatchlist}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {isInWatchlist ? (
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800">{quote.symbol}</h1>
        <p className="text-gray-600 mb-4">{quote.name}</p>

        <div className="mb-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            ${quote.price.toFixed(2)}
          </h2>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <RealTimeChart symbol={symbol} />

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Price History</h3>
          <StockChart symbol={symbol} />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Open</p>
            <p className="text-lg font-bold text-gray-800">${quote.open.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Prev Close</p>
            <p className="text-lg font-bold text-gray-800">${quote.previousClose.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Day High</p>
            <p className="text-lg font-bold text-gray-800">${quote.dayHigh.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Day Low</p>
            <p className="text-lg font-bold text-gray-800">${quote.dayLow.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openTradeModal('buy')}
            className="py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg"
          >
            Buy
          </button>
          <button
            onClick={() => openTradeModal('sell')}
            className="py-4 bg-red-600 text-white rounded-xl font-semibold text-lg"
          >
            Sell
          </button>
        </div>
      </div>

      {showTradeModal && (
        <TradeModal
          symbol={symbol}
          currentPrice={quote.price}
          type={tradeType}
          onClose={() => setShowTradeModal(false)}
        />
      )}
    </div>
  );
};
