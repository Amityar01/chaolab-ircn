'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface NeuralActivityProps {
  mousePos: { x: number; y: number };
  predictionError: number;
  isOmission: boolean;
}

// Generate electrode positions in a grid pattern (like ECoG array)
function generateElectrodePositions(rows: number, cols: number, radius: number) {
  const positions: THREE.Vector3[] = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const u = (i / (rows - 1)) * Math.PI * 0.5 + Math.PI * 0.25;
      const v = (j / (cols - 1)) * Math.PI * 0.7 - Math.PI * 0.35;

      const x = radius * Math.sin(u) * Math.cos(v);
      const y = radius * Math.cos(u);
      const z = radius * Math.sin(u) * Math.sin(v);

      positions.push(new THREE.Vector3(x, y, z));
    }
  }

  return positions;
}

// Calmer shader - subtle glow, gentle waves
const brainVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float time;
  uniform vec2 activityCenter;
  uniform float activityStrength;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;

    // Very subtle wave displacement
    float dist = length(position.xz - activityCenter);
    float wave = sin(dist * 2.0 - time * 1.5) * 0.008 * activityStrength;
    wave *= exp(-dist * 0.5);

    vec3 newPosition = position + normal * wave;
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
  uniform float errorFlash;
  uniform float omissionFlash;
  uniform vec3 baseColor;

  void main() {
    // Fresnel for depth
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

    // Subtle activity wave from mouse
    float dist = length(vPosition.xz - activityCenter);
    float activityWave = sin(dist * 2.5 - time * 1.5) * 0.5 + 0.5;
    activityWave *= exp(-dist * 0.4) * activityStrength * 0.4;

    // Base color with fresnel rim
    vec3 finalColor = baseColor * (0.4 + fresnel * 0.4);

    // Add subtle purple activity
    finalColor += vec3(0.55, 0.36, 0.96) * activityWave * 0.3;

    // Brief error flash (blue tint)
    finalColor += vec3(0.0, 0.6, 0.9) * errorFlash * 0.2;

    // Brief omission flash (cyan tint)
    finalColor += vec3(0.2, 0.8, 0.9) * omissionFlash * 0.15;

    // Subtle grid lines
    float gridX = smoothstep(0.47, 0.5, fract(vUv.x * 10.0));
    float gridY = smoothstep(0.47, 0.5, fract(vUv.y * 10.0));
    finalColor += vec3(0.3, 0.2, 0.5) * (gridX + gridY) * 0.08;

    gl_FragColor = vec4(finalColor, 0.9);
  }
`;

function BrainMesh({ mousePos, predictionError, isOmission }: NeuralActivityProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const errorFlashRef = useRef(0);
  const omissionFlashRef = useRef(0);
  const lastErrorRef = useRef(0);
  const lastOmissionRef = useRef(false);

  const activityCenter = useMemo(() => {
    const x = ((mousePos.x / window.innerWidth) - 0.5) * 3;
    const z = ((mousePos.y / window.innerHeight) - 0.5) * 3;
    return new THREE.Vector2(x, z);
  }, [mousePos.x, mousePos.y]);

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    activityCenter: { value: new THREE.Vector2(0, 0) },
    activityStrength: { value: 0 },
    errorFlash: { value: 0 },
    omissionFlash: { value: 0 },
    baseColor: { value: new THREE.Color('#1a1a2e') }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      const mat = materialRef.current;
      mat.uniforms.time.value = state.clock.elapsedTime;
      mat.uniforms.activityCenter.value.lerp(activityCenter, 0.08);

      // Gentle activity buildup
      mat.uniforms.activityStrength.value = THREE.MathUtils.lerp(
        mat.uniforms.activityStrength.value,
        0.8,
        0.02
      );

      // Error flash - trigger on spike, then decay quickly
      if (predictionError > lastErrorRef.current + 30) {
        errorFlashRef.current = 1;
      }
      lastErrorRef.current = predictionError;
      errorFlashRef.current *= 0.92; // Fast decay
      mat.uniforms.errorFlash.value = errorFlashRef.current;

      // Omission flash - trigger once on detection, then decay
      if (isOmission && !lastOmissionRef.current) {
        omissionFlashRef.current = 1;
      }
      lastOmissionRef.current = isOmission;
      omissionFlashRef.current *= 0.94; // Fast decay
      mat.uniforms.omissionFlash.value = omissionFlashRef.current;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1.3, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={brainVertexShader}
        fragmentShader={brainFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// Simpler electrode points - fewer, calmer
function Electrodes({ mousePos, predictionError, isOmission }: NeuralActivityProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const electrodePositions = useMemo(() => generateElectrodePositions(6, 10, 1.35), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(electrodePositions.length * 3);
    const colors = new Float32Array(electrodePositions.length * 3);

    electrodePositions.forEach((pos, i) => {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      colors[i * 3] = 0.55;
      colors[i * 3 + 1] = 0.36;
      colors[i * 3 + 2] = 0.96;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geo;
  }, [electrodePositions]);

  useFrame((state) => {
    if (pointsRef.current) {
      const colors = pointsRef.current.geometry.attributes.color;
      const time = state.clock.elapsedTime;

      const ax = ((mousePos.x / window.innerWidth) - 0.5) * 3;
      const az = ((mousePos.y / window.innerHeight) - 0.5) * 3;

      electrodePositions.forEach((pos, i) => {
        const dist = Math.sqrt((pos.x - ax) ** 2 + (pos.z - az) ** 2);
        // Slower, gentler wave
        const wave = Math.sin(dist * 2 - time * 1.2) * 0.5 + 0.5;
        const activity = wave * Math.exp(-dist * 0.4) * 0.5;

        // Subtle color variation
        colors.setXYZ(
          i,
          0.55 + activity * 0.2,
          0.36 + activity * 0.15,
          0.96
        );
      });

      colors.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

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
    <div className="absolute inset-0 w-full h-full" style={{ opacity: 0.85 }}>
      <Canvas
        camera={{ position: [0, 1.5, 4.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.4} />
        <pointLight position={[-5, -5, -5]} intensity={0.2} color="#8B5CF6" />

        <BrainMesh
          mousePos={mousePos}
          predictionError={predictionError}
          isOmission={isOmission}
        />

        <Electrodes
          mousePos={mousePos}
          predictionError={predictionError}
          isOmission={isOmission}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.15}
        />
      </Canvas>
    </div>
  );
}
