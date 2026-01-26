/**
 * Main Simulation Orchestrator
 *
 * Coordinates all components:
 * - Izhikevich neurons
 * - Synaptic connections with eligibility traces
 * - WHERE/WHEN prediction readouts
 * - Three-factor Hebbian learning
 */

import {
  Neuron,
  Synapse,
  NetworkSnapshot,
  SimulationConfig,
  NetworkInput,
  ReadoutLayer,
  DEFAULT_CONFIG,
} from './types';

// Simple prediction state (bypasses complex readout)
// Reserved for future use
const _smoothPredX = 0.5;
const _smoothPredY = 0.5;
import { stepNeuron, updateFiringRate, computeInputCurrent } from './izhikevich';
import { computeSynapticInputs, updateSynapses } from './synapse';
import { createReservoir, resetNeuronStates, resetSynapseWeights } from './reservoir';
import {
  createWhereReadout,
  createWhenReadout,
  predictWhere,
  predictWhen,
  trainWhere,
  trainWhen,
  computeErrorSignal,
} from './readout';

/** Spike history buffer length */
const HISTORY_LENGTH = 20;

/**
 * Main simulation class
 */
export class SpikingNetworkSimulation {
  private config: SimulationConfig;
  private neurons: Neuron[];
  private synapses: Synapse[];
  private whereReadout: ReadoutLayer;
  private whenReadout: ReadoutLayer;

  private spikeHistory: boolean[][];
  private historyIndex: number;
  private simulationTime: number;
  private stepCount: number;

  private lastInput: NetworkInput | null;
  private lastMovementTime: number;
  private spatialError: number;
  private temporalError: number;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const { neurons, synapses } = createReservoir(this.config);
    this.neurons = neurons;
    this.synapses = synapses;

    this.whereReadout = createWhereReadout(this.config.neuronCount);
    this.whenReadout = createWhenReadout(this.config.neuronCount);

    this.spikeHistory = [];
    for (let i = 0; i < HISTORY_LENGTH; i++) {
      this.spikeHistory.push(new Array(this.config.neuronCount).fill(false));
    }
    this.historyIndex = 0;

    this.simulationTime = 0;
    this.stepCount = 0;
    this.lastInput = null;
    this.lastMovementTime = 0;
    this.spatialError = 0;
    this.temporalError = 0;
  }

  /**
   * Step the simulation by one timestep
   */
  private step(input: NetworkInput): void {
    const { dt, eligibilityDecay, firingRateTau, learningRate, learningEnabled } = this.config;

    // Compute synaptic inputs from spike history
    const synapticInputs = computeSynapticInputs(
      this.synapses,
      this.neurons,
      this.spikeHistory,
      this.historyIndex
    );

    // Update each neuron
    this.neurons = this.neurons.map((neuron, i) => {
      // External input based on position
      const externalCurrent = computeInputCurrent(
        neuron,
        input.position.x,
        input.position.y,
        input.isMoving ? 18 : 8 // Stronger input when moving
      );

      // Add noise to promote varied firing patterns
      const noise = (Math.random() - 0.5) * 4;

      const totalCurrent = synapticInputs[i] + externalCurrent + noise;

      // Step neuron dynamics
      let updated = stepNeuron(neuron, totalCurrent, dt, this.simulationTime);

      // Update firing rate EMA
      updated = updateFiringRate(updated, dt, firingRateTau);

      return updated;
    });

    // Record spikes in history
    this.historyIndex = (this.historyIndex + 1) % HISTORY_LENGTH;
    this.spikeHistory[this.historyIndex] = this.neurons.map(n => n.fired);

    // Compute predictions
    const wherePred = predictWhere(this.whereReadout, this.neurons);
    const _whenPred = predictWhen(this.whenReadout, this.neurons);

    // Train readouts
    if (learningEnabled) {
      // Predict AHEAD: train on future position extrapolated from velocity
      const predictionHorizon = 150; // ms ahead
      const futureX = Math.max(0, Math.min(1, input.position.x + input.velocity.x * predictionHorizon));
      const futureY = Math.max(0, Math.min(1, input.position.y + input.velocity.y * predictionHorizon));

      const whereResult = trainWhere(
        this.whereReadout,
        this.neurons,
        futureX,
        futureY,
        learningRate * 15 // Readout learns faster
      );
      this.whereReadout = whereResult.layer;
      this.spatialError = whereResult.error;

      // WHEN target: predict timing based on movement state
      // High velocity = short prediction (something happening soon)
      // Stopped = longer prediction (waiting for next event)
      const velocityMag = Math.sqrt(input.velocity.x ** 2 + input.velocity.y ** 2);
      const timePredictionTarget = input.isMoving
        ? Math.min(500, 100 / (velocityMag + 0.01)) // Fast movement = short time
        : Math.min(2000, this.simulationTime - this.lastMovementTime + 200); // Stopped = predict resumption
      const whenResult = trainWhen(
        this.whenReadout,
        this.neurons,
        timePredictionTarget,
        learningRate * 5
      );
      this.whenReadout = whenResult.layer;
      this.temporalError = whenResult.error;
    } else {
      // Just compute error without learning
      const dx = wherePred.x - input.position.x;
      const dy = wherePred.y - input.position.y;
      this.spatialError = Math.sqrt(dx * dx + dy * dy);
    }

    // Update synapses with three-factor learning
    const errorSignal = computeErrorSignal(this.spatialError, this.temporalError);
    const gatingSignal = input.isMoving ? 1.0 : 0.3; // Attention modulation

    this.synapses = updateSynapses(
      this.synapses,
      this.neurons,
      errorSignal,
      gatingSignal,
      learningRate,
      dt,
      eligibilityDecay,
      learningEnabled
    );

    // Track movement timing
    if (input.isMoving) {
      this.lastMovementTime = this.simulationTime;
    }

    this.simulationTime += dt;
    this.stepCount++;
    this.lastInput = input;
  }

  /**
   * Advance simulation by multiple timesteps (for real-time rendering)
   */
  update(input: NetworkInput, deltaTime: number): void {
    const { dt, maxStepsPerFrame } = this.config;

    // Calculate how many steps to take
    const steps = Math.min(
      Math.floor(deltaTime / dt),
      maxStepsPerFrame
    );

    for (let i = 0; i < steps; i++) {
      this.step(input);
    }
  }

  /**
   * Get current network snapshot for visualization
   */
  getSnapshot(): NetworkSnapshot {
    const wherePred = predictWhere(this.whereReadout, this.neurons);
    const whenPred = predictWhen(this.whenReadout, this.neurons);

    return {
      neurons: this.neurons,
      synapses: this.synapses,
      wherePrediction: wherePred,
      whenPrediction: whenPred,
      simulationTime: this.simulationTime,
      spatialError: this.spatialError,
      temporalError: this.temporalError,
    };
  }

  /**
   * Reset simulation state
   */
  reset(): void {
    this.neurons = resetNeuronStates(this.neurons);
    this.synapses = resetSynapseWeights(this.synapses);
    this.whereReadout = createWhereReadout(this.config.neuronCount);
    this.whenReadout = createWhenReadout(this.config.neuronCount);

    for (let i = 0; i < HISTORY_LENGTH; i++) {
      this.spikeHistory[i].fill(false);
    }

    this.simulationTime = 0;
    this.stepCount = 0;
    this.lastInput = null;
    this.lastMovementTime = 0;
    this.spatialError = 0;
    this.temporalError = 0;
  }

  /**
   * Update configuration (recreates network if neuron count changes)
   */
  setConfig(newConfig: Partial<SimulationConfig>): void {
    const neuronCountChanged = newConfig.neuronCount !== undefined &&
      newConfig.neuronCount !== this.config.neuronCount;

    this.config = { ...this.config, ...newConfig };

    if (neuronCountChanged) {
      const { neurons, synapses } = createReservoir(this.config);
      this.neurons = neurons;
      this.synapses = synapses;
      this.whereReadout = createWhereReadout(this.config.neuronCount);
      this.whenReadout = createWhenReadout(this.config.neuronCount);

      this.spikeHistory = [];
      for (let i = 0; i < HISTORY_LENGTH; i++) {
        this.spikeHistory.push(new Array(this.config.neuronCount).fill(false));
      }
    }
  }

  /**
   * Toggle learning
   */
  setLearningEnabled(enabled: boolean): void {
    this.config.learningEnabled = enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  /**
   * Get neuron count
   */
  getNeuronCount(): number {
    return this.neurons.length;
  }

  /**
   * Get synapse count
   */
  getSynapseCount(): number {
    return this.synapses.length;
  }
}

/**
 * Factory function for creating simulation
 */
export function createSimulation(config?: Partial<SimulationConfig>): SpikingNetworkSimulation {
  return new SpikingNetworkSimulation(config);
}
