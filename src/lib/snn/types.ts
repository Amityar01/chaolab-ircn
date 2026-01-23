/**
 * Spiking Neural Network Types
 * Based on Yamada-Chao paper: "Joint encoding of what and when predictions
 * through error-modulated plasticity in reservoir spiking networks"
 */

/** Neuron type determines Izhikevich parameters */
export type NeuronType = 'regular' | 'bursting' | 'chattering' | 'inhibitory';

/** Izhikevich neuron parameters */
export interface IzhikevichParams {
  a: number;  // Recovery time constant
  b: number;  // Sensitivity of recovery
  c: number;  // After-spike reset value of v
  d: number;  // After-spike reset of u
}

/** Single neuron state */
export interface Neuron {
  id: number;
  type: NeuronType;
  params: IzhikevichParams;

  // State variables
  v: number;           // Membrane potential (mV)
  u: number;           // Recovery variable
  fired: boolean;      // Did neuron fire this timestep?

  // For visualization
  x: number;           // Position x (0-1 normalized)
  y: number;           // Position y (0-1 normalized)
  firingRate: number;  // EMA of firing rate for visualization
  lastSpikeTime: number;  // Timestep of last spike
}

/** Synapse with eligibility trace for three-factor learning */
export interface Synapse {
  pre: number;         // Presynaptic neuron index
  post: number;        // Postsynaptic neuron index
  weight: number;      // Synaptic weight
  delay: number;       // Axonal delay in timesteps
  eligibility: number; // Eligibility trace for credit assignment
  isExcitatory: boolean;
}

/** Linear readout layer for predictions */
export interface ReadoutLayer {
  weights: number[][];  // [output_dim][num_neurons]
  bias: number[];       // [output_dim]
  prediction: number[]; // Current prediction [output_dim]
}

/** WHERE prediction (spatial) */
export interface WherePrediction {
  x: number;
  y: number;
  confidence: number;
}

/** WHEN prediction (temporal) */
export interface WhenPrediction {
  timeToEvent: number;  // Predicted ms until next significant movement
  confidence: number;
}

/** Full network snapshot for visualization */
export interface NetworkSnapshot {
  neurons: Neuron[];
  synapses: Synapse[];
  wherePrediction: WherePrediction;
  whenPrediction: WhenPrediction;
  simulationTime: number;  // Total elapsed ms
  spatialError: number;    // WHERE prediction error
  temporalError: number;   // WHEN prediction error
}

/** Simulation configuration */
export interface SimulationConfig {
  neuronCount: number;
  connectionProbability: number;
  learningRate: number;
  learningEnabled: boolean;

  // Neuron type distribution
  typeDistribution: {
    regular: number;    // 0.40
    bursting: number;   // 0.25
    chattering: number; // 0.15
    inhibitory: number; // 0.20
  };

  // Timing
  dt: number;           // Timestep in ms (1.0)
  maxStepsPerFrame: number;  // Cap simulation steps per render frame

  // Eligibility trace
  eligibilityDecay: number;  // tau for trace decay

  // Firing rate EMA
  firingRateTau: number;     // tau for EMA smoothing
}

/** Input to the network */
export interface NetworkInput {
  position: { x: number; y: number };  // Current cursor/touch position (0-1)
  velocity: { x: number; y: number };  // Movement velocity
  isMoving: boolean;                   // Is input actively moving?
  timestamp: number;                   // Current time in ms
}

/** Default Izhikevich parameters by neuron type */
export const NEURON_PARAMS: Record<NeuronType, IzhikevichParams> = {
  regular:    { a: 0.02, b: 0.2, c: -65, d: 8 },
  bursting:   { a: 0.02, b: 0.2, c: -50, d: 4 },
  chattering: { a: 0.02, b: 0.2, c: -50, d: 2 },
  inhibitory: { a: 0.1,  b: 0.2, c: -65, d: 2 },
};

/** Default simulation configuration */
export const DEFAULT_CONFIG: SimulationConfig = {
  neuronCount: 80,
  connectionProbability: 0.15,
  learningRate: 0.001,
  learningEnabled: true,
  typeDistribution: {
    regular: 0.40,
    bursting: 0.25,
    chattering: 0.15,
    inhibitory: 0.20,
  },
  dt: 1.0,
  maxStepsPerFrame: 20,
  eligibilityDecay: 20,    // 20ms decay constant
  firingRateTau: 100,      // 100ms for smooth visualization
};
