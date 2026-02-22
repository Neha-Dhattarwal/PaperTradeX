
import { Request, Response } from 'express';
import * as yahooService from '../services/yahooService';

export const searchStocks = async (req: Request, res: Response) => {
  try {
    // Fix: Cast req to any to resolve property access errors on Request type
    const { q } = (req as any).query;
    if (!q) return (res as any).status(400).json({ message: 'Search query required' });
    const results = await yahooService.searchSymbol(q as string);
    (res as any).json(results);
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};

export const getQuote = async (req: Request, res: Response) => {
  try {
    // Fix: Cast req to any to resolve property access errors on Request type
    const { symbol } = (req as any).query;
    if (!symbol) return (res as any).status(400).json({ message: 'Symbol required' });
    const quote = await yahooService.getLivePrice(symbol as string);
    (res as any).json(quote);
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};

export const getHistorical = async (req: Request, res: Response) => {
  try {
    // Fix: Cast req to any to resolve property access errors on Request type
    const { symbol, start, end } = (req as any).query;
    if (!symbol) return (res as any).status(400).json({ message: 'Symbol required' });
    
    // Default to last 2 years if not provided
    const endDate = end ? (end as string) : new Date().toISOString().split('T')[0];
    const startDate = start ? (start as string) : new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0];
    
    const data = await yahooService.getHistoricalData(symbol as string, startDate, endDate);
    (res as any).json(data);
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};
