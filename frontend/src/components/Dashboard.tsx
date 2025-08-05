import React, { useEffect, useState } from 'react';
import TickerCard from './TickerCard';
import NewsModal from './NewsModal';
import SearchBar from './SearchBar'; // Import the new component
import styles from './Dashboard.module.css';

// Define TypeScript interfaces for our data structures
interface NewsArticle {
  headline: string;
  sentiment: string;
}

interface Indicators {
  rsi: string;
  macd: string;
  williams_r: string;
  sentiment: string;
}

interface AnalysisResult {
  ticker: string;
  name?: string;
  price: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: string;
  indicators: Indicators;
  signals: string[];
  news: NewsArticle[];
}

const API_BASE_URL = 'http://localhost:8000';

const Dashboard: React.FC = () => {
  const [stocks, setStocks] = useState<AnalysisResult[]>([]);
  const [commodities, setCommodities] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for managing the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stockRes, commodityRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analysis/stocks`),
          fetch(`${API_BASE_URL}/api/analysis/commodities`)
        ]);

        if (!stockRes.ok || !commodityRes.ok) {
          throw new Error('Failed to fetch data from the server.');
        }

        const stockData = await stockRes.json();
        const commodityData = await commodityRes.json();

        setStocks(stockData);
        setCommodities(commodityData);
        setError(null);
      } catch (err) {
        setError('Could not connect to the analysis server. Please ensure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Modal and Search Handlers ---
  const handleOpenModal = (tickerData: AnalysisResult) => {
    setSelectedTicker(tickerData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicker(null);
  };

  const handleSearch = async (ticker: string) => {
    setSearchLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/search/${ticker}`);
      if (!response.ok) {
        throw new Error(`No data found for ticker: ${ticker}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      handleOpenModal(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.message}>Loading analysis...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quant Analysis</h1>
        <SearchBar onSearch={handleSearch} isLoading={searchLoading} />
        {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
      </header>
      
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Stocks</h2>
        <div className={styles.grid}>
          {stocks.map(stock => (
            <TickerCard 
              key={stock.ticker} 
              data={stock}
              onClick={() => handleOpenModal(stock)} 
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Commodities</h2>
        <div className={styles.grid}>
          {commodities.map(comm => (
             <TickerCard 
              key={comm.ticker} 
              data={{...comm, ticker: comm.name || comm.ticker}}
              onClick={() => handleOpenModal(comm)} 
            />
          ))}
        </div>
      </section>

      {selectedTicker && (
        <NewsModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          ticker={selectedTicker.name || selectedTicker.ticker}
          recommendation={selectedTicker.recommendation}
          confidence={selectedTicker.confidence}
          indicators={selectedTicker.indicators}
          signals={selectedTicker.signals}
          news={selectedTicker.news || []}
        />
      )}
    </div>
  );
};

export default Dashboard;
