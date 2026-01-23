'use client';

// ============================================
// DRAGGABLE TOY COMPONENT
// ============================================
// Simple glowing geometric shapes - fixed to viewport

import React, { useState, useEffect, useCallback, useRef } from 'react';

type ToyShape =
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'brain-tl'
  | 'brain-tr'
  | 'brain-bl'
  | 'brain-br';

interface DraggableToyProps {
  id: string;
  shape: ToyShape;
  x: number;
  y: number;
  size?: number;
  color: string;
  onDrag: (id: string, x: number, y: number) => void;
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
    // Store offset using document coordinates
    const docX = e.clientX + window.scrollX;
    const docY = e.clientY + window.scrollY;
    dragOffset.current = { x: docX - x, y: docY - y };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [x, y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    // Convert to document coordinates
    const docX = e.clientX + window.scrollX;
    const docY = e.clientY + window.scrollY;
    onDrag(id, docX - dragOffset.current.x, docY - dragOffset.current.y);
  }, [isDragging, id, onDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  // Render different shapes
  const renderShape = () => {
    const isBrainPiece = shape.startsWith('brain-');
    const shapeSize = isBrainPiece ? size : size * 0.8;
    const brainOutline = `
      M50 12
      C41 4 28 8 24 18
      C14 22 12 36 20 44
      C14 52 16 66 28 72
      C28 84 40 92 50 88
      C60 92 72 84 72 72
      C84 66 86 52 80 44
      C88 36 86 22 76 18
      C72 8 59 4 50 12
      Z
    `.trim().replace(/\s+/g, ' ');

    const renderBrainPiece = (piece: 'tl' | 'tr' | 'bl' | 'br') => {
      const gradId = `grad-${id}`;

      const offset = (() => {
        switch (piece) {
          case 'tl':
            return { x: 0, y: 0 };
          case 'tr':
            return { x: 50, y: 0 };
          case 'bl':
            return { x: 0, y: 50 };
          case 'br':
            return { x: 50, y: 50 };
          default:
            return { x: 0, y: 0 };
        }
      })();

      const glow = `drop-shadow(0 0 ${14 * glowIntensity}px ${color})`;
      const outlineStroke = 1.5;
      const detailStroke = 1;
      const frameOpacity = isDragging ? 0.7 : 0.22;

      return (
        <svg width={shapeSize} height={shapeSize} viewBox="0 0 50 50" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="60%" stopColor={color} stopOpacity={0.14} />
              <stop offset="100%" stopColor={color} stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <g transform={`translate(${-offset.x}, ${-offset.y})`} style={{ filter: glow }}>
            <path d={brainOutline} fill={`url(#${gradId})`} stroke={color} strokeWidth={outlineStroke} />

            {/* Gyri lines */}
            <path
              d="M32 22 C24 26 24 36 32 40"
              fill="none"
              stroke={color}
              strokeWidth={detailStroke}
              opacity={0.35}
              strokeLinecap="round"
            />
            <path
              d="M68 22 C76 26 76 36 68 40"
              fill="none"
              stroke={color}
              strokeWidth={detailStroke}
              opacity={0.35}
              strokeLinecap="round"
            />
            <path
              d="M30 48 C22 52 22 62 30 66"
              fill="none"
              stroke={color}
              strokeWidth={detailStroke}
              opacity={0.25}
              strokeLinecap="round"
            />
            <path
              d="M70 48 C78 52 78 62 70 66"
              fill="none"
              stroke={color}
              strokeWidth={detailStroke}
              opacity={0.25}
              strokeLinecap="round"
            />
            <path
              d="M50 18 C44 26 44 36 50 44 C56 36 56 26 50 18"
              fill="none"
              stroke={color}
              strokeWidth={detailStroke}
              opacity={0.22}
              strokeLinejoin="round"
            />

            {/* Subtle center split */}
            <path
              d="M50 16 L50 84"
              fill="none"
              stroke={color}
              strokeWidth={0.7}
              opacity={0.18}
              strokeDasharray="3 3"
            />
            <path
              d="M16 50 L84 50"
              fill="none"
              stroke={color}
              strokeWidth={0.7}
              opacity={0.14}
              strokeDasharray="3 3"
            />
          </g>

          {/* "Broken edge" frame */}
          <rect
            x={1.5}
            y={1.5}
            width={47}
            height={47}
            rx={7}
            fill="none"
            stroke={color}
            strokeWidth={1.2}
            opacity={frameOpacity}
            strokeDasharray="5 4"
          />
        </svg>
      );
    };

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

      case 'brain-tl':
        return renderBrainPiece('tl');

      case 'brain-tr':
        return renderBrainPiece('tr');

      case 'brain-bl':
        return renderBrainPiece('bl');

      case 'brain-br':
        return renderBrainPiece('br');

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : 20,
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.15s ease-out',
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
