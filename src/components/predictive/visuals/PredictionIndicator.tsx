'use client';

// ============================================
// PREDICTION INDICATOR VISUAL COMPONENT
// ============================================
// Shows "!" for surprise, "?" for confusion, glow for confirmation

import React from 'react';
import type { PredictionError, Vec2 } from '../types';
import { CONFIG } from '../config';

interface PredictionIndicatorProps {
  error: PredictionError;
  position: Vec2;
}

export function PredictionIndicator({ error, position }: PredictionIndicatorProps) {
  const { type, confidence, timestamp } = error;

  // Calculate age for animation
  const age = Date.now() - timestamp;
  const progress = Math.min(1, age / CONFIG.ERROR_DISPLAY_DURATION);
  const opacity = 1 - progress;

  if (opacity <= 0) return null;

  if (type === 'positive') {
    // Surprise indicator: "!"
    return (
      <g
        className="surprise-indicator"
        transform={`translate(${position.x}, ${position.y - 30})`}
        opacity={opacity}
      >
        {/* Glow */}
        <circle
          cx={0}
          cy={0}
          r={20}
          fill={CONFIG.COLORS.surprise}
          opacity={0.3 * confidence}
        />

        {/* Background circle */}
        <circle
          cx={0}
          cy={0}
          r={14}
          fill={CONFIG.COLORS.surprise}
          opacity={0.9}
        />

        {/* Exclamation mark */}
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={18}
          fontWeight="bold"
          fontFamily="'JetBrains Mono', monospace"
        >
          !
        </text>

        {/* Pulse ring animation */}
        <circle
          cx={0}
          cy={0}
          r={14 + progress * 20}
          fill="none"
          stroke={CONFIG.COLORS.surprise}
          strokeWidth={2}
          opacity={(1 - progress) * 0.5}
        />
      </g>
    );
  }

  if (type === 'negative') {
    // Confusion indicator: "?"
    const floatOffset = progress * 15; // Float upward

    return (
      <g
        className="confusion-indicator"
        transform={`translate(${position.x}, ${position.y - 30 - floatOffset})`}
        opacity={opacity}
      >
        {/* Glow */}
        <circle
          cx={0}
          cy={0}
          r={18}
          fill={CONFIG.COLORS.confusion}
          opacity={0.2}
        />

        {/* Background circle */}
        <circle
          cx={0}
          cy={0}
          r={12}
          fill={CONFIG.COLORS.confusion}
          opacity={0.8}
        />

        {/* Question mark */}
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={14}
          fontWeight="bold"
          fontFamily="'JetBrains Mono', monospace"
        >
          ?
        </text>
      </g>
    );
  }

  return null;
}

// Confirmation glow component
interface ConfirmationGlowProps {
  position: Vec2;
  size: { width: number; height: number };
  timestamp: number;
}

export function ConfirmationGlow({ position, size, timestamp }: ConfirmationGlowProps) {
  const age = Date.now() - timestamp;
  const duration = 800;
  const progress = Math.min(1, age / duration);
  const opacity = Math.sin(progress * Math.PI) * 0.4;

  if (opacity <= 0) return null;

  return (
    <rect
      className="confirmed-indicator"
      x={position.x - 4}
      y={position.y - 4}
      width={size.width + 8}
      height={size.height + 8}
      rx={CONFIG.BBOX_BORDER_RADIUS + 4}
      fill="none"
      stroke={CONFIG.COLORS.confirmed}
      strokeWidth={3}
      opacity={opacity}
    />
  );
}

export default PredictionIndicator;
