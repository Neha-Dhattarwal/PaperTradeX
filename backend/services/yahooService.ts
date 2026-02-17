import yahooFinance from 'yahoo-finance2';

// ===============================
// Historical Data
// ===============================
export const getHistoricalData = async (
  symbol: string,
  startDate: string,
  endDate: string
) => {
  try {
    const queryOptions: any = {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    };

    const result: any = await yahooFinance.historical(symbol, queryOptions);

    if (!result) return [];

    return result.map((item: any) => ({
      time: item.date ? item.date.toISOString().split('T')[0] : null,
      open: item.open ?? null,
      high: item.high ?? null,
      low: item.low ?? null,
      close: item.close ?? null,
      volume: item.volume ?? null,
    }));

  } catch (error) {
    console.error(`Yahoo Historical Error for ${symbol}:`, error);
    throw error;
  }
};


// ===============================
// Live Price
// ===============================
export const getLivePrice = async (symbol: string) => {
  try {

    const quote: any = await yahooFinance.quote(symbol);

    if (!quote) return null;

    return {
      symbol: quote.symbol ?? symbol,
      price: quote.regularMarketPrice ?? 0,
      change: quote.regularMarketChangePercent ?? 0,
      bid: quote.bid ?? 0,
      ask: quote.ask ?? 0,
      lastUpdated: quote.regularMarketTime ?? null,
    };

  } catch (error) {
    console.error(`Yahoo Quote Error for ${symbol}:`, error);
    throw error;
  }
};


// ===============================
// Search Symbol
// ===============================
export const searchSymbol = async (query: string) => {
  try {

    const result: any = await yahooFinance.search(query);

    if (!result || !result.quotes) return [];

    return result.quotes.map((q: any) => ({
      symbol: q.symbol ?? "",
      name: q.shortname || q.longname || "",
      exchange: q.exchange ?? "",
      type: q.quoteType ?? "",
    }));

  } catch (error) {
    console.error(`Yahoo Search Error for ${query}:`, error);
    throw error;
  }
};
