import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 8;
const SENSE_RADIUS = 100;
const FOV_ANGLE = Math.PI * 0.7; // ~126 degrees field of view
const PIXEL_SIZE = 3;
const TADPOLE_RADIUS = 10;
const MEMORY_FADE_RATE = 0.002; // How fast unseen objects fade from memory

// Single tadpole for testing vision
const Tadpole = ({ x, y, vx, vy, phase }) => {
  const angle = Math.atan2(vy, vx);
  const p = PIXEL_SIZE;
  
  const time = Date.now() / 100 + phase;
  const wave1 = Math.sin(time) * 0.8;
  const wave2 = Math.sin(time + 1.5) * 1.2;
  const wave3 = Math.sin(time + 3) * 1.5;
  
  const color = '#7eb89e';
  const darkColor = '#5a8f6a';
  const lightColor = '#a8d4bc';
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle * 180 / Math.PI})`}>
      <rect x={-p*2} y={wave1 * p - p/2} width={p} height={p} fill={color} />
      <rect x={-p*3} y={wave2 * p - p/2} width={p} height={p} fill={darkColor} />
      <rect x={-p*4} y={wave3 * p - p/2} width={p} height={p} fill={darkColor} style={{ opacity: 0.7 }} />
      
      <rect x={-p} y={-p} width={p*3} height={p*2} fill={color} />
      <rect x={0} y={-p*1.5} width={p*2} height={p} fill={lightColor} style={{ opacity: 0.5 }} />
      <rect x={p*2} y={-p} width={p} height={p*2} fill={darkColor} />
    </g>
  );
};

// Field of view cone visualization
const FieldOfView = ({ x, y, angle }) => {
  const startAngle = angle - FOV_ANGLE / 2;
  const endAngle = angle + FOV_ANGLE / 2;
  
  // Create arc path
  const x1 = x + Math.cos(startAngle) * SENSE_RADIUS;
  const y1 = y + Math.sin(startAngle) * SENSE_RADIUS;
  const x2 = x + Math.cos(endAngle) * SENSE_RADIUS;
  const y2 = y + Math.sin(endAngle) * SENSE_RADIUS;
  
  const largeArc = FOV_ANGLE > Math.PI ? 1 : 0;
  
  return (
    <path
      d={`M ${x} ${y} L ${x1} ${y1} A ${SENSE_RADIUS} ${SENSE_RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`}
      fill="rgba(126,184,158,0.08)"
      stroke="rgba(126,184,158,0.25)"
      strokeWidth={1}
    />
  );
};

// Edge cell visualization
const EdgeCell = ({ x, y }) => (
  <rect
    x={x} y={y}
    width={GRID_SIZE} height={GRID_SIZE}
    fill="rgba(255,255,100,0.35)"
    stroke="rgba(255,255,100,0.6)"
    strokeWidth={0.5}
  />
);

// Detected/remembered object
const DetectedObject = ({ bbox, centroid, pStatic, confidence, inView }) => {
  // Color: red = static, green = movable
  const hue = 120 * (1 - pStatic);
  const alpha = inView ? 0.5 : 0.2 * confidence; // Fade when in memory only
  const borderAlpha = inView ? 0.9 : 0.4 * confidence;
  const color = `hsla(${hue}, 80%, 50%, ${alpha})`;
  const borderColor = `hsla(${hue}, 80%, 50%, ${borderAlpha})`;
  
  return (
    <g>
      <rect
        x={bbox.minX * GRID_SIZE}
        y={bbox.minY * GRID_SIZE}
        width={(bbox.maxX - bbox.minX + 1) * GRID_SIZE}
        height={(bbox.maxY - bbox.minY + 1) * GRID_SIZE}
        fill={color}
        stroke={borderColor}
        strokeWidth={inView ? 2 : 1}
        strokeDasharray={inView ? "none" : "4,2"}
      />
      <circle
        cx={centroid.x}
        cy={centroid.y}
        r={inView ? 4 : 3}
        fill={borderColor}
      />
      <text
        x={centroid.x}
        y={centroid.y - 10}
        fontSize={9}
        fill={inView ? "white" : "rgba(255,255,255,0.5)"}
        textAnchor="middle"
        style={{ fontFamily: 'monospace' }}
      >
        {(pStatic * 100).toFixed(0)}%{!inView && ' 👁'}
      </text>
    </g>
  );
};

const PageElement = ({ id, x, y, width, height, children, onDrag, draggable, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handlePointerDown = (e) => {
    if (!draggable) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = e.currentTarget.closest('[data-container]');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    onDrag(id, 
      Math.max(0, Math.min(containerRect.width - width, e.clientX - containerRect.left - dragOffset.x)),
      Math.max(0, Math.min(containerRect.height - height, e.clientY - containerRect.top - dragOffset.y))
    );
  };
  
  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  
  return (
    <div
      className={`absolute touch-none select-none ${className} ${draggable ? 'cursor-move' : ''}`}
      style={{
        left: x, top: y, width, height,
        transition: isDragging ? 'none' : 'box-shadow 0.15s',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
        zIndex: isDragging ? 100 : 1
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
    </div>
  );
};

export default function PredictiveTadpoles() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 360, height: 600 });
  const [tadpole, setTadpole] = useState(null);
  const [obstacles, setObstacles] = useState([]);
  const [edgeCells, setEdgeCells] = useState([]);
  const [objectMemory, setObjectMemory] = useState([]); // Persistent memory of objects
  const animationRef = useRef();
  const lastTimeRef = useRef(Date.now());
  
  const [pageElements, setPageElements] = useState([
    { id: 'card1', x: 40, y: 80, width: 100, height: 70, draggable: true },
    { id: 'card2', x: 180, y: 80, width: 100, height: 70, draggable: true },
    { id: 'btn1', x: 40, y: 280, width: 70, height: 30, draggable: true },
    { id: 'smallbox', x: 200, y: 300, width: 30, height: 30, draggable: true },
  ]);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  useEffect(() => {
    if (dimensions.width < 100) return;
    setTadpole({
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      vx: 0.8,
      vy: 0.5,
      phase: Math.random() * Math.PI * 2,
      wanderAngle: Math.random() * Math.PI * 2,
    });
  }, [dimensions.width > 100]);
  
  const handleDrag = useCallback((id, newX, newY) => {
    setPageElements(prev => prev.map(el => el.id === id ? { ...el, x: newX, y: newY } : el));
  }, []);
  
  useEffect(() => {
    setObstacles(pageElements.map(el => ({ ...el })));
  }, [pageElements]);
  
  // Check if a cell is blocked
  const isCellBlocked = useCallback((cellX, cellY) => {
    const pixelX = cellX * GRID_SIZE + GRID_SIZE / 2;
    const pixelY = cellY * GRID_SIZE + GRID_SIZE / 2;
    
    if (pixelX < 5 || pixelX > dimensions.width - 5 || 
        pixelY < 5 || pixelY > dimensions.height - 5) {
      return true;
    }
    
    for (const obs of obstacles) {
      if (pixelX > obs.x - 2 && pixelX < obs.x + obs.width + 2 &&
          pixelY > obs.y - 2 && pixelY < obs.y + obs.height + 2) {
        return true;
      }
    }
    return false;
  }, [obstacles, dimensions]);
  
  // Check if point is within field of view
  const isInFOV = useCallback((tadpoleX, tadpoleY, heading, pointX, pointY) => {
    const dx = pointX - tadpoleX;
    const dy = pointY - tadpoleY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > SENSE_RADIUS) return false;
    
    const angleToPoint = Math.atan2(dy, dx);
    let angleDiff = angleToPoint - heading;
    
    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    return Math.abs(angleDiff) < FOV_ANGLE / 2;
  }, []);
  
  // Find edge cells within FOV
  const findEdgeCells = useCallback((tadpoleX, tadpoleY, heading) => {
    const edges = [];
    const senseCellRadius = Math.ceil(SENSE_RADIUS / GRID_SIZE);
    const centerCellX = Math.floor(tadpoleX / GRID_SIZE);
    const centerCellY = Math.floor(tadpoleY / GRID_SIZE);
    
    for (let dy = -senseCellRadius; dy <= senseCellRadius; dy++) {
      for (let dx = -senseCellRadius; dx <= senseCellRadius; dx++) {
        const cellX = centerCellX + dx;
        const cellY = centerCellY + dy;
        
        const pixelX = cellX * GRID_SIZE + GRID_SIZE / 2;
        const pixelY = cellY * GRID_SIZE + GRID_SIZE / 2;
        
        // Check FOV instead of circular radius
        if (!isInFOV(tadpoleX, tadpoleY, heading, pixelX, pixelY)) continue;
        
        if (!isCellBlocked(cellX, cellY)) continue;
        
        const neighbors = [[-1,0], [1,0], [0,-1], [0,1]];
        let isEdge = false;
        for (const [nx, ny] of neighbors) {
          if (!isCellBlocked(cellX + nx, cellY + ny)) {
            isEdge = true;
            break;
          }
        }
        
        if (isEdge) {
          edges.push({ cellX, cellY });
        }
      }
    }
    
    return edges;
  }, [isCellBlocked, isInFOV]);
  
  // Flood fill for connected edges
  const floodFillEdges = useCallback((startCell, edgeSet, visited) => {
    const contour = [];
    const stack = [startCell];
    const key = (c) => `${c.cellX},${c.cellY}`;
    
    while (stack.length > 0) {
      const cell = stack.pop();
      const k = key(cell);
      
      if (visited.has(k)) continue;
      if (!edgeSet.has(k)) continue;
      
      visited.add(k);
      contour.push(cell);
      
      const neighbors = [
        [-1,-1], [0,-1], [1,-1],
        [-1, 0],         [1, 0],
        [-1, 1], [0, 1], [1, 1]
      ];
      
      for (const [dx, dy] of neighbors) {
        const neighbor = { cellX: cell.cellX + dx, cellY: cell.cellY + dy };
        if (!visited.has(key(neighbor)) && edgeSet.has(key(neighbor))) {
          stack.push(neighbor);
        }
      }
    }
    
    return contour;
  }, []);
  
  // Extract features
  const extractFeatures = useCallback((contour) => {
    if (contour.length === 0) return null;
    
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
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const size = contour.length;
    
    const centroid = {
      x: (sumX / contour.length) * GRID_SIZE + GRID_SIZE / 2,
      y: (sumY / contour.length) * GRID_SIZE + GRID_SIZE / 2,
    };
    
    // Create a simple signature for matching
    const signature = `${Math.round(size/3)}_${Math.round(aspectRatio*10)}`;
    
    return {
      bbox: { minX, maxX, minY, maxY },
      centroid,
      size,
      width,
      height,
      aspectRatio,
      signature,
    };
  }, []);
  
  // Compute P(static)
  const computePStatic = useCallback((features) => {
    if (!features) return 0.5;
    
    let pStatic = 0.5;
    
    if (features.size > 25) pStatic += 0.25;
    else if (features.size < 12) pStatic -= 0.2;
    
    if (features.aspectRatio > 2.5) pStatic += 0.15;
    
    if (features.aspectRatio < 1.5 && features.size < 18) pStatic -= 0.15;
    
    const distFromEdge = Math.min(
      features.bbox.minX * GRID_SIZE,
      features.bbox.minY * GRID_SIZE,
      dimensions.width - features.bbox.maxX * GRID_SIZE,
      dimensions.height - features.bbox.maxY * GRID_SIZE
    );
    if (distFromEdge < 20) pStatic += 0.2;
    
    return Math.max(0.1, Math.min(0.95, pStatic));
  }, [dimensions]);
  
  // Match detected object to memory
  const matchToMemory = useCallback((features, memory) => {
    let bestMatch = null;
    let bestScore = Infinity;
    
    for (let i = 0; i < memory.length; i++) {
      const mem = memory[i];
      
      // Compare signature and distance
      if (mem.signature !== features.signature) continue;
      
      const dist = Math.sqrt(
        (mem.centroid.x - features.centroid.x) ** 2 +
        (mem.centroid.y - features.centroid.y) ** 2
      );
      
      // Allow some movement for matching
      if (dist < 80 && dist < bestScore) {
        bestScore = dist;
        bestMatch = i;
      }
    }
    
    return bestMatch;
  }, []);
  
  // Check collision at a point
  const checkCollision = useCallback((x, y, padding = 8) => {
    if (x < padding || x > dimensions.width - padding ||
        y < padding || y > dimensions.height - padding) {
      return { hit: true, type: 'boundary' };
    }
    
    for (const obs of obstacles) {
      if (x > obs.x - padding && x < obs.x + obs.width + padding &&
          y > obs.y - padding && y < obs.y + obs.height + padding) {
        return { hit: true, type: 'obstacle', obs };
      }
    }
    
    return { hit: false };
  }, [obstacles, dimensions]);
  
  // Find avoidance direction based on memory
  const findAvoidanceDirection = useCallback((x, y, currentAngle, memory) => {
    const numSamples = 12;
    let bestAngle = currentAngle;
    let lowestDanger = Infinity;
    
    for (let i = 0; i < numSamples; i++) {
      const testAngle = (i / numSamples) * Math.PI * 2;
      let danger = 0;
      
      // Sample ahead
      for (const dist of [20, 40, 60]) {
        const sampleX = x + Math.cos(testAngle) * dist;
        const sampleY = y + Math.sin(testAngle) * dist;
        
        // Check against remembered objects
        for (const obj of memory) {
          const objCenterX = obj.centroid.x;
          const objCenterY = obj.centroid.y;
          const objRadius = Math.max(obj.width, obj.height) * GRID_SIZE / 2 + 15;
          
          const distToObj = Math.sqrt((sampleX - objCenterX) ** 2 + (sampleY - objCenterY) ** 2);
          if (distToObj < objRadius) {
            danger += (1 - distToObj / objRadius) * obj.confidence;
          }
        }
        
        // Check boundaries
        if (sampleX < 25 || sampleX > dimensions.width - 25 ||
            sampleY < 25 || sampleY > dimensions.height - 25) {
          danger += 0.5;
        }
      }
      
      // Momentum preference
      const angleDiff = Math.abs(Math.atan2(Math.sin(testAngle - currentAngle), Math.cos(testAngle - currentAngle)));
      danger += angleDiff * 0.1;
      
      if (danger < lowestDanger) {
        lowestDanger = danger;
        bestAngle = testAngle;
      }
    }
    
    return bestAngle;
  }, [dimensions]);
  
  // Main detection and memory update
  const detectAndRemember = useCallback((tadpoleX, tadpoleY, heading, delta) => {
    // 1. Find edges in FOV
    const edges = findEdgeCells(tadpoleX, tadpoleY, heading);
    setEdgeCells(edges);
    
    // 2. Group into objects
    const edgeSet = new Set(edges.map(e => `${e.cellX},${e.cellY}`));
    const visited = new Set();
    const currentlyVisible = [];
    
    for (const cell of edges) {
      const k = `${cell.cellX},${cell.cellY}`;
      if (visited.has(k)) continue;
      
      const contour = floodFillEdges(cell, edgeSet, visited);
      if (contour.length < 3) continue;
      
      const features = extractFeatures(contour);
      if (!features) continue;
      
      const pStatic = computePStatic(features);
      
      currentlyVisible.push({
        ...features,
        pStatic,
        inView: true,
        confidence: 1,
      });
    }
    
    // 3. Update memory
    setObjectMemory(prevMemory => {
      const newMemory = [...prevMemory];
      const matched = new Set();
      
      // Match visible objects to memory
      for (const visible of currentlyVisible) {
        const matchIdx = matchToMemory(visible, newMemory);
        
        if (matchIdx !== null) {
          // Update existing memory
          matched.add(matchIdx);
          newMemory[matchIdx] = {
            ...visible,
            confidence: 1,
            inView: true,
          };
        } else {
          // New object - add to memory
          newMemory.push({
            ...visible,
            confidence: 1,
            inView: true,
            id: Date.now() + Math.random(),
          });
        }
      }
      
      // Fade unmatched memories
      for (let i = 0; i < newMemory.length; i++) {
        if (!matched.has(i) && !currentlyVisible.some(v => 
          v.centroid.x === newMemory[i].centroid.x && 
          v.centroid.y === newMemory[i].centroid.y
        )) {
          newMemory[i] = {
            ...newMemory[i],
            inView: false,
            confidence: newMemory[i].confidence - MEMORY_FADE_RATE * delta,
          };
        }
      }
      
      // Remove very faded memories
      return newMemory.filter(m => m.confidence > 0.1);
    });
  }, [findEdgeCells, floodFillEdges, extractFeatures, computePStatic, matchToMemory]);
  
  // Animation loop
  useEffect(() => {
    if (!tadpole) return;
    
    const animate = () => {
      const now = Date.now();
      const delta = Math.min(32, now - lastTimeRef.current) / 16.67;
      lastTimeRef.current = now;
      
      setTadpole(prev => {
        if (!prev) return prev;
        
        let { x, y, vx, vy, wanderAngle, phase } = prev;
        
        const currentAngle = Math.atan2(vy, vx);
        const speed = Math.sqrt(vx * vx + vy * vy);
        
        // Run detection
        detectAndRemember(x, y, currentAngle, delta);
        
        // Get avoidance direction from memory
        const safeAngle = findAvoidanceDirection(x, y, currentAngle, objectMemory);
        
        // Blend wander with avoidance
        wanderAngle += (Math.random() - 0.5) * 0.08 * delta;
        if (Math.random() < 0.008) {
          wanderAngle = Math.random() * Math.PI * 2;
        }
        
        // Target angle blends wander and avoidance
        const targetAngle = safeAngle;
        
        const angleDiff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
        const newAngle = currentAngle + angleDiff * 0.08 * delta;
        
        const targetSpeed = 1.2;
        const newSpeed = speed + (targetSpeed - speed) * 0.1 * delta;
        
        vx = Math.cos(newAngle) * newSpeed;
        vy = Math.sin(newAngle) * newSpeed;
        
        let nextX = x + vx * delta;
        let nextY = y + vy * delta;
        
        // Physical collision check
        const collision = checkCollision(nextX, nextY);
        if (collision.hit) {
          // Bounce
          if (collision.type === 'boundary') {
            if (nextX < 20 || nextX > dimensions.width - 20) vx *= -1;
            if (nextY < 20 || nextY > dimensions.height - 20) vy *= -1;
          } else if (collision.obs) {
            const obs = collision.obs;
            const centerX = obs.x + obs.width / 2;
            const centerY = obs.y + obs.height / 2;
            const awayAngle = Math.atan2(y - centerY, x - centerX);
            vx = Math.cos(awayAngle) * newSpeed * 1.2;
            vy = Math.sin(awayAngle) * newSpeed * 1.2;
          }
          wanderAngle = Math.atan2(vy, vx);
          nextX = x;
          nextY = y;
        }
        
        nextX = Math.max(20, Math.min(dimensions.width - 20, nextX));
        nextY = Math.max(20, Math.min(dimensions.height - 20, nextY));
        
        return { ...prev, x: nextX, y: nextY, vx, vy, wanderAngle };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [tadpole?.phase, detectAndRemember, findAvoidanceDirection, checkCollision, objectMemory, dimensions]);
  
  const inViewCount = objectMemory.filter(o => o.inView).length;
  const memoryCount = objectMemory.filter(o => !o.inView).length;
  
  return (
    <div className="w-full min-h-screen bg-slate-900 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1 gap-2 flex-wrap">
        <span className="text-slate-400 text-xs font-mono">
          FOV + memory + collision
        </span>
        <span className="text-slate-500 text-xs font-mono">
          <span className="text-green-400">{inViewCount} visible</span>
          {memoryCount > 0 && <span className="text-yellow-400 ml-2">{memoryCount} remembered</span>}
        </span>
      </div>
      
      <div 
        ref={containerRef}
        data-container
        className="relative bg-slate-800 rounded-lg overflow-hidden flex-1"
        style={{ minHeight: 480 }}
      >
        <PageElement {...pageElements.find(e => e.id === 'card1')} onDrag={handleDrag} className="bg-slate-700/80 rounded border border-slate-600/50 p-2">
          <div className="text-emerald-400 text-xs font-mono mb-1">card 1</div>
          <div className="text-slate-300 text-xs">Large box</div>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'card2')} onDrag={handleDrag} className="bg-slate-700/80 rounded border border-slate-600/50 p-2">
          <div className="text-emerald-400 text-xs font-mono mb-1">card 2</div>
          <div className="text-slate-300 text-xs">Large box</div>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'btn1')} onDrag={handleDrag} className="bg-emerald-600/80 rounded flex items-center justify-center">
          <span className="text-white text-xs font-mono">button</span>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'smallbox')} onDrag={handleDrag} className="bg-orange-500/80 rounded flex items-center justify-center">
          <span className="text-white text-xs font-mono">sm</span>
        </PageElement>
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Field of view */}
          {tadpole && (
            <FieldOfView 
              x={tadpole.x} 
              y={tadpole.y} 
              angle={Math.atan2(tadpole.vy, tadpole.vx)} 
            />
          )}
          
          {/* Edge cells */}
          {edgeCells.map((cell, i) => (
            <EdgeCell key={`${cell.cellX}-${cell.cellY}`} x={cell.cellX * GRID_SIZE} y={cell.cellY * GRID_SIZE} />
          ))}
          
          {/* Objects (both visible and remembered) */}
          {objectMemory.map((obj, i) => (
            <DetectedObject key={obj.id || i} {...obj} />
          ))}
          
          {/* Tadpole */}
          {tadpole && <Tadpole {...tadpole} />}
        </svg>
        
        <div className="absolute bottom-2 left-2 text-xs font-mono flex flex-col gap-0.5 text-slate-500">
          <div><span className="text-yellow-300">yellow</span> = edges in view</div>
          <div><span className="text-green-400">solid</span> = seeing now</div>
          <div><span className="text-yellow-400">dashed</span> = remembered</div>
        </div>
      </div>
    </div>
  );
}
