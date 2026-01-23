'use client';

// ============================================
// FIREFLY VISUAL COMPONENT
// ============================================
// A beautiful bioluminescent firefly with organic animation

import React, { useMemo } from 'react';
import type { Firefly as FireflyType } from '../types';
import { CONFIG } from '../config';

interface FireflyProps {
  firefly: FireflyType;
  showTrail?: boolean;
}

export function Firefly({ firefly, showTrail = true }: FireflyProps) {
  const {
    position,
    heading,
    hue,
    size,
    glowIntensity,
    wingAngle,
  } = firefly;

  // Memoize gradient IDs to prevent unnecessary re-renders
  const gradientId = useMemo(() => `firefly-glow-${firefly.id}`, [firefly.id]);
  const bodyGradientId = useMemo(() => `firefly-body-${firefly.id}`, [firefly.id]);

  // Convert heading to degrees for rotation
  const rotation = (heading * 180) / Math.PI + 90;

  // Firefly colors
  const glowColor = `hsl(${hue}, 80%, ${55 + glowIntensity * 15}%)`;
  const coreColor = `hsl(${hue}, 90%, ${70 + glowIntensity * 10}%)`;
  const haloColor = `hsla(${hue}, 70%, 90%, ${0.3 * glowIntensity})`;

  // Body dimensions (relative to size)
  const headSize = size * 0.3;
  const thoraxSize = size * 0.4;
  const abdomenWidth = size * 0.5;
  const abdomenHeight = size * 0.8;
  const wingLength = size * 1.2;
  const wingWidth = size * 0.3;

  return (
    <g
      transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}
      style={{ mixBlendMode: 'screen' }}
    >
      {/* Definitions */}
      <defs>
        {/* Main glow gradient */}
        <radialGradient id={gradientId} cx="50%" cy="70%" r="50%">
          <stop offset="0%" stopColor={coreColor} stopOpacity={glowIntensity} />
          <stop offset="40%" stopColor={glowColor} stopOpacity={glowIntensity * 0.7} />
          <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
        </radialGradient>

        {/* Body gradient */}
        <linearGradient id={bodyGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="50%" stopColor="#252538" />
          <stop offset="100%" stopColor={glowColor} />
        </linearGradient>
      </defs>

      {/* Large ambient halo */}
      <circle
        cx={0}
        cy={size * 0.3}
        r={size * 3}
        fill={haloColor}
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Secondary glow layer */}
      <ellipse
        cx={0}
        cy={size * 0.4}
        rx={size * 1.5}
        ry={size * 2}
        fill={`url(#${gradientId})`}
      />

      {/* Wings (translucent, fluttering) */}
      <g opacity={0.15 + glowIntensity * 0.1}>
        {/* Left wing */}
        <ellipse
          cx={-size * 0.4}
          cy={-size * 0.3}
          rx={wingLength}
          ry={wingWidth}
          fill="rgba(200, 220, 255, 0.3)"
          stroke="rgba(200, 220, 255, 0.15)"
          strokeWidth={0.5}
          transform={`rotate(${-30 + wingAngle})`}
        />
        {/* Right wing */}
        <ellipse
          cx={size * 0.4}
          cy={-size * 0.3}
          rx={wingLength}
          ry={wingWidth}
          fill="rgba(200, 220, 255, 0.3)"
          stroke="rgba(200, 220, 255, 0.15)"
          strokeWidth={0.5}
          transform={`rotate(${30 - wingAngle})`}
        />
      </g>

      {/* Body */}
      <g>
        {/* Head */}
        <circle
          cx={0}
          cy={-size * 0.6}
          r={headSize}
          fill="#1a1a2e"
        />
        {/* Eye glints */}
        <circle
          cx={-headSize * 0.4}
          cy={-size * 0.65}
          r={headSize * 0.15}
          fill="rgba(255, 255, 255, 0.4)"
        />
        <circle
          cx={headSize * 0.4}
          cy={-size * 0.65}
          r={headSize * 0.15}
          fill="rgba(255, 255, 255, 0.4)"
        />
        {/* Antennae */}
        <line
          x1={-headSize * 0.3}
          y1={-size * 0.7}
          x2={-headSize * 0.6}
          y2={-size * 1.1}
          stroke="#1a1a2e"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <line
          x1={headSize * 0.3}
          y1={-size * 0.7}
          x2={headSize * 0.6}
          y2={-size * 1.1}
          stroke="#1a1a2e"
          strokeWidth={1}
          strokeLinecap="round"
        />

        {/* Thorax */}
        <ellipse
          cx={0}
          cy={-size * 0.2}
          rx={thoraxSize * 0.8}
          ry={thoraxSize}
          fill="#252538"
        />

        {/* Abdomen (the glowing part!) */}
        <ellipse
          cx={0}
          cy={size * 0.35}
          rx={abdomenWidth}
          ry={abdomenHeight}
          fill={`url(#${bodyGradientId})`}
        />

        {/* Bioluminescent core */}
        <ellipse
          cx={0}
          cy={size * 0.5}
          rx={abdomenWidth * 0.7}
          ry={abdomenHeight * 0.5}
          fill={coreColor}
          opacity={glowIntensity}
        />

        {/* Bright spot */}
        <circle
          cx={0}
          cy={size * 0.4}
          r={size * 0.15}
          fill="white"
          opacity={glowIntensity * 0.8}
        />
      </g>
    </g>
  );
}

export default Firefly;
