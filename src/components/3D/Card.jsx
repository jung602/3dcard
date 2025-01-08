import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

const Card = ({ position, rotation, index, isSelected, onClick, isOther, data, opacity = 1, isTransitioning, transitionDelay, isFiltered }) => {
  const meshRef = useRef(null);
  const startTimeRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { gl, size } = useThree();
  const prevSizeRef = useRef({ width: size.width, height: size.height });

  const materials = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(data.coverImg);
    const alphaTexture = textureLoader.load('/images/alpha.png');
    
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 1,
      side: THREE.FrontSide,
      map: texture,
      alphaMap: alphaTexture,
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: data.color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 1,
      alphaMap: alphaTexture,
    });

    return [
      glassMaterial,
      glassMaterial,
      glassMaterial,
      glassMaterial,
      frontMaterial,
      glassMaterial
    ];
  }, [data.coverImg, data.color]);

  useEffect(() => {
    if (prevSizeRef.current.width !== size.width || prevSizeRef.current.height !== size.height) {
      setIsResizing(true);
      const timer = setTimeout(() => {
        setIsResizing(false);
        prevSizeRef.current = { width: size.width, height: size.height };
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [size.width, size.height]);

  const { hover } = useSpring({
    hover: hovered ? 0.5 : 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 60
    }
  });

  const meshPosition = isSelected 
    ? [0, 0, 0] 
    : position;

  const handleClick = (e) => {
    if (isOther) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    onClick();
  };

  const handlePointerOver = (e) => {
    if (isOther || isSelected) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e) => {
    if (isOther || isSelected) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    setHovered(false);
  };

  useEffect(() => {
    if (hovered) {
      gl.domElement.style.cursor = 'pointer';
      const tooltip = document.createElement('div');
      tooltip.id = 'card-tooltip';
      tooltip.style.position = 'fixed';
      tooltip.style.color = 'white';
      tooltip.style.padding = '4px 4px';
      tooltip.style.fontSize = '14px';
      tooltip.style.zIndex = '10000';
      tooltip.style.mixBlendMode = 'difference';
      tooltip.style.fontWeight = 'normal';
      tooltip.style.pointerEvents = 'none';
      tooltip.textContent = data.title;
      document.body.appendChild(tooltip);

      const updateTooltipPosition = (e) => {
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
      };
      
      document.addEventListener('mousemove', updateTooltipPosition);
      
      return () => {
        document.removeEventListener('mousemove', updateTooltipPosition);
        tooltip.remove();
      };
    } else {
      gl.domElement.style.cursor = 'auto';
      const tooltip = document.getElementById('card-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    }
  }, [hovered, gl, data.title]);

  useEffect(() => {
    if (hovered) {
      materials[4].color.set('#ff9f9f');
      materials[0].color.set('#ff9f9f');
    } else {
      materials[4].color.set('#ffffff');
      materials[0].color.set(data.color);
    }
  }, [hovered, data.color]);

  const { springPosition, springRotation, springScale } = useSpring({
    springPosition: position,
    springRotation: rotation,
    springScale: hovered ? [1.05, 1.05, 1.05] : [1, 1, 1],
    config: {
      duration: 600,
      easing: t => {
        const x1 = 0.34;
        const y1 = 1.56;
        const x2 = 0.1;
        const y2 = 1;

        let start = 0;
        let end = 1;
        const epsilon = 1e-6;

        let t0 = t;
        let t1;
        let t2;
        let x;
        let i = 0;

        do {
          t2 = t0 * t0;
          t1 = t2 * t0;
          x = 3 * t2 * (1 - t0) * x1 + 3 * t0 * (1 - t0) * (1 - t0) * x2 + t1;
          if (Math.abs(x - t) < epsilon) break;
          t0 -= (x - t) / (3 * t2 * (1 - x1) + 6 * t0 * (1 - t0) * (x1 - x2) + 3 * (1 - t0) * (1 - t0) * x2);
          if (++i > 10) break;
        } while (true);

        return 3 * t0 * t0 * (1 - t0) * y1 + 3 * t0 * (1 - t0) * (1 - t0) * y2 + t0 * t0 * t0;
      }
    },
    immediate: !isFiltered
  });

  useFrame((state, delta) => {
    if (isTransitioning && meshRef.current) {
      if (startTimeRef.current === null) {
        startTimeRef.current = state.clock.getElapsedTime();
      }

      const currentTime = state.clock.getElapsedTime();
      const elapsedTime = currentTime - startTimeRef.current;
      
      if (elapsedTime >= transitionDelay) {
        const animationProgress = Math.min((elapsedTime - transitionDelay) * 2, 1);
        meshRef.current.position.y += delta * 3;
        materials.forEach(material => {
          material.opacity = 1 - animationProgress;
        });
      }
    } else {
      startTimeRef.current = null;
      if (meshRef.current) {
        materials.forEach(material => {
          material.opacity = 1;
        });
      }
    }
  });

  const cardScale = useMemo(() => {
    const aspectRatio = size.width / size.height;
    const baseScale = 1;
    
    const scale = aspectRatio < 1 
      ? baseScale * Math.max(aspectRatio, 0.8)
      : baseScale;
    
    return [scale, scale * 1.3, 0.01];
  }, [size.width, size.height]);

  return (
    <animated.mesh
      ref={meshRef}
      position={springPosition}
      rotation={springRotation}
      scale={springScale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      renderOrder={isSelected ? 1 : -index}
      visible={!isOther && opacity > 0}
      title={data.title}
    >
      <animated.group position-x={hover}>
        <Box args={cardScale}>
          <meshPhysicalMaterial attach="material-0" {...materials[0]} />
          <meshPhysicalMaterial attach="material-1" {...materials[1]} />
          <meshPhysicalMaterial attach="material-2" {...materials[2]} />
          <meshPhysicalMaterial attach="material-3" {...materials[3]} />
          <meshPhysicalMaterial attach="material-4" {...materials[4]} />
          <meshPhysicalMaterial attach="material-5" {...materials[5]} />
        </Box>
      </animated.group>
    </animated.mesh>
  );
};

export default Card; 