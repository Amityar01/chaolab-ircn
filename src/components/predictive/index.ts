// ============================================
// PREDICTIVE FIREFLY SYSTEM - MAIN EXPORTS
// ============================================

// Types
export * from './types';

// Config
export { CONFIG, getPStaticColor, getMemoryOpacity, TOY_COLORS } from './config';

// Cognition (brain functions)
export * from './cognition';

// Engine (hooks)
export { useFireflyEngine } from './engine';
export { useObstacleTracker, useDraggableObstacle } from './engine';

// Visual components
export {
  Firefly,
  FOVCone,
  EdgeCells,
  DetectedObject,
  PredictionIndicator,
  ConfirmationGlow,
  GhostObject,
  ParticleField,
} from './visuals';

// Main canvas
export { PredictiveCanvas, default as PredictiveCanvasDefault } from './PredictiveCanvas';
