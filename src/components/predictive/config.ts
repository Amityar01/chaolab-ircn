// ============================================
// PREDICTIVE FIREFLY SYSTEM - CONFIGURATION
// ============================================
// All tunable parameters in one place

export const CONFIG = {
  // ========================================
  // GRID & SENSING
  // ========================================
  GRID_SIZE: 8,  // Edge detection grid cell size in pixels
  SENSE_RADIUS: 120,  // How far firefly can see
  FOV_ANGLE: Math.PI * 0.7,  // ~126 degrees field of view

  // ========================================
  // MEMORY
  // ========================================
  MEMORY_FADE_RATE: 0.003,  // How fast confidence decays per frame
  MEMORY_MATCH_THRESHOLD: 80,  // Max distance (px) to match object to memory
  MIN_CONFIDENCE: 0.1,  // Below this, memory is forgotten
  MAX_MEMORY_AGE: 10000,  // Max time (ms) to remember unseen object

  // ========================================
  // MOVEMENT
  // ========================================
  BASE_SPEED: 1.2,  // Base movement speed
  MAX_SPEED: 2.5,  // Maximum speed
  TURN_RATE: 0.08,  // How fast firefly can turn (radians/frame)
  WANDER_RATE: 0.08,  // Random heading variation
  AVOIDANCE_DISTANCE: 60,  // Start avoiding at this distance
  AVOIDANCE_STRENGTH: 2.0,  // How strongly to avoid

  // ========================================
  // PREDICTION
  // ========================================
  SURPRISE_THRESHOLD: 30,  // Displacement (px) to trigger surprise
  LEARNING_RATE: 0.15,  // How much P(static) changes after error
  CONFIRMATION_BOOST: 0.02,  // Small boost when prediction confirmed
  ERROR_DISPLAY_DURATION: 1500,  // How long to show ! or ? (ms)

  // ========================================
  // INITIAL BELIEFS
  // ========================================
  FIXED_OBSTACLE_P_STATIC: 0.85,  // Research cards, sections
  DRAGGABLE_TOY_P_STATIC: 0.35,  // Toys start uncertain
  UNKNOWN_OBJECT_P_STATIC: 0.5,  // Default for new objects

  // ========================================
  // VISUALS - COUNTS
  // ========================================
  FIREFLY_COUNT: 4,  // Number of fireflies
  TOY_COUNT: 6,  // Number of draggable toys
  PARTICLE_COUNT: 50,  // Ambient particles

  // ========================================
  // VISUALS - FIREFLY APPEARANCE
  // ========================================
  FIREFLY_BASE_SIZE: 12,  // Base size in pixels
  FIREFLY_SIZE_VARIANCE: 4,  // Random size variation
  FIREFLY_HUE_MIN: 35,  // Gold
  FIREFLY_HUE_MAX: 55,  // Amber
  GLOW_MIN: 0.6,  // Minimum glow intensity
  GLOW_MAX: 1.0,  // Maximum glow intensity
  PULSE_SPEED: 3,  // Glow pulse speed
  WING_FLUTTER_SPEED: 20,  // Wing animation speed
  WING_FLUTTER_ANGLE: 15,  // Max wing angle in degrees

  // ========================================
  // VISUALS - FOV CONE
  // ========================================
  FOV_FILL_OPACITY: 0.04,
  FOV_STROKE_OPACITY: 0.12,

  // ========================================
  // VISUALS - EDGE DETECTION
  // ========================================
  EDGE_CELL_OPACITY: 0.35,
  EDGE_CELL_PULSE_SPEED: 2,

  // ========================================
  // VISUALS - BOUNDING BOXES
  // ========================================
  BBOX_STROKE_WIDTH: 2,
  BBOX_BORDER_RADIUS: 6,
  BBOX_PADDING: 4,

  // ========================================
  // VISUALS - PARTICLES
  // ========================================
  PARTICLE_MIN_SIZE: 1,
  PARTICLE_MAX_SIZE: 3,
  PARTICLE_DRIFT_SPEED: 0.3,
  PARTICLE_OPACITY_MIN: 0.1,
  PARTICLE_OPACITY_MAX: 0.3,

  // ========================================
  // COLORS
  // ========================================
  COLORS: {
    // Background
    deepSpace: '#070b14',
    nightIndigo: '#0a0e1a',
    twilightBlue: '#0d1321',
    ambientGlow: '#111827',

    // Firefly bioluminescence
    fireflyGlow: '#ffd54f',
    fireflyCore: '#ffab00',
    fireflyHot: '#ff9100',
    fireflyHalo: '#fff3cd',

    // FOV cone
    fovFill: 'rgba(255, 213, 79, 0.04)',
    fovStroke: 'rgba(255, 213, 79, 0.12)',

    // Edge detection
    edgeCell: '#00e5ff',
    edgeCellGlow: 'rgba(0, 229, 255, 0.4)',

    // Memory states
    memoryActive: '#69f0ae',
    memoryFading: '#81c784',
    memoryGhost: 'rgba(129, 199, 132, 0.3)',

    // Prediction errors
    surprise: '#ff6b6b',
    surpriseGlow: '#ff8a80',
    confusion: '#64b5f6',
    confirmed: '#69f0ae',

    // Content cards
    cardGlass: 'rgba(255, 255, 255, 0.03)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardHover: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#f1f5f9',
    textMuted: '#94a3b8',

    // Draggable toys
    toyCyan: '#00bcd4',
    toyMagenta: '#e91e63',
    toyAmber: '#ffc107',
    toyTeal: '#009688',
    toyPurple: '#9c27b0',
  },

  // ========================================
  // TIMING
  // ========================================
  ANIMATION_FPS: 60,
  PERCEPTION_UPDATE_INTERVAL: 50,  // ms between perception updates

  // ========================================
  // ACCESSIBILITY
  // ========================================
  REDUCED_MOTION_SPEED_MULTIPLIER: 0.3,
  REDUCED_MOTION_DISABLE_PARTICLES: true,
} as const;

export type Config = typeof CONFIG;

// Helper to get color by P(static) value
export function getPStaticColor(pStatic: number): string {
  // Green (movable) -> Yellow (uncertain) -> Red (static)
  // But inverted for our use: high P(static) = likely fixed = red
  const hue = pStatic * 120;  // 0 = red, 60 = yellow, 120 = green
  return `hsl(${120 - hue}, 70%, 55%)`;
}

// Helper to get memory opacity based on confidence
export function getMemoryOpacity(confidence: number, isVisible: boolean): number {
  if (isVisible) return 0.9;
  return Math.max(0.2, confidence * 0.7);
}

// Toy colors array for easy access
export const TOY_COLORS = [
  CONFIG.COLORS.toyCyan,
  CONFIG.COLORS.toyMagenta,
  CONFIG.COLORS.toyAmber,
  CONFIG.COLORS.toyTeal,
  CONFIG.COLORS.toyPurple,
];
