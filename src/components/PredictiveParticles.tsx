'use client';

import { useEffect, useRef } from 'react';

interface Props {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  level: number; // 0 = input, 1 = short prediction, 2 = long prediction
  type: 'prediction' | 'error';
  life: number;
  maxLife: number;
}

// Prediction state for each hierarchy level
interface PredictionLevel {
  x: number;
  y: number;
  predictedX: number;
  predictedY: number;
  velocityX: number;
  velocityY: number;
  error: number;
}

export default function PredictiveParticles({ className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0, time: Date.now() });
  const particlesRef = useRef<Particle[]>([]);
  const levelsRef = useRef<PredictionLevel[]>([
    { x: 0, y: 0, predictedX: 0, predictedY: 0, velocityX: 0, velocityY: 0, error: 0 },
    { x: 0, y: 0, predictedX: 0, predictedY: 0, velocityX: 0, velocityY: 0, error: 0 },
    { x: 0, y: 0, predictedX: 0, predictedY: 0, velocityX: 0, velocityY: 0, error: 0 },
  ]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Prediction lookahead times for each level (in ms)
    const lookaheadTimes = [0, 80, 200];

    const animate = () => {
      if (!ctx || !canvas) return;

      const now = Date.now();
      const dt = Math.min((now - lastMouseRef.current.time) / 1000, 0.1);
      const mouse = mouseRef.current;
      const lastMouse = lastMouseRef.current;

      // Calculate actual velocity
      const actualVelX = (mouse.x - lastMouse.x) / Math.max(dt, 0.016);
      const actualVelY = (mouse.y - lastMouse.y) / Math.max(dt, 0.016);

      // Clear canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const levels = levelsRef.current;
      const particles = particlesRef.current;

      // Update each prediction level
      levels.forEach((level, i) => {
        // Smooth velocity estimation
        level.velocityX += (actualVelX - level.velocityX) * (0.3 - i * 0.08);
        level.velocityY += (actualVelY - level.velocityY) * (0.3 - i * 0.08);

        // Current position tracks mouse with some lag based on level
        const trackSpeed = 0.5 - i * 0.12;
        level.x += (mouse.x - level.x) * trackSpeed;
        level.y += (mouse.y - level.y) * trackSpeed;

        // Prediction based on velocity and lookahead time
        const lookahead = lookaheadTimes[i] / 1000;
        const newPredictedX = level.x + level.velocityX * lookahead;
        const newPredictedY = level.y + level.velocityY * lookahead;

        // Calculate prediction error (difference between where we predicted and where cursor actually is)
        const errorX = level.predictedX - mouse.x;
        const errorY = level.predictedY - mouse.y;
        const errorMagnitude = Math.sqrt(errorX * errorX + errorY * errorY);

        // Spawn prediction particles (purple) - flowing upward through hierarchy
        if (Math.random() < 0.15 && i < 2) {
          const speed = Math.sqrt(level.velocityX ** 2 + level.velocityY ** 2);
          if (speed > 20) {
            particles.push({
              x: level.x + (Math.random() - 0.5) * 20,
              y: level.y + (Math.random() - 0.5) * 20,
              targetX: levels[i + 1]?.predictedX || newPredictedX,
              targetY: levels[i + 1]?.predictedY || newPredictedY,
              level: i,
              type: 'prediction',
              life: 1,
              maxLife: 1,
            });
          }
        }

        // Spawn error particles (blue) - flowing downward when prediction is wrong
        if (errorMagnitude > 30 + i * 20 && Math.random() < 0.2) {
          particles.push({
            x: level.predictedX + (Math.random() - 0.5) * 15,
            y: level.predictedY + (Math.random() - 0.5) * 15,
            targetX: i > 0 ? levels[i - 1].x : mouse.x,
            targetY: i > 0 ? levels[i - 1].y : mouse.y,
            level: i,
            type: 'error',
            life: 1,
            maxLife: 1,
          });
        }

        level.error = errorMagnitude;
        level.predictedX = newPredictedX;
        level.predictedY = newPredictedY;
      });

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Move toward target
        p.x += (p.targetX - p.x) * 0.08;
        p.y += (p.targetY - p.y) * 0.08;

        // Decay
        p.life -= 0.025;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        const alpha = p.life * 0.7;
        const size = 2 + p.level * 1.5;

        if (p.type === 'prediction') {
          // Purple for predictions
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
        } else {
          // Blue for errors
          ctx.fillStyle = `rgba(0, 151, 224, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw hierarchy levels (subtle indicators)
      levels.forEach((level, i) => {
        const baseAlpha = 0.15 + i * 0.05;
        const size = 4 + i * 3;

        // Prediction position (where we think cursor will be)
        if (i > 0) {
          // Connection line from current to predicted
          ctx.strokeStyle = `rgba(139, 92, 246, ${baseAlpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(level.x, level.y);
          ctx.lineTo(level.predictedX, level.predictedY);
          ctx.stroke();

          // Predicted position dot
          const errorAlpha = Math.min(level.error / 100, 1);
          if (errorAlpha > 0.2) {
            // Show error state (blue tint)
            ctx.fillStyle = `rgba(0, 151, 224, ${baseAlpha + errorAlpha * 0.3})`;
          } else {
            // Normal prediction state (purple)
            ctx.fillStyle = `rgba(139, 92, 246, ${baseAlpha})`;
          }
          ctx.beginPath();
          ctx.arc(level.predictedX, level.predictedY, size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Current tracked position (smaller, more subtle)
        ctx.fillStyle = `rgba(100, 100, 120, ${baseAlpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(level.x, level.y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Keep particle count manageable
      while (particles.length > 100) {
        particles.shift();
      }

      lastMouseRef.current = { x: mouse.x, y: mouse.y, time: now };
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  );
}
