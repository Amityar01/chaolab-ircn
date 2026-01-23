'use client';

// ============================================
// EDGE CELLS VISUAL COMPONENT
// ============================================
// Visualizes edge detection - neural activation sparkles

import React from 'react';
import type { EdgeCell } from '../types';
import { CONFIG } from '../config';

interface EdgeCellsProps {
  cells: EdgeCell[];
  gridSize?: number;
  time?: number;
}

export function EdgeCells({
  cells,
  gridSize = CONFIG.GRID_SIZE,
  time = 0,
}: EdgeCellsProps) {
  if (cells.length === 0) return null;

  return (
    <g className="edge-cells" style={{ mixBlendMode: 'screen' }}>
      {cells.map((cell, index) => {
        // Staggered pulse animation based on position
        const pulseOffset = (cell.x + cell.y) * 0.3 + index * 0.1;
        const pulse = 0.5 + 0.5 * Math.sin(time * CONFIG.EDGE_CELL_PULSE_SPEED + pulseOffset);
        const opacity = CONFIG.EDGE_CELL_OPACITY * (0.6 + pulse * 0.4);

        return (
          <g key={`${cell.x}-${cell.y}`}>
            {/* Glow behind */}
            <rect
              x={cell.worldX - gridSize / 2 - 2}
              y={cell.worldY - gridSize / 2 - 2}
              width={gridSize + 4}
              height={gridSize + 4}
              fill={CONFIG.COLORS.edgeCellGlow}
              opacity={opacity * 0.3}
              rx={2}
            />
            {/* Main cell */}
            <rect
              x={cell.worldX - gridSize / 2}
              y={cell.worldY - gridSize / 2}
              width={gridSize}
              height={gridSize}
              fill={CONFIG.COLORS.edgeCell}
              opacity={opacity}
              rx={1}
            />
            {/* Sparkle highlight */}
            <circle
              cx={cell.worldX}
              cy={cell.worldY}
              r={gridSize * 0.2}
              fill="white"
              opacity={pulse * 0.5}
            />
          </g>
        );
      })}
    </g>
  );
}

export default EdgeCells;
