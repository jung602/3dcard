import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';

const GradientOverlay = () => {
  const { viewport } = useThree();
  
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(
      256, 256, 0,
      256, 256, 256
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const scale = useMemo(() => {
    return [viewport.width * 1.5, viewport.height * 1.5, 1];
  }, [viewport.width, viewport.height]);

  return (
    <Plane args={[1, 1]} scale={scale} position={[0, 0, 3]}>
      <meshBasicMaterial
        transparent
        map={gradientTexture}
        depthTest={false}
        depthWrite={false}
        opacity={0.8}
      />
    </Plane>
  );
};

export default GradientOverlay; 