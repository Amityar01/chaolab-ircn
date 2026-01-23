'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FireflyBackgroundProps {
  obstacles?: Obstacle[];
  fireflyCount?: number;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  glowIntensity: number;
  targetIntensity: number;
  size: number;
}

const FIREFLY_COLORS = {
  core: '#7dd956',
  glow: '#b8f090',
};

export default function FireflyBackground({
  obstacles = [],
  fireflyCount = 6
}: FireflyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const obstaclesRef = useRef<Obstacle[]>(obstacles);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Update obstacles ref when prop changes
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  // Initialize fireflies
  const initializeFireflies = useCallback((width: number, height: number) => {
    const fireflies: Firefly[] = [];
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
        glowIntensity: 0.3 + Math.random() * 0.4,
        targetIntensity: 0.3 + Math.random() * 0.7,
        size: 3 + Math.random() * 2,
      });
    }
    firefliesRef.current = fireflies;
  }, [fireflyCount]);

  // Check if point collides with obstacle
  const checkObstacleCollision = useCallback((x: number, y: number, padding: number = 30) => {
    for (const obs of obstaclesRef.current) {
      if (x > obs.x - padding &&
          x < obs.x + obs.width + padding &&
          y > obs.y - padding &&
          y < obs.y + obs.height + padding) {
        return obs;
      }
    }
    return null;
  }, []);

  // Find direction away from obstacles
  const findAvoidanceDirection = useCallback((x: number, y: number, currentVx: number, currentVy: number) => {
    const senseDistance = 80;
    let avoidX = 0;
    let avoidY = 0;

    for (const obs of obstaclesRef.current) {
      const centerX = obs.x + obs.width / 2;
      const centerY = obs.y + obs.height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const effectiveRadius = Math.max(obs.width, obs.height) / 2 + senseDistance;

      if (dist < effectiveRadius && dist > 0) {
        const strength = 1 - dist / effectiveRadius;
        avoidX += (dx / dist) * strength * 0.02;
        avoidY += (dy / dist) * strength * 0.02;
      }
    }

    return { avoidX, avoidY };
  }, []);

  // Update firefly positions
  const updateFireflies = useCallback((delta: number) => {
    const { width, height } = dimensionsRef.current;
    if (width === 0 || height === 0) return;

    firefliesRef.current = firefliesRef.current.map(firefly => {
      let { x, y, vx, vy, phase, glowIntensity, targetIntensity, size } = firefly;

      // Update phase for organic movement
      phase += 0.02 * delta;

      // Add gentle wandering
      vx += (Math.sin(phase) * 0.001 + (Math.random() - 0.5) * 0.003) * delta;
      vy += (Math.cos(phase * 0.7) * 0.001 + (Math.random() - 0.5) * 0.003) * delta;

      // Obstacle avoidance
      const { avoidX, avoidY } = findAvoidanceDirection(x, y, vx, vy);
      vx += avoidX * delta;
      vy += avoidY * delta;

      // Speed limit
      const speed = Math.sqrt(vx * vx + vy * vy);
      const maxSpeed = 0.8;
      const minSpeed = 0.15;
      if (speed > maxSpeed) {
        vx = (vx / speed) * maxSpeed;
        vy = (vy / speed) * maxSpeed;
      } else if (speed < minSpeed) {
        const angle = Math.atan2(vy, vx);
        vx = Math.cos(angle) * minSpeed;
        vy = Math.sin(angle) * minSpeed;
      }

      // Apply friction
      vx *= 0.995;
      vy *= 0.995;

      // Update position
      x += vx * delta;
      y += vy * delta;

      // Boundary bounce
      const padding = 20;
      if (x < padding) { x = padding; vx = Math.abs(vx) * 0.5; }
      if (x > width - padding) { x = width - padding; vx = -Math.abs(vx) * 0.5; }
      if (y < padding) { y = padding; vy = Math.abs(vy) * 0.5; }
      if (y > height - padding) { y = height - padding; vy = -Math.abs(vy) * 0.5; }

      // Check obstacle collision and bounce
      const hitObstacle = checkObstacleCollision(x, y, 15);
      if (hitObstacle) {
        const centerX = hitObstacle.x + hitObstacle.width / 2;
        const centerY = hitObstacle.y + hitObstacle.height / 2;
        const awayAngle = Math.atan2(y - centerY, x - centerX);
        vx = Math.cos(awayAngle) * 0.5;
        vy = Math.sin(awayAngle) * 0.5;
      }

      // Glow pulsing
      if (Math.random() < 0.02) {
        targetIntensity = 0.3 + Math.random() * 0.7;
      }
      glowIntensity += (targetIntensity - glowIntensity) * 0.02 * delta;

      return { x, y, vx, vy, phase, glowIntensity, targetIntensity, size };
    });
  }, [findAvoidanceDirection, checkObstacleCollision]);

  // Draw fireflies
  const drawFireflies = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = dimensionsRef.current;
    ctx.clearRect(0, 0, width, height);

    for (const firefly of firefliesRef.current) {
      const { x, y, glowIntensity, size } = firefly;

      // Outer glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 8);
      gradient.addColorStop(0, `rgba(184, 240, 144, ${glowIntensity * 0.4})`);
      gradient.addColorStop(0.3, `rgba(184, 240, 144, ${glowIntensity * 0.2})`);
      gradient.addColorStop(1, 'rgba(184, 240, 144, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(x, y, size * 8, 0, Math.PI * 2);
      ctx.fill();

      // Inner glow
      const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      innerGradient.addColorStop(0, `rgba(125, 217, 86, ${glowIntensity * 0.8})`);
      innerGradient.addColorStop(0.5, `rgba(184, 240, 144, ${glowIntensity * 0.4})`);
      innerGradient.addColorStop(1, 'rgba(184, 240, 144, 0)');

      ctx.beginPath();
      ctx.fillStyle = innerGradient;
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 240, ${glowIntensity})`;
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      dimensionsRef.current = { width, height };

      if (firefliesRef.current.length === 0) {
        initializeFireflies(width, height);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 16.67, 3);
      lastTime = currentTime;

      updateFireflies(delta);
      drawFireflies(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializeFireflies, updateFireflies, drawFireflies]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
