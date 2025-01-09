import React from 'react';
import { cardData } from '../data/cardData';

const CardFilter = ({ onFilterChange, selectedYear, selectedMonth }) => {
  const years = [...new Set(cardData.map(card => card.year))].sort((a, b) => b - a);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleReset = () => {
    onFilterChange('reset', null);
  };

  const textStyle = (isSelected) => ({
    padding: '2px 8px',
    color: isSelected ? '#000000' : '#999999',
    cursor: 'pointer',
    fontWeight: 'normal',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    lineHeight: '20px',
    userSelect: 'none'
  });

  return (
    <div style={{
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
        overflowX: 'auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          minWidth: 'max-content'
        }}>
          {years.map(year => (
            <span
              key={year}
              onClick={() => onFilterChange('year', year)}
              style={textStyle(selectedYear === year)}
            >
              {year}년
            </span>
          ))}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          minWidth: 'max-content'
        }}>
          {months.map(month => (
            <span
              key={month}
              onClick={() => onFilterChange('month', month)}
              style={textStyle(selectedMonth === month)}
            >
              {month}월
            </span>
          ))}
        </div>
      </div>

      <span
        onClick={handleReset}
        style={{
          ...textStyle(false),
          position: 'absolute',
          right: '20px',
          color: '#999999',
          textDecoration: 'underline'
        }}
      >
        초기화
      </span>
    </div>
  );
};

export default CardFilter; 