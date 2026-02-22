import YahooFinance from 'yahoo-finance2';

/**
 * Yahoo Finance client (v3+)
 * Survey notice suppressed for clean logs
 */
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey']
});

/**
 * -------------------------------
 * In-memory caches (per process)
 * -------------------------------
 */
const livePriceCache = new Map(); // symbol -> { data, timestamp }
const historicalCache = new Map(); // key -> { data, timestamp }

const LIVE_TTL = 15 * 1000;       // 15 seconds
const HISTORICAL_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches live market price (rate-limit safe)
 */
export const getLivePrice = async (symbol) => {
  const now = Date.now();

  // ✅ Serve cached price if fresh
  const cached = livePriceCache.get(symbol);
  if (cached && now - cached.timestamp < LIVE_TTL) {
    return cached.data;
  }

  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote?.regularMarketPrice) {
      throw new Error(`Price not available for ${symbol}`);
    }

    const data = {
      price: quote.regularMarketPrice,
      time: quote.regularMarketTime * 1000,
      change: quote.regularMarketChangePercent ?? 0
    };

    livePriceCache.set(symbol, {
      data,
      timestamp: now
    });

    return data;
  } catch (e) {
    // ⚠️ On rate limit, serve last cached value
    if (e.code === 429 && cached) {
      console.warn(`[Yahoo] 429 for ${symbol}, serving cached price`);
      return cached.data;
    }

    console.error(`[Yahoo] Quote Error (${symbol}):`, e.message);
    throw e;
  }
};

/**
 * Fetches historical / replay candles
 * Auto-selects best interval based on range
 */
export const getHistoricalData = async (
  symbol,
  period1,
  period2 = new Date()
) => {
  const startDate = new Date(period1);
  const endDate = new Date(period2);

  const cacheKey = `${symbol}_${startDate.toISOString()}_${endDate.toISOString()}`;
  const now = Date.now();

  // ✅ Serve cached historical data
  const cached = historicalCache.get(cacheKey);
  if (cached && now - cached.timestamp < HISTORICAL_TTL) {
    return cached.data;
  }

  try {
    const ageInDays =
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // Yahoo interval limits
    let interval = '1m';
    if (ageInDays > 28) interval = '15m';
    if (ageInDays > 58) interval = '1h';
    if (ageInDays > 720) interval = '1d';

    console.log(
      `[Yahoo] ${symbol} | interval=${interval} | from=${startDate.toISOString().split('T')[0]}`
    );

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval
    });

    if (!result?.quotes?.length) {
      console.warn(`[Yahoo] No historical data for ${symbol}`);
      return [];
    }

    const data = result.quotes
      .filter(q => q.open != null && q.close != null)
      .map(q => ({
        timestamp: q.date.getTime(),
        time:
          interval === '1d'
            ? q.date.toISOString().split('T')[0]
            : q.date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              }),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume ?? 0
      }));

    historicalCache.set(cacheKey, {
      data,
      timestamp: now
    });

    return data;
  } catch (e) {
    console.error(`[Yahoo] Chart Error (${symbol}):`, e.message);
    return [];
  }
};
