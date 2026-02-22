
import { Response } from 'express';
import * as yahooService from '../services/yahooService.js';

// In-Memory Mock Store
const mockState = {
  cashBalance: 100000,
  holdings: [] as any[],
  trades: [] as any[]
};

const GUEST_ID = 'guest_user_123';

export const executeBuy = async (req: any, res: Response) => {
  try {
    const { symbol, quantity, mode, price: replayPrice } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return (res as any).status(400).json({ message: 'Invalid symbol or quantity' });
    }

    let executionPrice = 0;
    if (mode === 'LIVE') {
      const quote = await yahooService.getLivePrice(symbol);
      executionPrice = quote.price;
    } else {
      executionPrice = replayPrice;
    }

    const cost = executionPrice * quantity;
    if (mockState.cashBalance < cost) {
      return (res as any).status(400).json({ message: 'Insufficient funds' });
    }

    // 1. Log Trade
    const trade = {
      id: 't_' + Date.now(),
      userId: GUEST_ID,
      symbol,
      price: executionPrice,
      quantity,
      side: 'BUY',
      mode,
      timestamp: new Date(),
    };
    mockState.trades.unshift(trade);

    // 2. Update Portfolio
    const portfolioItem = mockState.holdings.find(h => h.symbol === symbol);
    if (portfolioItem) {
      const newTotalQuantity = portfolioItem.quantity + quantity;
      const newAvgPrice = ((portfolioItem.avgPrice * portfolioItem.quantity) + cost) / newTotalQuantity;
      portfolioItem.quantity = newTotalQuantity;
      portfolioItem.avgPrice = newAvgPrice;
    } else {
      mockState.holdings.push({
        symbol,
        quantity,
        avgPrice: executionPrice,
      });
    }

    // 3. Update Balance
    mockState.cashBalance -= cost;

    (res as any).json({ trade, cashBalance: mockState.cashBalance });
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};

export const executeSell = async (req: any, res: Response) => {
  try {
    const { symbol, quantity, mode, price: replayPrice } = req.body;
    const portfolioIndex = mockState.holdings.findIndex(h => h.symbol === symbol);

    if (portfolioIndex === -1 || mockState.holdings[portfolioIndex].quantity < quantity) {
      return (res as any).status(400).json({ message: 'Insufficient holdings' });
    }

    let executionPrice = 0;
    if (mode === 'LIVE') {
      const quote = await yahooService.getLivePrice(symbol);
      executionPrice = quote.price;
    } else {
      executionPrice = replayPrice;
    }

    const credit = executionPrice * quantity;

    // 1. Log Trade
    const trade = {
      id: 't_' + Date.now(),
      userId: GUEST_ID,
      symbol,
      price: executionPrice,
      quantity,
      side: 'SELL',
      mode,
      timestamp: new Date(),
    };
    mockState.trades.unshift(trade);

    // 2. Update Portfolio
    mockState.holdings[portfolioIndex].quantity -= quantity;
    if (mockState.holdings[portfolioIndex].quantity === 0) {
      mockState.holdings.splice(portfolioIndex, 1);
    }

    // 3. Update Balance
    mockState.cashBalance += credit;

    (res as any).json({ trade, cashBalance: mockState.cashBalance });
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};

export const getPortfolio = async (req: any, res: Response) => {
  (res as any).json({ holdings: mockState.holdings, cashBalance: mockState.cashBalance });
};

export const getTradeHistory = async (req: any, res: Response) => {
  (res as any).json(mockState.trades);
};
