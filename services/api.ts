
/**
 * Advanced Market Data Service with Multi-Proxy Fallback
 * Bypasses CORS using public proxies and targets stable Yahoo Finance Chart endpoints.
 */

const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

const YAHOO_BASE = 'https://query1.finance.yahoo.com';
const YAHOO_SEARCH_BASE = 'https://query2.finance.yahoo.com';

const fetchWithFallback = async (targetUrl: string): Promise<any> => {
  let lastError: any = null;
  const cacheBustUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}_cb=${Date.now()}`;

  for (const proxyFn of PROXIES) {
    try {
      const proxiedUrl = proxyFn(cacheBustUrl);
      const response = await fetch(proxiedUrl);
      if (!response.ok) continue;
      const data = await response.json();
      return data.contents ? JSON.parse(data.contents) : data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Market data connection failed.");
};

export const api = {
  async getHistorical(symbol: string) {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - (2 * 365 * 24 * 60 * 60);
      const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${start}&period2=${end}&interval=1d&events=history`;
      const data = await fetchWithFallback(url);
      
      const result = data.chart.result[0];
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;
      
      if (!timestamps) return [];

      return timestamps.map((t: number, i: number) => ({
        time: new Date(t * 1000).toISOString().split('T')[0],
        open: quotes.open[i],
        high: quotes.high[i],
        low: quotes.low[i],
        close: quotes.close[i],
        volume: quotes.volume[i],
      })).filter((bar: any) => bar.open != null);
    } catch (error) {
      console.error("Historical API Error:", error);
      throw error;
    }
  },

  async getQuote(symbol: string) {
    try {
      const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
      const data = await fetchWithFallback(url);
      const meta = data.chart.result[0].meta;
      
      return {
        symbol: meta.symbol,
        price: meta.regularMarketPrice || meta.chartPreviousClose,
        change: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
        name: meta.symbol,
        currency: meta.currency,
        exchange: meta.exchangeName
      };
    } catch (error) {
      console.error("Quote API Error:", error);
      throw error;
    }
  },

  async searchStocks(query: string) {
    try {
      const url = `${YAHOO_SEARCH_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10`;
      const data = await fetchWithFallback(url);
      return (data.quotes || []).map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType
      }));
    } catch (error) {
      return [];
    }
  }
};
