"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { CelestialBodyData } from "@/lib/types";
import { useIsMounted } from "@/lib/useIsMounted";
import { OrbitLine } from "./OrbitLine";
import { TEXTURE_PATHS, useTextureCached } from "./textureLoader";

interface MoonBodyProps {
  data: CelestialBodyData;
  isSelected: boolean;
  onSelect: (data: CelestialBodyData) => void;
  speedMultiplier: number;
  onRegisterMesh?: (id: string, obj: THREE.Object3D | null) => void;
}

export function MoonBody({
  data,
  isSelected,
  onSelect,
  speedMultiplier,
  onRegisterMesh,
}: MoonBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const mounted = useIsMounted();

  const texture = useTextureCached(TEXTURE_PATHS[data.id]);

  useEffect(() => {
    if (onRegisterMesh && meshRef.current) {
      onRegisterMesh(data.id, meshRef.current);
      return () => {
        onRegisterMesh(data.id, null);
      };
    }
  }, [data.id, onRegisterMesh]);

  useFrame((_, delta) => {
    // Axial rotation
    if (meshRef.current) {
      const rotSpeed =
        data.rotationPeriodHours !== 0
          ? (1 / Math.abs(data.rotationPeriodHours)) * 10 * speedMultiplier
          : 0.02 * speedMultiplier;
      meshRef.current.rotation.y += rotSpeed * delta;
    }

    // Orbital revolution around parent planet
    if (orbitGroupRef.current && data.orbitalPeriodDays > 0) {
      const orbitSpeed = (1 / (Math.sqrt(data.orbitalPeriodDays) * 2.5)) * speedMultiplier;
      orbitGroupRef.current.rotation.y += orbitSpeed * delta;
    }
  });

  return (
    <>
      {/* Sub-orbit track line around parent planet */}
      <OrbitLine
        radius={data.scaledDistance}
        highlighted={isSelected}
        opacity={isSelected ? 0.9 : 0.25}
        color={isSelected ? 0xffffff : 0x3f3f46}
        segments={64}
      />

      {/* Orbiting group */}
      <group ref={orbitGroupRef}>
        <group position={[data.scaledDistance, 0, 0]}>
          {/* Moon Sphere */}
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
            <sphereGeometry args={[data.scaledRadius, 24, 24]} />
            <meshStandardMaterial
              map={texture || undefined}
              color={texture ? "#FFFFFF" : data.colorHex}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>

          {/* Selection / Hover Indicator Ring */}
          {(isSelected || hovered) && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[data.scaledRadius * 1.25, data.scaledRadius * 1.35, 24]}
              />
              <meshBasicMaterial
                color={isSelected ? "#FFFFFF" : "#71717A"}
                side={THREE.DoubleSide}
                transparent
                opacity={isSelected ? 0.95 : 0.6}
              />
            </mesh>
          )}

          {/* Floating Label (Visible on hover or selection) */}
          {mounted && (
            <Html
              position={[0, data.scaledRadius + 0.5, 0]}
              center
              distanceFactor={22}
              style={{
                pointerEvents: "none",
                opacity: hovered || isSelected ? 1 : 0,
                visibility: hovered || isSelected ? "visible" : "hidden",
                transform: hovered || isSelected ? "scale(1)" : "scale(0.85)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }}
            >
              <div
                className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-all ${
                  isSelected
                    ? "bg-white text-black shadow-lg shadow-white/20"
                    : "bg-black/80 text-zinc-200 border border-white/20"
                }`}
              >
                {data.name.pl}
              </div>
            </Html>
          )}
        </group>
      </group>
    </>
  );
}
