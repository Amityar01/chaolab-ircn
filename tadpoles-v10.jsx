import React, { useState, useEffect, useRef, useCallback } from 'react';

const NUM_TADPOLES = 6;
const GRID_SIZE = 14;
const SURPRISE_DURATION = 800;
const PIXEL_SIZE = 3;
const TADPOLE_RADIUS = 10;
const SENSE_DISTANCE = 40;

const Tadpole = ({ x, y, vx, vy, surprised, omissionSurprise, predictedPath, showPrediction, phase, selected, onClick }) => {
  const angle = Math.atan2(vy, vx);
  const p = PIXEL_SIZE;
  
  const time = Date.now() / 100 + phase;
  const wave1 = Math.sin(time) * 0.8;
  const wave2 = Math.sin(time + 1.5) * 1.2;
  const wave3 = Math.sin(time + 3) * 1.5;
  
  const isOmission = omissionSurprise && !surprised;
  const color = surprised ? '#ff6b6b' : isOmission ? '#a388ee' : selected ? '#6ec8e8' : '#7eb89e';
  const darkColor = surprised ? '#cc5555' : isOmission ? '#7c5fc4' : selected ? '#4ba3c3' : '#5a8f6a';
  const lightColor = surprised ? '#ff8a8a' : isOmission ? '#c4b5fd' : selected ? '#a8e4f5' : '#a8d4bc';
  
  return (
    <g 
      transform={`translate(${x}, ${y}) rotate(${angle * 180 / Math.PI})`}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Selection ring */}
      {selected && (
        <g transform={`rotate(${-angle * 180 / Math.PI})`}>
          <circle cx={0} cy={0} r={16} fill="none" stroke="#6ec8e8" strokeWidth={2} strokeDasharray="4,3" opacity={0.7} />
        </g>
      )}
      
      {showPrediction && predictedPath && predictedPath.length > 1 && (
        <g transform={`rotate(${-angle * 180 / Math.PI})`}>
          {predictedPath.filter((_, i) => i % 2 === 0).map((point, i) => (
            <rect
              key={i}
              x={point.x - x - p/2}
              y={point.y - y - p/2}
              width={p}
              height={p}
              fill={point.blocked ? 'rgba(255,107,107,0.5)' : selected ? 'rgba(110,200,232,0.3)' : 'rgba(126,184,158,0.25)'}
            />
          ))}
        </g>
      )}
      
      <rect x={-p*2} y={wave1 * p - p/2} width={p} height={p} fill={color} />
      <rect x={-p*3} y={wave2 * p - p/2} width={p} height={p} fill={darkColor} />
      <rect x={-p*4} y={wave3 * p - p/2} width={p} height={p} fill={darkColor} style={{ opacity: 0.7 }} />
      
      <rect x={-p} y={-p} width={p*3} height={p*2} fill={color} />
      <rect x={0} y={-p*1.5} width={p*2} height={p} fill={lightColor} style={{ opacity: 0.5 }} />
      <rect x={p*2} y={-p} width={p} height={p*2} fill={darkColor} />
      
      {surprised && (
        <>
          <rect x={p*3 + 2} y={-p*3} width={p} height={p*2} fill="#fff" />
          <rect x={p*3 + 2} y={p} width={p} height={p} fill="#fff" />
        </>
      )}
      
      {isOmission && (
        <>
          <rect x={p*3 + 2} y={-p*3} width={p*2} height={p} fill="#fff" />
          <rect x={p*4 + 2} y={-p*2} width={p} height={p} fill="#fff" />
          <rect x={p*3 + 2} y={-p} width={p} height={p} fill="#fff" />
          <rect x={p*3 + 2} y={p} width={p} height={p} fill="#fff" />
        </>
      )}
    </g>
  );
};

const Ripple = ({ x, y, startTime }) => {
  const age = (Date.now() - startTime) / 1000;
  const maxAge = 0.8;
  if (age > maxAge) return null;
  
  const progress = age / maxAge;
  const radius = 10 + progress * 60;
  const opacity = (1 - progress) * 0.5;
  
  return (
    <g>
      <circle cx={x} cy={y} r={radius} fill="none" stroke="rgba(126,184,158,0.6)" strokeWidth={2 * (1 - progress)} style={{ opacity }} />
      <circle cx={x} cy={y} r={radius * 0.6} fill="none" stroke="rgba(126,184,158,0.4)" strokeWidth={1.5 * (1 - progress)} style={{ opacity: opacity * 0.7 }} />
    </g>
  );
};

const HeatmapCell = ({ x, y, belief, visits, isSelected }) => {
  if (belief < 0.3) return null;
  
  const confidence = Math.min(1, visits / 8);
  
  // Different colors for selected vs aggregate
  let r, g, b;
  if (isSelected) {
    // Cyan/blue for individual
    r = Math.floor(50 + 60 * (1 - confidence));
    g = Math.floor(180 + 40 * (1 - confidence));
    b = 232;
  } else {
    // Yellow -> Red for aggregate
    r = 255;
    g = Math.floor(200 * (1 - confidence));
    b = Math.floor(50 * (1 - confidence));
  }
  
  const alpha = 0.25 + confidence * 0.35;
  
  return (
    <rect
      x={x}
      y={y}
      width={GRID_SIZE}
      height={GRID_SIZE}
      fill={`rgba(${r}, ${g}, ${b}, ${alpha})`}
      style={{ pointerEvents: 'none' }}
    />
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
  const [showPrediction, setShowPrediction] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedTadpole, setSelectedTadpole] = useState(null); // null = aggregate, number = specific tadpole
  const [tadpoles, setTadpoles] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [ripples, setRipples] = useState([]);
  const [heatmapCells, setHeatmapCells] = useState([]);
  const beliefMaps = useRef([]);
  const animationRef = useRef();
  const lastTimeRef = useRef(Date.now());
  
  const [pageElements, setPageElements] = useState([
    { id: 'title', x: 16, y: 12, width: 160, height: 28, draggable: false },
    { id: 'card1', x: 16, y: 56, width: 120, height: 64, draggable: true },
    { id: 'card2', x: 152, y: 56, width: 120, height: 64, draggable: true },
    { id: 'btn1', x: 16, y: 240, width: 80, height: 28, draggable: true },
    { id: 'btn2', x: 110, y: 240, width: 80, height: 28, draggable: true },
    { id: 'text', x: 16, y: 420, width: 200, height: 44, draggable: true },
  ]);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        setDimensions({ width: w, height: h });
        
        setPageElements([
          { id: 'title', x: 12, y: 10, width: Math.min(140, w * 0.4), height: 24, draggable: false },
          { id: 'card1', x: 12, y: 46, width: Math.min(110, w * 0.35), height: 56, draggable: true },
          { id: 'card2', x: Math.min(136, w * 0.4), y: 46, width: Math.min(110, w * 0.35), height: 56, draggable: true },
          { id: 'btn1', x: 12, y: h * 0.38, width: 72, height: 26, draggable: true },
          { id: 'btn2', x: 96, y: h * 0.38, width: 72, height: 26, draggable: true },
          { id: 'text', x: 12, y: h - 70, width: Math.min(180, w * 0.6), height: 40, draggable: true },
        ]);
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  useEffect(() => {
    if (dimensions.width < 100) return;
    
    const initialTadpoles = Array.from({ length: NUM_TADPOLES }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        id: i,
        x: 60 + Math.random() * (dimensions.width - 120),
        y: 140 + Math.random() * (dimensions.height - 280),
        vx: Math.cos(angle) * 1.3,
        vy: Math.sin(angle) * 1.3,
        targetAngle: angle,
        angularVel: 0,
        surprised: false,
        omissionSurprise: false,
        surpriseTime: 0,
        predictedPath: [],
        phase: Math.random() * Math.PI * 2,
        wanderAngle: Math.random() * Math.PI * 2,
      };
    });
    setTadpoles(initialTadpoles);
    beliefMaps.current = Array.from({ length: NUM_TADPOLES }, () => ({}));
  }, [dimensions.width > 100]);
  
  const handleDrag = useCallback((id, newX, newY) => {
    setPageElements(prev => prev.map(el => el.id === id ? { ...el, x: newX, y: newY } : el));
  }, []);
  
  useEffect(() => {
    setObstacles(pageElements.map(el => ({ ...el })));
  }, [pageElements]);
  
  const getCellKey = (x, y) => `${Math.floor(x / GRID_SIZE)},${Math.floor(y / GRID_SIZE)}`;
  const getCellCoords = (key) => {
    const [cx, cy] = key.split(',').map(Number);
    return { x: cx * GRID_SIZE, y: cy * GRID_SIZE };
  };
  
  const getCell = useCallback((tadpoleIndex, x, y) => {
    const key = getCellKey(x, y);
    return beliefMaps.current[tadpoleIndex]?.[key] || null;
  }, []);
  
  const getBelief = useCallback((tadpoleIndex, x, y) => {
    const cell = getCell(tadpoleIndex, x, y);
    return cell ? cell.belief : 0;
  }, [getCell]);
  
  const getVisits = useCallback((tadpoleIndex, x, y) => {
    const cell = getCell(tadpoleIndex, x, y);
    return cell ? cell.visits : 0;
  }, [getCell]);
  
  const markObstacle = useCallback((tadpoleIndex, x, y) => {
    const key = getCellKey(x, y);
    const map = beliefMaps.current[tadpoleIndex];
    const current = map[key] || { belief: 0, visits: 0 };
    map[key] = {
      belief: Math.min(1, current.belief + 0.4),
      visits: current.visits + 1
    };
  }, []);
  
  const clearCell = useCallback((tadpoleIndex, x, y) => {
    const key = getCellKey(x, y);
    const map = beliefMaps.current[tadpoleIndex];
    const hadBelief = map[key] && map[key].belief > 0.3;
    delete map[key];
    return hadBelief;
  }, []);
  
  const updateHeatmap = useCallback(() => {
    if (!showHeatmap) {
      setHeatmapCells([]);
      return;
    }
    
    const cells = [];
    const isSelected = selectedTadpole !== null;
    
    if (isSelected) {
      // Show only selected tadpole's map
      const map = beliefMaps.current[selectedTadpole];
      if (map) {
        Object.entries(map).forEach(([key, cell]) => {
          if (cell.belief > 0.2) {
            const { x, y } = getCellCoords(key);
            cells.push({ key, x, y, belief: cell.belief, visits: cell.visits, isSelected: true });
          }
        });
      }
    } else {
      // Aggregate all tadpoles
      const aggregated = {};
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
    
    setHeatmapCells(cells);
  }, [showHeatmap, selectedTadpole]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRipples(prev => prev.filter(r => Date.now() - r.startTime < 800));
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  const checkRealObstacle = useCallback((x, y, padding = 5) => {
    for (const obs of obstacles) {
      if (x > obs.x - padding && x < obs.x + obs.width + padding &&
          y > obs.y - padding && y < obs.y + obs.height + padding) {
        return true;
      }
    }
    if (x < padding || x > dimensions.width - padding || 
        y < padding || y > dimensions.height - padding) {
      return true;
    }
    return false;
  }, [obstacles, dimensions]);
  
  const checkTadpoleCollision = useCallback((myId, x, y, allTadpoles) => {
    for (const other of allTadpoles) {
      if (other.id === myId) continue;
      const dx = x - other.x;
      const dy = y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < TADPOLE_RADIUS * 2) {
        return { other, dx, dy, dist };
      }
    }
    return null;
  }, []);
  
  const findBestDirection = useCallback((tadpoleIndex, x, y, currentAngle, wanderAngle, allTadpoles, myId) => {
    const numSamples = 12;
    let bestAngle = wanderAngle;
    let lowestCost = Infinity;
    
    for (let i = 0; i < numSamples; i++) {
      const testAngle = (i / numSamples) * Math.PI * 2;
      let cost = 0;
      
      for (const distMult of [0.5, 1.0]) {
        const sampleX = x + Math.cos(testAngle) * SENSE_DISTANCE * distMult;
        const sampleY = y + Math.sin(testAngle) * SENSE_DISTANCE * distMult;
        
        const belief = getBelief(tadpoleIndex, sampleX, sampleY);
        const visits = getVisits(tadpoleIndex, sampleX, sampleY);
        
        const confidence = Math.min(1, visits / 8);
        const avoidance = belief * confidence;
        
        const weight = distMult < 0.7 ? 3 : 1;
        cost += avoidance * weight * 2;
        
        for (const other of allTadpoles) {
          if (other.id === myId) continue;
          const dx = sampleX - other.x;
          const dy = sampleY - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < TADPOLE_RADIUS * 2.5) {
            cost += (1 - dist / (TADPOLE_RADIUS * 2.5)) * 0.3;
          }
        }
      }
      
      const wanderDiff = Math.abs(Math.atan2(Math.sin(testAngle - wanderAngle), Math.cos(testAngle - wanderAngle)));
      cost += wanderDiff * 0.3;
      
      const momDiff = Math.abs(Math.atan2(Math.sin(testAngle - currentAngle), Math.cos(testAngle - currentAngle)));
      cost += momDiff * 0.1;
      
      if (cost < lowestCost) {
        lowestCost = cost;
        bestAngle = testAngle;
      }
    }
    
    return { angle: bestAngle, cost: lowestCost };
  }, [getBelief, getVisits]);
  
  const generatePredictedPath = useCallback((tadpole, tadpoleIndex) => {
    const path = [];
    let px = tadpole.x;
    let py = tadpole.y;
    const angle = Math.atan2(tadpole.vy, tadpole.vx);
    let pvx = Math.cos(angle) * 1.3;
    let pvy = Math.sin(angle) * 1.3;
    
    for (let i = 0; i < 45; i += 3) {
      px += pvx * 4;
      py += pvy * 4;
      
      const belief = getBelief(tadpoleIndex, px, py);
      const visits = getVisits(tadpoleIndex, px, py);
      const isBlocked = belief > 0.5 && visits > 3;
      
      if (px < 10 || px > dimensions.width - 10) pvx *= -1;
      if (py < 10 || py > dimensions.height - 10) pvy *= -1;
      px = Math.max(10, Math.min(dimensions.width - 10, px));
      py = Math.max(10, Math.min(dimensions.height - 10, py));
      
      path.push({ x: px, y: py, blocked: isBlocked });
      if (isBlocked) break;
    }
    return path;
  }, [dimensions, getBelief, getVisits]);
  
  // Handle tadpole click
  const handleTadpoleClick = useCallback((e, tadpoleId) => {
    e.stopPropagation();
    if (selectedTadpole === tadpoleId) {
      setSelectedTadpole(null); // Deselect
    } else {
      setSelectedTadpole(tadpoleId);
      setShowHeatmap(true); // Auto-show beliefs when selecting
    }
  }, [selectedTadpole]);
  
  useEffect(() => {
    if (tadpoles.length === 0) return;
    
    let heatmapCounter = 0;
    
    const animate = () => {
      const now = Date.now();
      const delta = Math.min(32, now - lastTimeRef.current) / 16.67;
      lastTimeRef.current = now;
      
      heatmapCounter++;
      if (heatmapCounter >= 6) {
        updateHeatmap();
        heatmapCounter = 0;
      }
      
      setTadpoles(prevTadpoles => {
        return prevTadpoles.map((tadpole, idx) => {
          let { x, y, vx, vy, targetAngle, angularVel, surprised, omissionSurprise, surpriseTime, phase, wanderAngle } = tadpole;
          
          const currentAngle = Math.atan2(vy, vx);
          const speed = Math.sqrt(vx * vx + vy * vy);
          
          // Random wander
          wanderAngle += (Math.random() - 0.5) * 0.08 * delta;
          if (Math.random() < 0.005) {
            wanderAngle = Math.random() * Math.PI * 2;
          }
          
          // Active sensing
          let omissionDetected = false;
          
          for (let angleOff = -0.7; angleOff <= 0.7; angleOff += 0.35) {
            for (let dist = 12; dist <= SENSE_DISTANCE; dist += 10) {
              const senseAngle = currentAngle + angleOff;
              const senseX = x + Math.cos(senseAngle) * dist;
              const senseY = y + Math.sin(senseAngle) * dist;
              
              const belief = getBelief(idx, senseX, senseY);
              const realObstacle = checkRealObstacle(senseX, senseY, 3);
              
              if (belief > 0.4 && !realObstacle) {
                const hadBelief = clearCell(idx, senseX, senseY);
                if (hadBelief) {
                  omissionDetected = true;
                }
              }
              
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
          
          // Navigation
          const { angle: bestAngle } = findBestDirection(idx, x, y, currentAngle, wanderAngle, prevTadpoles, tadpole.id);
          targetAngle = bestAngle;
          
          const angleDiff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
          angularVel += angleDiff * 0.2 * delta;
          angularVel *= 0.8;
          
          const newAngle = currentAngle + angularVel * delta;
          
          const baseSpeed = 1.5;
          const speedOsc = Math.sin(now / 200 + phase) * 0.25;
          const targetSpeed = baseSpeed + speedOsc;
          const newSpeed = speed + (targetSpeed - speed) * 0.15 * delta;
          
          vx = Math.cos(newAngle) * newSpeed;
          vy = Math.sin(newAngle) * newSpeed;
          
          let nextX = x + vx * delta;
          let nextY = y + vy * delta;
          
          // Collision
          const hitObstacle = checkRealObstacle(nextX, nextY, 6);
          const belief = getBelief(idx, nextX, nextY);
          const visits = getVisits(idx, nextX, nextY);
          const expectedHit = belief > 0.5 && visits > 2;
          
          if (hitObstacle && !expectedHit) {
            surprised = true;
            omissionSurprise = false;
            surpriseTime = now;
            markObstacle(idx, nextX, nextY);
          }
          
          const tadpoleHit = checkTadpoleCollision(tadpole.id, nextX, nextY, prevTadpoles);
          if (tadpoleHit) {
            const { dx, dy, dist } = tadpoleHit;
            if (Math.random() < 0.2) {
              surprised = true;
              omissionSurprise = false;
              surpriseTime = now;
            }
            const pushAngle = Math.atan2(dy, dx);
            const pushForce = (TADPOLE_RADIUS * 2 - dist) * 0.15;
            vx += Math.cos(pushAngle) * pushForce;
            vy += Math.sin(pushAngle) * pushForce;
            nextX = x + vx * delta;
            nextY = y + vy * delta;
          }
          
          if (hitObstacle) {
            const testDirs = [[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]];
            for (const [dx, dy] of testDirs) {
              if (!checkRealObstacle(x + dx * 10, y + dy * 10, 5)) {
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
          
          if ((surprised || omissionSurprise) && now - surpriseTime > SURPRISE_DURATION) {
            surprised = false;
            omissionSurprise = false;
          }
          
          nextX = Math.max(12, Math.min(dimensions.width - 12, nextX));
          nextY = Math.max(12, Math.min(dimensions.height - 12, nextY));
          
          const newTadpole = { 
            ...tadpole, 
            x: nextX, y: nextY, 
            vx, vy, 
            targetAngle, angularVel,
            surprised, omissionSurprise, surpriseTime,
            wanderAngle
          };
          const predictedPath = generatePredictedPath(newTadpole, idx);
          
          return { ...newTadpole, predictedPath };
        });
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [tadpoles.length, checkRealObstacle, checkTadpoleCollision, findBestDirection, getBelief, getVisits, markObstacle, clearCell, generatePredictedPath, updateHeatmap, dimensions]);
  
  const handleContainerClick = (e) => {
    // Deselect when clicking empty space
    if (e.target === containerRef.current || e.target.tagName === 'svg' || e.target.closest('svg') === e.target) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Check if clicked near any tadpole
      const clickedTadpole = tadpoles.find(t => {
        const dist = Math.sqrt((t.x - clickX) ** 2 + (t.y - clickY) ** 2);
        return dist < 25;
      });
      
      if (clickedTadpole) {
        // Let the tadpole click handler deal with it
        return;
      }
      
      // Clicked empty space
      if (selectedTadpole !== null) {
        setSelectedTadpole(null);
        return;
      }
      
      // Ripple and startle
      setRipples(prev => [...prev, { x: clickX, y: clickY, startTime: Date.now() }]);
      
      setTadpoles(prev => prev.map(tadpole => {
        const dist = Math.sqrt((tadpole.x - clickX) ** 2 + (tadpole.y - clickY) ** 2);
        if (dist < 80) {
          const fleeAngle = Math.atan2(tadpole.y - clickY, tadpole.x - clickX);
          return {
            ...tadpole,
            vx: Math.cos(fleeAngle) * 3,
            vy: Math.sin(fleeAngle) * 3,
            wanderAngle: fleeAngle,
            angularVel: 0,
            surprised: true,
            surpriseTime: Date.now()
          };
        }
        return tadpole;
      }));
    }
  };
  
  const resetMemory = () => {
    beliefMaps.current = Array.from({ length: NUM_TADPOLES }, () => ({}));
    setHeatmapCells([]);
  };
  
  return (
    <div className="w-full min-h-screen bg-slate-900 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1 gap-2 flex-wrap">
        <span className="text-slate-400 text-xs font-mono">
          predictive tadpoles
          {selectedTadpole !== null && (
            <span className="text-cyan-400 ml-2">· viewing #{selectedTadpole + 1}'s mind</span>
          )}
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={resetMemory}
            className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            [reset]
          </button>
          <label className="flex items-center gap-1.5 text-slate-500 text-xs">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="w-3 h-3 accent-red-400"
            />
            beliefs
          </label>
          <label className="flex items-center gap-1.5 text-slate-500 text-xs">
            <input
              type="checkbox"
              checked={showPrediction}
              onChange={(e) => setShowPrediction(e.target.checked)}
              className="w-3 h-3 accent-emerald-500"
            />
            paths
          </label>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        data-container
        className="relative bg-slate-800 rounded-lg overflow-hidden flex-1"
        style={{ minHeight: 480 }}
        onClick={handleContainerClick}
      >
        <PageElement {...pageElements.find(e => e.id === 'title')} onDrag={handleDrag} className="">
          <div className="h-full flex items-center">
            <span className="text-slate-300 font-mono text-xs">IRCN Lab</span>
          </div>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'card1')} onDrag={handleDrag} className="bg-slate-700/80 rounded border border-slate-600/50 p-2">
          <div className="text-emerald-400 text-xs font-mono mb-1">research</div>
          <div className="text-slate-300 text-xs">Predictive Coding</div>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'card2')} onDrag={handleDrag} className="bg-slate-700/80 rounded border border-slate-600/50 p-2">
          <div className="text-emerald-400 text-xs font-mono mb-1">focus</div>
          <div className="text-slate-300 text-xs">Omission Response</div>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'btn1')} onDrag={handleDrag} className="bg-emerald-600/80 rounded flex items-center justify-center">
          <span className="text-white text-xs font-mono">team</span>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'btn2')} onDrag={handleDrag} className="bg-slate-600/80 rounded border border-slate-500/50 flex items-center justify-center">
          <span className="text-slate-300 text-xs font-mono">papers</span>
        </PageElement>
        
        <PageElement {...pageElements.find(e => e.id === 'text')} onDrag={handleDrag} className="bg-slate-700/40 rounded p-2 border border-slate-600/30">
          <div className="text-slate-500 text-xs font-mono">University of Tokyo</div>
        </PageElement>
        
        <svg className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }}>
          {showHeatmap && heatmapCells.map(cell => (
            <HeatmapCell key={cell.key} {...cell} />
          ))}
          
          {ripples.map((ripple, i) => (
            <Ripple key={`${ripple.startTime}-${i}`} {...ripple} />
          ))}
          
          {tadpoles.map(tadpole => (
            <Tadpole 
              key={tadpole.id} 
              {...tadpole} 
              showPrediction={showPrediction}
              selected={selectedTadpole === tadpole.id}
              onClick={(e) => handleTadpoleClick(e, tadpole.id)}
            />
          ))}
        </svg>
        
        <div className="absolute bottom-2 left-2 text-xs font-mono flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-white">!</span>
            <span>collision surprise</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-purple-300">?</span>
            <span>omission (gone!)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 mt-1">
            <span className="text-cyan-400">○</span>
            <span>tap tadpole = see mind</span>
          </div>
        </div>
        
        <div className="absolute bottom-2 right-2 text-slate-600 text-xs font-mono">
          tap · drag
        </div>
      </div>
    </div>
  );
}
