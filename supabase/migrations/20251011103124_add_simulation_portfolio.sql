/*
  # Add Simulation Portfolio Tables

  1. New Tables
    - `simulation_holdings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `symbol` (text, stock ticker)
      - `quantity` (numeric, shares owned)
      - `avg_price` (numeric, average purchase price)
      - `current_value` (numeric, current market value)
      - `updated_at` (timestamptz)
    
    - `simulation_trades`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `symbol` (text)
      - `side` (text, 'buy' or 'sell')
      - `quantity` (numeric)
      - `price` (numeric)
      - `total_value` (numeric)
      - `pnl` (numeric, profit/loss)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own simulation data
*/

-- Create simulation_holdings table
CREATE TABLE IF NOT EXISTS simulation_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity >= 0),
  avg_price numeric NOT NULL CHECK (avg_price >= 0),
  current_value numeric DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, symbol)
);

-- Create simulation_trades table
CREATE TABLE IF NOT EXISTS simulation_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price > 0),
  total_value numeric NOT NULL,
  pnl numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE simulation_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_trades ENABLE ROW LEVEL SECURITY;

-- Simulation holdings policies
CREATE POLICY "Users can view own simulation holdings"
  ON simulation_holdings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulation holdings"
  ON simulation_holdings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulation holdings"
  ON simulation_holdings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulation holdings"
  ON simulation_holdings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Simulation trades policies
CREATE POLICY "Users can view own simulation trades"
  ON simulation_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulation trades"
  ON simulation_trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_simulation_holdings_user_id ON simulation_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_holdings_symbol ON simulation_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_simulation_trades_user_id ON simulation_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_trades_created_at ON simulation_trades(created_at DESC);
