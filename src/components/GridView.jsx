import React from 'react';
import { cardData } from '../data/cardData';
import './GridView.css';

const GridView = ({ isTransitioning }) => {
  return (
    <div className={`grid-container ${isTransitioning ? 'fade-out' : ''}`}>
      {cardData.map((card, index) => (
        <div 
          key={card.id} 
          className={`grid-item ${isTransitioning ? 'fade-out' : ''}`}
          style={{ 
            '--fade-out-delay': `${Math.max(0, (cardData.length - index - 1) * 0.1)}s`
          }}
        >
          <img src={card.coverImg} alt={card.title} />
          <h3>{card.title}</h3>
          <p>ID: {card.id}</p>
        </div>
      ))}
    </div>
  );
};

export default GridView; 