'use client';

// ============================================
// GHOST OBJECT VISUAL COMPONENT
// ============================================
// Fading memory visualization for objects that disappeared

import React, { useState, useEffect } from 'react';
import type { MemorizedObject } from '../types';
import { CONFIG } from '../config';

interface GhostObjectProps {
  memory: MemorizedObject;
  fadeStartTime: number;
}

export function GhostObject({ memory, fadeStartTime }: GhostObjectProps) {
  const [opacity, setOpacity] = useState(0.6);

  useEffect(() => {
    const interval = setInterval(() => {
      const age = Date.now() - fadeStartTime;
      const progress = Math.min(1, age / 2000); // 2 second fade
      setOpacity((1 - progress) * 0.6);
    }, 50);

    return () => clearInterval(interval);
  }, [fadeStartTime]);

  if (opacity <= 0.05) return null;

  const { bounds, centroid } = memory.features;

  return (
    <g className="ghost-object" opacity={opacity}>
      {/* Ghost outline */}
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        rx={CONFIG.BBOX_BORDER_RADIUS}
        fill="none"
        stroke={CONFIG.COLORS.memoryGhost}
        strokeWidth={1.5}
        strokeDasharray="8 6"
      />

      {/* Dissolving particles effect */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 10 + Math.random() * 20;
        const x = centroid.x + Math.cos(angle) * radius;
        const y = centroid.y + Math.sin(angle) * radius;

        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2}
            fill={CONFIG.COLORS.memoryGhost}
            opacity={opacity * 0.5}
          />
        );
      })}

      {/* "Gone" indicator */}
      <g transform={`translate(${centroid.x}, ${centroid.y})`}>
        <circle
          cx={0}
          cy={0}
          r={16}
          fill="rgba(0, 0, 0, 0.4)"
        />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={CONFIG.COLORS.confusion}
          fontSize={12}
          fontWeight={500}
        >
          ?
        </text>
      </g>
    </g>
  );
}

export default GhostObject;
