/**
 * Spiking Neural Network Library
 *
 * Based on Yamada-Chao paper: "Joint encoding of what and when predictions
 * through error-modulated plasticity in reservoir spiking networks"
 *
 * Features:
 * - Izhikevich neuron model with heterogeneous parameters
 * - Three-factor Hebbian learning with eligibility traces
 * - Dual prediction channels (WHERE/WHEN)
 * - Biologically plausible reservoir computing
 */

// Types
export * from './types';

// Core modules
export { createNeuron, stepNeuron, updateFiringRate, computeInputCurrent } from './izhikevich';
export {
  createSynapse,
  computeSynapticCurrent,
  updateEligibility,
  applyLearning,
  updateSynapses,
  computeSynapticInputs,
  getVisibleSynapses,
} from './synapse';
export {
  createReservoir,
  getNetworkStats,
  resetNeuronStates,
  resetSynapseWeights,
} from './reservoir';
export {
  createReadoutLayer,
  forward,
  updateReadout,
  createWhereReadout,
  createWhenReadout,
  extractFiringRates,
  predictWhere,
  predictWhen,
  trainWhere,
  trainWhen,
  computeErrorSignal,
} from './readout';

// Main simulation
export { SpikingNetworkSimulation, createSimulation } from './simulation';
