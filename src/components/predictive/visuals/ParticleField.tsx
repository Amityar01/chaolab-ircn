'use client';

// ============================================
// PARTICLE FIELD VISUAL COMPONENT
// ============================================
// Ambient floating dust motes for atmospheric depth

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CONFIG } from '../config';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
  twinklePhase: number;
}

interface ParticleFieldProps {
  width: number;
  height: number;
  count?: number;
  className?: string;
}

export function ParticleField({
  width,
  height,
  count = CONFIG.PARTICLE_COUNT,
  className = '',
}: ParticleFieldProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  // Initialize particles
  useEffect(() => {
    if (width === 0 || height === 0) return;

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: CONFIG.PARTICLE_MIN_SIZE + Math.random() * (CONFIG.PARTICLE_MAX_SIZE - CONFIG.PARTICLE_MIN_SIZE),
      opacity: CONFIG.PARTICLE_OPACITY_MIN + Math.random() * (CONFIG.PARTICLE_OPACITY_MAX - CONFIG.PARTICLE_OPACITY_MIN),
      speed: CONFIG.PARTICLE_DRIFT_SPEED * (0.5 + Math.random() * 0.5),
      angle: Math.random() * Math.PI * 2,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    setParticles(newParticles);
  }, [width, height, count]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const animate = () => {
      timeRef.current += 0.016; // ~60fps

      setParticles(prev =>
        prev.map(p => {
          // Slow drift movement
          let newX = p.x + Math.cos(p.angle) * p.speed;
          let newY = p.y + Math.sin(p.angle) * p.speed;

          // Wrap around edges
          if (newX < 0) newX = width;
          if (newX > width) newX = 0;
          if (newY < 0) newY = height;
          if (newY > height) newY = 0;

          // Slowly change direction
          const newAngle = p.angle + (Math.random() - 0.5) * 0.02;

          return {
            ...p,
            x: newX,
            y: newY,
            angle: newAngle,
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length, width, height]);

  // Calculate twinkle opacity
  const getParticleOpacity = (particle: Particle): number => {
    const twinkle = 0.5 + 0.5 * Math.sin(timeRef.current * 0.5 + particle.twinklePhase);
    return particle.opacity * (0.7 + twinkle * 0.3);
  };

  if (width === 0 || height === 0) return null;

  return (
    <svg
      className={`particle-field ${className}`}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      {particles.map(p => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill="rgba(255, 255, 255, 0.8)"
          opacity={getParticleOpacity(p)}
        />
      ))}
    </svg>
  );
}

export default ParticleField;
