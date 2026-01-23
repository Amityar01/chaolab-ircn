/**
 * Synapse Model with Eligibility Trace
 *
 * Three-Factor Hebbian Learning:
 * Δw(t) = η · r(t) · [y(t) - Z(t)] · G(t)
 *         ↑        ↑              ↑
 *    presynaptic  error        gating
 *     activity    signal       (attention)
 *
 * Eligibility traces allow for biologically plausible credit assignment
 * by tracking recent pre-post correlations.
 */

import { Synapse, Neuron } from './types';

/** Maximum synaptic weight */
const MAX_WEIGHT = 1.0;
const MIN_WEIGHT = 0.0;

/** Synaptic delay range in timesteps */
const MIN_DELAY = 1;
const MAX_DELAY = 5;

/**
 * Create a synapse between two neurons
 */
export function createSynapse(
  pre: number,
  post: number,
  isExcitatory: boolean,
  initialWeight?: number
): Synapse {
  return {
    pre,
    post,
    weight: initialWeight ?? (Math.random() * 0.3 + 0.1),
    delay: Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY,
    eligibility: 0,
    isExcitatory,
  };
}

/**
 * Compute the current delivered by a synapse
 * Takes into account delay via spike history
 */
export function computeSynapticCurrent(
  synapse: Synapse,
  spikeHistory: boolean[][], // [timestep][neuronIndex]
  currentStep: number
): number {
  // Look back by delay amount
  const delayedStep = currentStep - synapse.delay;
  if (delayedStep < 0 || !spikeHistory[delayedStep]) {
    return 0;
  }

  const preFired = spikeHistory[delayedStep][synapse.pre];
  if (!preFired) {
    return 0;
  }

  // Deliver current based on weight and excitatory/inhibitory nature
  const sign = synapse.isExcitatory ? 1 : -1;
  return sign * synapse.weight * 20; // Scale factor for current
}

/**
 * Update eligibility trace based on pre and post activity
 *
 * The trace accumulates when pre and post are active together,
 * and decays exponentially over time.
 */
export function updateEligibility(
  synapse: Synapse,
  preNeuron: Neuron,
  postNeuron: Neuron,
  dt: number,
  tau: number
): Synapse {
  // Decay existing trace
  const decay = Math.exp(-dt / tau);
  let newEligibility = synapse.eligibility * decay;

  // Accumulate based on STDP-like rule
  // If pre fired and post fired (or was near threshold), increase trace
  if (preNeuron.fired) {
    // Pre-post correlation
    const postActivity = postNeuron.fired ? 1 : Math.max(0, (postNeuron.v + 65) / 95);
    newEligibility += postActivity * 0.1;
  }

  // Clamp eligibility
  newEligibility = Math.max(-1, Math.min(1, newEligibility));

  return {
    ...synapse,
    eligibility: newEligibility,
  };
}

/**
 * Apply three-factor learning rule
 *
 * Δw = η · eligibility · error · gating
 */
export function applyLearning(
  synapse: Synapse,
  errorSignal: number,  // Prediction error (from readout)
  gatingSignal: number, // Attention/modulation (0-1)
  learningRate: number
): Synapse {
  // Three-factor update
  const deltaW = learningRate * synapse.eligibility * errorSignal * gatingSignal;

  let newWeight = synapse.weight + deltaW;

  // Clamp weight
  newWeight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newWeight));

  return {
    ...synapse,
    weight: newWeight,
  };
}

/**
 * Batch update all synapses for learning
 */
export function updateSynapses(
  synapses: Synapse[],
  neurons: Neuron[],
  errorSignal: number,
  gatingSignal: number,
  learningRate: number,
  dt: number,
  eligibilityTau: number,
  learningEnabled: boolean
): Synapse[] {
  return synapses.map(synapse => {
    // Update eligibility trace
    let updated = updateEligibility(
      synapse,
      neurons[synapse.pre],
      neurons[synapse.post],
      dt,
      eligibilityTau
    );

    // Apply learning if enabled
    if (learningEnabled && Math.abs(errorSignal) > 0.01) {
      updated = applyLearning(updated, errorSignal, gatingSignal, learningRate);
    }

    return updated;
  });
}

/**
 * Compute total synaptic input to each neuron
 */
export function computeSynapticInputs(
  synapses: Synapse[],
  neurons: Neuron[],
  spikeHistory: boolean[][],
  currentStep: number
): number[] {
  const inputs = new Array(neurons.length).fill(0);

  for (const synapse of synapses) {
    const current = computeSynapticCurrent(synapse, spikeHistory, currentStep);
    inputs[synapse.post] += current;
  }

  return inputs;
}

/**
 * Get visible synapses for rendering (weight above threshold)
 */
export function getVisibleSynapses(
  synapses: Synapse[],
  minWeight: number = 0.15
): Synapse[] {
  return synapses.filter(s => s.weight >= minWeight);
}
