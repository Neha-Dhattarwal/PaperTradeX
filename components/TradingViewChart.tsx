import React, { useEffect, useRef } from 'react';
import { OHLC } from '../types';

// The library is loaded as a global script in index.html
declare global {
  interface Window {
    LightweightCharts: any;
  }
}

interface TradingViewChartProps {
  data: OHLC[];
  fullData?: OHLC[]; // Used to determine limits when in replay mode
  isReplayMode: boolean;
  isSelectingStart: boolean;
  onBarSelect?: (index: number) => void;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  data, 
  fullData = [], 
  isReplayMode, 
  isSelectingStart,
  onBarSelect 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chartInitialized = false;
    const initChart = () => {
      if (!chartContainerRef.current || chartInitialized) return;
      
      const LWC = window.LightweightCharts;
      if (!LWC) {
        return false;
      }

      const chart = LWC.createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: '#94a3b8',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(51, 65, 85, 0.05)' },
          horzLines: { color: 'rgba(51, 65, 85, 0.05)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(51, 65, 85, 0.2)',
          autoScale: true,
        },
        timeScale: {
          borderColor: 'rgba(51, 65, 85, 0.2)',
          timeVisible: true,
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        crosshair: {
          mode: 0, // Normal crosshair
        }
      });
      chartRef.current = chart;

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });
      candleSeriesRef.current = candleSeries;

      const volumeSeries = chart.addHistogramSeries({
        color: 'rgba(99, 102, 241, 0.2)',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;

      // Click handler for bar selection
      chart.subscribeClick((param: any) => {
        if (!param.time || !onBarSelect || !fullData.length) return;
        
        // Find index in fullData corresponding to the clicked time
        const clickedTimeStr = new Date(param.time * 1000).toISOString().split('T')[0];
        const index = fullData.findIndex(d => {
          const dTimeStr = new Date(d.time).toISOString().split('T')[0];
          return dTimeStr === clickedTimeStr;
        });

        if (index !== -1) {
          onBarSelect(index);
        }
      });

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };
      window.addEventListener('resize', handleResize);
      
      if (data.length > 0) updateData(data);
      chartInitialized = true;
      return true;
    };

    // Try to initialize immediately or via interval if script isn't ready
    if (!initChart()) {
      const interval = setInterval(() => {
        if (initChart()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [fullData, onBarSelect]);

  const updateData = (ohlcData: OHLC[]) => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    
    try {
      const formattedCandles = ohlcData.map(d => ({
        time: Math.floor(new Date(d.time).getTime() / 1000),
        open: d.open, high: d.high, low: d.low, close: d.close,
      }));

      const formattedVolumes = ohlcData.map(d => ({
        time: Math.floor(new Date(d.time).getTime() / 1000),
        value: d.volume,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
      }));

      candleSeriesRef.current.setData(formattedCandles);
      volumeSeriesRef.current.setData(formattedVolumes);
    } catch (e) {
      console.warn("Chart data update failed:", e);
    }
  };

  useEffect(() => {
    updateData(data);
  }, [data]);

  return (
    <div className="relative h-full w-full group">
      <div ref={chartContainerRef} className="tradingview-chart-container" />
      {isSelectingStart && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl pointer-events-none animate-bounce z-10">
          Click a candle to set Replay Start Point
        </div>
      )}
    </div>
  );
};