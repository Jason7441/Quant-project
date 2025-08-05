import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import ChartToolbar from './ChartToolbar';

// --- TypeScript Interfaces ---
// (Assuming ChartData is defined as before)
interface ChartData {
  ohlc: { time: string; open: number; high: number; low: number; close: number }[];
  volume: { time: string; value: number }[];
  rsi: { time: string; value: number }[];
  macd: {
    macd_line: { time: string; value: number }[];
    signal_line: { time: string; value: number }[];
  };
  bollinger_bands: { time: string; upper: number; middle: number; lower: number }[];
}

interface FinancialChartProps {
  data: ChartData;
}

// --- Chart Component ---
const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Record<string, ISeriesApi<any>>>({});

  const [visibility, setVisibility] = useState({
    bb: true,
    volume: true,
    macd: true,
    rsi: true,
  });

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: { background: { color: '#1a1a1a' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
      crosshair: { mode: 1 },
      timeScale: { borderColor: '#444' },
    });

    const chart = chartRef.current;

    // Store series in a ref to access them later
    seriesRef.current = {
      candlestick: chart.addCandlestickSeries({ upColor: '#23d160', downColor: '#ff4757', borderDownColor: '#ff4757', borderUpColor: '#23d160', wickDownColor: '#ff4757', wickUpColor: '#23d160' }),
      bbUpper: chart.addLineSeries({ color: '#4c8dff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }),
      bbMiddle: chart.addLineSeries({ color: '#f7b267', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }),
      bbLower: chart.addLineSeries({ color: '#4c8dff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }),
      volume: chart.addHistogramSeries({ color: '#444', priceFormat: { type: 'volume' }, priceScaleId: 'volume_scale' }),
      macd: chart.addLineSeries({ color: '#2962FF', lineWidth: 2, priceScaleId: 'macd_scale' }),
      signal: chart.addLineSeries({ color: '#FF6D00', lineWidth: 2, priceScaleId: 'macd_scale' }),
      rsi: chart.addLineSeries({ color: '#e0e3eb', lineWidth: 2, priceScaleId: 'rsi_scale' }),
    };

    // Set initial data
    seriesRef.current.candlestick.setData(data.ohlc);
    seriesRef.current.bbUpper.setData(data.bollinger_bands.map(d => ({ time: d.time, value: d.upper })));
    seriesRef.current.bbMiddle.setData(data.bollinger_bands.map(d => ({ time: d.time, value: d.middle })));
    seriesRef.current.bbLower.setData(data.bollinger_bands.map(d => ({ time: d.time, value: d.lower })));
    seriesRef.current.volume.setData(data.volume);
    seriesRef.current.macd.setData(data.macd.macd_line);
    seriesRef.current.signal.setData(data.macd.signal_line);
    seriesRef.current.rsi.setData(data.rsi);

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data]); // Only re-create the chart if the core data changes

  // Effect to handle visibility toggles
  useEffect(() => {
    if (!chartRef.current) return;

    // Bollinger Bands
    seriesRef.current.bbUpper.applyOptions({ visible: visibility.bb });
    seriesRef.current.bbMiddle.applyOptions({ visible: visibility.bb });
    seriesRef.current.bbLower.applyOptions({ visible: visibility.bb });

    // Volume
    seriesRef.current.volume.applyOptions({ visible: visibility.volume });
    chartRef.current.priceScale('volume_scale').applyOptions({ visible: visibility.volume });

    // MACD
    seriesRef.current.macd.applyOptions({ visible: visibility.macd });
    seriesRef.current.signal.applyOptions({ visible: visibility.macd });
    chartRef.current.priceScale('macd_scale').applyOptions({ visible: visibility.macd });
    
    // RSI
    seriesRef.current.rsi.applyOptions({ visible: visibility.rsi });
    chartRef.current.priceScale('rsi_scale').applyOptions({ visible: visibility.rsi });

  }, [visibility]);

  return (
    <div style={{ width: '100%' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '450px' }} />
      <ChartToolbar visibility={visibility} onToggle={key => setVisibility(prev => ({ ...prev, [key]: !prev[key] }))} />
    </div>
  );
};

export default FinancialChart;
