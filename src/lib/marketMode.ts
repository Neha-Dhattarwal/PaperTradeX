import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MarketMode = 'live' | 'previous';

type MarketModeState = {
  mode: MarketMode;
  setMode: (mode: MarketMode) => void;
  simulationBalance: number;
  setSimulationBalance: (balance: number) => void;
};

export const useMarketMode = create<MarketModeState>()(
  persist(
    (set) => ({
      mode: 'live',
      setMode: (mode) => set({ mode }),
      simulationBalance: 100000,
      setSimulationBalance: (balance) => set({ simulationBalance: balance }),
    }),
    {
      name: 'market-mode-storage',
    }
  )
);

export const getHistoricalTimestamp = (): number => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return Math.floor(yesterday.getTime() / 1000);
};

export const getHistoricalDateLabel = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
