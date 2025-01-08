import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import { Box, Environment, OrthographicCamera, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { cardData } from '../data/cardData';

const Card = ({ position, rotation, index, isSelected, onClick, isOther, data, opacity = 1, isTransitioning, transitionDelay, isFiltered }) => {
  const meshRef = useRef(null);
  const startTimeRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { gl, size } = useThree();
  const prevSizeRef = useRef({ width: size.width, height: size.height });

  // 스처와 메테리얼을 useMemo로 최적화
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

  // 브라우저 크기 변경 감지
  useEffect(() => {
    if (prevSizeRef.current.width !== size.width || prevSizeRef.current.height !== size.height) {
      setIsResizing(true);
      const timer = setTimeout(() => {
        setIsResizing(false);
        prevSizeRef.current = { width: size.width, height: size.height };
      }, 600); // 애니메이션 duration과 동일하게 설정
      return () => clearTimeout(timer);
    }
  }, [size.width, size.height]);

  // hover 효과만을 위한 스프링
  const { hover } = useSpring({
    hover: hovered ? 0.5 : 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 60
    }
  });

  // 기본 위치는 애니메이션 없이 직접 설정
  const meshPosition = isSelected 
    ? [0, 0, 0] 
    : position;

  const finalScale = [1, 1, 1];

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
      // 툴팁 생성
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

      // 마우스 이동에 따른 툴팁 위치 업데이트
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

  // 포지션과 로테이션에 대한 스프링 애니메이션 추가
  const { springPosition, springRotation, springScale } = useSpring({
    springPosition: position,
    springRotation: rotation,
    springScale: hovered ? [1.05, 1.05, 1.05] : [1, 1, 1],
    config: {
      duration: 600,
      easing: t => {
        // cubic-bezier(0.34, 1.56, 0.64, 1)
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
    immediate: !isFiltered // 필터링되지 않은 상태에서는 즉시 적용
  });

  // useFrame에서 스크롤 위치 즉시 업데이트 제거
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

  // 브라우저 크기에 따른 카드 크기 계산
  const cardScale = useMemo(() => {
    const aspectRatio = size.width / size.height;
    const baseScale = 1;
    
    // 화면이 작아질수록 카드 크기도 줄임
    const scale = aspectRatio < 1 
      ? baseScale * Math.max(aspectRatio, 0.8) // 최소 0.7배로 제한
      : baseScale;
    
    return [scale, scale * 1.3, 0.01]; // 원래 카드 비율 [1, 1.3, 0.02] 유지
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

const GradientOverlay = () => {
  const { size, viewport } = useThree();
  
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
    // 화면 크기의 120%로 설정
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

const Scene = ({ isTransitioning, selectedYear, selectedMonth }) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const { gl, size } = useThree();
  const animationStartTimeRef = useRef(null);
  const [filterAnimationProgress, setFilterAnimationProgress] = useState(1);
  const virtualScrollRef = useRef(0);
  const lastDataIndexRef = useRef(0);

  const calculateZoom = () => {
    const baseZoom = 300;
    const aspectRatio = size.width / size.height;
    if (aspectRatio > 1) {
      return baseZoom * Math.sqrt(aspectRatio);
    }
    return baseZoom;
  };

  const calculateLayout = () => {
    const aspectRatio = size.width / size.height;
    const isFiltered = selectedYear || selectedMonth;
    
    const baseSpacing = isFiltered ? 0.15 : 0.4;
    
    const xSpacing = aspectRatio < 1 
      ? baseSpacing * Math.max(aspectRatio, 0.75)
      : baseSpacing * Math.min(aspectRatio, 2);
    
    const ySpacing = aspectRatio < 1
      ? baseSpacing * Math.min(.75/aspectRatio, 2)
      : baseSpacing;
    
    return {
      x: xSpacing,
      y: ySpacing,
      z: baseSpacing * 0.3
    };
  };

  useEffect(() => {
    const startTime = Date.now();
    const duration = 800;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setFilterAnimationProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [selectedYear, selectedMonth]);

  const filteredCardData = useMemo(() => {
    return cardData.filter(card => {
      if (selectedYear && card.year !== selectedYear) return false;
      if (selectedMonth && card.month !== selectedMonth) return false;
      return true;
    });
  }, [selectedYear, selectedMonth]);

  const calculateStackPosition = (index, offset) => {
    const layout = calculateLayout();
    const totalCards = cardData.length;
    const visibleRange = 5;
    
    // 가상 스크롤 위치 계산
    const virtualScroll = virtualScrollRef.current;
    let adjustedOffset = ((virtualScroll + index) % totalCards + totalCards) % totalCards;
    let position = adjustedOffset;
    
    if (position > visibleRange) {
      position -= totalCards;
    } else if (position < -visibleRange) {
      position += totalCards;
    }

    const isFiltered = selectedYear || selectedMonth;
    const defaultPosition = position;
    let filteredPosition = position;
    
    if (isFiltered) {
      const filteredIndex = filteredCardData.findIndex(card => card.id === cardData[index].id);
      if (filteredIndex !== -1) {
        const centerOffset = -(filteredCardData.length - 1) / 2;
        filteredPosition = filteredIndex + centerOffset;
      } else {
        filteredPosition = position * 3;
      }
    }

    const interpolatedPosition = {
      x: defaultPosition * layout.x * (1 - filterAnimationProgress) + filteredPosition * layout.x * filterAnimationProgress,
      y: defaultPosition * layout.y * (1 - filterAnimationProgress) + filteredPosition * layout.y * 0.8 * filterAnimationProgress,
      z: -Math.abs(defaultPosition) * layout.z * (1 - filterAnimationProgress) + -Math.abs(filteredPosition) * layout.z * filterAnimationProgress
    };

    const cardOpacity = isFiltered ? 
      (filteredCardData.some(card => card.id === cardData[index].id) ? 1 : 0) : 
      1;
    
    return {
      position: [
        interpolatedPosition.x,
        interpolatedPosition.y,
        interpolatedPosition.z
      ],
      rotation: [0.25, Math.PI * -0.15, 0],
      opacity: cardOpacity
    };
  };

  const cards = useMemo(() => {
    return cardData.map((data, i) => {
      const cardPosition = calculateStackPosition(i, scrollOffset);
      return {
        ...cardPosition,
        index: i,
        data: data,
        zPosition: cardPosition.position[2]
      };
    })
    .sort((a, b) => b.zPosition - a.zPosition)
    .map((card, displayIndex) => ({
      ...card,
      displayIndex
    }));
  }, [scrollOffset, filterAnimationProgress]);

  useEffect(() => {
    const handleResize = () => {
      setScrollOffset(prev => prev + 0.0001);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e) => {
    if (selectedCard !== null) return;
    e.preventDefault();
    
    // 가상 스크롤 업데이트
    virtualScrollRef.current += e.deltaY * 0.001;
    
    // 실제 스크롤 오프셋 업데이트
    setScrollOffset(prev => prev + e.deltaY * 0.001);
    
    // 데이터 순환을 위한 인덱스 계산
    const totalCards = cardData.length;
    const currentIndex = Math.floor(Math.abs(virtualScrollRef.current)) % totalCards;
    
    if (currentIndex !== lastDataIndexRef.current) {
      lastDataIndexRef.current = currentIndex;
    }
  };

  useEffect(() => {
    const domElement = gl.domElement;
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => domElement.removeEventListener('wheel', handleWheel);
  }, [gl, selectedCard]);

  useEffect(() => {
    if (isTransitioning) {
      animationStartTimeRef.current = Date.now();
    } else {
      animationStartTimeRef.current = null;
    }
  }, [isTransitioning]);

  const getTransitionDelay = (displayIndex) => {
    return Math.max(0, (displayIndex - 2)) * 0.05;
  };

  return (
    <>
      <color attach="background" args={['#FFFFFF']} />
      <OrthographicCamera
        makeDefault
        position={[0, 0, 5]}
        zoom={calculateZoom()}
        rotation={[0, 0, 0]}
        up={[0, 1, 0]}
      />
      <Environment preset="studio" intensity={1} />
      <directionalLight position={[0, 5, 5]} intensity={1} />
      {cards.map((card) => (
        <Card
          key={card.index}
          {...card}
          isSelected={selectedCard === card.index}
          isOther={selectedCard !== null && selectedCard !== card.index}
          onClick={() => setSelectedCard(selectedCard === card.index ? null : card.index)}
          isTransitioning={isTransitioning}
          transitionDelay={getTransitionDelay(card.displayIndex)}
        />
      ))}
      <GradientOverlay />
    </>
  );
};

export const Cards3D = ({ isTransitioning, selectedYear, selectedMonth }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas>
        <Scene 
          isTransitioning={isTransitioning}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </Canvas>
    </div>
  );
}; 