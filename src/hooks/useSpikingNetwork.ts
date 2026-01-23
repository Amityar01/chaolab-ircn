'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { SpikingNetworkSimulation, createSimulation } from '@/lib/snn/simulation';
import { NetworkSnapshot, SimulationConfig, NetworkInput } from '@/lib/snn/types';

export interface UseSpikingNetworkOptions {
  config?: Partial<SimulationConfig>;
  autoStart?: boolean;
}

export interface UseSpikingNetworkReturn {
  snapshot: NetworkSnapshot | null;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  updateInput: (input: NetworkInput) => void;
  setConfig: (config: Partial<SimulationConfig>) => void;
  setLearningEnabled: (enabled: boolean) => void;
}

/**
 * React hook for managing a spiking neural network simulation
 */
export function useSpikingNetwork(
  options: UseSpikingNetworkOptions = {}
): UseSpikingNetworkReturn {
  const { config, autoStart = false } = options;

  const simulationRef = useRef<SpikingNetworkSimulation | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const inputRef = useRef<NetworkInput>({
    position: { x: 0.5, y: 0.5 },
    velocity: { x: 0, y: 0 },
    isMoving: false,
    timestamp: 0,
  });

  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize simulation and auto-start if requested
  useEffect(() => {
    simulationRef.current = createSimulation(config);
    setSnapshot(simulationRef.current.getSnapshot());

    // Auto-start immediately after creation
    if (autoStart) {
      setIsRunning(true);
      lastTimeRef.current = 0;

      const animateLoop = (timestamp: number) => {
        if (!simulationRef.current) return;

        const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
        lastTimeRef.current = timestamp;
        inputRef.current.timestamp = timestamp;

        simulationRef.current.update(inputRef.current, deltaTime);
        setSnapshot(simulationRef.current.getSnapshot());

        animationFrameRef.current = requestAnimationFrame(animateLoop);
      };

      animationFrameRef.current = requestAnimationFrame(animateLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!simulationRef.current) return;

    const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
    lastTimeRef.current = timestamp;

    // Update input timestamp
    inputRef.current.timestamp = timestamp;

    // Run simulation
    simulationRef.current.update(inputRef.current, deltaTime);

    // Get snapshot for rendering
    setSnapshot(simulationRef.current.getSnapshot());

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isRunning, animate]);

  const stop = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.reset();
      setSnapshot(simulationRef.current.getSnapshot());
    }
  }, []);

  const updateInput = useCallback((input: NetworkInput) => {
    inputRef.current = input;
  }, []);

  const setConfigCallback = useCallback((newConfig: Partial<SimulationConfig>) => {
    if (simulationRef.current) {
      simulationRef.current.setConfig(newConfig);
      setSnapshot(simulationRef.current.getSnapshot());
    }
  }, []);

  const setLearningEnabled = useCallback((enabled: boolean) => {
    if (simulationRef.current) {
      simulationRef.current.setLearningEnabled(enabled);
    }
  }, []);

  return {
    snapshot,
    isRunning,
    start,
    stop,
    reset,
    updateInput,
    setConfig: setConfigCallback,
    setLearningEnabled,
  };
}
