import React from 'react';
import styles from './ChartToolbar.module.css';

// Define the types for the component's props
type Indicator = 'bb' | 'volume' | 'macd' | 'rsi';

interface ChartToolbarProps {
  visibility: Record<Indicator, boolean>;
  onToggle: (indicator: Indicator) => void;
}

const ChartToolbar: React.FC<ChartToolbarProps> = ({ visibility, onToggle }) => {
  const buttons: { key: Indicator; label: string }[] = [
    { key: 'bb', label: 'Bollinger Bands' },
    { key: 'volume', label: 'Volume' },
    { key: 'macd', label: 'MACD' },
    { key: 'rsi', label: 'RSI' },
  ];

  return (
    <div className={styles.toolbar}>
      {buttons.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          className={`${styles.button} ${visibility[key] ? styles.active : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default ChartToolbar;
