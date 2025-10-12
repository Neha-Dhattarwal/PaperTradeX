import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Holding } from '../../lib/supabase';
import { TrendingUp, DollarSign, Wallet, Plus, Minus, Clock, Zap } from 'lucide-react';
import { StockSearch } from './StockSearch';
import { useMarketMode, getHistoricalDateLabel } from '../../lib/marketMode';

export const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const { mode, setMode, simulationBalance, setSimulationBalance } = useMarketMode();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [simulationHoldings, setSimulationHoldings] = useState<Holding[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [simulationPortfolioValue, setSimulationPortfolioValue] = useState(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => {
    if (mode === 'live') {
      fetchHoldings();
    } else {
      fetchSimulationHoldings();
    }
  }, [mode]);

  const fetchHoldings = async () => {
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching holdings:', error);
      return;
    }

    setHoldings(data || []);
    const totalValue = (data || []).reduce((sum, h) => sum + Number(h.current_value), 0);
    setPortfolioValue(totalValue);
  };

  const fetchSimulationHoldings = async () => {
    const { data, error } = await supabase
      .from('simulation_holdings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching simulation holdings:', error);
      return;
    }

    setSimulationHoldings(data || []);
    const totalValue = (data || []).reduce((sum, h) => sum + Number(h.current_value), 0);
    setSimulationPortfolioValue(totalValue);
  };

  const handleTransaction = async () => {
    if (!profile || !amount) return;

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;

    const newBalance = transactionType === 'deposit'
      ? profile.balance + value
      : profile.balance - value;

    if (newBalance < 0) {
      alert('Insufficient balance');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', profile.id);

    if (error) {
      console.error('Transaction error:', error);
      return;
    }

    await refreshProfile();
    setShowDepositModal(false);
    setAmount('');
  };

  const currentBalance = mode === 'live' ? (profile?.balance || 0) : simulationBalance;
  const currentPortfolioValue = mode === 'live' ? portfolioValue : simulationPortfolioValue;
  const currentHoldings = mode === 'live' ? holdings : simulationHoldings;
  const totalPortfolioValue = currentBalance + currentPortfolioValue;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className={`text-white p-6 rounded-b-3xl shadow-lg ${
        mode === 'live'
          ? 'bg-gradient-to-br from-blue-600 to-blue-800'
          : 'bg-gradient-to-br from-orange-600 to-orange-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">Portfolio</h1>
            <p className={`text-sm ${mode === 'live' ? 'text-blue-100' : 'text-orange-100'}`}>
              {mode === 'live' ? 'Live Market' : `Previous Day - ${getHistoricalDateLabel()}`}
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

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <p className="text-blue-100 text-sm mb-1">Total Value</p>
          <h2 className="text-4xl font-bold">${totalPortfolioValue.toFixed(2)}</h2>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span className="text-sm text-green-300">+0.00%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className={`w-4 h-4 ${mode === 'live' ? 'text-blue-200' : 'text-orange-200'}`} />
              <p className={`text-xs ${mode === 'live' ? 'text-blue-100' : 'text-orange-100'}`}>Cash</p>
            </div>
            <p className="text-lg font-bold">${currentBalance.toFixed(2)}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={`w-4 h-4 ${mode === 'live' ? 'text-blue-200' : 'text-orange-200'}`} />
              <p className={`text-xs ${mode === 'live' ? 'text-blue-100' : 'text-orange-100'}`}>Holdings</p>
            </div>
            <p className="text-lg font-bold">${currentPortfolioValue.toFixed(2)}</p>
          </div>
        </div>

        {mode === 'live' && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setTransactionType('deposit');
                setShowDepositModal(true);
              }}
              className="flex-1 bg-white text-blue-600 py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Deposit
            </button>
            <button
              onClick={() => {
                setTransactionType('withdraw');
                setShowDepositModal(true);
              }}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Minus className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        <StockSearch />

        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            {mode === 'live' ? 'Your Holdings' : 'Simulation Holdings'}
          </h3>
          {currentHoldings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-500">No holdings yet</p>
              <p className="text-sm text-gray-400 mt-2">Search and buy stocks to start trading</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentHoldings.map((holding) => (
                <div key={holding.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800">{holding.symbol}</h4>
                      <p className="text-sm text-gray-500">{holding.quantity} shares</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">${Number(holding.current_value).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Avg: ${Number(holding.avg_price).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">
              {transactionType === 'deposit' ? 'Deposit Cash' : 'Withdraw Cash'}
            </h3>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleTransaction}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
