"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { AlertTriangle, Compass } from "lucide-react";
import { StarData, DeepSkyObject, ConstellationLine } from "@/lib/types";
import { horizontalToCartesian3D } from "@/lib/astronomyMath";

interface SkyMapViewer3DProps {
  stars: StarData[];
  constellationLines: Record<string, ConstellationLine[]>;
  deepSkyObjects: DeepSkyObject[];
  showConstellations: boolean;
  showLabels: boolean;
  showDso: boolean;
  showHorizon: boolean;
  showGrid: boolean;
  onSelectObject: (item: {
    type: "star" | "dso" | "constellation";
    data: StarData | DeepSkyObject | { con: string; stars: StarData[] };
  }) => void;
  selectedId?: string;
  onSwitchTo2D?: () => void;
}

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const emptySubscribe = () => () => {};

const SPHERE_RADIUS = 100;

export function SkyMapViewer3D({
  stars,
  constellationLines,
  deepSkyObjects,
  showConstellations,
  showLabels,
  showDso,
  showHorizon,
  showGrid,
  onSelectObject,
  selectedId,
  onSwitchTo2D,
}: SkyMapViewer3DProps) {
  const webglSupported = useSyncExternalStore(
    emptySubscribe,
    () => isWebGLAvailable(),
    () => true
  );

  // Map of stars by ID for quick position lookup
  const starsMap = useMemo(() => {
    const map = new Map<string, StarData>();
    for (const star of stars) {
      map.set(star.id, star);
    }
    return map;
  }, [stars]);

  // Constellation 3D lines geometry
  const constellationLinesGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (const lines of Object.values(constellationLines)) {
      for (const [starAId, starBId] of lines) {
        const starA = starsMap.get(starAId);
        const starB = starsMap.get(starBId);
        if (starA?.horizontal && starB?.horizontal) {
          const [ax, ay, az] = horizontalToCartesian3D(
            starA.horizontal.alt,
            starA.horizontal.az,
            SPHERE_RADIUS * 0.99
          );
          const [bx, by, bz] = horizontalToCartesian3D(
            starB.horizontal.alt,
            starB.horizontal.az,
            SPHERE_RADIUS * 0.99
          );
          points.push(new THREE.Vector3(ax, ay, az));
          points.push(new THREE.Vector3(bx, by, bz));
        }
      }
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [constellationLines, starsMap]);

  // Altitude grid circles (30°, 60°)
  const altGridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 72;
    const altitudes = [30, 60];

    for (const alt of altitudes) {
      for (let i = 0; i < segments; i++) {
        const az1 = (i / segments) * 360;
        const az2 = ((i + 1) / segments) * 360;
        const [x1, y1, z1] = horizontalToCartesian3D(alt, az1, SPHERE_RADIUS * 0.98);
        const [x2, y2, z2] = horizontalToCartesian3D(alt, az2, SPHERE_RADIUS * 0.98);
        points.push(new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  if (webglSupported === false) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#09090b] p-6 text-center text-zinc-100 select-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 mb-4 shadow-xl">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Wymagana akceleracja WebGL dla Sfery 3D
        </h3>
        <p className="max-w-md text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
          Twoja przeglądarka lub środowisko nie posiada aktywnego kontekstu WebGL. Skorzystaj z wbudowanej, interaktywnej Planisfery 2D opartej o grafikę wektorową SVG.
        </p>
        {onSwitchTo2D && (
          <button
            onClick={onSwitchTo2D}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-all shadow-lg shadow-white/10"
          >
            <Compass className="h-4 w-4" />
            <span>Przełącz na Planisferę 2D (SVG)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#09090b] select-none touch-none">
      <Canvas
        camera={{ position: [0, 0, 0.1], fov: 65, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#09090b"]} />

        {/* OrbitControls configured for looking around from inside the celestial sphere */}
        <OrbitControls
          makeDefault
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={-0.45} // Inverted so dragging moves the sky naturally
          minDistance={0.05}
          maxDistance={5}
        />

        {/* Ambient lighting */}
        <ambientLight intensity={0.5} />

        {/* Constellation Lines */}
        {showConstellations && (
          <lineSegments geometry={constellationLinesGeometry}>
            <lineBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </lineSegments>
        )}

        {/* Celestial Coordinate Grid (Alt Circles) */}
        {showGrid && (
          <lineSegments geometry={altGridGeometry}>
            <lineBasicMaterial
              color="#71717a"
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </lineSegments>
        )}

        {/* Horizon Disk & Cardinal Directions */}
        {showHorizon && (
          <group position={[0, -0.2, 0]}>
            {/* Translucent ground mask below the horizon */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[SPHERE_RADIUS * 1.05, 64]} />
              <meshBasicMaterial
                color="#050507"
                transparent
                opacity={0.7}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Glowing horizon ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[SPHERE_RADIUS * 0.98, SPHERE_RADIUS * 1.01, 64]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.2}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Cardinal Directions Labels on Horizon */}
            {[
              { label: "N", az: 0 },
              { label: "E", az: 90 },
              { label: "S", az: 180 },
              { label: "W", az: 270 },
            ].map((dir) => {
              const [x, y, z] = horizontalToCartesian3D(1.5, dir.az, SPHERE_RADIUS * 0.95);
              return (
                <Html key={dir.label} position={[x, y, z]} center distanceFactor={15}>
                  <div className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-black text-white border border-white/20 backdrop-blur-md">
                    {dir.label}
                  </div>
                </Html>
              );
            })}
          </group>
        )}

        {/* Individual Stars */}
        {stars.map((star) => {
          if (!star.horizontal) return null;
          const isAbove = star.horizontal.alt > 0;
          const [x, y, z] = horizontalToCartesian3D(
            star.horizontal.alt,
            star.horizontal.az,
            SPHERE_RADIUS
          );

          // Star sphere radius scaled by magnitude
          const baseSize = Math.max(0.4, 2.2 - star.mag * 0.35);
          const isSelected = selectedId === star.id;

          return (
            <group key={star.id} position={[x, y, z]}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectObject({ type: "star", data: star });
                }}
                onPointerOver={() => {
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "auto";
                }}
              >
                <sphereGeometry args={[baseSize, 16, 16]} />
                <meshBasicMaterial
                  color={star.color || "#ffffff"}
                  transparent
                  opacity={isAbove ? 1 : 0.25}
                />
              </mesh>

              {/* Selection Ring */}
              {isSelected && (
                <mesh>
                  <ringGeometry args={[baseSize * 1.5, baseSize * 2.2, 24]} />
                  <meshBasicMaterial
                    color="#ffffff"
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.9}
                  />
                </mesh>
              )}

              {/* Star Labels */}
              {showLabels && isAbove && (star.mag < 2.5 || isSelected) && (
                <Html position={[0, baseSize + 0.8, 0]} center distanceFactor={25}>
                  <div
                    className={`whitespace-nowrap px-1.5 py-0.5 text-[10px] font-medium rounded backdrop-blur-md transition-all pointer-events-none ${
                      isSelected
                        ? "bg-white text-black font-semibold shadow-md shadow-white/20"
                        : "bg-black/75 text-zinc-300 border border-white/15"
                    }`}
                  >
                    {star.name}
                  </div>
                </Html>
              )}
            </group>
          );
        })}

        {/* Deep Sky Objects (DSO) */}
        {showDso &&
          deepSkyObjects.map((dso) => {
            if (!dso.horizontal) return null;
            const isAbove = dso.horizontal.alt > 0;
            const [x, y, z] = horizontalToCartesian3D(
              dso.horizontal.alt,
              dso.horizontal.az,
              SPHERE_RADIUS * 0.97
            );
            const isSelected = selectedId === dso.id;

            return (
              <group key={dso.id} position={[x, y, z]}>
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject({ type: "dso", data: dso });
                  }}
                  onPointerOver={() => {
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = "auto";
                  }}
                >
                  <ringGeometry args={[0.9, 1.4, 20]} />
                  <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={isAbove ? 0.85 : 0.25}
                    side={THREE.DoubleSide}
                  />
                </mesh>

                {showLabels && isAbove && (
                  <Html position={[0, 2.0, 0]} center distanceFactor={25}>
                    <div
                      className={`whitespace-nowrap px-1.5 py-0.5 text-[9px] font-semibold rounded backdrop-blur-md pointer-events-none ${
                        isSelected
                          ? "bg-white text-black font-bold shadow-md shadow-white/20"
                          : "bg-zinc-900/90 text-zinc-200 border border-white/20"
                      }`}
                    >
                      {dso.id} ({dso.namePl.split(" ")[0]})
                    </div>
                  </Html>
                )}
              </group>
            );
          })}
      </Canvas>
    </div>
  );
}
