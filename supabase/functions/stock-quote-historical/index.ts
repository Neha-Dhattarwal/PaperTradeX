import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import yahooFinance from "npm:yahoo-finance2@2.11.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get("symbol");
    const mode = url.searchParams.get("mode") || "live";

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Symbol parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (mode === "previous") {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      const result = await yahooFinance.chart(symbol, {
        period1: startOfYesterday,
        period2: endOfYesterday,
        interval: "5m",
      });

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const targetQuote = result.quotes.find((q: any) => {
        const quoteDate = new Date(q.date);
        const quoteTimeInMinutes = quoteDate.getHours() * 60 + quoteDate.getMinutes();
        return Math.abs(quoteTimeInMinutes - currentTimeInMinutes) <= 5;
      });

      const quote = targetQuote || result.quotes[result.quotes.length - 1];

      if (!quote) {
        return new Response(
          JSON.stringify({ error: "No historical data available" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const previousQuote = result.quotes[0];
      const change = quote.close - previousQuote.close;
      const changePercent = (change / previousQuote.close) * 100;

      const data = {
        symbol: symbol,
        name: result.meta.longName || result.meta.shortName || symbol,
        price: quote.close,
        change: change,
        changePercent: changePercent,
        previousClose: previousQuote.close,
        open: quote.open,
        dayHigh: quote.high,
        dayLow: quote.low,
        volume: quote.volume,
        marketCap: 0,
        mode: "previous",
        historicalDate: yesterday.toISOString(),
      };

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const quote = await yahooFinance.quote(symbol);

      const data = {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        mode: "live",
      };

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch stock quote" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
