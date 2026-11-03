"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Pause, Orbit, AlertTriangle, ArrowLeft, RefreshCw, RotateCcw } from "lucide-react";
import { CelestialBodyData } from "@/lib/types";
import planetsRaw from "@/data/planets.json";
import moonsAndDwarfsRaw from "@/data/moons_and_dwarfs.json";
import { PlanetInfoOverlay } from "./PlanetInfoOverlay";

const planets = planetsRaw as CelestialBodyData[];
const moonsAndDwarfs = moonsAndDwarfsRaw as CelestialBodyData[];
const dwarfPlanets = moonsAndDwarfs.filter((b) => b.type === "dwarf_planet");
const heliocentricBodies = [...planets, ...dwarfPlanets].sort(
  (a, b) => a.scaledDistance - b.scaledDistance
);

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

// Dynamic import of SolarScene to ensure client-only WebGL initialization
const DynamicSolarScene = dynamic(
  () => import("./SolarScene").then((mod) => mod.SolarScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#09090b] text-white">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <Orbit className="h-12 w-12 animate-spin text-white/80" />
          <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin" />
        </div>
        <p className="mt-4 text-sm font-medium tracking-widest uppercase text-zinc-400">
          Inicjalizacja silnika 3D & WebGL...
        </p>
      </div>
    ),
  }
);

const emptySubscribe = () => () => {};

export function SolarViewer() {
  const [selectedPlanet, setSelectedPlanet] = useState<CelestialBodyData | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [resetCameraTrigger, setResetCameraTrigger] = useState<number>(0);
  const webglSupported = useSyncExternalStore(
    emptySubscribe,
    () => isWebGLAvailable(),
    () => true
  );

  if (webglSupported === false) {
    return (
      <div className="relative flex h-[calc(100dvh-4rem)] min-h-[480px] w-full flex-col items-center justify-center bg-[#09090b] p-6 text-center">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-xl shadow-rose-500/10 mb-6">
          <AlertTriangle className="h-10 w-10 animate-pulse" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3">
          Wymagana obsługa WebGL i akceleracja sprzętowa
        </h2>

        <p className="max-w-md text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
          Twoja przeglądarka lub karta graficzna nie udostępnia aktywnego kontekstu WebGL. Interaktywna trójwymiarowa wizualizacja Układu Słonecznego wymaga akceleracji graficznej.
        </p>

        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400 mb-8 text-left space-y-2">
          <div className="font-semibold text-zinc-200">Jak włączyć WebGL?</div>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>
              Upewnij się, że w ustawieniach przeglądarki włączona jest opcja <em>„Używaj akceleracji sprzętowej, gdy jest dostępna”</em>.
            </li>
            <li>
              Zaktualizuj sterowniki karty graficznej lub spróbuj uruchomić stronę w innej przeglądarce.
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 hover:bg-zinc-200 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Wróć do Dashboardu</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Odśwież stronę</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[480px] w-full overflow-hidden bg-[#09090b] select-none touch-none">
      {/* 3D WebGL Canvas */}
      <DynamicSolarScene
        selectedPlanet={selectedPlanet}
        onSelectPlanet={setSelectedPlanet}
        speedMultiplier={speedMultiplier}
        resetTrigger={resetCameraTrigger}
      />

      {/* Top Left Title & Controls Overlay */}
      <div className="pointer-events-none absolute left-3 top-3 right-3 sm:right-auto sm:left-6 sm:top-6 z-10 flex flex-col gap-2 sm:gap-3">
        <div className="pointer-events-auto rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-950/80 p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
              <h1 className="text-sm sm:text-lg font-bold tracking-wide text-white">
                Układ Słoneczny 3D
              </h1>
            </div>
            {/* Speed indicator on mobile inside header */}
            <span className="sm:hidden text-[10px] font-mono text-zinc-300 bg-white/10 px-2 py-0.5 rounded border border-white/15">
              {speedMultiplier === 0 ? "Pauza" : `${speedMultiplier}x`}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-xs hidden sm:block">
            Interaktywna symulacja na podstawie danych NASA Solar System Exploration.
          </p>

          {/* Time speed controls */}
          <div className="mt-2 sm:mt-3 flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 border-t border-white/10 pt-2 sm:pt-3">
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 mr-0.5 sm:mr-1">Prędkość:</span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => setSpeedMultiplier(0)}
                className={`rounded-md p-1 sm:p-1.5 text-xs transition-colors ${
                  speedMultiplier === 0
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
                title="Pauza"
              >
                <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
              <button
                onClick={() => setSpeedMultiplier(1)}
                className={`rounded-md px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-colors ${
                  speedMultiplier === 1
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setSpeedMultiplier(5)}
                className={`rounded-md px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-colors ${
                  speedMultiplier === 5
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                5x
              </button>
              <button
                onClick={() => setSpeedMultiplier(15)}
                className={`rounded-md px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-colors ${
                  speedMultiplier === 15
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                15x
              </button>
            </div>
          </div>

          {/* Reset Camera View button */}
          <div className="mt-2 sm:mt-2.5 border-t border-white/10 pt-2 sm:pt-2.5">
            <button
              onClick={() => {
                setSelectedPlanet(null);
                setResetCameraTrigger((prev) => prev + 1);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
              title="Zresetuj pozycję kamery do widoku całego Układu Słonecznego"
            >
              <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-300" />
              <span>Resetuj widok kamery</span>
            </button>
          </div>
        </div>

        {/* Navigation Hint - Desktop only */}
        <div className="pointer-events-auto hidden sm:block rounded-xl border border-white/5 bg-zinc-950/60 px-3 py-2 text-[11px] text-zinc-400 backdrop-blur-md">
          <span>🖱 LPM: Obracanie • PPM: Przesuwanie • Scroll: Zoom</span>
        </div>
      </div>

      {/* Bottom Planet Quick-Selector Bar */}
      <div
        className={`pointer-events-none absolute bottom-3 sm:bottom-6 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-10 flex justify-center px-2 sm:px-4 ${
          selectedPlanet ? "hidden sm:flex" : "flex"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/10 bg-zinc-950/80 p-1 sm:p-1.5 shadow-2xl backdrop-blur-xl max-w-full overflow-x-auto scrollbar-none touch-pan-x">
          {heliocentricBodies.map((body) => {
            const isSelected = selectedPlanet?.id === body.id;
            const isDwarf = body.type === "dwarf_planet";
            return (
              <button
                key={body.id}
                onClick={() => setSelectedPlanet(body)}
                className={`shrink-0 flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-white text-black font-semibold shadow-md shadow-white/10"
                    : "text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: body.colorHex }}
                />
                <span>{body.name.pl}</span>
                {isDwarf && (
                  <span className="text-[9px] opacity-75 font-normal">
                    (karłowata)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Planet HUD Panel */}
      <PlanetInfoOverlay
        planet={selectedPlanet}
        onClose={() => setSelectedPlanet(null)}
        onSelectPlanet={setSelectedPlanet}
      />
    </div>
  );
}
