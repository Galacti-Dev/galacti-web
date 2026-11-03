"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { CelestialBodyData } from "@/lib/types";
import { useIsMounted } from "@/lib/useIsMounted";
import { MoonBody } from "./MoonBody";
import { TEXTURE_PATHS, SATURN_RING_TEXTURE, useTextureCached } from "./textureLoader";

interface CelestialBodyProps {
  data: CelestialBodyData;
  isSelected: boolean;
  selectedBodyId?: string;
  moons?: CelestialBodyData[];
  onSelect: (data: CelestialBodyData) => void;
  speedMultiplier: number;
  onRegisterMesh?: (id: string, obj: THREE.Object3D | null) => void;
}

export function CelestialBody({
  data,
  isSelected,
  selectedBodyId,
  moons = [],
  onSelect,
  speedMultiplier,
  onRegisterMesh,
}: CelestialBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const mounted = useIsMounted();

  const isSun = data.id === "sun";
  const hasRings = data.id === "saturn";

  const texturePath = TEXTURE_PATHS[data.id];
  const planetTexture = useTextureCached(texturePath);
  const ringTexture = useTextureCached(hasRings ? SATURN_RING_TEXTURE : undefined);

  useEffect(() => {
    if (onRegisterMesh && meshRef.current) {
      onRegisterMesh(data.id, meshRef.current);
      return () => {
        onRegisterMesh(data.id, null);
      };
    }
  }, [data.id, onRegisterMesh]);

  // Construct concentric ring geometry with custom UV mapping for radial strip texture
  const ringGeometry = useMemo(() => {
    if (!hasRings) return null;
    const innerRadius = data.scaledRadius * 1.4;
    const outerRadius = data.scaledRadius * 2.3;
    const geom = new THREE.RingGeometry(innerRadius, outerRadius, 64, 8);
    const pos = geom.attributes.position;
    const uv = geom.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      const u = (r - innerRadius) / (outerRadius - innerRadius);
      uv.setXY(i, u, 0.5);
    }
    uv.needsUpdate = true;
    return geom;
  }, [hasRings, data.scaledRadius]);

  useEffect(() => {
    return () => {
      ringGeometry?.dispose();
    };
  }, [ringGeometry]);

  // Calculate orbital revolution and axial rotation
  useFrame((_, delta) => {
    // Axial rotation
    if (meshRef.current) {
      const rotSpeed =
        data.rotationPeriodHours !== 0
          ? (1 / Math.abs(data.rotationPeriodHours)) * 10 * speedMultiplier
          : 0.01 * speedMultiplier;
      meshRef.current.rotation.y += rotSpeed * delta * 2;
    }

    // Orbital revolution around Sun
    if (orbitGroupRef.current && !isSun && data.orbitalPeriodDays > 0) {
      // Scale period so planets move noticeably: 365 days = ~30 seconds per revolution at 1x
      const orbitSpeed = (1 / (Math.sqrt(data.orbitalPeriodDays) * 4)) * speedMultiplier;
      orbitGroupRef.current.rotation.y += orbitSpeed * delta;
    }
  });

  return (
    <group ref={orbitGroupRef}>
      {/* Position of body on orbit */}
      <group position={[data.scaledDistance, 0, 0]}>
        {/* Celestial Body Sphere */}
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(data);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[data.scaledRadius, isSun ? 48 : 36, isSun ? 48 : 36]} />
          {isSun ? (
            <meshBasicMaterial
              map={planetTexture || undefined}
              color={planetTexture ? "#FFFFFF" : data.colorHex}
            />
          ) : (
            <meshStandardMaterial
              map={planetTexture || undefined}
              color={planetTexture ? "#FFFFFF" : data.colorHex}
              roughness={0.7}
              metalness={0.1}
            />
          )}
        </mesh>

        {/* Sun Glow & Core Light */}
        {isSun && (
          <>
            <pointLight intensity={3.5} distance={300} decay={0.1} color="#FFF4D6" />
            {/* Corona mesh */}
            <mesh>
              <sphereGeometry args={[data.scaledRadius * 1.15, 32, 32]} />
              <meshBasicMaterial
                color="#FDB813"
                transparent
                opacity={0.25}
                side={THREE.BackSide}
              />
            </mesh>
          </>
        )}

        {/* Saturn's Rings */}
        {hasRings && ringGeometry && (
          <mesh rotation={[-Math.PI / 2.3, 0.2, 0]}>
            <primitive object={ringGeometry} attach="geometry" />
            <meshStandardMaterial
              map={ringTexture || undefined}
              alphaMap={ringTexture || undefined}
              color={ringTexture ? "#FFFFFF" : "#D4B28C"}
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        )}

        {/* Selection / Hover Indicator Ring */}
        {(isSelected || hovered) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[data.scaledRadius * 1.25, data.scaledRadius * 1.35, 32]}
            />
            <meshBasicMaterial
              color={isSelected ? "#FFFFFF" : "#71717A"}
              side={THREE.DoubleSide}
              transparent
              opacity={isSelected ? 0.95 : 0.6}
            />
          </mesh>
        )}

        {/* Floating Label (Visible on hover, selection, or for Sun) */}
        {mounted && (
          <Html
            position={[0, data.scaledRadius + 0.8, 0]}
            center
            distanceFactor={30}
            style={{
              pointerEvents: "none",
              opacity: hovered || isSelected || isSun ? 1 : 0,
              visibility: hovered || isSelected || isSun ? "visible" : "hidden",
              transform: hovered || isSelected || isSun ? "scale(1)" : "scale(0.85)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            <div
              className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-semibold backdrop-blur-md transition-all ${
                isSelected
                  ? "bg-white text-black shadow-lg shadow-white/20"
                  : "bg-black/80 text-zinc-200 border border-white/20"
              }`}
            >
              {data.name.pl}
            </div>
          </Html>
        )}

        {/* Hierarchical Moons Sub-System */}
        {moons.map((moon) => (
          <MoonBody
            key={moon.id}
            data={moon}
            isSelected={selectedBodyId === moon.id}
            onSelect={onSelect}
            speedMultiplier={speedMultiplier}
            onRegisterMesh={onRegisterMesh}
          />
        ))}
      </group>
    </group>
  );
}
