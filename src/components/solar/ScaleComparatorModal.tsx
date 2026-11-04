"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Scale,
  ArrowRightLeft,
  ChevronRight,
} from "lucide-react";
import { CelestialBodyData } from "@/lib/types";
import planetsRaw from "@/data/planets.json";
import moonsAndDwarfsRaw from "@/data/moons_and_dwarfs.json";

const planets = planetsRaw as CelestialBodyData[];
const moonsAndDwarfs = moonsAndDwarfsRaw as CelestialBodyData[];
export const ALL_SOLAR_BODIES: CelestialBodyData[] = [...planets, ...moonsAndDwarfs];

// Reference physical parameters for bodies (mass in kg, surface gravity in m/s²)
export interface BodyPhysics {
  massKg: number;
  massExp: string;
  gravityMss: number;
  gravityEarthRatio: number;
}

const BODY_PHYSICS: Record<string, BodyPhysics> = {
  sun: {
    massKg: 1.989e30,
    massExp: "1.989 × 10³⁰",
    gravityMss: 274.0,
    gravityEarthRatio: 27.94,
  },
  mercury: {
    massKg: 3.3011e23,
    massExp: "3.301 × 10²³",
    gravityMss: 3.7,
    gravityEarthRatio: 0.38,
  },
  venus: {
    massKg: 4.8675e24,
    massExp: "4.868 × 10²⁴",
    gravityMss: 8.87,
    gravityEarthRatio: 0.904,
  },
  earth: {
    massKg: 5.9722e24,
    massExp: "5.972 × 10²⁴",
    gravityMss: 9.807,
    gravityEarthRatio: 1.0,
  },
  mars: {
    massKg: 6.4171e23,
    massExp: "6.417 × 10²³",
    gravityMss: 3.72,
    gravityEarthRatio: 0.379,
  },
  jupiter: {
    massKg: 1.8982e27,
    massExp: "1.898 × 10²⁷",
    gravityMss: 24.79,
    gravityEarthRatio: 2.528,
  },
  saturn: {
    massKg: 5.6834e26,
    massExp: "5.683 × 10²⁶",
    gravityMss: 10.44,
    gravityEarthRatio: 1.065,
  },
  uranus: {
    massKg: 8.681e25,
    massExp: "8.681 × 10²⁵",
    gravityMss: 8.69,
    gravityEarthRatio: 0.886,
  },
  neptune: {
    massKg: 1.0241e26,
    massExp: "1.024 × 10²⁶",
    gravityMss: 11.15,
    gravityEarthRatio: 1.137,
  },
  pluto: {
    massKg: 1.303e22,
    massExp: "1.303 × 10²²",
    gravityMss: 0.62,
    gravityEarthRatio: 0.063,
  },
  ceres: {
    massKg: 9.383e20,
    massExp: "9.383 × 10²⁰",
    gravityMss: 0.27,
    gravityEarthRatio: 0.028,
  },
  moon: {
    massKg: 7.342e22,
    massExp: "7.342 × 10²²",
    gravityMss: 1.62,
    gravityEarthRatio: 0.165,
  },
  io: {
    massKg: 8.932e22,
    massExp: "8.932 × 10²²",
    gravityMss: 1.796,
    gravityEarthRatio: 0.183,
  },
  europa: {
    massKg: 4.8e22,
    massExp: "4.800 × 10²²",
    gravityMss: 1.315,
    gravityEarthRatio: 0.134,
  },
  ganymede: {
    massKg: 1.4819e23,
    massExp: "1.482 × 10²³",
    gravityMss: 1.428,
    gravityEarthRatio: 0.146,
  },
  callisto: {
    massKg: 1.0759e23,
    massExp: "1.076 × 10²³",
    gravityMss: 1.235,
    gravityEarthRatio: 0.126,
  },
  titan: {
    massKg: 1.3452e23,
    massExp: "1.345 × 10²³",
    gravityMss: 1.352,
    gravityEarthRatio: 0.138,
  },
  enceladus: {
    massKg: 1.08e20,
    massExp: "1.080 × 10²⁰",
    gravityMss: 0.113,
    gravityEarthRatio: 0.012,
  },
  charon: {
    massKg: 1.586e21,
    massExp: "1.586 × 10²¹",
    gravityMss: 0.288,
    gravityEarthRatio: 0.029,
  },
};

export function getBodyPhysics(body: CelestialBodyData): BodyPhysics {
  if (BODY_PHYSICS[body.id]) {
    return BODY_PHYSICS[body.id];
  }
  // Estimated fallback based on mean silicate density ~ 3.5 g/cm3
  const rMeters = body.realRadiusKm * 1000;
  const volM3 = (4 / 3) * Math.PI * Math.pow(rMeters, 3);
  const approxMass = volM3 * 3500;
  const G = 6.6743e-11;
  const approxG = (G * approxMass) / Math.pow(rMeters, 2);
  return {
    massKg: approxMass,
    massExp: approxMass.toExponential(2).replace("e+", " × 10"),
    gravityMss: parseFloat(approxG.toFixed(2)),
    gravityEarthRatio: parseFloat((approxG / 9.807).toFixed(3)),
  };
}

interface ScaleComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanet?: CelestialBodyData | null;
  onSelectPlanet?: (planet: CelestialBodyData) => void;
}

export function ScaleComparatorModal({
  isOpen,
  onClose,
  initialPlanet,
  onSelectPlanet,
}: ScaleComparatorModalProps) {
  const earth = useMemo(
    () => ALL_SOLAR_BODIES.find((b) => b.id === "earth") || ALL_SOLAR_BODIES[3],
    []
  );
  const sun = useMemo(
    () => ALL_SOLAR_BODIES.find((b) => b.id === "sun") || ALL_SOLAR_BODIES[0],
    []
  );

  const [selectedIdA, setSelectedIdA] = useState<string | null>(null);
  const [selectedIdB, setSelectedIdB] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<"linear" | "normalized">("linear");

  const bodyIdA = selectedIdA ?? (initialPlanet?.id || "earth");
  const bodyIdB = selectedIdB ?? (bodyIdA === "earth" ? "sun" : "earth");

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bodyA = ALL_SOLAR_BODIES.find((b) => b.id === bodyIdA) || earth;
  const bodyB = ALL_SOLAR_BODIES.find((b) => b.id === bodyIdB) || sun;

  const physicsA = getBodyPhysics(bodyA);
  const physicsB = getBodyPhysics(bodyB);

  // Radius ratio
  const radiusRatio = bodyA.realRadiusKm / bodyB.realRadiusKm;
  // Volume ratio = (rA / rB)^3
  const volumeRatio = Math.pow(radiusRatio, 3);
  // Mass ratio
  const massRatio = physicsA.massKg / physicsB.massKg;
  // Gravity ratio
  const gravityRatio = physicsA.gravityMss / physicsB.gravityMss;

  const handleSwap = () => {
    const curA = bodyIdA;
    const curB = bodyIdB;
    setSelectedIdA(curB);
    setSelectedIdB(curA);
  };

  // Rendering scales
  const maxR = Math.max(bodyA.realRadiusKm, bodyB.realRadiusKm);

  // Pixels for visual spheres: Container max diameter is 180px
  const maxDiameterPx = 180;
  const diameterA =
    scaleMode === "linear"
      ? Math.max(4, (bodyA.realRadiusKm / maxR) * maxDiameterPx)
      : 130;
  const diameterB =
    scaleMode === "linear"
      ? Math.max(4, (bodyB.realRadiusKm / maxR) * maxDiameterPx)
      : 130;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scale-comparator-title"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-white/15 bg-zinc-950 p-4 sm:p-6 text-zinc-100 shadow-2xl overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="scale-comparator-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-white"
              >
                Porównywarka Skali Ciał Niebieskich
              </h2>
              <p className="text-xs text-zinc-400">
                Prawdziwe proporcje geometryczne, masa i grawitacja wg danych NASA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij okno porównania"
            className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick presets & body selectors */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Body A Selector */}
          <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Ciało A
              </span>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: bodyA.colorHex }}
              />
            </div>
            <select
              value={bodyIdA}
              onChange={(e) => setSelectedIdA(e.target.value)}
              aria-label="Wybierz pierwsze ciało niebieskie"
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-white"
            >
              {ALL_SOLAR_BODIES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name.pl} ({b.name.en}) — {b.type}
                </option>
              ))}
            </select>
          </div>

          {/* Body B Selector */}
          <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Ciało B (Referencyjne)
                </span>
                <button
                  onClick={handleSwap}
                  title="Zamień kolejność ciał"
                  className="rounded-md p-0.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </button>
              </div>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: bodyB.colorHex }}
              />
            </div>
            <select
              value={bodyIdB}
              onChange={(e) => setSelectedIdB(e.target.value)}
              aria-label="Wybierz drugie ciało niebieskie"
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-white"
            >
              {ALL_SOLAR_BODIES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name.pl} ({b.name.en}) — {b.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick preset buttons */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] font-medium mr-1">Szybki cel B:</span>
          <button
            onClick={() => setSelectedIdB("earth")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              bodyIdB === "earth"
                ? "bg-white text-black font-semibold"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            vs Ziemia
          </button>
          <button
            onClick={() => setSelectedIdB("sun")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              bodyIdB === "sun"
                ? "bg-white text-black font-semibold"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            vs Słońce
          </button>
          <button
            onClick={() => setSelectedIdB("jupiter")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              bodyIdB === "jupiter"
                ? "bg-white text-black font-semibold"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            vs Jowisz
          </button>
          <button
            onClick={() => setSelectedIdB("moon")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              bodyIdB === "moon"
                ? "bg-white text-black font-semibold"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            vs Księżyc
          </button>

          <div className="ml-auto flex items-center gap-1 border-l border-white/10 pl-2">
            <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">Tryb widoku:</span>
            <button
              onClick={() => setScaleMode("linear")}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                scaleMode === "linear"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Skala 1:1 zachowująca rzeczywiste proporcje promienia"
            >
              Skala 1:1
            </button>
            <button
              onClick={() => setScaleMode("normalized")}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                scaleMode === "normalized"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Zbliżenie i wyrównany rozmiar do porównania tekstur i detali"
            >
              Wyrównany
            </button>
          </div>
        </div>

        {/* Visual Dual Orb Comparison Canvas */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
          {/* Background star dust effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent pointer-events-none" />

          <div className="grid grid-cols-2 w-full gap-4 items-center z-10">
            {/* Body A Sphere */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-[180px] w-full flex items-center justify-center relative">
                <div
                  className="rounded-full shadow-2xl transition-all duration-300 relative flex items-center justify-center"
                  style={{
                    width: `${diameterA}px`,
                    height: `${diameterA}px`,
                    backgroundColor: bodyA.colorHex,
                    boxShadow: `0 0 35px ${bodyA.colorHex}33, inset -8px -8px 24px rgba(0,0,0,0.85)`,
                  }}
                >
                  {/* Subtle surface specular highlight */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
                  {/* If very small in 1:1 linear mode, add ring indicator */}
                  {diameterA < 10 && scaleMode === "linear" && (
                    <div className="absolute -inset-2.5 rounded-full border border-dashed border-white/60 animate-ping opacity-60" />
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="font-bold text-white text-sm sm:text-base">
                  {bodyA.name.pl}
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  R = {bodyA.realRadiusKm.toLocaleString("pl-PL")} km
                </div>
              </div>
            </div>

            {/* Body B Sphere */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-[180px] w-full flex items-center justify-center relative">
                <div
                  className="rounded-full shadow-2xl transition-all duration-300 relative flex items-center justify-center"
                  style={{
                    width: `${diameterB}px`,
                    height: `${diameterB}px`,
                    backgroundColor: bodyB.colorHex,
                    boxShadow: `0 0 35px ${bodyB.colorHex}33, inset -8px -8px 24px rgba(0,0,0,0.85)`,
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
                  {diameterB < 10 && scaleMode === "linear" && (
                    <div className="absolute -inset-2.5 rounded-full border border-dashed border-white/60 animate-ping opacity-60" />
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="font-bold text-white text-sm sm:text-base">
                  {bodyB.name.pl}
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  R = {bodyB.realRadiusKm.toLocaleString("pl-PL")} km
                </div>
              </div>
            </div>
          </div>

          {/* Quick takeaway summary text */}
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-center text-xs text-zinc-300 w-full max-w-xl z-10 font-mono">
            {radiusRatio >= 1 ? (
              <span>
                <strong>{bodyA.name.pl}</strong> ma promień{" "}
                <strong>{radiusRatio.toFixed(2)}×</strong> większy oraz objętość{" "}
                <strong>
                  {volumeRatio > 1000000
                    ? `${(volumeRatio / 1000000).toFixed(2)} mln×`
                    : `${volumeRatio.toFixed(1)}×`}
                </strong>{" "}
                większą niż {bodyB.name.pl}.
              </span>
            ) : (
              <span>
                <strong>{bodyA.name.pl}</strong> ma promień stanowiący zaledwie{" "}
                <strong>{(radiusRatio * 100).toFixed(2)}%</strong> promienia{" "}
                {bodyB.name.pl} ({bodyB.name.pl} pomieściłoby{" "}
                <strong>
                  {(1 / volumeRatio) > 1000000
                    ? `${((1 / volumeRatio) / 1000000).toFixed(2)} mln`
                    : Math.round(1 / volumeRatio).toLocaleString("pl-PL")}
                </strong>{" "}
                takich obiektów).
              </span>
            )}
          </div>
        </div>

        {/* Detailed Comparative Table */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/40 overflow-hidden">
          <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span>Parametr fizyczny</span>
            <div className="flex items-center gap-8 pr-2">
              <span className="w-24 text-right text-white">{bodyA.name.pl}</span>
              <span className="w-24 text-right text-zinc-400">{bodyB.name.pl}</span>
              <span className="w-24 text-right text-zinc-200">Stosunek (A / B)</span>
            </div>
          </div>

          <div className="divide-y divide-white/5 text-xs font-mono">
            {/* Promień */}
            <div className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02]">
              <span className="text-zinc-300 font-sans">Promień równikowy</span>
              <div className="flex items-center gap-8 pr-2">
                <span className="w-24 text-right text-white">
                  {bodyA.realRadiusKm.toLocaleString("pl-PL")} km
                </span>
                <span className="w-24 text-right text-zinc-400">
                  {bodyB.realRadiusKm.toLocaleString("pl-PL")} km
                </span>
                <span className="w-24 text-right font-bold text-white">
                  {radiusRatio >= 1
                    ? `${radiusRatio.toFixed(2)}×`
                    : `${(radiusRatio * 100).toFixed(1)}%`}
                </span>
              </div>
            </div>

            {/* Masa */}
            <div className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02]">
              <span className="text-zinc-300 font-sans">Masa</span>
              <div className="flex items-center gap-8 pr-2">
                <span className="w-24 text-right text-white">{physicsA.massExp} kg</span>
                <span className="w-24 text-right text-zinc-400">{physicsB.massExp} kg</span>
                <span className="w-24 text-right font-bold text-white">
                  {massRatio >= 1
                    ? `${massRatio.toFixed(2)}×`
                    : `${(massRatio * 100).toFixed(2)}%`}
                </span>
              </div>
            </div>

            {/* Grawitacja powierzchniowa */}
            <div className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02]">
              <span className="text-zinc-300 font-sans">Przyspieszenie grawitacyjne (g)</span>
              <div className="flex items-center gap-8 pr-2">
                <span className="w-24 text-right text-white">{physicsA.gravityMss} m/s²</span>
                <span className="w-24 text-right text-zinc-400">{physicsB.gravityMss} m/s²</span>
                <span className="w-24 text-right font-bold text-white">
                  {gravityRatio.toFixed(2)}×
                </span>
              </div>
            </div>

            {/* Waga 70kg człowieka */}
            <div className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] bg-white/[0.01]">
              <span className="text-zinc-300 font-sans">Ciężar astronauty (70 kg na Ziemi)</span>
              <div className="flex items-center gap-8 pr-2">
                <span className="w-24 text-right text-white">
                  {Math.round(70 * physicsA.gravityEarthRatio)} kg
                </span>
                <span className="w-24 text-right text-zinc-400">
                  {Math.round(70 * physicsB.gravityEarthRatio)} kg
                </span>
                <span className="w-24 text-right text-zinc-400">
                  {physicsA.gravityEarthRatio.toFixed(2)}g
                </span>
              </div>
            </div>

            {/* Doba */}
            <div className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02]">
              <span className="text-zinc-300 font-sans">Długość obrotu (doba)</span>
              <div className="flex items-center gap-8 pr-2">
                <span className="w-24 text-right text-white">
                  {Math.abs(bodyA.rotationPeriodHours) >= 24
                    ? `${(bodyA.rotationPeriodHours / 24).toFixed(1)} d`
                    : `${bodyA.rotationPeriodHours.toFixed(1)} h`}
                </span>
                <span className="w-24 text-right text-zinc-400">
                  {Math.abs(bodyB.rotationPeriodHours) >= 24
                    ? `${(bodyB.rotationPeriodHours / 24).toFixed(1)} d`
                    : `${bodyB.rotationPeriodHours.toFixed(1)} h`}
                </span>
                <span className="w-24 text-right text-zinc-400">—</span>
              </div>
            </div>

            {/* Rok orbitalny */}
            <div className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02]">
              <span className="text-zinc-300 font-sans">Okres orbitalny (rok)</span>
              <div className="flex items-center gap-8 pr-2">
                <span className="w-24 text-right text-white">
                  {bodyA.orbitalPeriodDays > 365
                    ? `${(bodyA.orbitalPeriodDays / 365.25).toFixed(1)} lat`
                    : `${bodyA.orbitalPeriodDays.toFixed(1)} d`}
                </span>
                <span className="w-24 text-right text-zinc-400">
                  {bodyB.orbitalPeriodDays > 365
                    ? `${(bodyB.orbitalPeriodDays / 365.25).toFixed(1)} lat`
                    : `${bodyB.orbitalPeriodDays.toFixed(1)} d`}
                </span>
                <span className="w-24 text-right text-zinc-400">—</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            Wskazówka: Naciśnij <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Esc</kbd> aby zamknąć
          </div>

          <div className="flex items-center gap-2">
            {onSelectPlanet && bodyA && (
              <button
                onClick={() => {
                  onSelectPlanet(bodyA);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all active:scale-95"
              >
                <span>Skocz do {bodyA.name.pl} w 3D</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
