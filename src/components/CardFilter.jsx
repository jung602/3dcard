import React from 'react';
import { cardData } from '../data/cardData';

const CardFilter = ({ onFilterChange, selectedYear, selectedMonth }) => {
  // 중복 제거된 연도와 월 목록 생성
  const years = [...new Set(cardData.map(card => card.year))].sort((a, b) => b - a);
  const months = [...new Set(cardData.map(card => card.month))].sort((a, b) => b - a);

  const handleReset = () => {
    onFilterChange('reset', null);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    }}>
      <div>
        <select 
          value={selectedYear || ''} 
          onChange={(e) => onFilterChange('year', e.target.value ? Number(e.target.value) : null)}
          style={{
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">전체 연도</option>
          {years.map(year => (
            <option key={year} value={year}>{year}년</option>
          ))}
        </select>
      </div>
      <div>
        <select 
          value={selectedMonth || ''} 
          onChange={(e) => onFilterChange('month', e.target.value ? Number(e.target.value) : null)}
          style={{
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">전체 월</option>
          {months.map(month => (
            <option key={month} value={month}>{month}월</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleReset}
        style={{
          padding: '8px 16px',
          borderRadius: '5px',
          border: '1px solid #ddd',
          background: 'rgba(255, 255, 255, 0.9)',
          cursor: 'pointer'
        }}
      >
        초기화
      </button>
    </div>
  );
};

export default CardFilter; 