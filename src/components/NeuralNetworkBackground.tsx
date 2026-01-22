'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  layer: number; // 0 = bottom (input), 1 = middle, 2 = top (prediction)
  activity: number;
  predictionSignal: number;
  errorSignal: number;
}

interface Connection {
  from: number;
  to: number;
  strength: number;
  predictionPulse: number; // 0-1, traveling from bottom to top
  errorPulse: number; // 0-1, traveling from top to bottom
}

interface Props {
  mousePos: { x: number; y: number };
  predictionError: number;
  isOmission: boolean;
  className?: string;
}

export default function NeuralNetworkBackground({
  mousePos,
  predictionError,
  isOmission,
  className = ''
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  // Initialize network
  const initNetwork = useCallback((width: number, height: number) => {
    const nodes: Node[] = [];
    const connections: Connection[] = [];

    // Create hierarchical layers
    const layerCounts = [20, 15, 10]; // bottom to top
    const layerHeights = [0.8, 0.5, 0.2]; // y position (0 = top, 1 = bottom)

    layerCounts.forEach((count, layer) => {
      for (let i = 0; i < count; i++) {
        const spreadX = 0.7 - layer * 0.1;
        nodes.push({
          x: (0.5 - spreadX / 2 + (i / (count - 1)) * spreadX) * width,
          y: layerHeights[layer] * height + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          layer,
          activity: 0,
          predictionSignal: 0,
          errorSignal: 0
        });
      }
    });

    // Create connections between adjacent layers
    nodes.forEach((node, i) => {
      if (node.layer < 2) {
        // Connect to nodes in layer above
        const nodesAbove = nodes.filter((n, j) => n.layer === node.layer + 1);
        nodesAbove.forEach((target, j) => {
          const targetIndex = nodes.indexOf(target);
          if (Math.random() < 0.4) { // 40% connection probability
            connections.push({
              from: i,
              to: targetIndex,
              strength: 0.3 + Math.random() * 0.7,
              predictionPulse: Math.random(), // Start at random phase
              errorPulse: Math.random()
            });
          }
        });
      }
    });

    nodesRef.current = nodes;
    connectionsRef.current = connections;
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNetwork(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      if (!ctx || !canvas) return;

      timeRef.current += 0.016;
      const time = timeRef.current;

      // Clear with fade for trail effect
      ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Update nodes
      nodes.forEach((node, i) => {
        // Gentle drift
        node.x += node.vx;
        node.y += node.vy;

        // Boundary bounce
        if (node.x < 50 || node.x > canvas.width - 50) node.vx *= -1;
        if (node.y < 50 || node.y > canvas.height - 50) node.vy *= -1;

        // Mouse interaction - bottom layer nodes respond to mouse
        if (node.layer === 0) {
          const dx = mousePos.x - node.x;
          const dy = mousePos.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            node.activity = Math.max(node.activity, 1 - dist / 200);
          }
        }

        // Decay activity
        node.activity *= 0.95;
        node.predictionSignal *= 0.92;
        node.errorSignal *= 0.92;

        // Omission response - all nodes pulse
        if (isOmission) {
          node.activity += 0.05 * Math.sin(time * 10);
        }
      });

      // Propagate signals through connections
      connections.forEach((conn) => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];

        // Bottom-up: activity propagates as prediction
        if (fromNode.activity > 0.1) {
          conn.predictionPulse = (conn.predictionPulse + 0.03 * fromNode.activity) % 1;
          if (conn.predictionPulse > 0.9) {
            toNode.predictionSignal = Math.min(1, toNode.predictionSignal + 0.3);
            toNode.activity = Math.min(1, toNode.activity + 0.2);
          }
        }

        // Top-down: prediction errors propagate downward
        if (predictionError > 20) {
          conn.errorPulse = (conn.errorPulse + 0.02 * (predictionError / 100)) % 1;
          if (conn.errorPulse > 0.9) {
            fromNode.errorSignal = Math.min(1, fromNode.errorSignal + 0.2);
          }
        }
      });

      // Draw connections
      connections.forEach((conn) => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];

        const avgActivity = (fromNode.activity + toNode.activity) / 2;

        if (avgActivity > 0.05 || conn.predictionPulse > 0.5 || conn.errorPulse > 0.5) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);

          // Base connection
          ctx.strokeStyle = `rgba(50, 50, 80, ${0.1 + avgActivity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Prediction pulse (purple, travels up)
          if (conn.predictionPulse > 0) {
            const pulsePos = conn.predictionPulse;
            const px = fromNode.x + (toNode.x - fromNode.x) * pulsePos;
            const py = fromNode.y + (toNode.y - fromNode.y) * pulsePos;

            const gradient = ctx.createRadialGradient(px, py, 0, px, py, 15);
            gradient.addColorStop(0, `rgba(139, 92, 246, ${0.8 * fromNode.activity})`);
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

            ctx.beginPath();
            ctx.arc(px, py, 15, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }

          // Error pulse (blue, travels down)
          if (conn.errorPulse > 0 && predictionError > 20) {
            const pulsePos = 1 - conn.errorPulse; // Reverse direction
            const px = fromNode.x + (toNode.x - fromNode.x) * pulsePos;
            const py = fromNode.y + (toNode.y - fromNode.y) * pulsePos;

            const gradient = ctx.createRadialGradient(px, py, 0, px, py, 12);
            gradient.addColorStop(0, `rgba(0, 151, 224, ${0.6 * (predictionError / 100)})`);
            gradient.addColorStop(1, 'rgba(0, 151, 224, 0)');

            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const baseSize = 3 + node.layer * 2;
        const activitySize = baseSize + node.activity * 8;

        // Glow
        if (node.activity > 0.1 || node.predictionSignal > 0.1 || node.errorSignal > 0.1) {
          const glowSize = activitySize * 3;

          // Prediction glow (purple)
          if (node.predictionSignal > 0.1) {
            const gradient = ctx.createRadialGradient(
              node.x, node.y, 0,
              node.x, node.y, glowSize
            );
            gradient.addColorStop(0, `rgba(139, 92, 246, ${node.predictionSignal * 0.5})`);
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }

          // Error glow (blue)
          if (node.errorSignal > 0.1) {
            const gradient = ctx.createRadialGradient(
              node.x, node.y, 0,
              node.x, node.y, glowSize
            );
            gradient.addColorStop(0, `rgba(0, 151, 224, ${node.errorSignal * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 151, 224, 0)');
            ctx.beginPath();
            ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, activitySize, 0, Math.PI * 2);

        // Color based on signals
        const r = 80 + node.predictionSignal * 60 + node.errorSignal * 0;
        const g = 70 + node.activity * 30 + node.errorSignal * 80;
        const b = 120 + node.predictionSignal * 130 + node.errorSignal * 100;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.4 + node.activity * 0.6})`;
        ctx.fill();

        // Omission highlight
        if (isOmission) {
          ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 + Math.sin(time * 10) * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw mouse influence area (subtle)
      const mouseGradient = ctx.createRadialGradient(
        mousePos.x, mousePos.y, 0,
        mousePos.x, mousePos.y, 150
      );
      mouseGradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
      mouseGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 150, 0, Math.PI * 2);
      ctx.fillStyle = mouseGradient;
      ctx.fill();

      lastMouseRef.current = { ...mousePos };
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mousePos, predictionError, isOmission, initNetwork]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
