import React, { useEffect, useState } from 'react';
import FinancialChart from './FinancialChart';
import styles from './NewsModal.module.css';

// --- TypeScript Interfaces ---
interface NewsArticle { headline: string; sentiment: string; }
interface Indicators { rsi: string; macd: string; williams_r: string; sentiment: string; }
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

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: string;
  indicators: Indicators;
  signals: string[];
  news: NewsArticle[];
}

const API_BASE_URL = 'http://localhost:8000';

const getSignalMeaning = (signal: string) => {
  const meanings: { [key: string]: string } = {
    "RSI_OVERSOLD": "Asset may be undervalued and due for a bounce.",
    "RSI_OVERBOUGHT": "Asset may be overvalued and due for a pullback.",
    "MACD_BULLISH": "Upward momentum is increasing.",
    "MACD_BEARISH": "Downward momentum is increasing.",
    "BB_OVERSOLD": "Price is below the typical trading range; may revert higher.",
    "BB_OVERBOUGHT": "Price is above the typical trading range; may revert lower.",
    "STOCH_OVERSOLD": "Momentum is low and may be turning positive.",
    "STOCH_OVERBOUGHT": "Momentum is high and may be turning negative.",
    "WILLIAMS_OVERSOLD": "Selling pressure may be exhausted.",
    "WILLIAMS_OVERBOUGHT": "Buying pressure may be exhausted.",
  };
  return meanings[signal] || "A standard technical signal.";
};

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, ticker, recommendation, confidence, indicators, signals, news }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchChartData = async () => {
        setIsLoadingChart(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/chart/${ticker}`);
          const data = await response.json();
          if (data.error) setChartData(null);
          else setChartData(data);
        } catch (error) {
          setChartData(null);
        } finally {
          setIsLoadingChart(false);
        }
      };
      fetchChartData();
    }
  }, [isOpen, ticker]);

  if (!isOpen) return null;

  const bullishSignals = signals.filter(s => s.includes('BULLISH') || s.includes('OVERSOLD')).length;
  const bearishSignals = signals.filter(s => s.includes('BEARISH') || s.includes('OVERBOUGHT')).length;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.ticker}>{ticker} Details</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          
          <div className={styles.chartContainer}>
            {isLoadingChart ? <p className={styles.loadingText}>Loading Chart...</p> : chartData ? <FinancialChart data={chartData} /> : <p className={styles.loadingText}>Could not load chart data.</p>}
          </div>

          <div className={styles.analysisSection}>
            <h3 className={styles.sectionTitle}>Analysis Breakdown</h3>
            <div className={styles.indicatorGrid}>
              <div className={styles.indicatorItem}><span>RSI</span><span className={styles.indicatorValue}>{indicators.rsi}</span></div>
              <div className={styles.indicatorItem}><span>MACD</span><span className={styles.indicatorValue}>{indicators.macd}</span></div>
              <div className={styles.indicatorItem}><span>Williams %R</span><span className={styles.indicatorValue}>{indicators.williams_r}</span></div>
              <div className={styles.indicatorItem}><span>Sentiment</span><span className={styles.indicatorValue}>{indicators.sentiment}</span></div>
            </div>
            <div className={styles.rationale}>
              <p>Recommendation of <span className={styles.glow}>{recommendation}</span> is based on:</p>
              <ul>
                <li><strong>{bullishSignals}</strong> bullish signal(s) vs. <strong>{bearishSignals}</strong> bearish signal(s).</li>
                <li>Overall news sentiment score of <strong>{indicators.sentiment}</strong>.</li>
                <li>Confidence level of <strong>{confidence}</strong>.</li>
              </ul>
            </div>
            <div className={styles.signals}>
              {signals.map((signal, index) => (
                <div key={index} className={styles.signalItem}>
                  <span className={styles.signalName}>{signal.replace(/_/g, ' ')}</span>
                  <span className={styles.signalMeaning}>{getSignalMeaning(signal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.newsSection}>
            <h3 className={styles.sectionTitle}>Recent News</h3>
            <ul className={styles.newsList}>
              {news.length > 0 ? news.map((article, index) => (
                <li key={index} className={styles.newsItem}>
                  <p className={styles.headline}>{article.headline}</p>
                  <span className={styles.sentiment}>Sentiment: {article.sentiment}</span>
                </li>
              )) : <p>No recent news found for this ticker.</p>}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewsModal;