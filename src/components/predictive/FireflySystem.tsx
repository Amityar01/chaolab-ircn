'use client';

// ============================================
// FIREFLY SYSTEM - Light orbs with tadpole brain
// ============================================
// Simple glowing orbs, grid-based beliefs, natural movement

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  NUM_FIREFLIES: 5,
  GRID_SIZE: 16,
  SENSE_DISTANCE: 60,
  SURPRISE_DURATION: 1000,

  // Movement - smooth rotation-based
  BASE_SPEED: 1.3,
  MAX_SPEED: 1.8,
  TURN_SMOOTHING: 0.04,   // Gentle turning
  ANGULAR_DAMPING: 0.96,  // High = smooth curves, keeps rotating
  WANDER_STRENGTH: 0.015, // Continuous gentle curve
  WANDER_VARIATION: 0.008, // Random variation in curve

  // Cursor attraction
  CURSOR_ATTRACTION: 0.12,  // Turn rate toward cursor per frame
  CURSOR_RANGE: 700,        // Max distance for cursor attraction

  // Belief formation
  SOLID_PADDING: 0,      // No expansion - must be exactly inside obstacle to mark belief
  SENSE_PADDING: 8,      // Padding for detecting obstacles during sensing (slightly larger)
  COLLISION_PADDING: 10, // Padding for actual collision detection

  // Visuals
  ORB_SIZE: 8,
  GLOW_SIZE: 24,
  TRAIL_LENGTH: 8,
};

// ============================================
// TYPES
// ============================================
interface Firefly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetAngle: number;
  angularVel: number;
  wanderAngle: number;
  surprised: boolean;
  omissionSurprise: boolean;
  surpriseTime: number;
  phase: number;
  trail: Array<{ x: number; y: number }>;
  hue: number;
  // Avoidance state - turn away from expected obstacles
  avoidAngle: number;      // Direction to avoid
  avoidUntil: number;      // Timestamp until which to keep avoiding
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BeliefCell {
  belief: number;
  visits: number;
}

type BeliefMap = Record<string, BeliefCell>;

// ============================================
// FIREFLY ORB COMPONENT
// ============================================
function FireflyOrb({
  firefly,
  selected,
  showPrediction,
  predictedPath,
  onClick
}: {
  firefly: Firefly;
  selected: boolean;
  showPrediction: boolean;
  predictedPath: Array<{ x: number; y: number; blocked: boolean }>;
  onClick: () => void;
}) {
  const { x, y, surprised, omissionSurprise, phase, trail, hue } = firefly;

  // Pulsing glow
  const time = Date.now() / 1000;
  const pulse = 0.7 + 0.3 * Math.sin(time * 3 + phase);
  const glowSize = CONFIG.GLOW_SIZE * pulse;

  const isOmission = omissionSurprise && !surprised;

  // Colors
  const baseColor = `hsl(${hue}, 80%, 65%)`;
  const glowColor = surprised
    ? 'rgba(255, 107, 107, 0.6)'
    : isOmission
      ? 'rgba(163, 136, 238, 0.6)'
      : `hsla(${hue}, 80%, 65%, 0.4)`;
  const coreColor = surprised
    ? '#ff6b6b'
    : isOmission
      ? '#a388ee'
      : `hsl(${hue}, 85%, 75%)`;

  return (
    <g style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={onClick}>
      {/* Trail */}
      {trail.map((point, i) => {
        const opacity = (i / trail.length) * 0.3;
        const size = CONFIG.ORB_SIZE * 0.5 * (i / trail.length);
        return (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={size}
            fill={baseColor}
            opacity={opacity}
          />
        );
      })}

      {/* Predicted path */}
      {showPrediction && predictedPath.length > 0 && (
        <g>
          {predictedPath.filter((_, i) => i % 3 === 0).map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={2}
              fill={point.blocked ? 'rgba(255,107,107,0.5)' : `hsla(${hue}, 70%, 60%, 0.3)`}
            />
          ))}
        </g>
      )}

      {/* Selection ring */}
      {selected && (
        <circle
          cx={x}
          cy={y}
          r={20}
          fill="none"
          stroke={baseColor}
          strokeWidth={1.5}
          strokeDasharray="4,3"
          opacity={0.7}
        />
      )}

      {/* Outer glow */}
      <circle
        cx={x}
        cy={y}
        r={glowSize}
        fill={glowColor}
        style={{ filter: 'blur(8px)' }}
      />

      {/* Inner glow */}
      <circle
        cx={x}
        cy={y}
        r={glowSize * 0.5}
        fill={glowColor}
        opacity={0.8}
      />

      {/* Core */}
      <circle
        cx={x}
        cy={y}
        r={CONFIG.ORB_SIZE * pulse}
        fill={coreColor}
      />

      {/* Bright center */}
      <circle
        cx={x}
        cy={y}
        r={CONFIG.ORB_SIZE * 0.4}
        fill="white"
        opacity={0.8 * pulse}
      />

      {/* Surprise indicator */}
      {surprised && (
        <g transform={`translate(${x + 12}, ${y - 12})`}>
          <circle cx={0} cy={0} r={8} fill="#ff6b6b" />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={12}
            fontWeight="bold"
            fontFamily="monospace"
          >
            !
          </text>
        </g>
      )}

      {/* Omission indicator */}
      {isOmission && (
        <g transform={`translate(${x + 12}, ${y - 12})`}>
          <circle cx={0} cy={0} r={8} fill="#a388ee" />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={11}
            fontWeight="bold"
            fontFamily="monospace"
          >
            ?
          </text>
        </g>
      )}
    </g>
  );
}

// ============================================
// BELIEF HEATMAP CELL
// ============================================
function BeliefCell({
  x, y, belief, visits, isSelected
}: {
  x: number;
  y: number;
  belief: number;
  visits: number;
  isSelected: boolean;
}) {
  if (belief < 0.3) return null;

  const confidence = Math.min(1, visits / 6);
  const alpha = 0.15 + confidence * 0.25;

  // Cyan for individual, amber for aggregate
  const color = isSelected
    ? `rgba(0, 229, 255, ${alpha})`
    : `rgba(255, 180, 50, ${alpha})`;

  return (
    <rect
      x={x}
      y={y}
      width={CONFIG.GRID_SIZE}
      height={CONFIG.GRID_SIZE}
      fill={color}
      rx={2}
    />
  );
}

// ============================================
// RIPPLE EFFECT
// ============================================
function Ripple({ x, y, startTime }: { x: number; y: number; startTime: number }) {
  const age = (Date.now() - startTime) / 1000;
  const maxAge = 0.8;
  if (age > maxAge) return null;

  const progress = age / maxAge;
  const radius = 15 + progress * 80;
  const opacity = (1 - progress) * 0.4;

  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill="none"
      stroke="rgba(255, 213, 79, 0.5)"
      strokeWidth={2 * (1 - progress)}
      opacity={opacity}
    />
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
interface FireflySystemProps {
  obstacles: Obstacle[];
  width: number;
  height: number;
}

export function FireflySystem({
  obstacles,
  width,
  height,
}: FireflySystemProps) {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [selectedFirefly, setSelectedFirefly] = useState<number | null>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; startTime: number }>>([]);
  const [beliefCells, setBeliefCells] = useState<Array<{ key: string; x: number; y: number; belief: number; visits: number; isSelected: boolean }>>([]);

  const beliefMaps = useRef<BeliefMap[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const obstaclesRef = useRef(obstacles);
  const svgRef = useRef<SVGSVGElement>(null);
  const cursorRef = useRef<{ x: number; y: number; lastMoveTime: number; strength: number }>({
    x: -1000,
    y: -1000,
    lastMoveTime: 0,
    strength: 0
  });

  // Update obstacles ref
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  // Track cursor/touch position with decay
  useEffect(() => {
    const updatePosition = (clientX: number, clientY: number) => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        cursorRef.current = { x, y, lastMoveTime: Date.now(), strength: 1 };
      }
    };

    const handleMouseMove = (e: MouseEvent) => updatePosition(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleLeave = () => {
      // Don't reset position, just let it decay
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  // Check if position is inside any obstacle
  const isInsideObstacle = useCallback((x: number, y: number, padding = 20) => {
    for (const obs of obstaclesRef.current) {
      if (x > obs.x - padding && x < obs.x + obs.width + padding &&
        y > obs.y - padding && y < obs.y + obs.height + padding) {
        return true;
      }
    }
    return false;
  }, []);

  // Find a valid spawn position
  const findValidPosition = useCallback((maxAttempts = 50) => {
    for (let i = 0; i < maxAttempts; i++) {
      const x = 50 + Math.random() * (width - 100);
      const y = 50 + Math.random() * (height - 100);
      if (!isInsideObstacle(x, y, 30)) {
        return { x, y };
      }
    }
    // Fallback: spawn at edge
    return { x: 50, y: 50 + Math.random() * 200 };
  }, [width, height, isInsideObstacle]);

  // Initialize fireflies (wait for obstacles to be ready)
  useEffect(() => {
    if (width < 100 || height < 100) return;
    // Wait a bit for obstacles to be calculated
    if (obstacles.length === 0) return;

    setFireflies(prev => {
      // Don't reinitialize if we already have fireflies
      if (prev.length > 0) return prev;

      const initialFireflies: Firefly[] = Array.from({ length: CONFIG.NUM_FIREFLIES }, (_, i) => {
        const pos = findValidPosition();
        const angle = Math.random() * Math.PI * 2;

        return {
          id: i,
          x: pos.x,
          y: pos.y,
          vx: Math.cos(angle) * CONFIG.BASE_SPEED,
          vy: Math.sin(angle) * CONFIG.BASE_SPEED,
          targetAngle: angle,
          angularVel: 0,
          wanderAngle: angle,
          surprised: false,
          omissionSurprise: false,
          surpriseTime: 0,
          phase: Math.random() * Math.PI * 2,
          trail: [],
          hue: 35 + Math.random() * 25,
          avoidAngle: 0,
          avoidUntil: 0,
        };
      });

      beliefMaps.current = Array.from({ length: CONFIG.NUM_FIREFLIES }, () => ({}));
      return initialFireflies;
    });
  }, [width, height, obstacles.length > 0, findValidPosition]);

  // Helper functions
  const getCellKey = (x: number, y: number) =>
    `${Math.floor(x / CONFIG.GRID_SIZE)},${Math.floor(y / CONFIG.GRID_SIZE)}`;

  const getCellCoords = (key: string) => {
    const [cx, cy] = key.split(',').map(Number);
    return { x: cx * CONFIG.GRID_SIZE, y: cy * CONFIG.GRID_SIZE };
  };

  const getBelief = useCallback((fireflyIndex: number, x: number, y: number) => {
    const key = getCellKey(x, y);
    const cell = beliefMaps.current[fireflyIndex]?.[key];
    return cell ? cell.belief : 0;
  }, []);

  const getVisits = useCallback((fireflyIndex: number, x: number, y: number) => {
    const key = getCellKey(x, y);
    const cell = beliefMaps.current[fireflyIndex]?.[key];
    return cell ? cell.visits : 0;
  }, []);

  const markObstacle = useCallback((fireflyIndex: number, x: number, y: number) => {
    const key = getCellKey(x, y);
    const map = beliefMaps.current[fireflyIndex];
    if (!map) return;
    const current = map[key] || { belief: 0, visits: 0 };
    map[key] = {
      belief: Math.min(1, current.belief + 0.35),
      visits: current.visits + 1,
    };
  }, []);

  const clearCell = useCallback((fireflyIndex: number, x: number, y: number) => {
    const key = getCellKey(x, y);
    const map = beliefMaps.current[fireflyIndex];
    if (!map) return false;
    const hadBelief = map[key] && map[key].belief > 0.3;
    delete map[key];
    return hadBelief;
  }, []);

  // Check if point is inside obstacle with given padding
  // Positive padding = expand obstacle bounds (for avoidance)
  // Negative padding = shrink bounds (must be well inside for belief marking)
  const checkRealObstacle = useCallback((x: number, y: number, padding = 8) => {
    for (const obs of obstaclesRef.current) {
      if (x > obs.x - padding && x < obs.x + obs.width + padding &&
        y > obs.y - padding && y < obs.y + obs.height + padding) {
        return true;
      }
    }
    return false;
  }, []);

  // RAYCAST + BELIEFS: Game-engine style feelers with predictive coding
  // Cast rays forward, use beliefs to predict, sense to verify
  const castRay = useCallback((
    fireflyIndex: number,
    startX: number,
    startY: number,
    angle: number,
    maxDist: number
  ): { hitDist: number; expectedHit: boolean; actualHit: boolean } => {
    const stepSize = 8;
    for (let dist = stepSize; dist <= maxDist; dist += stepSize) {
      const px = startX + Math.cos(angle) * dist;
      const py = startY + Math.sin(angle) * dist;

      const belief = getBelief(fireflyIndex, px, py);
      const visits = getVisits(fireflyIndex, px, py);
      const expectedHit = belief > 0.3 && visits > 1;
      const actualHit = checkRealObstacle(px, py, 6);

      if (expectedHit || actualHit) {
        return { hitDist: dist, expectedHit, actualHit };
      }
    }
    return { hitDist: maxDist, expectedHit: false, actualHit: false };
  }, [getBelief, getVisits, checkRealObstacle]);

  // Find best direction using 5 feeler rays
  const findBestDirection = useCallback((
    fireflyIndex: number,
    x: number,
    y: number,
    currentAngle: number,
    wanderAngle: number
  ): { angle: number; needsAvoidance: boolean; avoidDir: number } => {
    // Cast 5 rays: center, slight left/right, far left/right
    const rayAngles = [0, -0.3, 0.3, -0.6, 0.6];
    const rays = rayAngles.map(offset => ({
      angle: currentAngle + offset,
      offset,
      ...castRay(fireflyIndex, x, y, currentAngle + offset, CONFIG.SENSE_DISTANCE)
    }));

    // Check if center ray is blocked (by belief or reality)
    const centerRay = rays[0];
    const leftRays = rays.filter(r => r.offset < 0);
    const rightRays = rays.filter(r => r.offset > 0);

    // If something ahead, need to avoid
    const needsAvoidance = centerRay.hitDist < CONFIG.SENSE_DISTANCE * 0.7;

    if (needsAvoidance) {
      // Find clearest side
      const leftClear = Math.min(...leftRays.map(r => r.hitDist));
      const rightClear = Math.min(...rightRays.map(r => r.hitDist));

      // Turn toward clearer side
      const avoidDir = leftClear > rightClear ? -1 : 1;
      const turnAngle = currentAngle + avoidDir * 0.8;

      return { angle: turnAngle, needsAvoidance: true, avoidDir };
    }

    // Nothing ahead - gentle wander
    return { angle: wanderAngle, needsAvoidance: false, avoidDir: 0 };
  }, [castRay]);

  const generatePredictedPath = useCallback((
    firefly: Firefly,
    fireflyIndex: number
  ) => {
    const path: Array<{ x: number; y: number; blocked: boolean }> = [];
    let px = firefly.x;
    let py = firefly.y;
    const angle = Math.atan2(firefly.vy, firefly.vx);
    let pvx = Math.cos(angle) * CONFIG.BASE_SPEED;
    let pvy = Math.sin(angle) * CONFIG.BASE_SPEED;

    for (let i = 0; i < 50; i += 3) {
      px += pvx * 5;
      py += pvy * 5;

      const belief = getBelief(fireflyIndex, px, py);
      const visits = getVisits(fireflyIndex, px, py);
      const isBlocked = belief > 0.5 && visits > 2;

      // Bounce off edges
      if (px < 20 || px > width - 20) pvx *= -1;
      if (py < 20 || py > height - 20) pvy *= -1;
      px = Math.max(20, Math.min(width - 20, px));
      py = Math.max(20, Math.min(height - 20, py));

      path.push({ x: px, y: py, blocked: isBlocked });
      if (isBlocked) break;
    }

    return path;
  }, [width, height, getBelief, getVisits]);

  // Update heatmap display
  const updateBeliefDisplay = useCallback(() => {
    if (selectedFirefly === null) {
      setBeliefCells(prev => (prev.length === 0 ? prev : []));
      return;
    }

    const cells: typeof beliefCells = [];
    const map = beliefMaps.current[selectedFirefly];
    if (map) {
      Object.entries(map).forEach(([key, cell]) => {
        if (cell.belief > 0.2) {
          const { x, y } = getCellCoords(key);
          cells.push({ key, x, y, belief: cell.belief, visits: cell.visits, isSelected: true });
        }
      });
    }

    setBeliefCells(cells);
  }, [selectedFirefly]);

  // Animation loop
  useEffect(() => {
    if (fireflies.length === 0) return;

    let beliefCounter = 0;

    const animate = () => {
      const now = Date.now();
      const delta = Math.min(32, now - lastTimeRef.current) / 16.67;
      lastTimeRef.current = now;

      // Update belief display periodically
      beliefCounter++;
      if (beliefCounter >= 8) {
        updateBeliefDisplay();
        beliefCounter = 0;
      }

      setFireflies(prev => prev.map((firefly, idx) => {
        const { x, y, phase, trail } = firefly;
        let { vx, vy, targetAngle, angularVel, wanderAngle, surprised, omissionSurprise, surpriseTime } = firefly;

        const currentAngle = Math.atan2(vy, vx);
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Smooth continuous wander - gentle curves, no sudden changes
        // Each firefly has a persistent turn bias that slowly evolves
        const wanderBias = Math.sin(now / 3000 + phase * 10) * CONFIG.WANDER_STRENGTH;
        const wanderNoise = (Math.sin(now / 500 + phase * 5) * 0.5 + Math.sin(now / 1300 + phase * 7) * 0.5) * CONFIG.WANDER_VARIATION;
        wanderAngle = currentAngle + wanderBias + wanderNoise;

        // Cursor/touch attraction with decay
        let cursorTurnForce = 0;
        const cursor = cursorRef.current;

        // Decay strength over time when not moving (2 second decay)
        const timeSinceMove = now - cursor.lastMoveTime;
        const decayedStrength = Math.max(0, cursor.strength * (1 - timeSinceMove / 2000));

        if (decayedStrength > 0.05) {
          const cdx = cursor.x - x;
          const cdy = cursor.y - y;
          const cursorDist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cursorDist < CONFIG.CURSOR_RANGE && cursorDist > 15) {
            const angleToCursor = Math.atan2(cdy, cdx);
            let cursorAngleDiff = angleToCursor - currentAngle;
            // Normalize to -PI to PI
            while (cursorAngleDiff > Math.PI) cursorAngleDiff -= Math.PI * 2;
            while (cursorAngleDiff < -Math.PI) cursorAngleDiff += Math.PI * 2;
            // Attraction with distance and decay
            const distFactor = 1 - cursorDist / CONFIG.CURSOR_RANGE;
            cursorTurnForce = cursorAngleDiff * distFactor * decayedStrength * CONFIG.CURSOR_ATTRACTION;
          }
        }

        // PREDICTIVE CODING: Sense, compare to predictions, generate errors
        // Beliefs only update when there's a prediction error
        let positiveErrorDetected = false; // Unexpected obstacle
        let negativeErrorDetected = false; // Expected obstacle missing
        let expectedObstacleAhead = false;
        let obstacleAvoidAngle = 0;

        for (let angleOff = -0.5; angleOff <= 0.5; angleOff += 0.25) {
          for (let dist = 15; dist <= CONFIG.SENSE_DISTANCE; dist += 10) {
            const senseAngle = currentAngle + angleOff;
            const senseX = x + Math.cos(senseAngle) * dist;
            const senseY = y + Math.sin(senseAngle) * dist;

            // PREDICT: What does the internal model expect?
            const belief = getBelief(idx, senseX, senseY);
            const visits = getVisits(idx, senseX, senseY);
            const expectedObstacle = belief > 0.3 && visits > 1;

            // SENSE: What's actually there?
            const actualObstacle = checkRealObstacle(senseX, senseY, CONFIG.SENSE_PADDING);

            // PREDICTION ERROR: Compare prediction to reality
            if (actualObstacle && !expectedObstacle) {
              // POSITIVE ERROR: Obstacle exists but wasn't predicted
              // Update belief to include this obstacle
              markObstacle(idx, senseX, senseY);
              positiveErrorDetected = true;
            } else if (!actualObstacle && expectedObstacle) {
              // NEGATIVE ERROR: Predicted obstacle but nothing there
              // Update belief to remove this obstacle
              clearCell(idx, senseX, senseY);
              negativeErrorDetected = true;
            }
            // No error = prediction was correct, no update needed

            // Check if we EXPECT an obstacle ahead (from beliefs ONLY)
            // This is what drives avoidance - acting on the internal model
            const isForward = Math.abs(angleOff) < 0.3;
            const isClose = dist < CONFIG.SENSE_DISTANCE * 0.6;

            if (isForward && isClose && expectedObstacle && !expectedObstacleAhead) {
              expectedObstacleAhead = true;
              // Turn away from expected obstacle
              obstacleAvoidAngle = currentAngle + (angleOff >= 0 ? -Math.PI / 2 : Math.PI / 2);
            }
          }
        }

        // Get avoidance state from firefly
        let { avoidAngle, avoidUntil } = firefly;

        // Set new avoidance if we expect obstacle ahead (from beliefs)
        if (expectedObstacleAhead && now > avoidUntil) {
          avoidAngle = obstacleAvoidAngle;
          avoidUntil = now + 800; // Avoid for 800ms
        }

        // Show surprise indicators
        if (positiveErrorDetected && !surprised && !omissionSurprise) {
          // Saw something unexpected - mild surprise during sensing
          // (Big surprise comes from collision)
        }

        if (negativeErrorDetected && !omissionSurprise && !surprised) {
          omissionSurprise = true;
          surprised = false;
          surpriseTime = now;
        }

        // Navigation using raycast feelers
        const navResult = findBestDirection(idx, x, y, currentAngle, wanderAngle);
        targetAngle = navResult.angle;

        // Smooth turning with momentum
        let angleDiff = Math.atan2(
          Math.sin(targetAngle - currentAngle),
          Math.cos(targetAngle - currentAngle)
        );

        // If feelers detect obstacle, turn more aggressively
        if (navResult.needsAvoidance) {
          angleDiff *= 2.5; // Stronger turn when avoiding
          // Also set avoidance state
          if (now > avoidUntil) {
            avoidAngle = targetAngle;
            avoidUntil = now + 500;
          }
        }

        // If actively avoiding from recent collision, maintain direction
        if (now < avoidUntil && !navResult.needsAvoidance) {
          let avoidDiff = avoidAngle - currentAngle;
          while (avoidDiff > Math.PI) avoidDiff -= Math.PI * 2;
          while (avoidDiff < -Math.PI) avoidDiff += Math.PI * 2;
          angleDiff = avoidDiff * 0.4;
        }

        // Apply turn forces: navigation + cursor
        angularVel += angleDiff * CONFIG.TURN_SMOOTHING * delta;
        angularVel += cursorTurnForce;

        // Damping for smooth curves
        angularVel *= CONFIG.ANGULAR_DAMPING;

        // Clamp angular velocity (allow more when avoiding)
        const maxAngVel = navResult.needsAvoidance ? 0.25 : 0.15;
        angularVel = Math.max(-maxAngVel, Math.min(maxAngVel, angularVel));

        const newAngle = currentAngle + angularVel * delta;

        // Natural speed variation
        const speedOsc = Math.sin(now / 300 + phase) * 0.3;
        const targetSpeed = CONFIG.BASE_SPEED + speedOsc;
        // Gradual speed changes (momentum)
        const newSpeed = Math.min(CONFIG.MAX_SPEED, speed + (targetSpeed - speed) * 0.08 * delta);

        vx = Math.cos(newAngle) * newSpeed;
        vy = Math.sin(newAngle) * newSpeed;

        let nextX = x + vx * delta;
        let nextY = y + vy * delta;

        // PREDICTIVE CODING: Collision is the ultimate prediction error
        const hitObstacle = checkRealObstacle(nextX, nextY, CONFIG.COLLISION_PADDING);
        const belief = getBelief(idx, nextX, nextY);
        const visits = getVisits(idx, nextX, nextY);
        const expectedHit = belief > 0.3 && visits > 1;

        // Hard collision
        if (hitObstacle) {
          // PREDICTION ERROR on collision
          if (!expectedHit) {
            // Big positive error: crashed into unexpected obstacle
            // This is how we learn about new obstacles
            surprised = true;
            omissionSurprise = false;
            surpriseTime = now;
            // Update belief - learn from this error
            markObstacle(idx, nextX, nextY);
          }
          // If expectedHit, we knew it was there but couldn't avoid
          // (momentum carried us in) - no surprise, no belief update needed

          // Find escape direction - check multiple angles
          const escapeDirections = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7],
            [0.9, 0.4], [-0.9, 0.4], [0.9, -0.4], [-0.9, -0.4],
          ];

          let escapeX = -vx; // Default: reverse
          let escapeY = -vy;

          for (const [edx, edy] of escapeDirections) {
            const testX = x + edx * 30;
            const testY = y + edy * 30;
            if (!checkRealObstacle(testX, testY, 12)) {
              escapeX = edx;
              escapeY = edy;
              break;
            }
          }

          // Normalize escape direction
          const escapeMag = Math.sqrt(escapeX * escapeX + escapeY * escapeY);
          if (escapeMag > 0) {
            escapeX /= escapeMag;
            escapeY /= escapeMag;
          }

          // HARD bounce - push away with force
          const bounceSpeed = Math.max(CONFIG.BASE_SPEED * 1.5, newSpeed);
          vx = escapeX * bounceSpeed;
          vy = escapeY * bounceSpeed;

          // Strong angular kick in escape direction
          const escapeAngle = Math.atan2(escapeY, escapeX);
          angularVel = (escapeAngle - currentAngle) * 0.5;

          // Set avoidance to keep turning away after collision
          avoidAngle = escapeAngle;
          avoidUntil = now + 1200; // Avoid for 1.2 seconds after collision

          // Push position away from obstacle
          nextX = x + escapeX * 5;
          nextY = y + escapeY * 5;
        }

        // Clear surprise after duration
        if ((surprised || omissionSurprise) && now - surpriseTime > CONFIG.SURPRISE_DURATION) {
          surprised = false;
          omissionSurprise = false;
        }

        // Bounce off screen edges
        if (nextX < 15) {
          nextX = 15;
          vx = Math.abs(vx); // Reflect velocity
          wanderAngle = Math.atan2(vy, vx);
        } else if (nextX > width - 15) {
          nextX = width - 15;
          vx = -Math.abs(vx);
          wanderAngle = Math.atan2(vy, vx);
        }
        if (nextY < 15) {
          nextY = 15;
          vy = Math.abs(vy);
          wanderAngle = Math.atan2(vy, vx);
        } else if (nextY > height - 15) {
          nextY = height - 15;
          vy = -Math.abs(vy);
          wanderAngle = Math.atan2(vy, vx);
        }

        // Update trail
        const newTrail = [{ x, y }, ...trail].slice(0, CONFIG.TRAIL_LENGTH);

        return {
          ...firefly,
          x: nextX,
          y: nextY,
          vx,
          vy,
          targetAngle,
          angularVel,
          wanderAngle,
          surprised,
          omissionSurprise,
          surpriseTime,
          trail: newTrail,
          avoidAngle,
          avoidUntil,
        };
      }));

      // Clean up old ripples
      setRipples(prev => prev.filter(r => Date.now() - r.startTime < 800));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [fireflies.length, width, height, checkRealObstacle, findBestDirection, getBelief, getVisits, markObstacle, clearCell, updateBeliefDisplay]);

  // Handle firefly click
  const handleFireflyClick = useCallback((fireflyId: number) => {
    setSelectedFirefly(prev => prev === fireflyId ? null : fireflyId);
  }, []);

  // Generate predicted paths
  const predictedPaths = fireflies.map((f, i) => generatePredictedPath(f, i));

  if (width === 0 || height === 0) return null;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Belief heatmap */}
      {beliefCells.map(cell => (
        <BeliefCell
          key={cell.key}
          x={cell.x}
          y={cell.y}
          belief={cell.belief}
          visits={cell.visits}
          isSelected={cell.isSelected}
        />
      ))}

      {/* Ripples */}
      {ripples.map((ripple, i) => (
        <Ripple key={`${ripple.startTime}-${i}`} {...ripple} />
      ))}

      {/* Fireflies */}
      {fireflies.map((firefly, i) => (
        <FireflyOrb
          key={firefly.id}
          firefly={firefly}
          selected={selectedFirefly === firefly.id}
          showPrediction={selectedFirefly === firefly.id}
          predictedPath={selectedFirefly === firefly.id ? predictedPaths[i] : []}
          onClick={() => handleFireflyClick(firefly.id)}
        />
      ))}
    </svg>
  );
}

export default FireflySystem;
