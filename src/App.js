import React from 'react';
import './App.css';
import GalleryPage from './pages/GalleryPage';

function App() {
  return (
    <div className="App" style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'bottom', alignItems: 'end' }}>
      <GalleryPage />
    </div>
  );
}

export default App;
