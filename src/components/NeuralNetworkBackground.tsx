'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  activity: number;
}

interface Connection {
  from: number;
  to: number;
  pulse: number;
}

interface Props {
  mousePos: { x: number; y: number };
  predictionError: number;
  isOmission: boolean;
  className?: string;
}

export default function NeuralNetworkBackground({
  mousePos,
  predictionError: _predictionError,
  isOmission: _isOmission,
  className = ''
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const timeRef = useRef(0);

  const initNetwork = useCallback((width: number, height: number) => {
    const nodes: Node[] = [];
    const connections: Connection[] = [];

    // Simple grid of nodes - sparse and clean
    const cols = 8;
    const rows = 5;
    const spacingX = width / (cols + 1);
    const spacingY = height / (rows + 1);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = spacingX * (col + 1) + (Math.random() - 0.5) * 30;
        const y = spacingY * (row + 1) + (Math.random() - 0.5) * 30;
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          activity: 0
        });
      }
    }

    // Connect nearby nodes (not all, just some)
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i >= j) return;
        const dist = Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2);
        // Only connect if reasonably close and random chance
        if (dist < spacingX * 1.8 && Math.random() < 0.3) {
          connections.push({
            from: i,
            to: j,
            pulse: 0
          });
        }
      });
    });

    nodesRef.current = nodes;
    connectionsRef.current = connections;
  }, []);

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

      // Clear
      ctx.fillStyle = 'rgba(6, 8, 13, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Update nodes
      nodes.forEach((node) => {
        // Gentle floating motion
        node.x = node.baseX + Math.sin(timeRef.current * 0.3 + node.baseY * 0.01) * 5;
        node.y = node.baseY + Math.cos(timeRef.current * 0.2 + node.baseX * 0.01) * 5;

        // Mouse proximity activates nodes
        const dx = mousePos.x - node.x;
        const dy = mousePos.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          node.activity = Math.max(node.activity, (1 - dist / 150) * 0.6);
        }

        // Decay
        node.activity *= 0.96;
      });

      // Draw connections
      connections.forEach((conn) => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];

        const avgActivity = (fromNode.activity + toNode.activity) / 2;

        // Only draw if there's some activity
        if (avgActivity > 0.02) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${avgActivity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Pulse along connection if active
          if (avgActivity > 0.1) {
            conn.pulse = (conn.pulse + 0.02) % 1;
            const px = fromNode.x + (toNode.x - fromNode.x) * conn.pulse;
            const py = fromNode.y + (toNode.y - fromNode.y) * conn.pulse;

            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(139, 92, 246, ${avgActivity * 0.5})`;
            ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const size = 2 + node.activity * 3;
        const alpha = 0.2 + node.activity * 0.4;

        // Glow
        if (node.activity > 0.1) {
          const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, size * 4
          );
          gradient.addColorStop(0, `rgba(139, 92, 246, ${node.activity * 0.2})`);
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, size * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [mousePos, initNetwork]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0, opacity: 0.6 }}
    />
  );
}
