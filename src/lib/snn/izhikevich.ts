/**
 * Izhikevich Neuron Model
 *
 * dv/dt = 0.04v² + 5v + 140 - u + I
 * du/dt = a(bv - u)
 * if v ≥ 30mV: v ← c, u ← u + d
 *
 * This model reproduces the spiking behavior of biological neurons
 * with different parameter sets for different neuron types.
 */

import { Neuron, NeuronType, NEURON_PARAMS, IzhikevichParams } from './types';

/** Spike threshold in mV */
const SPIKE_THRESHOLD = 30;

/** Resting potential for initialization */
const RESTING_POTENTIAL = -65;

/**
 * Create a new neuron with specified type and position
 */
export function createNeuron(
  id: number,
  type: NeuronType,
  x: number,
  y: number
): Neuron {
  const params = NEURON_PARAMS[type];

  return {
    id,
    type,
    params,
    v: RESTING_POTENTIAL + Math.random() * 10 - 5, // Small random variation
    u: params.b * RESTING_POTENTIAL,
    fired: false,
    x,
    y,
    firingRate: 0,
    lastSpikeTime: -Infinity,
  };
}

/**
 * Step the neuron forward by dt milliseconds
 *
 * Uses Euler integration with the Izhikevich equations.
 * Returns the updated neuron state.
 */
export function stepNeuron(
  neuron: Neuron,
  current: number,    // Total input current
  dt: number,         // Timestep in ms
  currentTime: number // Current simulation time
): Neuron {
  const { a, b, c, d } = neuron.params;
  let { v, u } = neuron;

  // Izhikevich equations (Euler integration)
  // Using smaller substeps for numerical stability
  const substeps = 2;
  const subdt = dt / substeps;

  for (let i = 0; i < substeps; i++) {
    const dv = (0.04 * v * v + 5 * v + 140 - u + current) * subdt;
    const du = a * (b * v - u) * subdt;
    v += dv;
    u += du;

    // Clamp v to prevent numerical explosion
    if (v > 100) v = 100;
  }

  // Check for spike
  const fired = v >= SPIKE_THRESHOLD;

  if (fired) {
    v = c;      // Reset membrane potential
    u = u + d;  // Adapt recovery variable
  }

  return {
    ...neuron,
    v,
    u,
    fired,
    lastSpikeTime: fired ? currentTime : neuron.lastSpikeTime,
  };
}

/**
 * Update the firing rate EMA for visualization
 */
export function updateFiringRate(
  neuron: Neuron,
  dt: number,
  tau: number
): Neuron {
  // Exponential moving average
  const alpha = dt / tau;
  const instantRate = neuron.fired ? 1 : 0;
  const newRate = neuron.firingRate + alpha * (instantRate - neuron.firingRate);

  return {
    ...neuron,
    firingRate: newRate,
  };
}

/**
 * Inject a current pulse based on distance to input position
 * Neurons closer to the input receive stronger current
 */
export function computeInputCurrent(
  neuron: Neuron,
  inputX: number,
  inputY: number,
  inputStrength: number = 20
): number {
  const dx = neuron.x - inputX;
  const dy = neuron.y - inputY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Gaussian receptive field - wider sigma for more neurons to respond
  const sigma = 0.25;
  const spatialCurrent = inputStrength * Math.exp(-(distance * distance) / (2 * sigma * sigma));

  // Background tonic current keeps neurons closer to threshold
  const tonicCurrent = 5;

  return spatialCurrent + tonicCurrent;
}

/**
 * Get neuron parameters for a given type
 */
export function getParamsForType(type: NeuronType): IzhikevichParams {
  return NEURON_PARAMS[type];
}

/**
 * Check if neuron is excitatory (non-inhibitory)
 */
export function isExcitatory(neuron: Neuron): boolean {
  return neuron.type !== 'inhibitory';
}
