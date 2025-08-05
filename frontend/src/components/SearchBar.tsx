import React, { useState } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [ticker, setTicker] = useState('');

  const handleSearch = () => {
    if (ticker.trim()) {
      onSearch(ticker.trim().toUpperCase());
      setTicker('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter Ticker (e.g., GOOG)"
        className={styles.searchInput}
        disabled={isLoading}
      />
      <button
        onClick={handleSearch}
        className={styles.searchButton}
        disabled={isLoading}
      >
        {isLoading ? '...' : 'Search'}
      </button>
    </div>
  );
};

export default SearchBar;
