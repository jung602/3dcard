import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Cards3D } from './components/Cards3D';
import './App.css';

function App() {
  return (
    <div className="App">
      <Canvas>
        <Cards3D />
      </Canvas>
    </div>
  );
}

export default App; 