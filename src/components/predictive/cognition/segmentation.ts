// ============================================
// SEGMENTATION MODULE
// ============================================
// Groups detected edge cells into coherent objects using flood fill

import type { EdgeCell, ObjectFeatures, Vec2 } from '../types';
import { CONFIG } from '../config';

/**
 * Create a unique key for a cell position
 */
function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Flood fill to find connected edge cells (8-connectivity)
 */
export function floodFillEdges(
  startCell: EdgeCell,
  allEdgesSet: Set<string>,
  visited: Set<string>
): EdgeCell[] {
  const cluster: EdgeCell[] = [];
  const stack: EdgeCell[] = [startCell];

  while (stack.length > 0) {
    const cell = stack.pop()!;
    const key = cellKey(cell.x, cell.y);

    if (visited.has(key)) continue;
    visited.add(key);

    // Only include cells that are in our edge set
    if (!allEdgesSet.has(key)) continue;

    cluster.push(cell);

    // Check 8-connected neighbors
    const neighbors = [
      { x: cell.x - 1, y: cell.y },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x, y: cell.y - 1 },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x - 1, y: cell.y - 1 },
      { x: cell.x + 1, y: cell.y - 1 },
      { x: cell.x - 1, y: cell.y + 1 },
      { x: cell.x + 1, y: cell.y + 1 },
    ];

    for (const n of neighbors) {
      const nKey = cellKey(n.x, n.y);
      if (!visited.has(nKey) && allEdgesSet.has(nKey)) {
        // Find the actual cell data
        stack.push({
          x: n.x,
          y: n.y,
          worldX: n.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
          worldY: n.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
        });
      }
    }
  }

  return cluster;
}

/**
 * Extract features from a cluster of edge cells
 */
export function extractFeatures(
  cells: EdgeCell[],
  gridSize: number = CONFIG.GRID_SIZE
): ObjectFeatures | null {
  if (cells.length < 2) {
    return null; // Too small to be meaningful
  }

  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0;

  for (const cell of cells) {
    minX = Math.min(minX, cell.worldX);
    maxX = Math.max(maxX, cell.worldX);
    minY = Math.min(minY, cell.worldY);
    maxY = Math.max(maxY, cell.worldY);
    sumX += cell.worldX;
    sumY += cell.worldY;
  }

  const width = maxX - minX + gridSize;
  const height = maxY - minY + gridSize;

  // Skip if too small
  if (width < gridSize * 2 && height < gridSize * 2) {
    return null;
  }

  const centroid: Vec2 = {
    x: sumX / cells.length,
    y: sumY / cells.length,
  };

  const aspectRatio = width / Math.max(height, 1);

  return {
    id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    centroid,
    bounds: {
      x: minX - gridSize / 2,
      y: minY - gridSize / 2,
      width,
      height,
    },
    cellCount: cells.length,
    aspectRatio,
    cells,
  };
}

/**
 * Segment all edge cells into distinct objects
 */
export function segmentEdgesIntoObjects(
  edges: EdgeCell[],
  gridSize: number = CONFIG.GRID_SIZE
): ObjectFeatures[] {
  if (edges.length === 0) {
    return [];
  }

  // Create a set of all edge cell keys for fast lookup
  const allEdgesSet = new Set<string>();
  for (const edge of edges) {
    allEdgesSet.add(cellKey(edge.x, edge.y));
  }

  const visited = new Set<string>();
  const objects: ObjectFeatures[] = [];

  // Find connected components using flood fill
  for (const edge of edges) {
    const key = cellKey(edge.x, edge.y);
    if (visited.has(key)) continue;

    const cluster = floodFillEdges(edge, allEdgesSet, visited);
    const features = extractFeatures(cluster, gridSize);

    if (features) {
      objects.push(features);
    }
  }

  return objects;
}

/**
 * Calculate similarity between two object feature sets
 * Used for matching detected objects to memory
 */
export function calculateFeatureSimilarity(
  a: ObjectFeatures,
  b: ObjectFeatures
): number {
  // Position similarity (inverse of distance)
  const dx = a.centroid.x - b.centroid.x;
  const dy = a.centroid.y - b.centroid.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const positionScore = Math.max(0, 1 - distance / CONFIG.MEMORY_MATCH_THRESHOLD);

  // Size similarity
  const sizeA = a.bounds.width * a.bounds.height;
  const sizeB = b.bounds.width * b.bounds.height;
  const sizeRatio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);

  // Aspect ratio similarity
  const aspectDiff = Math.abs(a.aspectRatio - b.aspectRatio);
  const aspectScore = Math.max(0, 1 - aspectDiff / 2);

  // Weighted combination
  return positionScore * 0.5 + sizeRatio * 0.3 + aspectScore * 0.2;
}

/**
 * Merge overlapping or very close objects
 */
export function mergeCloseObjects(
  objects: ObjectFeatures[],
  threshold: number = 20
): ObjectFeatures[] {
  if (objects.length <= 1) return objects;

  const merged: ObjectFeatures[] = [];
  const used = new Set<number>();

  for (let i = 0; i < objects.length; i++) {
    if (used.has(i)) continue;

    let current = objects[i];
    const toMerge: ObjectFeatures[] = [current];

    // Find all objects to merge with this one
    for (let j = i + 1; j < objects.length; j++) {
      if (used.has(j)) continue;

      const other = objects[j];
      const dx = current.centroid.x - other.centroid.x;
      const dy = current.centroid.y - other.centroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < threshold) {
        toMerge.push(other);
        used.add(j);
      }
    }

    used.add(i);

    // If we have multiple objects to merge, combine them
    if (toMerge.length > 1) {
      const allCells = toMerge.flatMap(o => o.cells);
      const features = extractFeatures(allCells);
      if (features) {
        merged.push(features);
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}
