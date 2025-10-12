import { useState, useEffect } from 'react';
import { supabase, Trade, PendingOrder } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import { useMarketMode } from '../../lib/marketMode';

export const Portfolio = () => {
  const { user } = useAuth();
  const { mode, setMode } = useMarketMode();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [simulationTrades, setSimulationTrades] = useState<Trade[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'trades' | 'orders'>('trades');

  useEffect(() => {
    if (mode === 'live') {
      fetchTrades();
      fetchPendingOrders();
    } else {
      fetchSimulationTrades();
    }
  }, [mode]);

  const fetchTrades = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching trades:', error);
      return;
    }

    setTrades(data || []);
  };

  const fetchSimulationTrades = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('simulation_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching simulation trades:', error);
      return;
    }

    setSimulationTrades(data || []);
  };

  const fetchPendingOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    setPendingOrders(data || []);
  };

  const cancelOrder = async (orderId: string) => {
    await supabase
      .from('pending_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    fetchPendingOrders();
  };

  const currentTrades = mode === 'live' ? trades : simulationTrades;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className={`text-white p-6 rounded-b-3xl shadow-lg ${
        mode === 'live'
          ? 'bg-gradient-to-br from-blue-600 to-blue-800'
          : 'bg-gradient-to-br from-orange-600 to-orange-800'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className={`text-sm ${mode === 'live' ? 'text-blue-100' : 'text-orange-100'}`}>
              {mode === 'live' ? 'Live Trading' : 'Practice Mode'}
            </p>
          </div>
          <button
            onClick={() => setMode(mode === 'live' ? 'previous' : 'live')}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-semibold text-sm"
          >
            {mode === 'live' ? (
              <><Zap className="w-4 h-4" />Live</>
            ) : (
              <><Clock className="w-4 h-4" />Previous</>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              activeTab === 'trades'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            Trades
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            Orders
          </button>
        </div>

        {activeTab === 'trades' ? (
          <div className="space-y-3">
            {currentTrades.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-500">No trades yet</p>
              </div>
            ) : (
              currentTrades.map((trade) => (
                <div key={trade.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{trade.symbol}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      trade.side === 'buy'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {trade.side.toUpperCase()}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-semibold">{trade.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold">${Number(trade.price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold">${Number(trade.total_value).toFixed(2)}</p>
                    </div>
                  </div>
                  {trade.pnl !== 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {trade.pnl > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          trade.pnl > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.pnl > 0 ? '+' : ''}${Number(trade.pnl).toFixed(2)} P/L
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-500">No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{order.symbol}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === 'open'
                        ? 'bg-yellow-100 text-yellow-700'
                        : order.status === 'filled'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Entry Price</span>
                      <span className="font-semibold">${Number(order.entry_price).toFixed(2)}</span>
                    </div>
                    {order.stop_loss && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stop Loss</span>
                        <span className="font-semibold text-red-600">${Number(order.stop_loss).toFixed(2)}</span>
                      </div>
                    )}
                    {order.take_profit && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Take Profit</span>
                        <span className="font-semibold text-green-600">${Number(order.take_profit).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {order.status === 'open' && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="w-full mt-3 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
