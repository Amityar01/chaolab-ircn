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
  SENSE_DISTANCE: 80,
  SURPRISE_DURATION: 1000,

  // Movement
  BASE_SPEED: 1.2,
  TURN_SMOOTHING: 0.12,
  WANDER_RATE: 0.06,

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
  const { x, y, vx, vy, surprised, omissionSurprise, phase, trail, hue } = firefly;

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
    <g style={{ cursor: 'pointer' }} onClick={onClick}>
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
  showBeliefs?: boolean;
  showPaths?: boolean;
}

export function FireflySystem({
  obstacles,
  width,
  height,
  showBeliefs = false,
  showPaths = true,
}: FireflySystemProps) {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [selectedFirefly, setSelectedFirefly] = useState<number | null>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; startTime: number }>>([]);
  const [beliefCells, setBeliefCells] = useState<Array<{ key: string; x: number; y: number; belief: number; visits: number; isSelected: boolean }>>([]);

  const beliefMaps = useRef<BeliefMap[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const obstaclesRef = useRef(obstacles);

  // Update obstacles ref
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  // Initialize fireflies
  useEffect(() => {
    if (width < 100 || height < 100) return;

    const initialFireflies: Firefly[] = Array.from({ length: CONFIG.NUM_FIREFLIES }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const x = 100 + Math.random() * (width - 200);
      const y = 100 + Math.random() * (height - 200);

      return {
        id: i,
        x,
        y,
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
        hue: 35 + Math.random() * 25, // Gold to amber
      };
    });

    setFireflies(initialFireflies);
    beliefMaps.current = Array.from({ length: CONFIG.NUM_FIREFLIES }, () => ({}));
  }, [width > 100, height > 100]);

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

  const checkRealObstacle = useCallback((x: number, y: number, padding = 8) => {
    for (const obs of obstaclesRef.current) {
      if (x > obs.x - padding && x < obs.x + obs.width + padding &&
          y > obs.y - padding && y < obs.y + obs.height + padding) {
        return true;
      }
    }
    // Canvas bounds
    if (x < padding || x > width - padding || y < padding || y > height - padding) {
      return true;
    }
    return false;
  }, [width, height]);

  const findBestDirection = useCallback((
    fireflyIndex: number,
    x: number,
    y: number,
    currentAngle: number,
    wanderAngle: number
  ) => {
    const numSamples = 12;
    let bestAngle = wanderAngle;
    let lowestCost = Infinity;

    for (let i = 0; i < numSamples; i++) {
      const testAngle = (i / numSamples) * Math.PI * 2;
      let cost = 0;

      // Sample at two distances
      for (const distMult of [0.4, 1.0]) {
        const sampleX = x + Math.cos(testAngle) * CONFIG.SENSE_DISTANCE * distMult;
        const sampleY = y + Math.sin(testAngle) * CONFIG.SENSE_DISTANCE * distMult;

        const belief = getBelief(fireflyIndex, sampleX, sampleY);
        const visits = getVisits(fireflyIndex, sampleX, sampleY);
        const confidence = Math.min(1, visits / 6);

        // Avoid believed obstacles
        cost += belief * confidence * (distMult < 0.6 ? 4 : 2);
      }

      // Prefer wander direction
      const wanderDiff = Math.abs(Math.atan2(
        Math.sin(testAngle - wanderAngle),
        Math.cos(testAngle - wanderAngle)
      ));
      cost += wanderDiff * 0.4;

      // Momentum - prefer current direction
      const momDiff = Math.abs(Math.atan2(
        Math.sin(testAngle - currentAngle),
        Math.cos(testAngle - currentAngle)
      ));
      cost += momDiff * 0.15;

      if (cost < lowestCost) {
        lowestCost = cost;
        bestAngle = testAngle;
      }
    }

    return bestAngle;
  }, [getBelief, getVisits]);

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
    if (!showBeliefs) {
      setBeliefCells([]);
      return;
    }

    const cells: typeof beliefCells = [];
    const isSelected = selectedFirefly !== null;

    if (isSelected && selectedFirefly !== null) {
      const map = beliefMaps.current[selectedFirefly];
      if (map) {
        Object.entries(map).forEach(([key, cell]) => {
          if (cell.belief > 0.2) {
            const { x, y } = getCellCoords(key);
            cells.push({ key, x, y, belief: cell.belief, visits: cell.visits, isSelected: true });
          }
        });
      }
    } else {
      // Aggregate
      const aggregated: Record<string, BeliefCell> = {};
      beliefMaps.current.forEach(map => {
        Object.entries(map).forEach(([key, cell]) => {
          if (cell.belief > 0.2) {
            if (!aggregated[key] || cell.visits > aggregated[key].visits) {
              aggregated[key] = cell;
            }
          }
        });
      });

      Object.entries(aggregated).forEach(([key, cell]) => {
        const { x, y } = getCellCoords(key);
        cells.push({ key, x, y, belief: cell.belief, visits: cell.visits, isSelected: false });
      });
    }

    setBeliefCells(cells);
  }, [showBeliefs, selectedFirefly]);

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
        let { x, y, vx, vy, targetAngle, angularVel, wanderAngle, surprised, omissionSurprise, surpriseTime, phase, trail, hue } = firefly;

        const currentAngle = Math.atan2(vy, vx);
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Random wander
        wanderAngle += (Math.random() - 0.5) * CONFIG.WANDER_RATE * delta;
        if (Math.random() < 0.003) {
          wanderAngle = Math.random() * Math.PI * 2;
        }

        // Active sensing - look ahead and update beliefs
        let omissionDetected = false;

        for (let angleOff = -0.6; angleOff <= 0.6; angleOff += 0.3) {
          for (let dist = 15; dist <= CONFIG.SENSE_DISTANCE; dist += 12) {
            const senseAngle = currentAngle + angleOff;
            const senseX = x + Math.cos(senseAngle) * dist;
            const senseY = y + Math.sin(senseAngle) * dist;

            const belief = getBelief(idx, senseX, senseY);
            const realObstacle = checkRealObstacle(senseX, senseY, 5);

            // Omission: believed obstacle but nothing there
            if (belief > 0.4 && !realObstacle) {
              const hadBelief = clearCell(idx, senseX, senseY);
              if (hadBelief) {
                omissionDetected = true;
              }
            }

            // Mark real obstacles
            if (realObstacle) {
              markObstacle(idx, senseX, senseY);
            }
          }
        }

        if (omissionDetected && !omissionSurprise && !surprised) {
          omissionSurprise = true;
          surprised = false;
          surpriseTime = now;
        }

        // Navigation - find best direction based on beliefs
        const bestAngle = findBestDirection(idx, x, y, currentAngle, wanderAngle);
        targetAngle = bestAngle;

        // Smooth turning
        const angleDiff = Math.atan2(
          Math.sin(targetAngle - currentAngle),
          Math.cos(targetAngle - currentAngle)
        );
        angularVel += angleDiff * CONFIG.TURN_SMOOTHING * delta;
        angularVel *= 0.85; // Damping

        const newAngle = currentAngle + angularVel * delta;

        // Natural speed variation
        const speedOsc = Math.sin(now / 300 + phase) * 0.2;
        const targetSpeed = CONFIG.BASE_SPEED + speedOsc;
        const newSpeed = speed + (targetSpeed - speed) * 0.1 * delta;

        vx = Math.cos(newAngle) * newSpeed;
        vy = Math.sin(newAngle) * newSpeed;

        let nextX = x + vx * delta;
        let nextY = y + vy * delta;

        // Check for collision
        const hitObstacle = checkRealObstacle(nextX, nextY, 10);
        const belief = getBelief(idx, nextX, nextY);
        const visits = getVisits(idx, nextX, nextY);
        const expectedHit = belief > 0.5 && visits > 2;

        // Surprise on unexpected collision
        if (hitObstacle && !expectedHit) {
          surprised = true;
          omissionSurprise = false;
          surpriseTime = now;
          markObstacle(idx, nextX, nextY);
        }

        // Hard collision - find escape direction
        if (hitObstacle) {
          const escapeDirections = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]
          ];

          for (const [dx, dy] of escapeDirections) {
            if (!checkRealObstacle(x + dx * 15, y + dy * 15, 8)) {
              const escapeAngle = Math.atan2(dy, dx);
              vx = Math.cos(escapeAngle) * newSpeed;
              vy = Math.sin(escapeAngle) * newSpeed;
              wanderAngle = escapeAngle;
              break;
            }
          }
          angularVel = 0;
          nextX = x;
          nextY = y;
        }

        // Clear surprise after duration
        if ((surprised || omissionSurprise) && now - surpriseTime > CONFIG.SURPRISE_DURATION) {
          surprised = false;
          omissionSurprise = false;
        }

        // Keep in bounds
        nextX = Math.max(15, Math.min(width - 15, nextX));
        nextY = Math.max(15, Math.min(height - 15, nextY));

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

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked on a firefly
    const clickedFirefly = fireflies.find(f => {
      const dist = Math.sqrt((f.x - clickX) ** 2 + (f.y - clickY) ** 2);
      return dist < 25;
    });

    if (clickedFirefly) {
      setSelectedFirefly(prev =>
        prev === clickedFirefly.id ? null : clickedFirefly.id
      );
      return;
    }

    // Clicked empty space - deselect or create ripple
    if (selectedFirefly !== null) {
      setSelectedFirefly(null);
      return;
    }

    // Create ripple and startle nearby fireflies
    setRipples(prev => [...prev, { x: clickX, y: clickY, startTime: Date.now() }]);

    setFireflies(prev => prev.map(firefly => {
      const dist = Math.sqrt((firefly.x - clickX) ** 2 + (firefly.y - clickY) ** 2);
      if (dist < 100) {
        const fleeAngle = Math.atan2(firefly.y - clickY, firefly.x - clickX);
        return {
          ...firefly,
          vx: Math.cos(fleeAngle) * 3,
          vy: Math.sin(fleeAngle) * 3,
          wanderAngle: fleeAngle,
          angularVel: 0,
          surprised: true,
          surpriseTime: Date.now(),
        };
      }
      return firefly;
    }));
  }, [fireflies, selectedFirefly]);

  // Generate predicted paths
  const predictedPaths = fireflies.map((f, i) => generatePredictedPath(f, i));

  if (width === 0 || height === 0) return null;

  return (
    <svg
      width={width}
      height={height}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: 'pointer',
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
          showPrediction={showPaths}
          predictedPath={predictedPaths[i]}
          onClick={() => setSelectedFirefly(prev =>
            prev === firefly.id ? null : firefly.id
          )}
        />
      ))}
    </svg>
  );
}

export default FireflySystem;
