import React from 'react';
import styles from './TickerCard.module.css';

// Define the structure of the data prop
interface TickerData {
  ticker: string;
  price: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: string;
}

// Define the props that the TickerCard component will accept
interface TickerCardProps {
  data: TickerData;
  onClick: () => void;
}

const TickerCard: React.FC<TickerCardProps> = ({ data, onClick }) => {
  const { ticker, price, recommendation, confidence } = data;

  // Determine the class for the glowing effect based on the recommendation
  const recommendationClasses = () => {
    switch (recommendation) {
      case 'BUY':
        return `${styles.recommendation} ${styles.glowGreen}`;
      case 'SELL':
        return `${styles.recommendation} ${styles.glowRed}`;
      case 'HOLD':
      default:
        return `${styles.recommendation} ${styles.glow}`;
    }
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <h2 className={styles.ticker}>{ticker}</h2>
        <p className={styles.price}>${price}</p>
      </div>
      <div className={styles.body}>
        <p className={recommendationClasses()}>{recommendation}</p>
        <p className={styles.confidence}>{confidence} Confidence</p>
      </div>
    </div>
  );
};

export default TickerCard;
