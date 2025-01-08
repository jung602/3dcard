import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, OrthographicCamera } from '@react-three/drei';
import Card from './Card';
import GradientOverlay from './GradientOverlay';
import { cardData } from '../../data/cardData';

const Scene = ({ isTransitioning, selectedYear, selectedMonth }) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const { gl, size } = useThree();
  const animationStartTimeRef = useRef(null);
  const [filterAnimationProgress, setFilterAnimationProgress] = useState(1);

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
    
    let adjustedOffset = (offset + index) % totalCards;
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

  useEffect(() => {
    const handleWheel = (e) => {
      if (selectedCard !== null) return;
      e.preventDefault();
      setScrollOffset((prev) => prev + e.deltaY * 0.001);
    };

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

export default Scene; 