
export interface OHLC {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  mode: 'LIVE' | 'REPLAY';
  totalValue: number;
  currency?: string;
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

export interface ReplaySession {
  id: string;
  symbol: string;
  currentBarIndex: number;
  isPlaying: boolean;
  speed: number;
}

export enum MarketMode {
  LIVE = 'LIVE',
  REPLAY = 'REPLAY'
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
