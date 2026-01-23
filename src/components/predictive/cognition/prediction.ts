// ============================================
// PREDICTION MODULE
// ============================================
// Belief formation, prediction errors, and Bayesian updating

import type {
  ObjectFeatures,
  MemorizedObject,
  PredictionError,
  PredictionErrorType,
  PredictionState,
  Vec2,
  Bounds
} from '../types';
import { CONFIG } from '../config';

/**
 * Compute initial P(static) for a newly detected object
 * Based on position, size, and optional type hints
 */
export function computeInitialPStatic(
  features: ObjectFeatures,
  canvasBounds: Bounds,
  isKnownDraggable: boolean = false
): number {
  if (isKnownDraggable) {
    return CONFIG.DRAGGABLE_TOY_P_STATIC;
  }

  // Objects at edges of canvas are more likely to be fixed UI elements
  const margin = 100;
  const nearEdge =
    features.centroid.x < margin ||
    features.centroid.x > canvasBounds.width - margin ||
    features.centroid.y < margin ||
    features.centroid.y > canvasBounds.height - margin;

  // Larger objects are more likely to be fixed content
  const area = features.bounds.width * features.bounds.height;
  const isLarge = area > 10000;

  if (nearEdge || isLarge) {
    return CONFIG.FIXED_OBSTACLE_P_STATIC;
  }

  return CONFIG.UNKNOWN_OBJECT_P_STATIC;
}

/**
 * Detect positive prediction error (object moved/appeared unexpectedly)
 */
export function detectPositiveError(
  detected: ObjectFeatures,
  remembered: MemorizedObject | null,
  threshold: number = CONFIG.SURPRISE_THRESHOLD
): PredictionError | null {
  if (!remembered) {
    // New object that wasn't predicted - mild surprise
    return {
      type: 'positive',
      objectId: detected.id,
      displacement: 0,
      confidence: 0.5,
      timestamp: Date.now(),
    };
  }

  // Calculate displacement
  const dx = detected.centroid.x - remembered.features.centroid.x;
  const dy = detected.centroid.y - remembered.features.centroid.y;
  const displacement = Math.sqrt(dx * dx + dy * dy);

  if (displacement > threshold) {
    // Object moved more than expected!
    return {
      type: 'positive',
      objectId: remembered.id,
      displacement,
      confidence: Math.min(1.0, displacement / (threshold * 2)),
      timestamp: Date.now(),
    };
  }

  return null;
}

/**
 * Detect negative prediction error (expected object missing)
 */
export function detectNegativeError(
  missingMemory: MemorizedObject
): PredictionError {
  return {
    type: 'negative',
    objectId: missingMemory.id,
    expectedPosition: { ...missingMemory.features.centroid },
    confidence: missingMemory.confidence,
    timestamp: Date.now(),
  };
}

/**
 * Check for confirmed predictions (object where expected)
 */
export function checkConfirmedPrediction(
  detected: ObjectFeatures,
  remembered: MemorizedObject,
  threshold: number = CONFIG.SURPRISE_THRESHOLD / 2
): boolean {
  const dx = detected.centroid.x - remembered.features.centroid.x;
  const dy = detected.centroid.y - remembered.features.centroid.y;
  const displacement = Math.sqrt(dx * dx + dy * dy);

  return displacement < threshold && remembered.confidence > 0.5;
}

/**
 * Update belief (P(static)) after a positive error
 */
export function updateBeliefAfterPositiveError(
  currentPStatic: number,
  error: PredictionError,
  learningRate: number = CONFIG.LEARNING_RATE
): number {
  // Object moved, decrease P(static)
  // The larger the displacement, the more we decrease
  const scaledLearning = learningRate * Math.min(1.0, error.confidence);
  const newPStatic = currentPStatic * (1 - scaledLearning);

  return Math.max(0.05, newPStatic);  // Never go below 5%
}

/**
 * Update belief (P(static)) after a negative error
 */
export function updateBeliefAfterNegativeError(
  currentPStatic: number,
  learningRate: number = CONFIG.LEARNING_RATE
): number {
  // Object disappeared, decrease P(static)
  const newPStatic = currentPStatic * (1 - learningRate * 0.5);

  return Math.max(0.05, newPStatic);
}

/**
 * Update belief after confirmed prediction
 */
export function updateBeliefAfterConfirmation(
  currentPStatic: number,
  learningRate: number = CONFIG.CONFIRMATION_BOOST
): number {
  // Object was where expected, slightly increase P(static)
  const newPStatic = currentPStatic + (1 - currentPStatic) * learningRate;

  return Math.min(0.95, newPStatic);  // Never go above 95%
}

/**
 * Process all prediction errors for a perception update
 */
export function processPredictionUpdate(
  currentlyVisible: ObjectFeatures[],
  memory: MemorizedObject[],
  matched: Map<string, string>,
  movedObjects: Array<{ id: string; displacement: number }>,
  missingObjects: MemorizedObject[]
): {
  errors: PredictionError[];
  confirmed: string[];
  updatedMemory: MemorizedObject[];
} {
  const errors: PredictionError[] = [];
  const confirmed: string[] = [];

  // Process moved objects (positive errors)
  for (const moved of movedObjects) {
    const mem = memory.find(m => m.id === moved.id);
    if (mem) {
      errors.push({
        type: 'positive',
        objectId: moved.id,
        displacement: moved.displacement,
        confidence: Math.min(1.0, moved.displacement / CONFIG.SURPRISE_THRESHOLD),
        timestamp: Date.now(),
      });

      // Update belief
      mem.pStatic = updateBeliefAfterPositiveError(mem.pStatic, errors[errors.length - 1]);
    }
  }

  // Process missing objects (negative errors)
  for (const missing of missingObjects) {
    errors.push(detectNegativeError(missing));

    // Update belief
    missing.pStatic = updateBeliefAfterNegativeError(missing.pStatic);
    missing.confidence *= 0.7;  // Also reduce memory confidence
  }

  // Process confirmed predictions
  for (const detected of currentlyVisible) {
    const memId = matched.get(detected.id);
    if (memId) {
      const mem = memory.find(m => m.id === memId);
      if (mem && !movedObjects.some(m => m.id === memId)) {
        if (checkConfirmedPrediction(detected, mem)) {
          confirmed.push(memId);
          mem.pStatic = updateBeliefAfterConfirmation(mem.pStatic);
        }
      }
    }
  }

  return { errors, confirmed, updatedMemory: memory };
}

/**
 * Create initial prediction state
 */
export function createPredictionState(): PredictionState {
  return {
    activeErrors: [],
    confirmedPredictions: [],
    lastUpdateTime: Date.now(),
  };
}

/**
 * Update prediction state with new errors
 */
export function updatePredictionState(
  state: PredictionState,
  errors: PredictionError[],
  confirmed: string[]
): PredictionState {
  const now = Date.now();

  // Filter out expired errors
  const activeErrors = [
    ...state.activeErrors.filter(e =>
      now - e.timestamp < CONFIG.ERROR_DISPLAY_DURATION
    ),
    ...errors,
  ];

  return {
    activeErrors,
    confirmedPredictions: confirmed,
    lastUpdateTime: now,
  };
}

/**
 * Get color for P(static) visualization
 */
export function getPStaticColor(pStatic: number): string {
  // Low P(static) = likely movable = green
  // High P(static) = likely fixed = red
  // Interpolate through yellow
  const hue = (1 - pStatic) * 120;  // 120 = green, 0 = red
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Get label text for P(static)
 */
export function getPStaticLabel(pStatic: number): string {
  return `${Math.round(pStatic * 100)}%`;
}
