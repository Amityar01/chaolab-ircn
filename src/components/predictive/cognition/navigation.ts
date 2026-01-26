// ============================================
// NAVIGATION MODULE
// ============================================
// Movement, obstacle avoidance, and path planning

import type { Vec2, Bounds, MemorizedObject, Firefly, Obstacle } from '../types';
import { CONFIG } from '../config';

/**
 * Normalize an angle to [-PI, PI]
 */
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Calculate the magnitude of a vector
 */
function magnitude(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vector
 */
function _normalize(v: Vec2): Vec2 {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * Compute avoidance vector from nearby obstacles in memory
 */
export function computeAvoidanceVector(
  fireflyPos: Vec2,
  memory: MemorizedObject[],
  avoidanceDistance: number = CONFIG.AVOIDANCE_DISTANCE
): Vec2 {
  let avoidX = 0;
  let avoidY = 0;

  for (const mem of memory) {
    const bounds = mem.features.bounds;

    // Find closest point on obstacle
    const closestX = Math.max(bounds.x, Math.min(fireflyPos.x, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(fireflyPos.y, bounds.y + bounds.height));

    const dx = fireflyPos.x - closestX;
    const dy = fireflyPos.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < avoidanceDistance && distance > 0) {
      // Strength inversely proportional to distance
      const strength = (avoidanceDistance - distance) / avoidanceDistance;
      const normDx = dx / distance;
      const normDy = dy / distance;

      // Weight by P(static) - more likely static objects are more important to avoid
      const weight = mem.pStatic * CONFIG.AVOIDANCE_STRENGTH;

      avoidX += normDx * strength * weight;
      avoidY += normDy * strength * weight;
    }
  }

  return { x: avoidX, y: avoidY };
}

/**
 * Compute avoidance vector directly from raw obstacles (fallback when memory is empty)
 */
export function computeDirectAvoidance(
  fireflyPos: Vec2,
  obstacles: Obstacle[],
  avoidanceDistance: number = CONFIG.AVOIDANCE_DISTANCE
): Vec2 {
  let avoidX = 0;
  let avoidY = 0;

  for (const obstacle of obstacles) {
    const bounds = obstacle.bounds;

    // Find closest point on obstacle
    const closestX = Math.max(bounds.x, Math.min(fireflyPos.x, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(fireflyPos.y, bounds.y + bounds.height));

    const dx = fireflyPos.x - closestX;
    const dy = fireflyPos.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < avoidanceDistance && distance > 0) {
      const strength = (avoidanceDistance - distance) / avoidanceDistance;
      const normDx = dx / distance;
      const normDy = dy / distance;

      // Fixed obstacles get stronger avoidance
      const weight = obstacle.type === 'fixed'
        ? CONFIG.AVOIDANCE_STRENGTH * 1.5
        : CONFIG.AVOIDANCE_STRENGTH;

      avoidX += normDx * strength * weight;
      avoidY += normDy * strength * weight;
    }
  }

  return { x: avoidX, y: avoidY };
}

/**
 * Find a safe direction to move, avoiding obstacles
 */
export function findSafeDirection(
  fireflyPos: Vec2,
  currentHeading: number,
  memory: MemorizedObject[],
  canvasBounds: Bounds,
  preferredHeading?: number
): number {
  // If we have a preferred heading, start there
  let targetHeading = preferredHeading ?? currentHeading;

  // Compute avoidance vector
  const avoidance = computeAvoidanceVector(fireflyPos, memory);
  const avoidMag = magnitude(avoidance);

  if (avoidMag > 0.1) {
    // We need to avoid something
    const avoidAngle = Math.atan2(avoidance.y, avoidance.x);

    // Blend avoidance with preferred direction
    const blendWeight = Math.min(1.0, avoidMag);
    targetHeading = targetHeading + normalizeAngle(avoidAngle - targetHeading) * blendWeight;
  }

  // Add wall avoidance
  const margin = 80;

  if (fireflyPos.x < margin) {
    targetHeading = normalizeAngle(targetHeading + 0.3);
  } else if (fireflyPos.x > canvasBounds.width - margin) {
    targetHeading = normalizeAngle(targetHeading - 0.3);
  }

  if (fireflyPos.y < margin) {
    targetHeading = normalizeAngle(targetHeading + (Math.cos(targetHeading) > 0 ? 0.3 : -0.3));
  } else if (fireflyPos.y > canvasBounds.height - margin) {
    targetHeading = normalizeAngle(targetHeading + (Math.cos(targetHeading) > 0 ? -0.3 : 0.3));
  }

  return targetHeading;
}

/**
 * Add random wandering to heading
 */
export function addWander(
  currentHeading: number,
  wanderRate: number = CONFIG.WANDER_RATE
): number {
  const wander = (Math.random() - 0.5) * 2 * wanderRate;
  return normalizeAngle(currentHeading + wander);
}

/**
 * Smoothly turn toward target heading
 */
export function turnToward(
  currentHeading: number,
  targetHeading: number,
  turnRate: number = CONFIG.TURN_RATE
): number {
  let diff = normalizeAngle(targetHeading - currentHeading);

  // Limit turn rate
  if (Math.abs(diff) > turnRate) {
    diff = turnRate * Math.sign(diff);
  }

  return normalizeAngle(currentHeading + diff);
}

/**
 * Update velocity based on heading and speed
 */
export function updateVelocity(
  currentVel: Vec2,
  heading: number,
  targetSpeed: number,
  acceleration: number = 0.1
): Vec2 {
  // Target velocity from heading
  const targetVelX = Math.cos(heading) * targetSpeed;
  const targetVelY = Math.sin(heading) * targetSpeed;

  // Smoothly interpolate
  const newVelX = currentVel.x + (targetVelX - currentVel.x) * acceleration;
  const newVelY = currentVel.y + (targetVelY - currentVel.y) * acceleration;

  // Clamp speed
  const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
  if (speed > CONFIG.MAX_SPEED) {
    const scale = CONFIG.MAX_SPEED / speed;
    return { x: newVelX * scale, y: newVelY * scale };
  }

  return { x: newVelX, y: newVelY };
}

/**
 * Update firefly position, keeping within bounds and preventing overlap with obstacles
 */
export function updatePosition(
  position: Vec2,
  velocity: Vec2,
  canvasBounds: Bounds,
  obstacles: Obstacle[] = [],
  collisionRadius: number = 12
): Vec2 {
  let newX = position.x + velocity.x;
  let newY = position.y + velocity.y;

  // Hard collision with obstacles - push out if overlapping
  for (const obstacle of obstacles) {
    const b = obstacle.bounds;

    // Expand bounds by collision radius
    const left = b.x - collisionRadius;
    const right = b.x + b.width + collisionRadius;
    const top = b.y - collisionRadius;
    const bottom = b.y + b.height + collisionRadius;

    // Check if inside expanded bounds
    if (newX > left && newX < right && newY > top && newY < bottom) {
      // Find which edge is closest and push out
      const distLeft = newX - left;
      const distRight = right - newX;
      const distTop = newY - top;
      const distBottom = bottom - newY;

      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist === distLeft) {
        newX = left;
      } else if (minDist === distRight) {
        newX = right;
      } else if (minDist === distTop) {
        newY = top;
      } else {
        newY = bottom;
      }
    }
  }

  // Soft boundary - bounce back from canvas edges
  const margin = 20;

  if (newX < margin) {
    newX = margin + (margin - newX) * 0.5;
  } else if (newX > canvasBounds.width - margin) {
    newX = canvasBounds.width - margin - (newX - (canvasBounds.width - margin)) * 0.5;
  }

  if (newY < margin) {
    newY = margin + (margin - newY) * 0.5;
  } else if (newY > canvasBounds.height - margin) {
    newY = canvasBounds.height - margin - (newY - (canvasBounds.height - margin)) * 0.5;
  }

  return { x: newX, y: newY };
}

/**
 * Check if firefly is currently colliding with any obstacle
 */
export function isColliding(
  position: Vec2,
  memory: MemorizedObject[],
  collisionRadius: number = 15
): boolean {
  for (const mem of memory) {
    const bounds = mem.features.bounds;

    // Find closest point on obstacle
    const closestX = Math.max(bounds.x, Math.min(position.x, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(position.y, bounds.y + bounds.height));

    const dx = position.x - closestX;
    const dy = position.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < collisionRadius) {
      return true;
    }
  }

  return false;
}

/**
 * Get the speed based on whether we're avoiding something
 */
export function getContextualSpeed(
  memory: MemorizedObject[],
  position: Vec2
): number {
  const avoidance = computeAvoidanceVector(position, memory);
  const avoidMag = magnitude(avoidance);

  if (avoidMag > 0.3) {
    // Speed up when avoiding
    return CONFIG.BASE_SPEED * 1.5;
  }

  return CONFIG.BASE_SPEED;
}

/**
 * Complete navigation update for a firefly
 */
export function updateNavigation(
  firefly: Firefly,
  canvasBounds: Bounds,
  obstacles: Obstacle[] = []
): Partial<Firefly> {
  // Add some random wandering
  let targetHeading = addWander(firefly.targetHeading);

  // Find safe direction considering obstacles in memory
  targetHeading = findSafeDirection(
    firefly.position,
    firefly.heading,
    firefly.memory,
    canvasBounds,
    targetHeading
  );

  // Smoothly turn toward target
  const newHeading = turnToward(firefly.heading, targetHeading);

  // Calculate speed based on context
  const speed = getContextualSpeed(firefly.memory, firefly.position);

  // Update velocity
  const newVelocity = updateVelocity(firefly.velocity, newHeading, speed);

  // Update position with hard collision against real obstacles
  const newPosition = updatePosition(firefly.position, newVelocity, canvasBounds, obstacles);

  // Check if we're actively avoiding (based on world model)
  const avoidance = computeAvoidanceVector(firefly.position, firefly.memory);
  const isAvoiding = magnitude(avoidance) > 0.2;

  return {
    position: newPosition,
    velocity: newVelocity,
    heading: newHeading,
    targetHeading,
    isAvoiding,
  };
}
