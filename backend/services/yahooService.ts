
import yahooFinance from 'yahoo-finance2';

export const getHistoricalData = async (symbol: string, startDate: string, endDate: string) => {
  try {
    const queryOptions = {
      period1: startDate, // e.g., '2023-01-01'
      period2: endDate,   // e.g., '2024-01-01'
      interval: '1d' as any,
    };
    const result = await yahooFinance.historical(symbol, queryOptions);
    return result.map(item => ({
      time: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));
  } catch (error) {
    console.error(`Yahoo Historical Error for ${symbol}:`, error);
    throw error;
  }
};

export const getLivePrice = async (symbol: string) => {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChangePercent,
      bid: quote.bid,
      ask: quote.ask,
      lastUpdated: quote.regularMarketTime,
    };
  } catch (error) {
    console.error(`Yahoo Quote Error for ${symbol}:`, error);
    throw error;
  }
};

export const searchSymbol = async (query: string) => {
  try {
    const result = await yahooFinance.search(query);
    return result.quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname,
      exchange: q.exchange,
      type: q.quoteType,
    }));
  } catch (error) {
    console.error(`Yahoo Search Error for ${query}:`, error);
    throw error;
  }
};
