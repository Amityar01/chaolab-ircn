'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const GRID_SIZE = 6;
const SENSE_RADIUS = 120;
const FOV_ANGLE = Math.PI * 0.75;
const MEMORY_FADE_RATE = 0.003;

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ObjectMemory {
  id: string;
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  centroid: { x: number; y: number };
  size: number;
  signature: string;
  pStatic: number;
  confidence: number;
  inView: boolean;
  lastSeenCentroid?: { x: number; y: number };
  surprised?: boolean;
}

interface Creature {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  wanderAngle: number;
}

interface PredictiveCreatureProps {
  obstacles: Obstacle[];
  creatureCount?: number;
  showDebug?: boolean;
}

export default function PredictiveCreature({
  obstacles,
  creatureCount = 3,
  showDebug = false
}: PredictiveCreatureProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const creaturesRef = useRef<Creature[]>([]);
  const memoriesRef = useRef<Map<number, ObjectMemory[]>>(new Map());
  const obstaclesRef = useRef<Obstacle[]>(obstacles);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(Date.now());
  const [, forceRender] = useState(0);

  // Update obstacles ref
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  // Initialize dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: document.documentElement.scrollHeight
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize creatures
  useEffect(() => {
    if (dimensions.width < 100) return;
    if (creaturesRef.current.length > 0) return;

    const creatures: Creature[] = [];
    for (let i = 0; i < creatureCount; i++) {
      creatures.push({
        x: Math.random() * dimensions.width * 0.8 + dimensions.width * 0.1,
        y: Math.random() * Math.min(dimensions.height, 800) * 0.6 + 100,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        phase: Math.random() * Math.PI * 2,
        wanderAngle: Math.random() * Math.PI * 2,
      });
      memoriesRef.current.set(i, []);
    }
    creaturesRef.current = creatures;
  }, [dimensions.width, creatureCount]);

  // Check if cell is blocked
  const isCellBlocked = useCallback((cellX: number, cellY: number) => {
    const pixelX = cellX * GRID_SIZE + GRID_SIZE / 2;
    const pixelY = cellY * GRID_SIZE + GRID_SIZE / 2;

    // Boundaries
    if (pixelX < 10 || pixelX > dimensions.width - 10 ||
        pixelY < 10 || pixelY > dimensions.height - 10) {
      return true;
    }

    // Obstacles
    for (const obs of obstaclesRef.current) {
      if (pixelX > obs.x - 5 && pixelX < obs.x + obs.width + 5 &&
          pixelY > obs.y - 5 && pixelY < obs.y + obs.height + 5) {
        return true;
      }
    }
    return false;
  }, [dimensions]);

  // Check if point is in FOV
  const isInFOV = useCallback((cx: number, cy: number, heading: number, px: number, py: number) => {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > SENSE_RADIUS) return false;

    const angleToPoint = Math.atan2(dy, dx);
    let angleDiff = angleToPoint - heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    return Math.abs(angleDiff) < FOV_ANGLE / 2;
  }, []);

  // Find edge cells in FOV
  const findEdgeCells = useCallback((cx: number, cy: number, heading: number) => {
    const edges: { cellX: number; cellY: number }[] = [];
    const senseCellRadius = Math.ceil(SENSE_RADIUS / GRID_SIZE);
    const centerCellX = Math.floor(cx / GRID_SIZE);
    const centerCellY = Math.floor(cy / GRID_SIZE);

    for (let dy = -senseCellRadius; dy <= senseCellRadius; dy++) {
      for (let dx = -senseCellRadius; dx <= senseCellRadius; dx++) {
        const cellX = centerCellX + dx;
        const cellY = centerCellY + dy;
        const pixelX = cellX * GRID_SIZE + GRID_SIZE / 2;
        const pixelY = cellY * GRID_SIZE + GRID_SIZE / 2;

        if (!isInFOV(cx, cy, heading, pixelX, pixelY)) continue;
        if (!isCellBlocked(cellX, cellY)) continue;

        // Check if it's an edge (adjacent to non-blocked cell)
        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [nx, ny] of neighbors) {
          if (!isCellBlocked(cellX + nx, cellY + ny)) {
            edges.push({ cellX, cellY });
            break;
          }
        }
      }
    }
    return edges;
  }, [isCellBlocked, isInFOV]);

  // Flood fill to group edges into objects
  const floodFillEdges = useCallback((start: { cellX: number; cellY: number }, edgeSet: Set<string>, visited: Set<string>) => {
    const contour: { cellX: number; cellY: number }[] = [];
    const stack = [start];
    const key = (c: { cellX: number; cellY: number }) => `${c.cellX},${c.cellY}`;

    while (stack.length > 0) {
      const cell = stack.pop()!;
      const k = key(cell);
      if (visited.has(k) || !edgeSet.has(k)) continue;

      visited.add(k);
      contour.push(cell);

      const neighbors = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
      for (const [dx, dy] of neighbors) {
        const neighbor = { cellX: cell.cellX + dx, cellY: cell.cellY + dy };
        if (!visited.has(key(neighbor)) && edgeSet.has(key(neighbor))) {
          stack.push(neighbor);
        }
      }
    }
    return contour;
  }, []);

  // Extract features from contour
  const extractFeatures = useCallback((contour: { cellX: number; cellY: number }[]) => {
    if (contour.length < 3) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    for (const cell of contour) {
      minX = Math.min(minX, cell.cellX);
      maxX = Math.max(maxX, cell.cellX);
      minY = Math.min(minY, cell.cellY);
      maxY = Math.max(maxY, cell.cellY);
      sumX += cell.cellX;
      sumY += cell.cellY;
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const size = contour.length;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const signature = `${Math.round(size / 3)}_${Math.round(aspectRatio * 10)}`;

    return {
      bbox: { minX, maxX, minY, maxY },
      centroid: {
        x: (sumX / contour.length) * GRID_SIZE + GRID_SIZE / 2,
        y: (sumY / contour.length) * GRID_SIZE + GRID_SIZE / 2,
      },
      size,
      width,
      height,
      aspectRatio,
      signature,
    };
  }, []);

  // Compute P(static)
  const computePStatic = useCallback((features: ReturnType<typeof extractFeatures>) => {
    if (!features) return 0.5;
    let pStatic = 0.5;

    if (features.size > 30) pStatic += 0.25;
    else if (features.size < 15) pStatic -= 0.15;

    if (features.aspectRatio > 2) pStatic += 0.1;

    // Near edges = probably boundary
    const distFromEdge = Math.min(
      features.bbox.minX * GRID_SIZE,
      features.bbox.minY * GRID_SIZE,
      dimensions.width - features.bbox.maxX * GRID_SIZE,
      dimensions.height - features.bbox.maxY * GRID_SIZE
    );
    if (distFromEdge < 30) pStatic += 0.25;

    return Math.max(0.15, Math.min(0.9, pStatic));
  }, [dimensions]);

  // Find avoidance direction using memory
  const findAvoidanceDirection = useCallback((x: number, y: number, currentAngle: number, memory: ObjectMemory[]) => {
    const numSamples = 16;
    let bestAngle = currentAngle;
    let lowestDanger = Infinity;

    for (let i = 0; i < numSamples; i++) {
      const testAngle = (i / numSamples) * Math.PI * 2;
      let danger = 0;

      for (const dist of [30, 60, 90]) {
        const sampleX = x + Math.cos(testAngle) * dist;
        const sampleY = y + Math.sin(testAngle) * dist;

        // Check against remembered objects
        for (const obj of memory) {
          const objCenterX = obj.centroid.x;
          const objCenterY = obj.centroid.y;
          const objRadius = Math.max(
            (obj.bbox.maxX - obj.bbox.minX + 1) * GRID_SIZE,
            (obj.bbox.maxY - obj.bbox.minY + 1) * GRID_SIZE
          ) / 2 + 20;

          const distToObj = Math.sqrt((sampleX - objCenterX) ** 2 + (sampleY - objCenterY) ** 2);
          if (distToObj < objRadius) {
            danger += (1 - distToObj / objRadius) * obj.confidence * 2;
          }
        }

        // Check boundaries
        if (sampleX < 40 || sampleX > dimensions.width - 40 ||
            sampleY < 40 || sampleY > dimensions.height - 40) {
          danger += 1;
        }
      }

      // Prefer current direction slightly
      const angleDiff = Math.abs(Math.atan2(Math.sin(testAngle - currentAngle), Math.cos(testAngle - currentAngle)));
      danger += angleDiff * 0.15;

      if (danger < lowestDanger) {
        lowestDanger = danger;
        bestAngle = testAngle;
      }
    }

    return bestAngle;
  }, [dimensions]);

  // Animation loop
  useEffect(() => {
    if (dimensions.width < 100) return;

    const animate = () => {
      const now = Date.now();
      const delta = Math.min(32, now - lastTimeRef.current) / 16.67;
      lastTimeRef.current = now;

      creaturesRef.current = creaturesRef.current.map((creature, idx) => {
        let { x, y, vx, vy, phase, wanderAngle } = creature;
        const heading = Math.atan2(vy, vx);
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Find edges in FOV
        const edges = findEdgeCells(x, y, heading);
        const edgeSet = new Set(edges.map(e => `${e.cellX},${e.cellY}`));
        const visited = new Set<string>();
        const currentlyVisible: ObjectMemory[] = [];

        // Group edges into objects
        for (const cell of edges) {
          const k = `${cell.cellX},${cell.cellY}`;
          if (visited.has(k)) continue;

          const contour = floodFillEdges(cell, edgeSet, visited);
          const features = extractFeatures(contour);
          if (!features) continue;

          const pStatic = computePStatic(features);
          currentlyVisible.push({
            id: `${idx}-${features.signature}-${Math.round(features.centroid.x / 50)}`,
            ...features,
            pStatic,
            confidence: 1,
            inView: true,
          });
        }

        // Update memory
        const prevMemory = memoriesRef.current.get(idx) || [];
        const newMemory: ObjectMemory[] = [];
        const matchedIds = new Set<string>();

        // Match visible to memory
        for (const visible of currentlyVisible) {
          let matched = false;
          for (const mem of prevMemory) {
            const dist = Math.sqrt(
              (mem.centroid.x - visible.centroid.x) ** 2 +
              (mem.centroid.y - visible.centroid.y) ** 2
            );
            if (mem.signature === visible.signature && dist < 100) {
              // Check for surprise - object moved!
              const moved = mem.lastSeenCentroid &&
                Math.sqrt(
                  (mem.lastSeenCentroid.x - visible.centroid.x) ** 2 +
                  (mem.lastSeenCentroid.y - visible.centroid.y) ** 2
                ) > 30;

              newMemory.push({
                ...visible,
                confidence: 1,
                inView: true,
                lastSeenCentroid: { ...visible.centroid },
                surprised: moved,
                pStatic: moved ? Math.max(0.1, mem.pStatic - 0.3) : mem.pStatic,
              });
              matchedIds.add(mem.id);
              matched = true;
              break;
            }
          }
          if (!matched) {
            newMemory.push({
              ...visible,
              lastSeenCentroid: { ...visible.centroid },
            });
          }
        }

        // Keep unmatched memories (fade them)
        for (const mem of prevMemory) {
          if (!matchedIds.has(mem.id) && !currentlyVisible.some(v => v.id === mem.id)) {
            if (mem.confidence > 0.15) {
              newMemory.push({
                ...mem,
                inView: false,
                confidence: mem.confidence - MEMORY_FADE_RATE * delta,
                surprised: false,
              });
            }
          }
        }

        memoriesRef.current.set(idx, newMemory);

        // Navigate using memory
        const safeAngle = findAvoidanceDirection(x, y, heading, newMemory);

        // Wander
        wanderAngle += (Math.random() - 0.5) * 0.06 * delta;
        if (Math.random() < 0.005) {
          wanderAngle = Math.random() * Math.PI * 2;
        }

        // Blend angles
        const targetAngle = safeAngle;
        const angleDiff = Math.atan2(Math.sin(targetAngle - heading), Math.cos(targetAngle - heading));
        const newAngle = heading + angleDiff * 0.06 * delta;

        const targetSpeed = 1.0;
        const newSpeed = speed + (targetSpeed - speed) * 0.08 * delta;

        vx = Math.cos(newAngle) * newSpeed;
        vy = Math.sin(newAngle) * newSpeed;

        // Update position
        let nextX = x + vx * delta;
        let nextY = y + vy * delta;

        // Boundary bounce
        const padding = 30;
        if (nextX < padding) { nextX = padding; vx = Math.abs(vx); }
        if (nextX > dimensions.width - padding) { nextX = dimensions.width - padding; vx = -Math.abs(vx); }
        if (nextY < padding) { nextY = padding; vy = Math.abs(vy); }
        if (nextY > dimensions.height - padding) { nextY = dimensions.height - padding; vy = -Math.abs(vy); }

        // Obstacle collision
        for (const obs of obstaclesRef.current) {
          if (nextX > obs.x - 15 && nextX < obs.x + obs.width + 15 &&
              nextY > obs.y - 15 && nextY < obs.y + obs.height + 15) {
            const centerX = obs.x + obs.width / 2;
            const centerY = obs.y + obs.height / 2;
            const awayAngle = Math.atan2(y - centerY, x - centerX);
            vx = Math.cos(awayAngle) * newSpeed * 1.5;
            vy = Math.sin(awayAngle) * newSpeed * 1.5;
            nextX = x;
            nextY = y;
            break;
          }
        }

        phase += 0.03 * delta;

        return { x: nextX, y: nextY, vx, vy, phase, wanderAngle };
      });

      forceRender(n => n + 1);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, findEdgeCells, floodFillEdges, extractFeatures, computePStatic, findAvoidanceDirection]);

  return (
    <svg
      ref={svgRef}
      className="fixed inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', zIndex: 5 }}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="creatureGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7eb89e" />
          <stop offset="100%" stopColor="#5a8f6a" />
        </linearGradient>
      </defs>

      {creaturesRef.current.map((creature, idx) => {
        const heading = Math.atan2(creature.vy, creature.vx);
        const memory = memoriesRef.current.get(idx) || [];
        const startAngle = heading - FOV_ANGLE / 2;
        const endAngle = heading + FOV_ANGLE / 2;
        const x1 = creature.x + Math.cos(startAngle) * SENSE_RADIUS;
        const y1 = creature.y + Math.sin(startAngle) * SENSE_RADIUS;
        const x2 = creature.x + Math.cos(endAngle) * SENSE_RADIUS;
        const y2 = creature.y + Math.sin(endAngle) * SENSE_RADIUS;

        return (
          <g key={idx}>
            {/* FOV cone */}
            <path
              d={`M ${creature.x} ${creature.y} L ${x1} ${y1} A ${SENSE_RADIUS} ${SENSE_RADIUS} 0 0 1 ${x2} ${y2} Z`}
              fill="rgba(126, 184, 158, 0.06)"
              stroke="rgba(126, 184, 158, 0.15)"
              strokeWidth={1}
            />

            {/* Memory visualization */}
            {showDebug && memory.map((obj, i) => (
              <g key={`mem-${idx}-${i}`}>
                <rect
                  x={obj.bbox.minX * GRID_SIZE}
                  y={obj.bbox.minY * GRID_SIZE}
                  width={(obj.bbox.maxX - obj.bbox.minX + 1) * GRID_SIZE}
                  height={(obj.bbox.maxY - obj.bbox.minY + 1) * GRID_SIZE}
                  fill={obj.inView ? 'rgba(126, 184, 158, 0.2)' : 'rgba(255, 200, 100, 0.1)'}
                  stroke={obj.inView ? 'rgba(126, 184, 158, 0.6)' : 'rgba(255, 200, 100, 0.3)'}
                  strokeWidth={obj.inView ? 2 : 1}
                  strokeDasharray={obj.inView ? 'none' : '4,2'}
                />
                {obj.surprised && (
                  <text
                    x={obj.centroid.x}
                    y={obj.centroid.y - 15}
                    fontSize={16}
                    fill="#ff6b6b"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    !
                  </text>
                )}
              </g>
            ))}

            {/* Creature body */}
            <g transform={`translate(${creature.x}, ${creature.y}) rotate(${heading * 180 / Math.PI})`} filter="url(#glow)">
              {/* Tail segments */}
              <circle cx={-8} cy={Math.sin(creature.phase) * 2} r={3} fill="#5a8f6a" opacity={0.7} />
              <circle cx={-14} cy={Math.sin(creature.phase + 1) * 3} r={2.5} fill="#5a8f6a" opacity={0.5} />
              <circle cx={-19} cy={Math.sin(creature.phase + 2) * 3.5} r={2} fill="#5a8f6a" opacity={0.3} />

              {/* Body */}
              <ellipse cx={0} cy={0} rx={7} ry={5} fill="url(#creatureGrad)" />

              {/* Head */}
              <ellipse cx={6} cy={0} rx={4} ry={3.5} fill="#7eb89e" />

              {/* Eye */}
              <circle cx={8} cy={-1} r={1.5} fill="#1a1a2e" />
              <circle cx={8.5} cy={-1.3} r={0.5} fill="white" />

              {/* Surprise indicator */}
              {memory.some(m => m.surprised) && (
                <text x={12} y={-8} fontSize={12} fill="#ff6b6b" fontWeight="bold">!</text>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
