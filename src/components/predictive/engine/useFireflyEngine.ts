'use client';

// ============================================
// FIREFLY ENGINE HOOK
// ============================================
// Main orchestration: animation loop, state management, cognitive updates

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Firefly, Obstacle, EngineState, Bounds, ObjectFeatures, PredictionError } from '../types';
import { CONFIG } from '../config';
import {
  findEdgeCells,
  segmentEdgesIntoObjects,
  mergeCloseObjects,
  updateMemory,
  decayMemory,
  findMissingObjects,
  processPredictionUpdate,
  updatePredictionState,
  createPredictionState,
  updateNavigation,
} from '../cognition';

/**
 * Create a new firefly with distributed positions
 */
function createFirefly(id: string, canvasBounds: Bounds, index: number = 0, total: number = 1): Firefly {
  // Distribute fireflies across screen in a grid pattern
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);

  const cellWidth = canvasBounds.width / cols;
  const cellHeight = Math.min(canvasBounds.height, 800) / rows; // Limit to viewport

  // Position within cell with some randomness
  const x = cellWidth * (col + 0.3 + Math.random() * 0.4);
  const y = cellHeight * (row + 0.3 + Math.random() * 0.4) + 100; // Offset from top
  const heading = Math.random() * Math.PI * 2;

  return {
    id,
    position: { x, y },
    velocity: {
      x: Math.cos(heading) * CONFIG.BASE_SPEED,
      y: Math.sin(heading) * CONFIG.BASE_SPEED,
    },
    heading,
    targetHeading: heading,
    hue: CONFIG.FIREFLY_HUE_MIN + Math.random() * (CONFIG.FIREFLY_HUE_MAX - CONFIG.FIREFLY_HUE_MIN),
    size: CONFIG.FIREFLY_BASE_SIZE + (Math.random() - 0.5) * CONFIG.FIREFLY_SIZE_VARIANCE,
    glowIntensity: CONFIG.GLOW_MIN + Math.random() * (CONFIG.GLOW_MAX - CONFIG.GLOW_MIN),
    pulsePhase: Math.random() * Math.PI * 2,
    wingAngle: 0,
    memory: [],
    currentPerception: [],
    predictionState: createPredictionState(),
    isAvoiding: false,
  };
}

/**
 * Update firefly visuals (glow, wings)
 */
function updateFireflyVisuals(firefly: Firefly, time: number): Partial<Firefly> {
  // Pulsing glow (like breathing)
  const glowIntensity =
    CONFIG.GLOW_MIN +
    (CONFIG.GLOW_MAX - CONFIG.GLOW_MIN) *
    (0.5 + 0.5 * Math.sin(time * CONFIG.PULSE_SPEED + firefly.pulsePhase));

  // Wing flutter
  const wingAngle = Math.sin(time * CONFIG.WING_FLUTTER_SPEED) * CONFIG.WING_FLUTTER_ANGLE;

  return { glowIntensity, wingAngle };
}

/**
 * Process perception for a firefly
 */
function processPerception(
  firefly: Firefly,
  obstacles: Obstacle[],
  canvasBounds: Bounds
): {
  perception: ObjectFeatures[];
  errors: PredictionError[];
  confirmed: string[];
  updatedFirefly: Firefly;
} {
  // Find edge cells in FOV
  const edges = findEdgeCells(
    firefly.position,
    firefly.heading,
    obstacles,
    canvasBounds
  );

  // Segment into objects
  let detectedObjects = segmentEdgesIntoObjects(edges);
  detectedObjects = mergeCloseObjects(detectedObjects);

  // Create obstacle ID map for memory association
  const obstacleIdMap = new Map<string, string>();
  for (const obj of detectedObjects) {
    for (const obstacle of obstacles) {
      const b = obstacle.bounds;
      // Check if this detected object overlaps with an obstacle
      if (
        obj.bounds.x < b.x + b.width &&
        obj.bounds.x + obj.bounds.width > b.x &&
        obj.bounds.y < b.y + b.height &&
        obj.bounds.y + obj.bounds.height > b.y
      ) {
        const key = `${Math.round(obj.bounds.x)},${Math.round(obj.bounds.y)},${Math.round(obj.bounds.width)},${Math.round(obj.bounds.height)}`;
        obstacleIdMap.set(key, obstacle.id);
        break;
      }
    }
  }

  // Update memory with visible objects
  const { memory: newMemory, matched, newObjects, movedObjects } = updateMemory(
    detectedObjects,
    firefly.memory,
    16, // deltaTime
    obstacleIdMap
  );

  // Find objects that should be visible but aren't
  const currentVisibleIds = new Set(newMemory.filter(m => m.isCurrentlyVisible).map(m => m.id));
  const missingObjects = findMissingObjects(
    firefly.position,
    firefly.heading,
    newMemory,
    currentVisibleIds
  );

  // Process prediction errors
  const { errors, confirmed, updatedMemory } = processPredictionUpdate(
    detectedObjects,
    newMemory,
    matched,
    movedObjects,
    missingObjects
  );

  // Decay old memories
  const decayedMemory = decayMemory(updatedMemory, 16);

  // Update prediction state
  const newPredictionState = updatePredictionState(
    firefly.predictionState,
    errors,
    confirmed
  );

  return {
    perception: detectedObjects,
    errors,
    confirmed,
    updatedFirefly: {
      ...firefly,
      memory: decayedMemory,
      currentPerception: detectedObjects,
      predictionState: newPredictionState,
    },
  };
}

/**
 * Main firefly engine hook
 */
export function useFireflyEngine(
  obstacles: Obstacle[],
  canvasBounds: Bounds,
  fireflyCount: number = CONFIG.FIREFLY_COUNT,
  enabled: boolean = true
) {
  const [state, setState] = useState<EngineState>({
    fireflies: [],
    obstacles: [],
    canvasBounds: { x: 0, y: 0, width: 0, height: 0 },
    time: 0,
    deltaTime: 16,
    isRunning: false,
  });

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const perceptionIntervalRef = useRef<number>(0);

  // Initialize fireflies when canvas bounds change
  useEffect(() => {
    if (canvasBounds.width > 0 && canvasBounds.height > 0) {
      setState(prev => {
        // Only reinitialize if we don't have fireflies or bounds changed significantly
        if (
          prev.fireflies.length !== fireflyCount ||
          Math.abs(prev.canvasBounds.width - canvasBounds.width) > 100 ||
          Math.abs(prev.canvasBounds.height - canvasBounds.height) > 100
        ) {
          const fireflies = Array.from({ length: fireflyCount }, (_, i) =>
            createFirefly(`firefly_${i}`, canvasBounds, i, fireflyCount)
          );
          return {
            ...prev,
            fireflies,
            canvasBounds,
            isRunning: enabled,
          };
        }
        return { ...prev, canvasBounds, obstacles };
      });
    }
  }, [canvasBounds.width, canvasBounds.height, fireflyCount, enabled]);

  // Update obstacles reference
  useEffect(() => {
    setState(prev => ({ ...prev, obstacles }));
  }, [obstacles]);

  // Animation loop
  useEffect(() => {
    if (!enabled || state.canvasBounds.width === 0) return;

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setState(prev => {
        const time = prev.time + deltaTime / 1000;
        perceptionIntervalRef.current += deltaTime;

        // Process perception less frequently (optimization)
        const shouldUpdatePerception =
          perceptionIntervalRef.current >= CONFIG.PERCEPTION_UPDATE_INTERVAL;
        if (shouldUpdatePerception) {
          perceptionIntervalRef.current = 0;
        }

        const updatedFireflies = prev.fireflies.map(firefly => {
          // Update visuals every frame
          const visuals = updateFireflyVisuals(firefly, time);

          // Process perception periodically
          let cognitiveUpdates: Partial<Firefly> = {};
          if (shouldUpdatePerception) {
            const { updatedFirefly } = processPerception(
              firefly,
              prev.obstacles,
              prev.canvasBounds
            );
            cognitiveUpdates = {
              memory: updatedFirefly.memory,
              currentPerception: updatedFirefly.currentPerception,
              predictionState: updatedFirefly.predictionState,
            };
          }

          // Update navigation every frame (with hard collision against obstacles)
          const navigation = updateNavigation(
            { ...firefly, ...cognitiveUpdates },
            prev.canvasBounds,
            prev.obstacles
          );

          return {
            ...firefly,
            ...visuals,
            ...cognitiveUpdates,
            ...navigation,
          };
        });

        return {
          ...prev,
          fireflies: updatedFireflies,
          time,
          deltaTime,
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, state.canvasBounds.width, state.canvasBounds.height]);

  // Handle reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setState(prev => ({ ...prev, isRunning: !mediaQuery.matches && enabled }));
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enabled]);

  return {
    fireflies: state.fireflies,
    time: state.time,
    isRunning: state.isRunning && enabled,
  };
}

export default useFireflyEngine;
