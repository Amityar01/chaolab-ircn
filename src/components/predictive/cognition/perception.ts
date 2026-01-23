// ============================================
// PERCEPTION MODULE
// ============================================
// Handles field of view, edge detection, and sensory processing

import type { Vec2, Bounds, Obstacle, EdgeCell } from '../types';
import { CONFIG } from '../config';

/**
 * Check if a target position is within the firefly's field of view
 */
export function isInFieldOfView(
  fireflyPos: Vec2,
  fireflyHeading: number,
  targetPos: Vec2,
  fovAngle: number = CONFIG.FOV_ANGLE,
  senseRadius: number = CONFIG.SENSE_RADIUS
): boolean {
  // Calculate vector to target
  const dx = targetPos.x - fireflyPos.x;
  const dy = targetPos.y - fireflyPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if within range
  if (distance > senseRadius) {
    return false;
  }

  // Calculate angle to target
  const angleToTarget = Math.atan2(dy, dx);

  // Normalize angle difference to [-PI, PI]
  let angleDiff = angleToTarget - fireflyHeading;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  // Check if within FOV cone
  return Math.abs(angleDiff) <= fovAngle / 2;
}

/**
 * Check if a grid cell is blocked by any obstacle
 */
export function isCellBlocked(
  cellX: number,
  cellY: number,
  obstacles: Obstacle[],
  canvasBounds: Bounds,
  gridSize: number = CONFIG.GRID_SIZE
): boolean {
  const worldX = cellX * gridSize + gridSize / 2;
  const worldY = cellY * gridSize + gridSize / 2;

  // Check canvas bounds
  if (worldX < 0 || worldX > canvasBounds.width ||
      worldY < 0 || worldY > canvasBounds.height) {
    return true;
  }

  // Check each obstacle
  for (const obstacle of obstacles) {
    const b = obstacle.bounds;
    if (worldX >= b.x && worldX <= b.x + b.width &&
        worldY >= b.y && worldY <= b.y + b.height) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a cell is at an edge (blocked but adjacent to unblocked)
 */
function isEdgeCell(
  cellX: number,
  cellY: number,
  obstacles: Obstacle[],
  canvasBounds: Bounds,
  gridSize: number
): boolean {
  // Cell must be blocked
  if (!isCellBlocked(cellX, cellY, obstacles, canvasBounds, gridSize)) {
    return false;
  }

  // Check if any neighbor is unblocked
  const neighbors = [
    [cellX - 1, cellY],
    [cellX + 1, cellY],
    [cellX, cellY - 1],
    [cellX, cellY + 1],
  ];

  for (const [nx, ny] of neighbors) {
    if (!isCellBlocked(nx, ny, obstacles, canvasBounds, gridSize)) {
      return true;
    }
  }

  return false;
}

/**
 * Find all edge cells within the firefly's field of view
 * These represent "neural activations" when detecting object boundaries
 */
export function findEdgeCells(
  fireflyPos: Vec2,
  fireflyHeading: number,
  obstacles: Obstacle[],
  canvasBounds: Bounds,
  gridSize: number = CONFIG.GRID_SIZE,
  fovAngle: number = CONFIG.FOV_ANGLE,
  senseRadius: number = CONFIG.SENSE_RADIUS
): EdgeCell[] {
  const edges: EdgeCell[] = [];

  // Calculate grid bounds to check (optimization)
  const minCellX = Math.floor((fireflyPos.x - senseRadius) / gridSize);
  const maxCellX = Math.ceil((fireflyPos.x + senseRadius) / gridSize);
  const minCellY = Math.floor((fireflyPos.y - senseRadius) / gridSize);
  const maxCellY = Math.ceil((fireflyPos.y + senseRadius) / gridSize);

  // Scan grid cells in potential range
  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      const worldX = cx * gridSize + gridSize / 2;
      const worldY = cy * gridSize + gridSize / 2;

      // Check if in field of view
      if (!isInFieldOfView(fireflyPos, fireflyHeading, { x: worldX, y: worldY }, fovAngle, senseRadius)) {
        continue;
      }

      // Check if it's an edge cell
      if (isEdgeCell(cx, cy, obstacles, canvasBounds, gridSize)) {
        edges.push({
          x: cx,
          y: cy,
          worldX,
          worldY,
        });
      }
    }
  }

  return edges;
}

/**
 * Get the distance from a point to the nearest obstacle
 */
export function getDistanceToNearestObstacle(
  pos: Vec2,
  obstacles: Obstacle[]
): number {
  let minDistance = Infinity;

  for (const obstacle of obstacles) {
    const b = obstacle.bounds;

    // Find closest point on the obstacle rectangle
    const closestX = Math.max(b.x, Math.min(pos.x, b.x + b.width));
    const closestY = Math.max(b.y, Math.min(pos.y, b.y + b.height));

    const dx = pos.x - closestX;
    const dy = pos.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

/**
 * Get obstacles that intersect with the FOV cone
 */
export function getObstaclesInFOV(
  fireflyPos: Vec2,
  fireflyHeading: number,
  obstacles: Obstacle[],
  fovAngle: number = CONFIG.FOV_ANGLE,
  senseRadius: number = CONFIG.SENSE_RADIUS
): Obstacle[] {
  return obstacles.filter(obstacle => {
    const b = obstacle.bounds;
    // Check all corners of the obstacle
    const corners = [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x, y: b.y + b.height },
      { x: b.x + b.width, y: b.y + b.height },
    ];

    // Check center too
    const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    corners.push(center);

    // If any point is in FOV, include this obstacle
    return corners.some(corner =>
      isInFieldOfView(fireflyPos, fireflyHeading, corner, fovAngle, senseRadius)
    );
  });
}

/**
 * Calculate the FOV cone points for visualization
 */
export function getFOVConePoints(
  position: Vec2,
  heading: number,
  fovAngle: number = CONFIG.FOV_ANGLE,
  radius: number = CONFIG.SENSE_RADIUS
): Vec2[] {
  const points: Vec2[] = [];
  const segments = 32; // Smooth arc

  // Start point (firefly position)
  points.push({ x: position.x, y: position.y });

  // Arc points
  const startAngle = heading - fovAngle / 2;
  const endAngle = heading + fovAngle / 2;

  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    points.push({
      x: position.x + Math.cos(angle) * radius,
      y: position.y + Math.sin(angle) * radius,
    });
  }

  return points;
}
