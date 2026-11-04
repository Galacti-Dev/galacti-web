"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import planetsRaw from "@/data/planets.json";
import moonsAndDwarfsRaw from "@/data/moons_and_dwarfs.json";
import { CelestialBodyData } from "@/lib/types";
import { CelestialBody } from "./CelestialBody";
import { OrbitLine } from "./OrbitLine";

const planets = planetsRaw as CelestialBodyData[];
const moonsAndDwarfs = moonsAndDwarfsRaw as CelestialBodyData[];

const dwarfPlanets = moonsAndDwarfs.filter((b) => b.type === "dwarf_planet");
const moons = moonsAndDwarfs.filter((b) => b.type === "moon");

// Heliocentric bodies: Sun, 8 Major Planets, Dwarf Planets (Ceres, Pluto)
const heliocentricBodies = [...planets, ...dwarfPlanets];

// Map of parentBodyId -> moons sub-system
const moonsByParent: Record<string, CelestialBodyData[]> = {};
for (const moon of moons) {
  const pId = moon.parentBodyId || "";
  if (!moonsByParent[pId]) moonsByParent[pId] = [];
  moonsByParent[pId].push(moon);
}

const DEFAULT_CAM_POS = new THREE.Vector3(0, 50, 85);
const DEFAULT_TARGET_POS = new THREE.Vector3(0, 0, 0);

// Pre-allocated scratch vectors to prevent GC allocations during useFrame loop
const vPlanetPos = new THREE.Vector3();
const vPrevPlanetPos = new THREE.Vector3();
const vOffset = new THREE.Vector3();
const vCamDesired = new THREE.Vector3();
const vPlanetDelta = new THREE.Vector3();

interface CameraControllerProps {
  selectedPlanet: CelestialBodyData | null;
  resetTrigger?: number;
  meshMapRef: React.RefObject<Map<string, THREE.Object3D>>;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  isCinematicMode?: boolean;
}

function CameraController({
  selectedPlanet,
  resetTrigger,
  meshMapRef,
  controlsRef,
  isCinematicMode = false,
}: CameraControllerProps) {
  const { camera } = useThree();
  const isFlyingRef = useRef(false);
  const cinematicAngleRef = useRef(0);
  const prevPlanetIdRef = useRef<string | null>(null);
  const prevResetTriggerRef = useRef<number | undefined>(resetTrigger);

  useEffect(() => {
    const isReset = resetTrigger !== prevResetTriggerRef.current;
    prevResetTriggerRef.current = resetTrigger;

    if (isReset && !selectedPlanet) {
      isFlyingRef.current = true;
      prevPlanetIdRef.current = null;
      return;
    }

    if (selectedPlanet) {
      isFlyingRef.current = true;
      prevPlanetIdRef.current = selectedPlanet.id;
      const mesh = meshMapRef.current.get(selectedPlanet.id);
      if (mesh) {
        mesh.getWorldPosition(vPlanetPos);
        vPrevPlanetPos.copy(vPlanetPos);

        const isMoon = selectedPlanet.type === "moon";
        const isDwarf = selectedPlanet.type === "dwarf_planet";

        const safeDistance = Math.max(
          selectedPlanet.scaledRadius *
            (selectedPlanet.id === "saturn"
              ? 5.2
              : selectedPlanet.id === "sun"
              ? 3.2
              : isMoon
              ? 3.5
              : isDwarf
              ? 3.8
              : 4.0),
          isMoon ? 0.9 : isDwarf ? 1.5 : 3.5
        );

        vOffset.copy(camera.position).sub(vPlanetPos);
        if (vOffset.lengthSq() < 0.001) {
          vOffset.set(0, safeDistance * 0.4, safeDistance);
        }
        vOffset.y = Math.max(vOffset.y, safeDistance * 0.3);
        vOffset.normalize().multiplyScalar(safeDistance);
      }
    } else if (prevPlanetIdRef.current !== null) {
      // Transitioning back to global overview
      isFlyingRef.current = true;
      prevPlanetIdRef.current = null;
    }
  }, [selectedPlanet, resetTrigger, camera, meshMapRef]);

  // Cancel active flight animation if user manually moves or rotates the camera
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      if (isFlyingRef.current) {
        isFlyingRef.current = false;
        if (selectedPlanet) {
          const mesh = meshMapRef.current.get(selectedPlanet.id);
          if (mesh) {
            mesh.getWorldPosition(vPrevPlanetPos);
          }
        }
      }
    };
    controls.addEventListener("start", onStart);
    return () => {
      controls.removeEventListener("start", onStart);
    };
  }, [controlsRef, selectedPlanet, meshMapRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const dt = Math.min(delta, 0.1);

    if (isCinematicMode) {
      cinematicAngleRef.current += dt * 0.14;
      const angle = cinematicAngleRef.current;

      if (selectedPlanet) {
        const mesh = meshMapRef.current.get(selectedPlanet.id);
        if (mesh) {
          mesh.getWorldPosition(vPlanetPos);
          vPrevPlanetPos.copy(vPlanetPos);

          const isMoon = selectedPlanet.type === "moon";
          const isDwarf = selectedPlanet.type === "dwarf_planet";
          const orbitDist = Math.max(
            selectedPlanet.scaledRadius *
              (selectedPlanet.id === "saturn"
                ? 5.5
                : selectedPlanet.id === "sun"
                ? 3.4
                : isMoon
                ? 3.6
                : isDwarf
                ? 4.0
                : 4.2),
            isMoon ? 1.0 : isDwarf ? 1.6 : 3.8
          );

          const camX = vPlanetPos.x + Math.sin(angle) * orbitDist;
          const camZ = vPlanetPos.z + Math.cos(angle) * orbitDist;
          const camY =
            vPlanetPos.y +
            Math.sin(angle * 0.5) * (orbitDist * 0.22) +
            orbitDist * 0.32;

          vCamDesired.set(camX, camY, camZ);
          camera.position.lerp(vCamDesired, 1 - Math.exp(-3.5 * dt));
          if (controls) {
            controls.target.lerp(vPlanetPos, 1 - Math.exp(-4 * dt));
            controls.update();
          }
        }
      } else {
        // Panoramic cinematic overview of entire solar system
        const overviewDist = 95;
        const camX = Math.sin(angle * 0.2) * overviewDist;
        const camZ = Math.cos(angle * 0.2) * overviewDist;
        const camY = 38 + Math.sin(angle * 0.8) * 12;

        vCamDesired.set(camX, camY, camZ);
        camera.position.lerp(vCamDesired, 1 - Math.exp(-2.5 * dt));
        if (controls) {
          controls.target.lerp(DEFAULT_TARGET_POS, 1 - Math.exp(-3 * dt));
          controls.update();
        }
      }
      return;
    }

    if (selectedPlanet) {
      const mesh = meshMapRef.current.get(selectedPlanet.id);
      if (!mesh) return;

      mesh.getWorldPosition(vPlanetPos);

      if (isFlyingRef.current) {
        vCamDesired.copy(vPlanetPos).add(vOffset);

        const t = 1 - Math.exp(-4.5 * dt);
        camera.position.lerp(vCamDesired, t);
        if (controls) {
          controls.target.lerp(vPlanetPos, t);
          controls.update();
        }

        const targetDist = controls ? controls.target.distanceTo(vPlanetPos) : 0;
        const camDist = camera.position.distanceTo(vCamDesired);

        if (targetDist < 0.08 && camDist * 0.5 < 0.1) {
          isFlyingRef.current = false;
          if (controls) {
            controls.target.copy(vPlanetPos);
            controls.update();
          }
          vPrevPlanetPos.copy(vPlanetPos);
        }
      } else {
        // Smoothly track orbiting planet / moon translation in world space
        vPlanetDelta.copy(vPlanetPos).sub(vPrevPlanetPos);
        camera.position.add(vPlanetDelta);
        if (controls) {
          controls.target.add(vPlanetDelta);
          controls.update();
        }
        vPrevPlanetPos.copy(vPlanetPos);
      }
    } else if (isFlyingRef.current) {
      const t = 1 - Math.exp(-4 * dt);
      camera.position.lerp(DEFAULT_CAM_POS, t);
      if (controls) {
        controls.target.lerp(DEFAULT_TARGET_POS, t);
        controls.update();
      }

      const targetDist = controls ? controls.target.distanceTo(DEFAULT_TARGET_POS) : 0;
      const camDist = camera.position.distanceTo(DEFAULT_CAM_POS);

      if (targetDist < 0.08 && camDist < 0.15) {
        isFlyingRef.current = false;
        camera.position.copy(DEFAULT_CAM_POS);
        if (controls) {
          controls.target.copy(DEFAULT_TARGET_POS);
          controls.update();
        }
      }
    }
  });

  return null;
}

interface SolarSceneProps {
  selectedPlanet: CelestialBodyData | null;
  onSelectPlanet: (planet: CelestialBodyData | null) => void;
  speedMultiplier: number;
  resetTrigger?: number;
  isCinematicMode?: boolean;
}

export function SolarScene({
  selectedPlanet,
  onSelectPlanet,
  speedMultiplier,
  resetTrigger,
  isCinematicMode = false,
}: SolarSceneProps) {
  const meshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  const handleRegisterMesh = useCallback((id: string, obj: THREE.Object3D | null) => {
    if (obj) {
      meshMapRef.current.set(id, obj);
    } else {
      meshMapRef.current.delete(id);
    }
  }, []);

  return (
    <div className="relative h-full w-full bg-[#09090b]">
      <Canvas
        camera={{ position: [0, 50, 85], fov: 45, near: 0.1, far: 2000 }}
        dpr={[1, 1.5]}
        onPointerDown={(e) => {
          // If clicked directly on the canvas background, deselect
          if (e.target === e.currentTarget) {
            onSelectPlanet(null);
          }
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#09090b"]} />

        <Suspense fallback={null}>
          <CameraController
            selectedPlanet={selectedPlanet}
            resetTrigger={resetTrigger}
            meshMapRef={meshMapRef}
            controlsRef={controlsRef}
            isCinematicMode={isCinematicMode}
          />

          {/* Ambient Cosmic Illumination */}
          <ambientLight intensity={0.2} />

          {/* Deep Space Background Stars */}
          <Stars
            radius={350}
            depth={80}
            count={12000}
            factor={6}
            saturation={0}
            fade
            speed={0.6}
          />

          {/* Render Orbit Rings for Heliocentric Bodies */}
          {heliocentricBodies.map((body) => (
            <OrbitLine
              key={`orbit-${body.id}`}
              radius={body.scaledDistance}
              highlighted={selectedPlanet?.id === body.id}
            />
          ))}

          {/* Render Sun, Planets and Dwarf Planets (with their hierarchical moons) */}
          {heliocentricBodies.map((body) => (
            <CelestialBody
              key={body.id}
              data={body}
              isSelected={selectedPlanet?.id === body.id}
              selectedBodyId={selectedPlanet?.id}
              moons={moonsByParent[body.id] || []}
              onSelect={onSelectPlanet}
              speedMultiplier={speedMultiplier}
              onRegisterMesh={handleRegisterMesh}
            />
          ))}

          {/* 3D Navigation Controls */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={0.4}
            maxDistance={650}
            rotateSpeed={0.8}
            zoomSpeed={0.8}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
