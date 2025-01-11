import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import { Box, Environment, OrthographicCamera, Plane } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { cardData } from '../data/cardData';

// 이미지에서 주요 색상을 추출하는 함수
const extractColors = (image) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0);
  
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const colorCounts = {};
  
  // 픽셀 데이터를 5픽셀 간격으로 샘플링하여 성능 최적화
  for(let i = 0; i < pixels.length; i += 4 * 5) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const rgb = `${r},${g},${b}`;
    colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
  }
  
  // 가장 많이 사용된 색상 2개 추출
  const sortedColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([color]) => color.split(',').map(Number));
  
  return sortedColors;
};

const Card = ({ position, rotation, index, isSelected, onClick, isOther, opacity = 1, isTransitioning, transitionDelay, data }) => {
  const meshRef = useRef(null);
  const startTimeRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [dominantColors, setDominantColors] = useState(null);
  const materialsRef = useRef(null);
  const { gl } = useThree();

  // 그라디언트 텍스처 생성 함수
  const createGradientTexture = useCallback((colors) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    if (colors && colors.length >= 2) {
      gradient.addColorStop(0, `rgb(${colors[0].join(',')})`);
      gradient.addColorStop(1, `rgb(${colors[1].join(',')})`);
    } else {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f0f0f0');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // 초기 materials 생성
  useEffect(() => {
    if (!materialsRef.current) {
      const gradientTexture = createGradientTexture(null);
      
      const sideMaterial = new THREE.MeshPhysicalMaterial({
        map: gradientTexture,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        roughness: 0,
        metalness: .5,
        transmission: 1,
        clearcoat: 1.0,
        clearcoatRoughness: 0,
        ior: .2,
        thickness: 1,
        attenuationDistance: 1,
        reflectivity: 1,
        envMapIntensity: 1,
        depthWrite: false
      });

      const frontMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 1,
        side: THREE.FrontSide,
        depthWrite: true,
      });

      const backMaterial = new THREE.MeshPhysicalMaterial({
        transparent: true,
        opacity: 1,
        side: THREE.BackSide,
        roughness: 0,
        metalness: 0.5,
        transmission: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0,
        ior: 1.5,
        reflectivity: 1,
        envMapIntensity: 2,
        depthWrite: true,
      });

      materialsRef.current = [
        sideMaterial, // right
        sideMaterial, // left
        sideMaterial, // top
        sideMaterial, // bottom
        frontMaterial, // front
        backMaterial  // back
      ];

      if (data) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(data.coverImg, (loadedTexture) => {
          const image = loadedTexture.image;
          const colors = extractColors(image);
          setDominantColors(colors);

          // 추출된 색상으로 뒷면 컬러 설정
          if (colors && colors.length > 0) {
            const [r, g, b] = colors[0];
            backMaterial.color = new THREE.Color(r/255, g/255, b/255);
            // 뒷면 텍스처 블렌딩 모드 설정
            backMaterial.map = texture;
            backMaterial.map.encoding = THREE.sRGBEncoding;
            backMaterial.blending = THREE.MultiplyBlending;
          }
        });
        const alphaTexture = textureLoader.load('/images/alpha.png');
        
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        
        // 앞면 텍스처 적용
        frontMaterial.map = texture;
        frontMaterial.alphaMap = alphaTexture;
      }
    }
  }, [data, createGradientTexture, gl]);

  // dominantColors가 변경될 때만 사이드 재질 업데이트
  useEffect(() => {
    if (materialsRef.current && dominantColors) {
      const gradientTexture = createGradientTexture(dominantColors);
      materialsRef.current.forEach((material, index) => {
        if (index !== 4) { // 앞면(4번)을 제외한 나머지만 업데이트
          if (index === 5) { // 뒷면인 경우
            const [r, g, b] = dominantColors[0];
            material.color = new THREE.Color(r/255, g/255, b/255);
          } else { // 측면인 경우
            material.map = gradientTexture;
          }
          material.needsUpdate = true;
        }
      });
    }
  }, [dominantColors, createGradientTexture]);

  // hover 효과만을 위한 스프링
  const { hover } = useSpring({
    hover: hovered ? 0.5 : 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 60
    }
  });

  useEffect(() => {
    if (hovered) {
      materialsRef.current.forEach((material, index) => {
        if (index !== 4) {
          material.opacity = 0.3;
        }
      });
    } else {
      materialsRef.current.forEach((material, index) => {
        if (index !== 4) {
          material.opacity = 0.6;
        }
      });
    }
  }, [hovered]);

  // 기본 위치는 애니메이션 없이 직접 설정
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
      tooltip.textContent = data ? data.title : 'Card';
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
  }, [hovered, gl, data]);

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
    }
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
      }
    } else if (startTimeRef.current !== null) {
      startTimeRef.current = null;
    }
  });

  const cardScale = [1, 1.3, 0.015];

  return (
    <animated.mesh
      ref={meshRef}
      position={springPosition}
      rotation={springRotation}
      scale={springScale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      visible={!isOther && opacity > 0}
    >
      <animated.group position-x={hover}>
        <Box args={cardScale}>
          {materialsRef.current?.map((material, index) => 
            index === 4 || index === 5 ? (
              <meshBasicMaterial key={index} attach={`material-${index}`} {...material} />
            ) : (
              <meshPhysicalMaterial key={index} attach={`material-${index}`} {...material} />
            )
          )}
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
    gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.2)');
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
        opacity={1}
      />
    </Plane>
  );
};

const Scene = ({ isTransitioning, selectedYear, selectedMonth }) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const { gl, size } = useThree();
  const animationStartTimeRef = useRef(null);
  
  // 필터링된 카드 데이터
  const filteredCardData = useMemo(() => {
    // 년도와 월이 모두 선택된 경우에만 필터링
    if (!selectedYear || !selectedMonth) return cardData;
    
    return cardData.filter(card => 
      card.year === selectedYear && card.month === selectedMonth
    );
  }, [selectedYear, selectedMonth]);

  const totalCards = filteredCardData.length;
  const isFiltered = selectedYear && selectedMonth;
  const visibleRange = isFiltered ? 1 : 20; // 필터링 시 1개, 아닐 때 20개
  const scrollRef = useRef(0);
  const prevCardsRef = useRef([]);

  const calculateZoom = () => {
    const aspectRatio = size.width / size.height;
    const baseZoom = Math.min(size.width, size.height) * 0.3; // 화면 크기에 비례하여 줌 조절
    return baseZoom * Math.sqrt(aspectRatio);
  };

  const calculateLayout = () => {
    const aspectRatio = size.width / size.height;
    
    // 고정된 간격 사용
    const baseSpacing = 0.45; // 고정된 간격 값
    
    const diagonalLength = Math.sqrt(1 + aspectRatio * aspectRatio);
    const spacing = diagonalLength * baseSpacing;
    
    // z축 간격 고정
    const zSpacing = baseSpacing * 0.35;
    
    return {
      x: spacing * aspectRatio / diagonalLength,
      y: spacing / diagonalLength,
      z: zSpacing
    };
  };

  const calculateStackPosition = (index) => {
    const layout = calculateLayout();
    const position = index;
    
    if (isFiltered) {
      return {
        position: [0, 0, -2], // 필터링 시 중앙에 위치
        rotation: [0.25, Math.PI * -0.15, 0],
        opacity: 1
      };
    }

    // 필터링되지 않았을 때는 기존 대각선 배치
    const aspectRatio = size.width / size.height;
    const startX = -aspectRatio * 1.5;
    const startY = -1.5;
    
    return {
      position: [
        startX + position * layout.x,
        startY + position * layout.y,
        -Math.abs(position) * layout.z - 2
      ],
      rotation: [0.25, Math.PI * -0.15, 0],
      opacity: 1
    };
  };

  // 동적 카드 생성 로직 수정
  const cards = useMemo(() => {
    const currentIndex = Math.floor(scrollRef.current);
    const start = currentIndex - Math.floor(visibleRange / 2);
    const end = currentIndex + Math.ceil(visibleRange / 2);
    
    const cardArray = [];
    
    for (let i = start; i < end; i++) {
      const normalizedIndex = ((i % totalCards) + totalCards) % totalCards;
      const cardPosition = calculateStackPosition(i - scrollRef.current);
      
      const prevCard = prevCardsRef.current.find(
        card => card.normalizedIndex === normalizedIndex
      );
      
      cardArray.push({
        ...cardPosition,
        index: normalizedIndex,
        normalizedIndex,
        displayIndex: i - start,
        absoluteIndex: i,
        zPosition: cardPosition.position[2],
        prevPosition: prevCard ? prevCard.position : cardPosition.position
      });
    }
    
    const sortedCards = cardArray.sort((a, b) => b.zPosition - a.zPosition);
    prevCardsRef.current = sortedCards;
    
    return sortedCards;
  }, [scrollOffset, size.width, size.height, totalCards]);

  const handleWheel = (e) => {
    if (selectedCard !== null) return;
    e.preventDefault();
    
    const delta = -e.deltaY * 0.0015;
    scrollRef.current += delta;
    
    // 부드러운 스크롤을 위해 requestAnimationFrame 사용
    requestAnimationFrame(() => {
      setScrollOffset(prev => prev + delta);
    });
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

  // 필터 변경시 스크롤 초기화
  useEffect(() => {
    scrollRef.current = 0;
    setScrollOffset(0);
  }, [selectedYear, selectedMonth]);

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
      <Environment preset="studio" intensity={10} />
      {cards.map((card) => (
        <Card
          key={`${card.normalizedIndex}-${card.absoluteIndex}`}
          {...card}
          isSelected={selectedCard === card.index}
          isOther={selectedCard !== null && selectedCard !== card.index}
          onClick={() => setSelectedCard(selectedCard === card.index ? null : card.index)}
          isTransitioning={isTransitioning}
          transitionDelay={getTransitionDelay(card.displayIndex)}
          data={filteredCardData[card.index]}
        />
      ))}
      <GradientOverlay />
      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={1.5}
          luminanceSmoothing={1.5}
          height={100}
        />
        <Noise
          opacity={0.02}
          blendFunction={BlendFunction.OVERLAY}
        />
      </EffectComposer>
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