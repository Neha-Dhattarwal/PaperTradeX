
export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export enum MarketMode {
  LIVE = 'LIVE',
  REPLAY = 'REPLAY',
  PRACTICE = 'PRACTICE'
}

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface Trade {
  id: string;
  symbol: string;
  type?: OrderType; // Optional as some files use 'side'
  side?: 'BUY' | 'SELL';
  price: number;
  qty?: number;
  quantity?: number;
  timestamp: number;
  mode: MarketMode;
  pnl?: number;
  totalValue?: number;
}

export interface Position {
  id: string;
  symbol: string;
  qty: number;
  avgPrice: number;
  mode: MarketMode;
  stopLoss?: number;
  takeProfit?: number;
}

export interface UserState {
  balance: number;
  practiceBalance: number;
  positions: Position[];
  history: Trade[];
  pendingOrders: any[];
}

export interface ReplayState {
  symbol: string;
  date: string;
  currentIndex: number;
  allCandles: CandleData[];
  isPlaying: boolean;
  speed: number;
}

export interface ReplaySession {
  id: string;
  symbol: string;
  currentBarIndex: number;
  isPlaying: boolean;
  speed: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: any;
}

export interface OHLC {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currency?: string;
}

export interface Portfolio {
  cash: number;
  holdings: Holding[];
  trades: Trade[];
  initialBalance: number;
}

export interface StockInfo {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  lastPrice?: number;
  change?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
