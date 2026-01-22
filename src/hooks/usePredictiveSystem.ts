'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Vector utilities
interface Vector2 {
  x: number;
  y: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const distance = (a: Vector2, b: Vector2) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

// Simple velocity-based predictor with momentum
class PositionPredictor {
  private positions: { pos: Vector2; time: number }[] = [];
  private maxHistory = 10;
  private velocity: Vector2 = { x: 0, y: 0 };
  private acceleration: Vector2 = { x: 0, y: 0 };

  addPosition(pos: Vector2, time: number) {
    this.positions.push({ pos, time });
    if (this.positions.length > this.maxHistory) {
      this.positions.shift();
    }
    this.updateVelocity();
  }

  private updateVelocity() {
    if (this.positions.length < 2) return;

    const recent = this.positions.slice(-3);
    let vx = 0, vy = 0;
    let ax = 0, ay = 0;

    for (let i = 1; i < recent.length; i++) {
      const dt = (recent[i].time - recent[i - 1].time) / 1000;
      if (dt > 0) {
        const newVx = (recent[i].pos.x - recent[i - 1].pos.x) / dt;
        const newVy = (recent[i].pos.y - recent[i - 1].pos.y) / dt;

        if (i > 1) {
          ax = (newVx - vx) / dt;
          ay = (newVy - vy) / dt;
        }

        vx = newVx;
        vy = newVy;
      }
    }

    // Smooth the velocity
    this.velocity = {
      x: lerp(this.velocity.x, vx, 0.3),
      y: lerp(this.velocity.y, vy, 0.3)
    };
    this.acceleration = {
      x: lerp(this.acceleration.x, ax, 0.2),
      y: lerp(this.acceleration.y, ay, 0.2)
    };
  }

  predict(deltaTime: number = 0.1): Vector2 {
    const current = this.positions[this.positions.length - 1]?.pos || { x: 0, y: 0 };

    // Predict using velocity and acceleration
    return {
      x: current.x + this.velocity.x * deltaTime + 0.5 * this.acceleration.x * deltaTime * deltaTime,
      y: current.y + this.velocity.y * deltaTime + 0.5 * this.acceleration.y * deltaTime * deltaTime
    };
  }

  getVelocity(): Vector2 {
    return { ...this.velocity };
  }

  getSpeed(): number {
    return Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
  }

  clear() {
    this.positions = [];
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
  }
}

// Main hook for mouse prediction
export function useMousePrediction() {
  const [mousePos, setMousePos] = useState<Vector2>({ x: 0, y: 0 });
  const [predictedPos, setPredictedPos] = useState<Vector2>({ x: 0, y: 0 });
  const [predictionError, setPredictionError] = useState<number>(0);
  const [velocity, setVelocity] = useState<Vector2>({ x: 0, y: 0 });

  const predictorRef = useRef<PositionPredictor>(new PositionPredictor());
  const lastPredictionRef = useRef<Vector2>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      const now = performance.now();

      // Calculate error from last prediction
      const error = distance(lastPredictionRef.current, newPos);
      setPredictionError(error);

      // Update predictor
      predictorRef.current.addPosition(newPos, now);

      // Get new prediction
      const predicted = predictorRef.current.predict(0.05); // 50ms ahead
      lastPredictionRef.current = predicted;

      setMousePos(newPos);
      setPredictedPos(predicted);
      setVelocity(predictorRef.current.getVelocity());
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return {
    mousePos,
    predictedPos,
    predictionError,
    velocity,
    speed: Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
  };
}

// Hook for detecting omissions (when expected movement doesn't happen)
export function useOmissionDetection(threshold: number = 500) {
  const [isOmission, setIsOmission] = useState(false);
  const [omissionDuration, setOmissionDuration] = useState(0);
  const [omissionLocation, setOmissionLocation] = useState<Vector2>({ x: 0, y: 0 });

  const lastMoveTimeRef = useRef<number>(Date.now());
  const lastPosRef = useRef<Vector2>({ x: 0, y: 0 });
  const wasMovingRef = useRef<boolean>(false);
  const omissionStartRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      lastMoveTimeRef.current = Date.now();
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      wasMovingRef.current = true;

      if (isOmission) {
        setIsOmission(false);
        setOmissionDuration(0);
        omissionStartRef.current = null;
      }
    };

    const checkOmission = () => {
      const timeSinceMove = Date.now() - lastMoveTimeRef.current;

      // Only trigger omission if we were moving and then stopped
      if (wasMovingRef.current && timeSinceMove > threshold) {
        if (!isOmission) {
          setIsOmission(true);
          setOmissionLocation(lastPosRef.current);
          omissionStartRef.current = Date.now();
        }
        if (omissionStartRef.current) {
          setOmissionDuration(Date.now() - omissionStartRef.current);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    const interval = setInterval(checkOmission, 50);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, [threshold, isOmission]);

  return {
    isOmission,
    omissionDuration,
    omissionLocation
  };
}

// Hook for scroll prediction
export function useScrollPrediction() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [predictedScrollY, setPredictedScrollY] = useState(0);
  const [scrollPredictionError, setScrollPredictionError] = useState(0);

  const scrollHistoryRef = useRef<{ pos: number; time: number }[]>([]);
  const lastPredictionRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      const currentY = window.scrollY;

      // Calculate error
      const error = Math.abs(lastPredictionRef.current - currentY);
      setScrollPredictionError(error);

      // Update history
      scrollHistoryRef.current.push({ pos: currentY, time: now });
      if (scrollHistoryRef.current.length > 5) {
        scrollHistoryRef.current.shift();
      }

      // Calculate velocity
      const history = scrollHistoryRef.current;
      if (history.length >= 2) {
        const dt = (history[history.length - 1].time - history[history.length - 2].time) / 1000;
        if (dt > 0) {
          const vel = (history[history.length - 1].pos - history[history.length - 2].pos) / dt;
          setScrollVelocity(vel);

          // Predict
          const predicted = currentY + vel * 0.1; // 100ms ahead
          lastPredictionRef.current = predicted;
          setPredictedScrollY(predicted);
        }
      }

      setScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    scrollY,
    scrollVelocity,
    predictedScrollY,
    scrollPredictionError
  };
}

// Combined prediction context hook
export function usePredictiveSystem() {
  const mouse = useMousePrediction();
  const omission = useOmissionDetection(400);
  const scroll = useScrollPrediction();

  // Calculate overall "surprise" level based on prediction errors
  const surpriseLevel = Math.min(1, (mouse.predictionError / 100 + scroll.scrollPredictionError / 50) / 2);

  // Is the system in a high-error state?
  const isHighError = mouse.predictionError > 80 || scroll.scrollPredictionError > 100;

  return {
    mouse,
    omission,
    scroll,
    surpriseLevel,
    isHighError
  };
}
