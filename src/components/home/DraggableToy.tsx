'use client';

// ============================================
// DRAGGABLE TOY COMPONENT
// ============================================
// Simple glowing geometric shapes

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface DraggableToyProps {
  id: string;
  shape: 'circle' | 'triangle' | 'diamond' | 'hexagon';
  x: number;
  y: number;
  size?: number;
  color: string;
  onDrag: (id: string, newX: number, newY: number) => void;
}

export function DraggableToy({
  id,
  shape,
  x,
  y,
  size = 50,
  color,
  onDrag,
}: DraggableToyProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.6);

  // Track offset from click point to toy position
  const dragOffset = useRef({ x: 0, y: 0 });

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      setGlowIntensity(0.5 + 0.3 * Math.sin(time * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate offset from click point to toy's top-left corner
    const scrollY = window.scrollY;
    dragOffset.current = {
      x: e.clientX - x,
      y: e.clientY + scrollY - y,
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [x, y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    // Calculate new position maintaining the offset
    const scrollY = window.scrollY;
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY + scrollY - dragOffset.current.y;

    onDrag(id, newX, newY);
  }, [isDragging, id, onDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

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
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : 15,
        touchAction: isDragging ? 'none' : 'auto', // Allow scroll when not dragging
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: isDragging ? 'none' : 'transform 0.1s',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {renderShape()}
    </div>
  );
}

export default DraggableToy;
