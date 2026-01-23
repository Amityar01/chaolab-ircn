// ============================================
// MEMORY MODULE
// ============================================
// Object memory system with matching, storage, and temporal decay

import type { ObjectFeatures, MemorizedObject, Vec2 } from '../types';
import { CONFIG } from '../config';
import { calculateFeatureSimilarity } from './segmentation';

/**
 * Try to match a detected object to an existing memory
 * Returns the index of the matched memory, or null if no match
 */
export function matchToMemory(
  detected: ObjectFeatures,
  memory: MemorizedObject[],
  threshold: number = CONFIG.MEMORY_MATCH_THRESHOLD
): number | null {
  let bestMatch = -1;
  let bestScore = 0;

  for (let i = 0; i < memory.length; i++) {
    const mem = memory[i];
    const similarity = calculateFeatureSimilarity(detected, mem.features);

    // Also check raw distance as a hard cutoff
    const dx = detected.centroid.x - mem.features.centroid.x;
    const dy = detected.centroid.y - mem.features.centroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < threshold && similarity > bestScore) {
      bestScore = similarity;
      bestMatch = i;
    }
  }

  // Require a minimum similarity score
  if (bestMatch >= 0 && bestScore > 0.3) {
    return bestMatch;
  }

  return null;
}

/**
 * Create a new memory entry from detected features
 */
export function createMemory(
  features: ObjectFeatures,
  obstacleId?: string,
  initialPStatic: number = CONFIG.UNKNOWN_OBJECT_P_STATIC
): MemorizedObject {
  return {
    id: features.id,
    features: { ...features },
    pStatic: initialPStatic,
    confidence: 1.0,
    lastSeen: Date.now(),
    isCurrentlyVisible: true,
    originalObstacleId: obstacleId,
  };
}

/**
 * Calculate displacement between a detected object and its memory
 */
export function calculateDisplacement(
  detected: ObjectFeatures,
  remembered: MemorizedObject
): number {
  const dx = detected.centroid.x - remembered.features.centroid.x;
  const dy = detected.centroid.y - remembered.features.centroid.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Update memory with currently visible objects
 */
export function updateMemory(
  currentlyVisible: ObjectFeatures[],
  existingMemory: MemorizedObject[],
  deltaTime: number,
  obstacleIdMap?: Map<string, string> // Maps feature bounds to obstacle IDs
): {
  memory: MemorizedObject[];
  matched: Map<string, string>;  // detected ID -> memory ID
  newObjects: string[];
  movedObjects: Array<{ id: string; displacement: number }>;
} {
  const newMemory: MemorizedObject[] = [];
  const matched = new Map<string, string>();
  const newObjects: string[] = [];
  const movedObjects: Array<{ id: string; displacement: number }> = [];
  const usedMemoryIndices = new Set<number>();

  // First, mark all existing memories as not currently visible
  for (const mem of existingMemory) {
    mem.isCurrentlyVisible = false;
  }

  // Match each visible object to memory
  for (const detected of currentlyVisible) {
    const memIndex = matchToMemory(detected, existingMemory);

    if (memIndex !== null && !usedMemoryIndices.has(memIndex)) {
      // Found a match
      usedMemoryIndices.add(memIndex);
      const mem = existingMemory[memIndex];

      // Check for movement (prediction error)
      const displacement = calculateDisplacement(detected, mem);
      if (displacement > CONFIG.SURPRISE_THRESHOLD) {
        movedObjects.push({ id: mem.id, displacement });
      }

      // Update memory with new position
      mem.features = { ...detected, id: mem.id };
      mem.lastSeen = Date.now();
      mem.isCurrentlyVisible = true;
      mem.confidence = Math.min(1.0, mem.confidence + 0.1);

      matched.set(detected.id, mem.id);
      newMemory.push(mem);
    } else {
      // New object, create memory
      const obstacleId = obstacleIdMap?.get(boundsKey(detected.bounds));
      const initialP = obstacleId
        ? (obstacleId.includes('toy') ? CONFIG.DRAGGABLE_TOY_P_STATIC : CONFIG.FIXED_OBSTACLE_P_STATIC)
        : CONFIG.UNKNOWN_OBJECT_P_STATIC;

      const newMem = createMemory(detected, obstacleId, initialP);
      newObjects.push(newMem.id);
      matched.set(detected.id, newMem.id);
      newMemory.push(newMem);
    }
  }

  // Keep unmatched memories (objects not currently visible)
  for (let i = 0; i < existingMemory.length; i++) {
    if (!usedMemoryIndices.has(i)) {
      const mem = existingMemory[i];
      mem.isCurrentlyVisible = false;
      newMemory.push(mem);
    }
  }

  return { memory: newMemory, matched, newObjects, movedObjects };
}

/**
 * Apply temporal decay to memories
 */
export function decayMemory(
  memory: MemorizedObject[],
  deltaTime: number,
  fadeRate: number = CONFIG.MEMORY_FADE_RATE
): MemorizedObject[] {
  const now = Date.now();

  return memory.filter(mem => {
    // Don't decay currently visible objects
    if (mem.isCurrentlyVisible) {
      return true;
    }

    // Apply decay
    mem.confidence -= fadeRate * deltaTime;

    // Check age limit
    const age = now - mem.lastSeen;
    if (age > CONFIG.MAX_MEMORY_AGE) {
      mem.confidence = Math.min(mem.confidence, 0.05);
    }

    // Keep if above minimum confidence
    return mem.confidence > CONFIG.MIN_CONFIDENCE;
  });
}

/**
 * Get objects that should be visible but aren't (for negative prediction errors)
 */
export function findMissingObjects(
  fireflyPos: Vec2,
  fireflyHeading: number,
  memory: MemorizedObject[],
  currentlyVisibleIds: Set<string>,
  fovAngle: number = CONFIG.FOV_ANGLE,
  senseRadius: number = CONFIG.SENSE_RADIUS
): MemorizedObject[] {
  const missing: MemorizedObject[] = [];

  for (const mem of memory) {
    // Skip if already visible
    if (mem.isCurrentlyVisible || currentlyVisibleIds.has(mem.id)) {
      continue;
    }

    // Skip low confidence memories
    if (mem.confidence < 0.3) {
      continue;
    }

    // Check if memory location is in current FOV
    const target = mem.features.centroid;
    const dx = target.x - fireflyPos.x;
    const dy = target.y - fireflyPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > senseRadius) continue;

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - fireflyHeading;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    if (Math.abs(angleDiff) <= fovAngle / 2) {
      // Object should be visible but isn't!
      missing.push(mem);
    }
  }

  return missing;
}

/**
 * Get all currently remembered objects (visible or not)
 */
export function getRememberedObjects(memory: MemorizedObject[]): MemorizedObject[] {
  return memory.filter(m => m.confidence > CONFIG.MIN_CONFIDENCE);
}

/**
 * Helper to create a bounds key for obstacle mapping
 */
function boundsKey(bounds: { x: number; y: number; width: number; height: number }): string {
  return `${Math.round(bounds.x)},${Math.round(bounds.y)},${Math.round(bounds.width)},${Math.round(bounds.height)}`;
}
