'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { NetworkSnapshot, Neuron, Synapse } from '@/lib/snn/types';

export interface SpikingNetworkVisualizationProps {
  snapshot: NetworkSnapshot | null;
  width: number;
  height: number;
  showConnections?: boolean;
  showPrediction?: boolean;
  inputPosition?: { x: number; y: number };
  className?: string;
}

/** Color scheme */
const COLORS = {
  background: '#0a0a0f',
  excitatory: {
    base: 'rgba(147, 112, 219, 0.6)',  // Purple
    firing: 'rgba(186, 156, 255, 1)',
    glow: 'rgba(147, 112, 219, 0.4)',
  },
  inhibitory: {
    base: 'rgba(100, 149, 237, 0.6)',  // Blue
    firing: 'rgba(135, 181, 255, 1)',
    glow: 'rgba(100, 149, 237, 0.4)',
  },
  connection: {
    excitatory: 'rgba(147, 112, 219, 0.15)',
    inhibitory: 'rgba(100, 149, 237, 0.15)',
  },
  prediction: {
    accurate: 'rgba(147, 112, 219, 0.8)',
    error: 'rgba(100, 149, 237, 0.8)',
  },
  input: 'rgba(255, 255, 255, 0.3)',
};

/**
 * Canvas-based visualization for the spiking neural network
 */
export function SpikingNetworkVisualization({
  snapshot,
  width,
  height,
  showConnections = true,
  showPrediction = true,
  inputPosition,
  className,
}: SpikingNetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = width;
    const displayHeight = height;

    // Set canvas size accounting for DPR
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw connections
    if (showConnections) {
      drawConnections(ctx, snapshot.synapses, snapshot.neurons, displayWidth, displayHeight);
    }

    // Draw neurons
    drawNeurons(ctx, snapshot.neurons, displayWidth, displayHeight);

    // Draw input indicator
    if (inputPosition) {
      drawInputIndicator(ctx, inputPosition, displayWidth, displayHeight);
    }

    // Draw prediction
    if (showPrediction) {
      drawPrediction(ctx, snapshot, inputPosition, displayWidth, displayHeight);
    }
  }, [snapshot, width, height, showConnections, showPrediction, inputPosition]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  synapses: Synapse[],
  neurons: Neuron[],
  width: number,
  height: number
) {
  // Only draw synapses above weight threshold
  const minWeight = 0.15;
  const visibleSynapses = synapses.filter(s => s.weight >= minWeight);

  for (const synapse of visibleSynapses) {
    const pre = neurons[synapse.pre];
    const post = neurons[synapse.post];

    const x1 = pre.x * width;
    const y1 = pre.y * height;
    const x2 = post.x * width;
    const y2 = post.y * height;

    // Opacity based on weight
    const opacity = Math.min(0.4, synapse.weight * 0.4);
    const baseColor = synapse.isExcitatory
      ? COLORS.connection.excitatory
      : COLORS.connection.inhibitory;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = baseColor.replace('0.15', opacity.toString());
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawNeurons(
  ctx: CanvasRenderingContext2D,
  neurons: Neuron[],
  width: number,
  height: number
) {
  for (const neuron of neurons) {
    const x = neuron.x * width;
    const y = neuron.y * height;
    const isExcitatory = neuron.type !== 'inhibitory';
    const colors = isExcitatory ? COLORS.excitatory : COLORS.inhibitory;

    // Base size + rate bonus
    const baseRadius = 4;
    const rateBonus = neuron.firingRate * 4;
    const radius = baseRadius + rateBonus;

    // Brightness based on firing rate
    const brightness = Math.min(1, neuron.firingRate * 2 + 0.3);

    // Draw glow if recently fired
    if (neuron.fired || neuron.firingRate > 0.1) {
      const glowRadius = radius * 2.5;
      const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw neuron body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    // Color intensity based on firing rate
    const color = neuron.fired ? colors.firing : colors.base;
    ctx.fillStyle = color.replace(/[\d.]+\)$/, `${brightness})`);
    ctx.fill();

    // Highlight for bursting/chattering types
    if (neuron.type === 'bursting' || neuron.type === 'chattering') {
      ctx.strokeStyle = colors.firing.replace('1)', '0.3)');
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawInputIndicator(
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number },
  width: number,
  height: number
) {
  const x = position.x * width;
  const y = position.y * height;
  const radius = 15;

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.input;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Crosshair
  const crossSize = 8;
  ctx.beginPath();
  ctx.moveTo(x - crossSize, y);
  ctx.lineTo(x + crossSize, y);
  ctx.moveTo(x, y - crossSize);
  ctx.lineTo(x, y + crossSize);
  ctx.strokeStyle = COLORS.input;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPrediction(
  ctx: CanvasRenderingContext2D,
  snapshot: NetworkSnapshot,
  inputPosition: { x: number; y: number } | undefined,
  width: number,
  height: number
) {
  const { wherePrediction, spatialError } = snapshot;

  const predX = wherePrediction.x * width;
  const predY = wherePrediction.y * height;

  // Prediction circle
  const radius = 12;
  const isAccurate = spatialError < 0.1;
  const color = isAccurate ? COLORS.prediction.accurate : COLORS.prediction.error;

  ctx.beginPath();
  ctx.arc(predX, predY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.stroke();

  // Confidence indicator (filled arc)
  const confidenceAngle = wherePrediction.confidence * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(predX, predY);
  ctx.arc(predX, predY, radius - 3, -Math.PI / 2, -Math.PI / 2 + confidenceAngle);
  ctx.closePath();
  ctx.fillStyle = color.replace('0.8', '0.3');
  ctx.fill();

  // Error line (dashed)
  if (inputPosition && spatialError > 0.02) {
    const inputX = inputPosition.x * width;
    const inputY = inputPosition.y * height;

    ctx.beginPath();
    ctx.moveTo(predX, predY);
    ctx.lineTo(inputX, inputY);
    ctx.strokeStyle = COLORS.prediction.error.replace('0.8', '0.4');
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export default SpikingNetworkVisualization;
