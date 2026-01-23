'use client';

// ============================================
// PREDICTIVE CANVAS
// ============================================
// Main SVG container for all firefly visualizations

import React, { useMemo } from 'react';
import type { Obstacle, Bounds, Firefly as FireflyType } from './types';
import { CONFIG } from './config';
import {
  Firefly,
  FOVCone,
  EdgeCells,
  DetectedObject,
  PredictionIndicator,
  ParticleField,
} from './visuals';

interface PredictiveCanvasProps {
  fireflies: FireflyType[];
  canvasBounds: Bounds;
  time: number;
  showParticles?: boolean;
  showFOV?: boolean;
  showEdges?: boolean;
  showMemory?: boolean;
  className?: string;
}

export function PredictiveCanvas({
  fireflies,
  canvasBounds,
  time,
  showParticles = true,
  showFOV = true,
  showEdges = true,
  showMemory = true,
  className = '',
}: PredictiveCanvasProps) {
  const { width, height } = canvasBounds;

  if (width === 0 || height === 0) return null;

  return (
    <div
      className={`firefly-canvas ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 5,
        contain: 'layout style',
      }}
    >
      {/* Ambient particles */}
      {showParticles && (
        <ParticleField
          width={width}
          height={height}
          count={CONFIG.PARTICLE_COUNT}
        />
      )}

      {/* Main SVG canvas */}
      <svg
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* FOV cones (behind everything) */}
        {showFOV && fireflies.map(firefly => (
          <FOVCone
            key={`fov-${firefly.id}`}
            position={firefly.position}
            heading={firefly.heading}
            fireflyId={firefly.id}
          />
        ))}

        {/* Edge detection cells */}
        {showEdges && fireflies.map(firefly => (
          <EdgeCells
            key={`edges-${firefly.id}`}
            cells={firefly.currentPerception.flatMap(obj => obj.cells)}
            time={time}
          />
        ))}

        {/* Detected/Remembered objects */}
        {showMemory && fireflies.map(firefly =>
          firefly.memory.map(mem => (
            <DetectedObject
              key={`obj-${firefly.id}-${mem.id}`}
              object={mem}
            />
          ))
        )}

        {/* Prediction error indicators */}
        {fireflies.map(firefly =>
          firefly.predictionState.activeErrors.map((error, i) => (
            <PredictionIndicator
              key={`error-${firefly.id}-${i}-${error.timestamp}`}
              error={error}
              position={firefly.position}
            />
          ))
        )}

        {/* Fireflies (on top) */}
        {fireflies.map(firefly => (
          <Firefly
            key={firefly.id}
            firefly={firefly}
          />
        ))}
      </svg>

      {/* Vignette overlay */}
      <div className="vignette" />
    </div>
  );
}

export default PredictiveCanvas;
