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
    const range = url.searchParams.get("range") || "1d";
    const mode = url.searchParams.get("mode") || "current";

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Symbol parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let period1: any;
    let period2: any;
    let interval: any;

    if (mode === "yesterday") {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      period1 = startOfYesterday;
      period2 = endOfYesterday;
      interval = "1m";
    } else {
      period1 = range;
      interval = range === "1d" ? "1m" : range === "5d" ? "5m" : range === "1mo" ? "1h" : "1d";
    }

    const result = await yahooFinance.chart(symbol, {
      period1: period1,
      period2: period2,
      interval: interval,
    });

    const chartData = result.quotes.map((quote: any) => ({
      date: quote.date,
      price: quote.close,
      high: quote.high,
      low: quote.low,
      open: quote.open,
      volume: quote.volume,
    }));

    return new Response(
      JSON.stringify({
        symbol: result.meta.symbol,
        data: chartData,
        mode: mode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch chart data" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
