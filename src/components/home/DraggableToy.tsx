'use client';

// ============================================
// DRAGGABLE TOY COMPONENT
// ============================================
// Interactive glowing geometric shapes - fixed to viewport

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ToyShape, Vec2 } from '@/components/predictive/types';
import { TOY_COLORS } from '@/components/predictive/config';

interface DraggableToyProps {
  id: string;
  shape: ToyShape;
  initialPosition: Vec2;
  size?: number;
  colorIndex?: number;
  onPositionChange?: (id: string, position: Vec2, isDragging: boolean) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function DraggableToy({
  id,
  shape,
  initialPosition,
  size = 50,
  colorIndex = 0,
  onPositionChange,
}: DraggableToyProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.6);
  const dragStartRef = useRef<Vec2 | null>(null);
  const elementStartRef = useRef<Vec2 | null>(null);

  const color = TOY_COLORS[colorIndex % TOY_COLORS.length];

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      setGlowIntensity(0.5 + 0.3 * Math.sin(time * 2 + colorIndex));
    }, 50);
    return () => clearInterval(interval);
  }, [colorIndex]);

  // Notify parent of position changes
  useEffect(() => {
    onPositionChange?.(id, position, isDragging);
  }, [id, position, isDragging, onPositionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartRef.current = { ...position };
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    elementStartRef.current = { ...position };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !elementStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Keep within viewport
      let newX = elementStartRef.current.x + dx;
      let newY = elementStartRef.current.y + dy;

      newX = Math.max(0, Math.min(window.innerWidth - size, newX));
      newY = Math.max(0, Math.min(window.innerHeight - size, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!dragStartRef.current || !elementStartRef.current) return;

      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;

      let newX = elementStartRef.current.x + dx;
      let newY = elementStartRef.current.y + dy;

      newX = Math.max(0, Math.min(window.innerWidth - size, newX));
      newY = Math.max(0, Math.min(window.innerHeight - size, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      elementStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, size]);

  // Render different shapes
  const renderShape = () => {
    const shapeSize = size * 0.8;

    switch (shape) {
      case 'circle':
        return (
          <div
            style={{
              width: shapeSize,
              height: shapeSize,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${color}66, ${color}33)`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 ${20 * glowIntensity}px ${color}88, inset 0 0 20px ${color}44`,
            }}
          />
        );

      case 'triangle':
        return (
          <svg width={shapeSize} height={shapeSize} viewBox="0 0 100 100">
            <polygon
              points="50,10 90,90 10,90"
              fill={`${color}33`}
              stroke={color}
              strokeWidth="3"
              filter={`drop-shadow(0 0 ${10 * glowIntensity}px ${color})`}
            />
          </svg>
        );

      case 'square':
        return (
          <div
            style={{
              width: shapeSize,
              height: shapeSize,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${color}44, ${color}22)`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 ${15 * glowIntensity}px ${color}66`,
            }}
          />
        );

      case 'diamond':
        return (
          <svg width={shapeSize} height={shapeSize} viewBox="0 0 100 100">
            <polygon
              points="50,5 95,50 50,95 5,50"
              fill={`${color}33`}
              stroke={color}
              strokeWidth="3"
              filter={`drop-shadow(0 0 ${12 * glowIntensity}px ${color})`}
            />
          </svg>
        );

      case 'hexagon':
        return (
          <svg width={shapeSize} height={shapeSize} viewBox="0 0 100 100">
            <polygon
              points="50,5 93,25 93,75 50,95 7,75 7,25"
              fill={`${color}33`}
              stroke={color}
              strokeWidth="3"
              filter={`drop-shadow(0 0 ${12 * glowIntensity}px ${color})`}
            />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`draggable-toy ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : 15,
        touchAction: 'none',
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {renderShape()}
    </div>
  );
}

export default DraggableToy;
