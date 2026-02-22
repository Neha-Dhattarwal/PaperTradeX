
import { Response } from 'express';
import Trade from '../models/Trade';
import Portfolio from '../models/Portfolio';
import User from '../models/User';
import * as yahooService from '../services/yahooService';

export const executeBuy = async (req: any, res: Response) => {
  try {
    const { symbol, quantity, mode, price: replayPrice } = req.body;
    const userId = req.user.id;

    if (!symbol || !quantity || quantity <= 0) {
      return (res as any).status(400).json({ message: 'Invalid symbol or quantity' });
    }

    let executionPrice = 0;
    if (mode === 'LIVE') {
      const quote = await yahooService.getLivePrice(symbol);
      executionPrice = quote.price;
    } else {
      executionPrice = replayPrice; // In REPLAY mode, the price is sent from the frontend/current bar
    }

    const cost = executionPrice * quantity;
    const user = await User.findById(userId);

    if (!user || user.cashBalance < cost) {
      return (res as any).status(400).json({ message: 'Insufficient funds' });
    }

    // 1. Log Trade
    const trade = await Trade.create({
      userId,
      symbol,
      price: executionPrice,
      quantity,
      side: 'BUY',
      mode,
      timestamp: new Date(),
    });

    // 2. Update Portfolio
    let portfolioItem = await Portfolio.findOne({ userId, symbol });
    if (portfolioItem) {
      const newTotalQuantity = portfolioItem.quantity + quantity;
      const newAvgPrice = ((portfolioItem.avgPrice * portfolioItem.quantity) + cost) / newTotalQuantity;
      portfolioItem.quantity = newTotalQuantity;
      portfolioItem.avgPrice = newAvgPrice;
      await portfolioItem.save();
    } else {
      await Portfolio.create({
        userId,
        symbol,
        quantity,
        avgPrice: executionPrice,
      });
    }

    // 3. Update User Balance
    user.cashBalance -= cost;
    await user.save();

    (res as any).json({ trade, cashBalance: user.cashBalance });
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};

export const executeSell = async (req: any, res: Response) => {
  try {
    const { symbol, quantity, mode, price: replayPrice } = req.body;
    const userId = req.user.id;

    const portfolioItem = await Portfolio.findOne({ userId, symbol });
    if (!portfolioItem || portfolioItem.quantity < quantity) {
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
    const trade = await Trade.create({
      userId,
      symbol,
      price: executionPrice,
      quantity,
      side: 'SELL',
      mode,
      timestamp: new Date(),
    });

    // 2. Update Portfolio
    portfolioItem.quantity -= quantity;
    if (portfolioItem.quantity === 0) {
      await (portfolioItem as any).deleteOne();
    } else {
      await portfolioItem.save();
    }

    // 3. Update User Balance
    const user = await User.findById(userId);
    if (user) {
      user.cashBalance += credit;
      await user.save();
    }

    (res as any).json({ trade, cashBalance: user?.cashBalance });
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};

export const getPortfolio = async (req: any, res: Response) => {
  try {
    const holdings = await Portfolio.find({ userId: req.user.id });
    const user = await User.findById(req.user.id).select('cashBalance');
    (res as any).json({ holdings, cashBalance: user?.cashBalance });
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};

export const getTradeHistory = async (req: any, res: Response) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ timestamp: -1 });
    (res as any).json(trades);
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};
