'use client';

// ============================================
// FOV CONE VISUAL COMPONENT
// ============================================
// Visualizes the firefly's field of view / attention

import React, { useMemo } from 'react';
import type { Vec2 } from '../types';
import { CONFIG } from '../config';
import { getFOVConePoints } from '../cognition';

interface FOVConeProps {
  position: Vec2;
  heading: number;
  fovAngle?: number;
  radius?: number;
  fireflyId: string;
}

export function FOVCone({
  position,
  heading,
  fovAngle = CONFIG.FOV_ANGLE,
  radius = CONFIG.SENSE_RADIUS,
  fireflyId,
}: FOVConeProps) {
  // Calculate cone points
  const points = useMemo(
    () => getFOVConePoints(position, heading, fovAngle, radius),
    [position.x, position.y, heading, fovAngle, radius]
  );

  // Create SVG path
  const pathD = useMemo(() => {
    if (points.length < 3) return '';

    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return path + ' Z';
  }, [points]);

  // Gradient ID for this cone
  const gradientId = `fov-gradient-${fireflyId}`;

  return (
    <g className="fov-cone" style={{ mixBlendMode: 'screen' }}>
      <defs>
        <radialGradient
          id={gradientId}
          cx={position.x}
          cy={position.y}
          r={radius}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={CONFIG.COLORS.fireflyGlow} stopOpacity={CONFIG.FOV_FILL_OPACITY * 2} />
          <stop offset="60%" stopColor={CONFIG.COLORS.fireflyGlow} stopOpacity={CONFIG.FOV_FILL_OPACITY} />
          <stop offset="100%" stopColor={CONFIG.COLORS.fireflyGlow} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Fill */}
      <path
        d={pathD}
        fill={`url(#${gradientId})`}
        opacity={0.8}
      />

      {/* Edge stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={CONFIG.COLORS.fovStroke}
        strokeWidth={1}
        opacity={0.6}
      />
    </g>
  );
}

export default FOVCone;
