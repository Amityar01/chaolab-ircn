'use client';

// ============================================
// OBSTACLE TRACKER HOOK
// ============================================
// Tracks DOM element positions to create obstacle data for fireflies

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Obstacle, Bounds, ObstacleType } from '../types';

interface TrackedElement {
  id: string;
  ref: React.RefObject<HTMLElement | null>;
  type: ObstacleType;
  padding?: number;
}

/**
 * Hook to track DOM elements and convert them to obstacles
 */
export function useObstacleTracker(
  trackedElements: TrackedElement[],
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [canvasBounds, setCanvasBounds] = useState<Bounds>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const updateObstacles = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Update canvas bounds
    setCanvasBounds({
      x: 0,
      y: 0,
      width: containerRect.width,
      height: containerRect.height,
    });

    // Convert tracked elements to obstacles
    const newObstacles: Obstacle[] = [];

    for (const tracked of trackedElements) {
      if (!tracked.ref.current) continue;

      const rect = tracked.ref.current.getBoundingClientRect();
      const padding = tracked.padding ?? 0;

      // Convert to container-relative coordinates
      const bounds: Bounds = {
        x: rect.left - containerRect.left - padding,
        y: rect.top - containerRect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };

      // Skip if element is not visible or has no size
      if (bounds.width <= 0 || bounds.height <= 0) continue;

      // Skip if element is outside container
      if (
        bounds.x + bounds.width < 0 ||
        bounds.x > containerRect.width ||
        bounds.y + bounds.height < 0 ||
        bounds.y > containerRect.height
      ) {
        continue;
      }

      newObstacles.push({
        id: tracked.id,
        type: tracked.type,
        bounds,
      });
    }

    setObstacles(newObstacles);
  }, [trackedElements, containerRef]);

  // Update on mount and resize
  useEffect(() => {
    updateObstacles();

    const resizeObserver = new ResizeObserver(() => {
      updateObstacles();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize
    window.addEventListener('resize', updateObstacles);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateObstacles);
    };
  }, [updateObstacles, containerRef]);

  // Expose manual update function for drag events
  const forceUpdate = useCallback(() => {
    updateObstacles();
  }, [updateObstacles]);

  return {
    obstacles,
    canvasBounds,
    forceUpdate,
  };
}

/**
 * Hook for tracking a single draggable element with position overrides
 */
export function useDraggableObstacle(
  id: string,
  initialPosition: { x: number; y: number },
  size: { width: number; height: number }
) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementStartRef = useRef<{ x: number; y: number } | null>(null);

  const obstacle: Obstacle = {
    id,
    type: 'draggable',
    bounds: {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    },
  };

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    elementStartRef.current = { ...position };
  }, [position]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !elementStartRef.current) return;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    setPosition({
      x: elementStartRef.current.x + dx,
      y: elementStartRef.current.y + dy,
    });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    elementStartRef.current = null;
  }, []);

  const resetPosition = useCallback(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  return {
    position,
    isDragging,
    obstacle,
    handlers: {
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragEnd: handleDragEnd,
    },
    resetPosition,
  };
}

export default useObstacleTracker;
