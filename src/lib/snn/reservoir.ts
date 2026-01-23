/**
 * Reservoir Network Creation
 *
 * Creates a heterogeneous spiking neural network with:
 * - Mixed neuron types (regular, bursting, chattering, inhibitory)
 * - Sparse random connectivity
 * - Distance-dependent connection probability
 */

import { Neuron, Synapse, NeuronType, SimulationConfig, DEFAULT_CONFIG } from './types';
import { createNeuron, isExcitatory } from './izhikevich';
import { createSynapse } from './synapse';

/**
 * Select a neuron type based on distribution
 */
function selectNeuronType(
  distribution: SimulationConfig['typeDistribution']
): NeuronType {
  const rand = Math.random();
  let cumulative = 0;

  cumulative += distribution.regular;
  if (rand < cumulative) return 'regular';

  cumulative += distribution.bursting;
  if (rand < cumulative) return 'bursting';

  cumulative += distribution.chattering;
  if (rand < cumulative) return 'chattering';

  return 'inhibitory';
}

/**
 * Generate neuron positions using a combination of:
 * - Clustered layout (groups of nearby neurons)
 * - Some randomness for natural look
 */
function generatePositions(count: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];

  // Create 4-6 cluster centers
  const numClusters = Math.floor(Math.random() * 3) + 4;
  const clusterCenters: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numClusters; i++) {
    clusterCenters.push({
      x: 0.15 + Math.random() * 0.7,
      y: 0.15 + Math.random() * 0.7,
    });
  }

  for (let i = 0; i < count; i++) {
    // Pick a random cluster
    const cluster = clusterCenters[Math.floor(Math.random() * numClusters)];

    // Position near cluster center with Gaussian-like distribution
    const angle = Math.random() * Math.PI * 2;
    const radius = (Math.random() + Math.random()) * 0.12; // Roughly Gaussian

    let x = cluster.x + Math.cos(angle) * radius;
    let y = cluster.y + Math.sin(angle) * radius;

    // Clamp to valid range with margin
    x = Math.max(0.05, Math.min(0.95, x));
    y = Math.max(0.05, Math.min(0.95, y));

    positions.push({ x, y });
  }

  return positions;
}

/**
 * Compute connection probability based on distance
 * Closer neurons more likely to connect
 */
function connectionProbability(
  n1: Neuron,
  n2: Neuron,
  baseProbability: number
): number {
  const dx = n1.x - n2.x;
  const dy = n1.y - n2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Distance-dependent probability with cutoff
  const sigma = 0.3;
  const distanceFactor = Math.exp(-(distance * distance) / (2 * sigma * sigma));

  return baseProbability * distanceFactor;
}

/**
 * Create the neural reservoir
 */
export function createReservoir(
  config: SimulationConfig = DEFAULT_CONFIG
): { neurons: Neuron[]; synapses: Synapse[] } {
  const { neuronCount, connectionProbability: baseProb, typeDistribution } = config;

  // Create neurons
  const positions = generatePositions(neuronCount);
  const neurons: Neuron[] = positions.map((pos, i) => {
    const type = selectNeuronType(typeDistribution);
    return createNeuron(i, type, pos.x, pos.y);
  });

  // Create synapses
  const synapses: Synapse[] = [];

  for (let i = 0; i < neuronCount; i++) {
    for (let j = 0; j < neuronCount; j++) {
      if (i === j) continue; // No self-connections

      const prob = connectionProbability(neurons[i], neurons[j], baseProb);

      if (Math.random() < prob) {
        const excitatory = isExcitatory(neurons[i]);
        synapses.push(createSynapse(i, j, excitatory));
      }
    }
  }

  return { neurons, synapses };
}

/**
 * Get statistics about the network
 */
export function getNetworkStats(neurons: Neuron[], synapses: Synapse[]) {
  const typeCounts: Record<NeuronType, number> = {
    regular: 0,
    bursting: 0,
    chattering: 0,
    inhibitory: 0,
  };

  for (const neuron of neurons) {
    typeCounts[neuron.type]++;
  }

  const excitatorySynapses = synapses.filter(s => s.isExcitatory).length;
  const inhibitorySynapses = synapses.length - excitatorySynapses;

  const avgWeight = synapses.reduce((sum, s) => sum + s.weight, 0) / synapses.length;

  return {
    neuronCount: neurons.length,
    synapseCount: synapses.length,
    typeCounts,
    excitatorySynapses,
    inhibitorySynapses,
    avgWeight,
    connectionsPerNeuron: synapses.length / neurons.length,
  };
}

/**
 * Reset neuron states while preserving structure
 */
export function resetNeuronStates(neurons: Neuron[]): Neuron[] {
  return neurons.map(n => ({
    ...n,
    v: -65 + Math.random() * 10 - 5,
    u: n.params.b * -65,
    fired: false,
    firingRate: 0,
    lastSpikeTime: -Infinity,
  }));
}

/**
 * Reset synapse learning while preserving structure
 */
export function resetSynapseWeights(synapses: Synapse[]): Synapse[] {
  return synapses.map(s => ({
    ...s,
    weight: Math.random() * 0.3 + 0.1,
    eligibility: 0,
  }));
}
