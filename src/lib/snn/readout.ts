/**
 * Readout Layers for Dual Prediction Channels
 *
 * WHERE: Linear readout predicting cursor position (x, y)
 * WHEN: Linear readout predicting timing of next movement
 *
 * Both channels learn via gradient descent on prediction error,
 * using the network's firing rates as input features.
 */

import { Neuron, ReadoutLayer, WherePrediction, WhenPrediction } from './types';

/**
 * Create a readout layer with random initialization
 */
export function createReadoutLayer(
  inputSize: number,
  outputSize: number
): ReadoutLayer {
  // Xavier-like initialization
  const scale = Math.sqrt(2 / (inputSize + outputSize));

  const weights: number[][] = [];
  for (let o = 0; o < outputSize; o++) {
    const row: number[] = [];
    for (let i = 0; i < inputSize; i++) {
      row.push((Math.random() * 2 - 1) * scale);
    }
    weights.push(row);
  }

  const bias = new Array(outputSize).fill(0);
  const prediction = new Array(outputSize).fill(0.5);

  return { weights, bias, prediction };
}

/**
 * Forward pass: compute prediction from firing rates
 */
export function forward(
  layer: ReadoutLayer,
  firingRates: number[]
): number[] {
  const output: number[] = [];

  for (let o = 0; o < layer.weights.length; o++) {
    let sum = layer.bias[o];
    for (let i = 0; i < firingRates.length; i++) {
      sum += layer.weights[o][i] * firingRates[i];
    }
    // Sigmoid activation to bound output to [0, 1]
    output.push(sigmoid(sum));
  }

  return output;
}

/**
 * Compute gradient and update weights
 */
export function updateReadout(
  layer: ReadoutLayer,
  firingRates: number[],
  target: number[],
  learningRate: number
): { layer: ReadoutLayer; error: number } {
  const prediction = forward(layer, firingRates);

  // Compute error
  let totalError = 0;
  const errors: number[] = [];
  for (let o = 0; o < target.length; o++) {
    const err = target[o] - prediction[o];
    errors.push(err);
    totalError += err * err;
  }
  totalError = Math.sqrt(totalError / target.length); // RMSE

  // Gradient descent update
  const newWeights = layer.weights.map((row, o) => {
    const predO = prediction[o];
    // Derivative of sigmoid
    const sigmoidGrad = predO * (1 - predO);
    const delta = errors[o] * sigmoidGrad * learningRate;

    return row.map((w, i) => w + delta * firingRates[i]);
  });

  const newBias = layer.bias.map((b, o) => {
    const predO = prediction[o];
    const sigmoidGrad = predO * (1 - predO);
    const delta = errors[o] * sigmoidGrad * learningRate;
    return b + delta;
  });

  return {
    layer: {
      weights: newWeights,
      bias: newBias,
      prediction,
    },
    error: totalError,
  };
}

/**
 * Create WHERE prediction layer (x, y output)
 */
export function createWhereReadout(neuronCount: number): ReadoutLayer {
  return createReadoutLayer(neuronCount, 2);
}

/**
 * Create WHEN prediction layer (time-to-event output)
 */
export function createWhenReadout(neuronCount: number): ReadoutLayer {
  return createReadoutLayer(neuronCount, 1);
}

/**
 * Get firing rates from neurons for readout input
 */
export function extractFiringRates(neurons: Neuron[]): number[] {
  return neurons.map(n => n.firingRate);
}

/**
 * Compute WHERE prediction
 */
export function predictWhere(
  layer: ReadoutLayer,
  neurons: Neuron[]
): WherePrediction {
  const rates = extractFiringRates(neurons);
  const [x, y] = forward(layer, rates);

  // Confidence based on weight magnitudes and rate variance
  const rateVar = variance(rates);
  const confidence = Math.min(1, rateVar * 10 + 0.3);

  return { x, y, confidence };
}

/**
 * Compute WHEN prediction
 */
export function predictWhen(
  layer: ReadoutLayer,
  neurons: Neuron[]
): WhenPrediction {
  const rates = extractFiringRates(neurons);
  const [normalizedTime] = forward(layer, rates);

  // Scale to reasonable time range (0-2000ms)
  const timeToEvent = normalizedTime * 2000;

  // Confidence based on rate variance
  const rateVar = variance(rates);
  const confidence = Math.min(1, rateVar * 10 + 0.2);

  return { timeToEvent, confidence };
}

/**
 * Train WHERE readout with current position as target
 */
export function trainWhere(
  layer: ReadoutLayer,
  neurons: Neuron[],
  targetX: number,
  targetY: number,
  learningRate: number
): { layer: ReadoutLayer; error: number } {
  const rates = extractFiringRates(neurons);
  return updateReadout(layer, rates, [targetX, targetY], learningRate);
}

/**
 * Train WHEN readout with time-to-event as target
 */
export function trainWhen(
  layer: ReadoutLayer,
  neurons: Neuron[],
  targetTime: number, // in ms
  learningRate: number
): { layer: ReadoutLayer; error: number } {
  const rates = extractFiringRates(neurons);
  // Normalize target to [0, 1]
  const normalizedTarget = Math.max(0, Math.min(1, targetTime / 2000));
  return updateReadout(layer, rates, [normalizedTarget], learningRate);
}

/**
 * Compute the error signal for reservoir learning
 * Combines WHERE and WHEN errors
 */
export function computeErrorSignal(
  spatialError: number,
  temporalError: number,
  spatialWeight: number = 0.7,
  temporalWeight: number = 0.3
): number {
  return spatialError * spatialWeight + temporalError * temporalWeight;
}

// Helper functions

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sqDiffs = arr.map(x => (x - mean) * (x - mean));
  return sqDiffs.reduce((a, b) => a + b, 0) / arr.length;
}
