"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  Compass,
  Layers,
  Clock,
  MapPin,
  Plus,
  Minus,
  Sparkles,
  Telescope,
  Info,
} from "lucide-react";
import { SkyMapPlanisphere2D } from "@/components/skymap/SkyMapPlanisphere2D";
import { StarInfoCard } from "@/components/skymap/StarInfoCard";
import { StarData, DeepSkyObject, SkyMapCatalog } from "@/lib/types";
import rawSkyMap from "@/data/skymap_data.json";
import { getLocalSiderealTime, equatorialToHorizontal } from "@/lib/astronomyMath";

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

// Dynamic import for 3D Viewer to disable SSR (Three.js WebGL canvas)
const SkyMapViewer3D = dynamic(
  () =>
    import("@/components/skymap/SkyMapViewer3D").then(
      (mod) => mod.SkyMapViewer3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <span className="font-mono text-xs text-zinc-400">
            Inicjalizacja sfery niebieskiej 3D...
          </span>
        </div>
      </div>
    ),
  }
);

interface CityConfig {
  id: string;
  name: string;
  lat: number;
  lon: number;
  coords: string;
}

const CITIES: CityConfig[] = [
  {
    id: "warszawa",
    name: "Warszawa (Centrum)",
    lat: 52.23,
    lon: 21.01,
    coords: "52.23°N, 21.01°E",
  },
  {
    id: "gdansk",
    name: "Gdańsk (Północ)",
    lat: 54.35,
    lon: 18.65,
    coords: "54.35°N, 18.65°E",
  },
  {
    id: "krakow",
    name: "Kraków (Południe)",
    lat: 50.06,
    lon: 19.94,
    coords: "50.06°N, 19.94°E",
  },
];

const catalog = rawSkyMap as unknown as SkyMapCatalog;

const BASELINE_DATE = new Date("2026-11-03T21:00:00Z");

export default function SkyMapPage() {
  const webglSupported = useSyncExternalStore(
    emptySubscribe,
    () => isWebGLAvailable(),
    () => true
  );

  const [userViewMode, setUserViewMode] = useState<"3D" | "2D" | null>(null);
  const viewMode: "3D" | "2D" = userViewMode ?? (webglSupported === false ? "2D" : "3D");
  const setViewMode = (mode: "3D" | "2D") => setUserViewMode(mode);

  const [selectedCityId, setSelectedCityId] = useState<string>("warszawa");
  const [simulatedTime, setSimulatedTime] = useState<Date>(BASELINE_DATE);
  const [isLive, setIsLive] = useState<boolean>(true);

  // Initialize client time on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setSimulatedTime(new Date());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Layers
  const [showConstellations, setShowConstellations] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showDso, setShowDso] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Selection
  const [selectedObject, setSelectedObject] = useState<{
    type: "star" | "dso" | "constellation";
    data: StarData | DeepSkyObject | { con: string; stars: StarData[] };
  } | null>(null);

  // Live timer interval
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setSimulatedTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isLive]);

  const activeCity = useMemo(
    () => CITIES.find((c) => c.id === selectedCityId) || CITIES[0],
    [selectedCityId]
  );

  // Calculate Local Sidereal Time and horizontal Alt/Az coordinates
  const { lstHours, starsWithHorizontal, dsoWithHorizontal, visibleStarsCount, visibleDsoCount } =
    useMemo(() => {
      const lst = getLocalSiderealTime(simulatedTime, activeCity.lon);

      const stars = catalog.stars.map((star) => {
        const horiz = equatorialToHorizontal(
          { ra: star.ra, dec: star.dec },
          activeCity.lat,
          lst
        );
        return {
          ...star,
          horizontal: horiz,
        };
      });

      const dso = catalog.deepSkyObjects.map((obj) => {
        const horiz = equatorialToHorizontal(
          { ra: obj.ra, dec: obj.dec },
          activeCity.lat,
          lst
        );
        return {
          ...obj,
          horizontal: horiz,
        };
      });

      const vStars = stars.filter((s) => s.horizontal && s.horizontal.alt > 0).length;
      const vDso = dso.filter((d) => d.horizontal && d.horizontal.alt > 0).length;

      return {
        lstHours: lst,
        starsWithHorizontal: stars,
        dsoWithHorizontal: dso,
        visibleStarsCount: vStars,
        visibleDsoCount: vDso,
      };
    }, [simulatedTime, activeCity]);

  // Brightest currently visible star
  const brightestVisibleStar = useMemo(() => {
    const visible = starsWithHorizontal.filter(
      (s) => s.horizontal && s.horizontal.alt > 0
    );
    if (!visible.length) return null;
    return visible.reduce((min, s) => (s.mag < min.mag ? s : min), visible[0]);
  }, [starsWithHorizontal]);

  // Time controls
  const handleLiveNow = useCallback(() => {
    setIsLive(true);
    setSimulatedTime(new Date());
  }, []);

  const handleShiftTime = useCallback((hours: number) => {
    setIsLive(false);
    setSimulatedTime((prev) => new Date(prev.getTime() + hours * 3600 * 1000));
  }, []);

  const handleSetHour = useCallback((hour: number) => {
    setIsLive(false);
    setSimulatedTime((prev) => {
      const next = new Date(prev);
      next.setHours(hour, 0, 0, 0);
      return next;
    });
  }, []);

  // Format LST string (HH:MM)
  const formattedLst = useMemo(() => {
    const h = Math.floor(lstHours);
    const m = Math.floor((lstHours - h) * 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  }, [lstHours]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Top Header & View Switcher */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 sm:px-6 py-4 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                <Sparkles className="h-3 w-3" /> Galacti v0.5.0
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-xs text-zinc-400 font-mono">
                Polska Sfera Niebieska
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Interaktywna Mapa Nieba
            </h1>
            <p className="text-xs text-zinc-400">
              Wizualizacja sfery niebieskiej 2D/3D z przeliczaniem współrzędnych horyzontalnych (Alt/Az) w czasie rzeczywistym.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
              <button
                onClick={() => setViewMode("3D")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "3D"
                    ? "bg-white text-black shadow-md font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
                title={webglSupported === false ? "Wymaga akceleracji WebGL" : "Widok Sfery 3D"}
              >
                <Telescope className="h-3.5 w-3.5" />
                <span>Sfera 3D</span>
                {webglSupported === false && (
                  <span className="text-[10px] text-zinc-500 font-mono">(Brak WebGL)</span>
                )}
              </button>
              <button
                onClick={() => setViewMode("2D")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "2D"
                    ? "bg-white text-black shadow-md font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Planisfera 2D
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/60 px-4 sm:px-6 py-2.5 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Location Selector */}
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-mono">Lokalizacja:</span>
            <div className="flex gap-1">
              {CITIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCityId(c.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedCityId === c.id
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
            <span className="hidden lg:inline text-[11px] font-mono text-zinc-500 pl-1">
              ({activeCity.coords})
            </span>
          </div>

          {/* Time Controls */}
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <button
              onClick={handleLiveNow}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isLive
                  ? "bg-zinc-100 text-black font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                }`}
              />
              Teraz
            </button>
            <div className="flex items-center border border-zinc-800 rounded-md overflow-hidden bg-zinc-900">
              <button
                onClick={() => handleShiftTime(-1)}
                title="Cofnij o 1 godzinę"
                className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center"
              >
                <Minus className="h-3 w-3" />
                <span className="text-[10px] font-mono">1h</span>
              </button>
              <button
                onClick={() => handleShiftTime(1)}
                title="W przód o 1 godzinę"
                className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center border-l border-zinc-800"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[10px] font-mono">1h</span>
              </button>
            </div>
            <div className="hidden sm:flex gap-1">
              <button
                onClick={() => handleSetHour(22)}
                className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300"
              >
                22:00
              </button>
              <button
                onClick={() => handleSetHour(2)}
                className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300"
              >
                02:00
              </button>
            </div>
            <span className="font-mono text-[11px] text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
              {simulatedTime.toLocaleTimeString("pl-PL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Layer Toggles */}
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowConstellations((v) => !v)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showConstellations
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Przełącz linie gwiazdozbiorów"
              >
                Gwiazdozbiory
              </button>
              <button
                onClick={() => setShowLabels((v) => !v)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showLabels
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Przełącz etykiety i nazwy"
              >
                Etykiety
              </button>
              <button
                onClick={() => setShowDso((v) => !v)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showDso
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Przełącz obiekty Messiera (DSO)"
              >
                DSO
              </button>
              <button
                onClick={() => setShowGrid((v) => !v)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showGrid
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Przełącz siatkę współrzędnych"
              >
                Siatka
              </button>
              <button
                onClick={() => setShowHorizon((v) => !v)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  showHorizon
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Przełącz dysk i linię horyzontu"
              >
                Horyzont
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative flex-1 w-full h-[calc(100vh-12rem)] min-h-[550px] bg-zinc-950 overflow-hidden">
        {viewMode === "3D" ? (
          <SkyMapViewer3D
            stars={starsWithHorizontal}
            constellationLines={catalog.constellationLines}
            deepSkyObjects={dsoWithHorizontal}
            showConstellations={showConstellations}
            showLabels={showLabels}
            showDso={showDso}
            showHorizon={showHorizon}
            showGrid={showGrid}
            onSelectObject={setSelectedObject}
            selectedId={
              selectedObject?.type === "star"
                ? (selectedObject.data as StarData).id
                : selectedObject?.type === "dso"
                ? (selectedObject.data as DeepSkyObject).id
                : undefined
            }
            onSwitchTo2D={() => setViewMode("2D")}
          />
        ) : (
          <SkyMapPlanisphere2D
            stars={starsWithHorizontal}
            constellationLines={catalog.constellationLines}
            deepSkyObjects={dsoWithHorizontal}
            showConstellations={showConstellations}
            showLabels={showLabels}
            showDso={showDso}
            showHorizon={showHorizon}
            showGrid={showGrid}
            onSelectObject={setSelectedObject}
            selectedId={
              selectedObject?.type === "star"
                ? (selectedObject.data as StarData).id
                : selectedObject?.type === "dso"
                ? (selectedObject.data as DeepSkyObject).id
                : undefined
            }
          />
        )}

        {/* Selected Object Detail Card HUD */}
        <StarInfoCard
          selectedObject={selectedObject}
          onClose={() => setSelectedObject(null)}
        />

        {/* Bottom Helper Bar & Telemetry HUD */}
        <div className="absolute left-4 bottom-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/85 px-3 py-2 text-xs backdrop-blur-md text-zinc-300">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            <span>
              {viewMode === "3D"
                ? "Przeciągnij kursorem, aby rozglądać się po niebie. Kółko myszy = zoom."
                : "Rzut planisfery: Zenit w centrum, brzeg = linia horyzontu (Alt = 0°)."}
            </span>
          </div>

          <div className="pointer-events-auto hidden sm:flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/85 px-3 py-2 text-xs font-mono backdrop-blur-md text-zinc-400">
            <div>
              LST: <span className="text-white font-semibold">{formattedLst}</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              Nad horyzontem:{" "}
              <span className="text-white font-semibold">{visibleStarsCount}</span> gwiazd,{" "}
              <span className="text-white font-semibold">{visibleDsoCount}</span> DSO
            </div>
            {brightestVisibleStar && (
              <>
                <span className="text-zinc-700">|</span>
                <div>
                  Najjaśniejsza:{" "}
                  <span className="text-white font-semibold">
                    {brightestVisibleStar.name} ({brightestVisibleStar.mag.toFixed(2)}m)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
