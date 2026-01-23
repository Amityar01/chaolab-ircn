// ============================================
// PREDICTIVE FIREFLY SYSTEM - TYPE DEFINITIONS
// ============================================

// Basic 2D vector
export interface Vec2 {
  x: number;
  y: number;
}

// Bounding box
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================
// OBSTACLE TYPES
// ============================================

export type ObstacleType = 'fixed' | 'draggable';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  bounds: Bounds;
  color?: string;
}

// ============================================
// PERCEPTION TYPES
// ============================================

export interface EdgeCell {
  x: number;  // Grid cell x
  y: number;  // Grid cell y
  worldX: number;  // World position x
  worldY: number;  // World position y
}

export interface ObjectFeatures {
  id: string;
  centroid: Vec2;
  bounds: Bounds;
  cellCount: number;
  aspectRatio: number;
  cells: EdgeCell[];
}

// ============================================
// MEMORY TYPES
// ============================================

export interface MemorizedObject {
  id: string;
  features: ObjectFeatures;
  pStatic: number;  // Probability object is static (0-1)
  confidence: number;  // Memory confidence (0-1, fades over time)
  lastSeen: number;  // Timestamp when last observed
  isCurrentlyVisible: boolean;
  originalObstacleId?: string;  // Links back to DOM obstacle
}

// ============================================
// PREDICTION TYPES
// ============================================

export type PredictionErrorType = 'none' | 'positive' | 'negative';

export interface PredictionError {
  type: PredictionErrorType;
  objectId?: string;
  displacement?: number;  // For positive errors (how far it moved)
  expectedPosition?: Vec2;  // For negative errors (where we expected it)
  confidence: number;
  timestamp: number;
}

export interface PredictionState {
  activeErrors: PredictionError[];
  confirmedPredictions: string[];  // Object IDs that matched predictions
  lastUpdateTime: number;
}

// ============================================
// FIREFLY TYPES
// ============================================

export interface Firefly {
  id: string;
  position: Vec2;
  velocity: Vec2;
  heading: number;  // Radians
  targetHeading: number;

  // Visual properties
  hue: number;  // 35-55 for gold to amber
  size: number;  // Base size in pixels
  glowIntensity: number;  // 0-1
  pulsePhase: number;  // For animation offset
  wingAngle: number;  // Current wing flutter angle

  // Cognitive state
  memory: MemorizedObject[];
  currentPerception: ObjectFeatures[];
  predictionState: PredictionState;

  // Navigation
  isAvoiding: boolean;
  avoidanceTarget?: Vec2;
}

// ============================================
// ENGINE STATE
// ============================================

export interface EngineState {
  fireflies: Firefly[];
  obstacles: Obstacle[];
  canvasBounds: Bounds;
  time: number;
  deltaTime: number;
  isRunning: boolean;
}

// ============================================
// DRAGGABLE TOY TYPES
// ============================================

export type ToyShape = 'circle' | 'triangle' | 'square' | 'diamond' | 'hexagon';

export interface DraggableToy {
  id: string;
  shape: ToyShape;
  position: Vec2;
  initialPosition: Vec2;
  size: number;
  color: string;
  isDragging: boolean;
  glowIntensity: number;
}

// ============================================
// VISUALIZATION PROPS
// ============================================

export interface FireflyVisualProps {
  firefly: Firefly;
  showDebug?: boolean;
}

export interface FOVConeProps {
  position: Vec2;
  heading: number;
  fovAngle: number;
  radius: number;
}

export interface EdgeCellsProps {
  cells: EdgeCell[];
  gridSize: number;
}

export interface DetectedObjectProps {
  object: MemorizedObject;
  isGhost?: boolean;
}

export interface PredictionIndicatorProps {
  error: PredictionError;
  position: Vec2;
}

// ============================================
// CANVAS PROPS
// ============================================

export interface PredictiveCanvasProps {
  obstacles: Obstacle[];
  fireflyCount?: number;
  showLegend?: boolean;
  className?: string;
}

// ============================================
// HELPER TYPES
// ============================================

export interface ColorPalette {
  fireflyGlow: string;
  fireflyCore: string;
  fovFill: string;
  fovStroke: string;
  edgeCell: string;
  memoryActive: string;
  memoryFaded: string;
  surprise: string;
  confusion: string;
  confirmed: string;
}
