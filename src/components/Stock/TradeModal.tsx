import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useMarketMode } from '../../lib/marketMode';

type Props = {
  symbol: string;
  currentPrice: number;
  type: 'buy' | 'sell';
  onClose: () => void;
};

export const TradeModal = ({ symbol, currentPrice, type, onClose }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const { mode, simulationBalance, setSimulationBalance } = useMarketMode();
  const [quantity, setQuantity] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalValue = parseFloat(quantity || '0') * currentPrice;
  const currentBalance = mode === 'live' ? (profile?.balance || 0) : simulationBalance;
  const canAfford = totalValue <= currentBalance;

  const handleTrade = async () => {
    if (!user || !profile) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Invalid quantity');
      return;
    }

    if (type === 'buy' && totalValue > currentBalance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'buy') {
        const newBalance = currentBalance - totalValue;

        if (mode === 'live') {
          await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', user.id);
        } else {
          setSimulationBalance(newBalance);
        }

        const holdingsTable = mode === 'live' ? 'holdings' : 'simulation_holdings';
        const { data: existingHolding } = await supabase
          .from(holdingsTable)
          .select('*')
          .eq('user_id', user.id)
          .eq('symbol', symbol)
          .maybeSingle();

        if (existingHolding) {
          const newQty = Number(existingHolding.quantity) + qty;
          const newAvgPrice = ((Number(existingHolding.avg_price) * Number(existingHolding.quantity)) + totalValue) / newQty;

          await supabase
            .from(holdingsTable)
            .update({
              quantity: newQty,
              avg_price: newAvgPrice,
              current_value: newQty * currentPrice,
            })
            .eq('id', existingHolding.id);
        } else {
          await supabase
            .from(holdingsTable)
            .insert({
              user_id: user.id,
              symbol,
              quantity: qty,
              avg_price: currentPrice,
              current_value: totalValue,
            });
        }

        const tradesTable = mode === 'live' ? 'trades' : 'simulation_trades';
        await supabase
          .from(tradesTable)
          .insert({
            user_id: user.id,
            symbol,
            side: 'buy',
            quantity: qty,
            price: currentPrice,
            total_value: totalValue,
            pnl: 0,
          });

        if (stopLoss || takeProfit) {
          await supabase
            .from('pending_orders')
            .insert({
              user_id: user.id,
              symbol,
              side: 'sell',
              quantity: qty,
              stop_loss: stopLoss ? parseFloat(stopLoss) : null,
              take_profit: takeProfit ? parseFloat(takeProfit) : null,
              status: 'open',
              entry_price: currentPrice,
            });
        }
      } else {
        const holdingsTable = mode === 'live' ? 'holdings' : 'simulation_holdings';
        const { data: holding } = await supabase
          .from(holdingsTable)
          .select('*')
          .eq('user_id', user.id)
          .eq('symbol', symbol)
          .maybeSingle();

        if (!holding || Number(holding.quantity) < qty) {
          setError('Insufficient shares');
          setLoading(false);
          return;
        }

        const pnl = (currentPrice - Number(holding.avg_price)) * qty;
        const newBalance = currentBalance + totalValue;

        if (mode === 'live') {
          await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', user.id);
        } else {
          setSimulationBalance(newBalance);
        }

        const newQty = Number(holding.quantity) - qty;
        if (newQty === 0) {
          await supabase
            .from(holdingsTable)
            .delete()
            .eq('id', holding.id);
        } else {
          await supabase
            .from(holdingsTable)
            .update({
              quantity: newQty,
              current_value: newQty * currentPrice,
            })
            .eq('id', holding.id);
        }

        const tradesTable = mode === 'live' ? 'trades' : 'simulation_trades';
        await supabase
          .from(tradesTable)
          .insert({
            user_id: user.id,
            symbol,
            side: 'sell',
            quantity: qty,
            price: currentPrice,
            total_value: totalValue,
            pnl,
          });
      }

      if (mode === 'live') {
        await refreshProfile();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {type === 'buy' ? 'Buy' : 'Sell'} {symbol}
            </h2>
            {mode === 'previous' && (
              <p className="text-sm text-orange-600 font-semibold">Practice Mode</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Current Price</p>
          <p className="text-2xl font-bold">${currentPrice.toFixed(2)}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Number of shares"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {type === 'buy' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss (Optional)
                </label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Sell if price drops to"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Take Profit (Optional)
                </label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="Sell if price rises to"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </>
          )}

          <div className={`rounded-xl p-4 ${mode === 'live' ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-gray-800">${totalValue.toFixed(2)}</span>
            </div>
            {type === 'buy' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Available {mode === 'previous' ? '(Practice)' : ''}</span>
                <span className={`font-bold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                  ${currentBalance.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleTrade}
            disabled={loading || (type === 'buy' && !canAfford)}
            className={`w-full py-4 rounded-xl font-semibold text-lg ${
              type === 'buy'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : type === 'buy' ? 'Buy Now' : 'Sell Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
