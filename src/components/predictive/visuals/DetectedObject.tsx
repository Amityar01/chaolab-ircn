'use client';

// ============================================
// DETECTED OBJECT VISUAL COMPONENT
// ============================================
// Bounding box + P(static) label for perceived objects

import React from 'react';
import type { MemorizedObject } from '../types';
import { CONFIG, getPStaticColor, getMemoryOpacity } from '../config';
import { getPStaticLabel } from '../cognition';

interface DetectedObjectProps {
  object: MemorizedObject;
  showLabel?: boolean;
}

export function DetectedObject({ object, showLabel = true }: DetectedObjectProps) {
  const { features, pStatic, confidence, isCurrentlyVisible } = object;
  const { bounds } = features;

  // Colors based on P(static)
  const boxColor = getPStaticColor(pStatic);
  const opacity = getMemoryOpacity(confidence, isCurrentlyVisible);

  // Label
  const label = getPStaticLabel(pStatic);

  // Styling based on visibility
  const strokeDasharray = isCurrentlyVisible ? 'none' : '6 4';
  const strokeWidth = isCurrentlyVisible ? CONFIG.BBOX_STROKE_WIDTH : 1.5;

  return (
    <g className="detected-object" opacity={opacity}>
      {/* Glow effect for visible objects */}
      {isCurrentlyVisible && (
        <rect
          x={bounds.x - CONFIG.BBOX_PADDING - 4}
          y={bounds.y - CONFIG.BBOX_PADDING - 4}
          width={bounds.width + (CONFIG.BBOX_PADDING + 4) * 2}
          height={bounds.height + (CONFIG.BBOX_PADDING + 4) * 2}
          rx={CONFIG.BBOX_BORDER_RADIUS + 4}
          fill="none"
          stroke={boxColor}
          strokeWidth={1}
          opacity={0.2}
        />
      )}

      {/* Main bounding box */}
      <rect
        x={bounds.x - CONFIG.BBOX_PADDING}
        y={bounds.y - CONFIG.BBOX_PADDING}
        width={bounds.width + CONFIG.BBOX_PADDING * 2}
        height={bounds.height + CONFIG.BBOX_PADDING * 2}
        rx={CONFIG.BBOX_BORDER_RADIUS}
        fill="none"
        stroke={boxColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />

      {/* Memory icon for remembered (not visible) objects */}
      {!isCurrentlyVisible && (
        <g transform={`translate(${bounds.x + bounds.width + 4}, ${bounds.y - 4})`}>
          <text
            fontSize={10}
            fill={boxColor}
            opacity={0.8}
          >
            👁
          </text>
        </g>
      )}

      {/* P(static) label */}
      {showLabel && (
        <g transform={`translate(${bounds.x + bounds.width / 2}, ${bounds.y - 10})`}>
          {/* Background pill */}
          <rect
            x={-20}
            y={-10}
            width={40}
            height={16}
            rx={8}
            fill="rgba(0, 0, 0, 0.6)"
          />
          {/* Label text */}
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={boxColor}
            fontSize={10}
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

export default DetectedObject;
