import React, { useState } from 'react';
import { Cards3D } from '../components/Cards3D';
import CardFilter from '../components/CardFilter';
import GridView from '../components/GridView';

const GalleryPage = () => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d' or 'grid'

  const handleFilterChange = (type, value) => {
    if (type === 'reset') {
      setSelectedYear(null);
      setSelectedMonth(null);
      return;
    }

    if (type === 'year') {
      setSelectedYear(value);
    } else if (type === 'month') {
      setSelectedMonth(value);
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <CardFilter 
          onFilterChange={handleFilterChange}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
        <button
          onClick={() => setViewMode(prev => prev === '3d' ? 'grid' : '3d')}
          style={{
            padding: '8px 16px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            background: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer'
          }}
        >
          {viewMode === '3d' ? '그리드 뷰' : '3D 뷰'}
        </button>
      </div>
      
      {viewMode === '3d' ? (
        <Cards3D 
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          isTransitioning={false}
        />
      ) : (
        <GridView 
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      )}
    </div>
  );
};

export default GalleryPage; 