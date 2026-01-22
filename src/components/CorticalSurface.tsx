'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface NeuralActivityProps {
  mousePos: { x: number; y: number };
  predictionError: number;
  isOmission: boolean;
  omissionLocation: { x: number; y: number };
}

// Generate electrode positions in a grid pattern (like ECoG array)
function generateElectrodePositions(rows: number, cols: number, radius: number) {
  const positions: THREE.Vector3[] = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Map to spherical surface
      const u = (i / (rows - 1)) * Math.PI * 0.6 + Math.PI * 0.2;
      const v = (j / (cols - 1)) * Math.PI * 0.8 - Math.PI * 0.4;

      const x = radius * Math.sin(u) * Math.cos(v);
      const y = radius * Math.cos(u);
      const z = radius * Math.sin(u) * Math.sin(v);

      positions.push(new THREE.Vector3(x, y, z));
    }
  }

  return positions;
}

// Custom shader for the brain surface with activity waves
const brainVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float time;
  uniform vec2 activityCenter;
  uniform float activityStrength;
  uniform float predictionError;
  uniform float omissionPulse;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;

    // Wave displacement based on activity
    float dist = length(position.xz - activityCenter);
    float wave = sin(dist * 3.0 - time * 4.0) * 0.02 * activityStrength;
    wave *= exp(-dist * 0.5);

    // Error pulse - ripples outward
    float errorWave = sin(length(position.xz) * 5.0 - time * 8.0) * 0.03 * predictionError;

    // Omission response - whole surface pulses
    float omissionWave = sin(time * 12.0) * 0.02 * omissionPulse;

    vec3 newPosition = position + normal * (wave + errorWave + omissionWave);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const brainFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float time;
  uniform vec2 activityCenter;
  uniform float activityStrength;
  uniform float predictionError;
  uniform float omissionPulse;
  uniform vec3 predictionColor;
  uniform vec3 errorColor;
  uniform vec3 baseColor;

  void main() {
    // Base fresnel effect for depth
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.0);

    // Activity wave from mouse position
    float dist = length(vPosition.xz - activityCenter);
    float activityWave = sin(dist * 4.0 - time * 5.0) * 0.5 + 0.5;
    activityWave *= exp(-dist * 0.3) * activityStrength;

    // Prediction wave - traveling outward
    float predictionWave = sin(dist * 3.0 - time * 3.0) * 0.5 + 0.5;
    predictionWave *= exp(-dist * 0.4) * activityStrength * 0.5;

    // Error signal - red/orange burst
    float errorSignal = sin(length(vPosition.xz) * 6.0 - time * 10.0) * 0.5 + 0.5;
    errorSignal *= predictionError;

    // Omission response - pulsing glow
    float omissionGlow = (sin(time * 15.0) * 0.5 + 0.5) * omissionPulse;

    // Combine colors
    vec3 activity = predictionColor * (activityWave + predictionWave);
    vec3 error = errorColor * errorSignal;
    vec3 omission = vec3(0.3, 0.8, 1.0) * omissionGlow;

    vec3 finalColor = baseColor * (0.3 + fresnel * 0.3);
    finalColor += activity;
    finalColor += error;
    finalColor += omission;

    // Add subtle grid pattern (electrode grid hint)
    float gridX = smoothstep(0.48, 0.5, fract(vUv.x * 12.0));
    float gridY = smoothstep(0.48, 0.5, fract(vUv.y * 12.0));
    finalColor += vec3(0.1) * (gridX + gridY) * 0.3;

    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

function BrainMesh({ mousePos, predictionError, isOmission, omissionLocation }: NeuralActivityProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  // Convert mouse position to 3D space
  const activityCenter = useMemo(() => {
    const x = ((mousePos.x / window.innerWidth) - 0.5) * 4;
    const z = ((mousePos.y / window.innerHeight) - 0.5) * 4;
    return new THREE.Vector2(x, z);
  }, [mousePos.x, mousePos.y]);

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    activityCenter: { value: new THREE.Vector2(0, 0) },
    activityStrength: { value: 0 },
    predictionError: { value: 0 },
    omissionPulse: { value: 0 },
    predictionColor: { value: new THREE.Color('#8B5CF6') },
    errorColor: { value: new THREE.Color('#0097E0') },
    baseColor: { value: new THREE.Color('#1a1a2e') }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.activityCenter.value.lerp(activityCenter, 0.1);
      materialRef.current.uniforms.activityStrength.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.activityStrength.value,
        1,
        0.05
      );
      materialRef.current.uniforms.predictionError.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.predictionError.value,
        Math.min(predictionError / 100, 1),
        0.1
      );
      materialRef.current.uniforms.omissionPulse.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.omissionPulse.value,
        isOmission ? 1 : 0,
        isOmission ? 0.3 : 0.05
      );
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={brainVertexShader}
        fragmentShader={brainFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Electrode points that glow based on activity
function Electrodes({ mousePos, predictionError, isOmission }: NeuralActivityProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const electrodePositions = useMemo(() => generateElectrodePositions(8, 16, 2.05), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(electrodePositions.length * 3);
    const colors = new Float32Array(electrodePositions.length * 3);
    const sizes = new Float32Array(electrodePositions.length);

    electrodePositions.forEach((pos, i) => {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      colors[i * 3] = 0.5;
      colors[i * 3 + 1] = 0.3;
      colors[i * 3 + 2] = 1.0;
      sizes[i] = 0.05;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geo;
  }, [electrodePositions]);

  useFrame((state) => {
    if (pointsRef.current) {
      const colors = pointsRef.current.geometry.attributes.color;
      const sizes = pointsRef.current.geometry.attributes.size;
      const time = state.clock.elapsedTime;

      // Convert mouse to activity center
      const ax = ((mousePos.x / window.innerWidth) - 0.5) * 4;
      const az = ((mousePos.y / window.innerHeight) - 0.5) * 4;

      electrodePositions.forEach((pos, i) => {
        const dist = Math.sqrt((pos.x - ax) ** 2 + (pos.z - az) ** 2);
        const wave = Math.sin(dist * 3 - time * 4) * 0.5 + 0.5;
        const activity = wave * Math.exp(-dist * 0.3);

        // Prediction color (purple)
        const predictionIntensity = activity * 0.8;
        // Error color (blue)
        const errorIntensity = (predictionError / 100) * Math.sin(time * 8 + i) * 0.5;
        // Omission (cyan pulse)
        const omissionIntensity = isOmission ? Math.sin(time * 12) * 0.5 + 0.5 : 0;

        colors.setXYZ(
          i,
          0.55 + predictionIntensity * 0.3 + errorIntensity * 0.0, // R
          0.36 + errorIntensity * 0.6 + omissionIntensity * 0.4, // G
          0.96 + errorIntensity * 0.0 + omissionIntensity * 0.04 // B
        );

        sizes.setX(i, 0.04 + activity * 0.08 + (isOmission ? 0.03 : 0));
      });

      colors.needsUpdate = true;
      sizes.needsUpdate = true;

      pointsRef.current.rotation.y += 0.001;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Prediction ghost - shows where we predict the cursor will cause activity
function PredictionGhost({ predictedPos }: { predictedPos: { x: number; y: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const targetPos = useMemo(() => {
    const x = ((predictedPos.x / (typeof window !== 'undefined' ? window.innerWidth : 1)) - 0.5) * 4;
    const z = ((predictedPos.y / (typeof window !== 'undefined' ? window.innerHeight : 1)) - 0.5) * 4;
    // Project onto sphere surface
    const r = 2.1;
    const y = Math.sqrt(Math.max(0, r * r - x * x - z * z));
    return new THREE.Vector3(x, y, z);
  }, [predictedPos.x, predictedPos.y]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPos, 0.15);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 2, 0]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial
        color="#8B5CF6"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Main component
export default function CorticalSurface({
  mousePos = { x: 0, y: 0 },
  predictedPos = { x: 0, y: 0 },
  predictionError = 0,
  isOmission = false,
  omissionLocation = { x: 0, y: 0 }
}: {
  mousePos?: { x: number; y: number };
  predictedPos?: { x: number; y: number };
  predictionError?: number;
  isOmission?: boolean;
  omissionLocation?: { x: number; y: number };
}) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8B5CF6" />

        <BrainMesh
          mousePos={mousePos}
          predictionError={predictionError}
          isOmission={isOmission}
          omissionLocation={omissionLocation}
        />

        <Electrodes
          mousePos={mousePos}
          predictionError={predictionError}
          isOmission={isOmission}
          omissionLocation={omissionLocation}
        />

        <PredictionGhost predictedPos={predictedPos} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.2}
        />
      </Canvas>
    </div>
  );
}
