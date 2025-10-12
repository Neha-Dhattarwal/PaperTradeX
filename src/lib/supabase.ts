import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type Holding = {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  current_value: number;
  updated_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_value: number;
  pnl: number;
  created_at: string;
};

export type Watchlist = {
  id: string;
  user_id: string;
  symbol: string;
  created_at: string;
};

export type PendingOrder = {
  id: string;
  user_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: 'open' | 'filled' | 'cancelled';
  entry_price: number;
  created_at: string;
  updated_at: string;
};

export type HistoricalSession = {
  id: string;
  user_id: string;
  session_id: string;
  start_date: string;
  end_date: string | null;
  initial_balance: number;
  current_balance: number;
  session_data: {
    holdings: any[];
    trades: any[];
  };
  created_at: string;
  updated_at: string;
};
