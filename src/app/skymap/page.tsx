"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Clock,
  MapPin,
  Plus,
  Minus,
  Sparkles,
  Search,
  Play,
  Pause,
  LocateFixed,
  Info,
  X,
  Maximize,
  Minimize,
  Keyboard,
  Crosshair,
  Target,
  Eye,
} from "lucide-react";
import { SkyMapPlanisphere2D } from "@/components/skymap/SkyMapPlanisphere2D";
import { StarInfoCard } from "@/components/skymap/StarInfoCard";
import { MobileStarBottomSheet } from "@/components/skymap/MobileStarBottomSheet";
import { MobileFloatingDock } from "@/components/skymap/MobileFloatingDock";
import { KeyboardShortcutsModal } from "@/components/skymap/KeyboardShortcutsModal";
import { StarData, DeepSkyObject, SkyMapCatalog, FOV_PRESETS } from "@/lib/types";
import rawSkyMap from "@/data/skymap_data.json";
import {
  getLocalSiderealTime,
  equatorialToHorizontal,
  horizontalToPlanisphere2D,
  CONSTELLATION_NAMES_PL,
} from "@/lib/astronomyMath";

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
    name: "Warszawa",
    lat: 52.23,
    lon: 21.01,
    coords: "52.23°N, 21.01°E",
  },
  {
    id: "krakow",
    name: "Kraków",
    lat: 50.06,
    lon: 19.94,
    coords: "50.06°N, 19.94°E",
  },
  {
    id: "gdansk",
    name: "Gdańsk",
    lat: 54.35,
    lon: 18.65,
    coords: "54.35°N, 18.65°E",
  },
  {
    id: "wroclaw",
    name: "Wrocław",
    lat: 51.11,
    lon: 17.03,
    coords: "51.11°N, 17.03°E",
  },
  {
    id: "poznan",
    name: "Poznań",
    lat: 52.41,
    lon: 16.93,
    coords: "52.41°N, 16.93°E",
  },
  {
    id: "bieszczady",
    name: "Bieszczady (Ciemne Niebo)",
    lat: 49.25,
    lon: 22.5,
    coords: "49.25°N, 22.50°E",
  },
];

const catalog = rawSkyMap as unknown as SkyMapCatalog;
const BASELINE_DATE = new Date("2026-11-04T21:00:00Z");

const CX = 300;
const CY = 300;
const RADIUS = 250;

function triggerHaptic(duration = 18) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // ignore
    }
  }
}

export default function SkyMapPage() {
  const [selectedCityId, setSelectedCityId] = useState<string>("warszawa");
  const [customLocation, setCustomLocation] = useState<CityConfig | null>(null);
  const [simulatedTime, setSimulatedTime] = useState<Date>(BASELINE_DATE);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(60); // minutes per real second

  // Fullscreen & Observatory HUD state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isObservatoryMode, setIsObservatoryMode] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);

  // FOV Simulator Preset
  const [fovPresetId, setFovPresetId] = useState<string>("none");

  // Search query & focus state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [targetFocus, setTargetFocus] = useState<{ x: number; y: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Layers
  const [showConstellations, setShowConstellations] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showDso, setShowDso] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMilkyWay, setShowMilkyWay] = useState(true);
  const [minMagLimit, setMinMagLimit] = useState<number>(6.0); // 6.0 all, 3.5 medium, 2.0 city

  // Selection
  const [selectedObject, setSelectedObject] = useState<{
    type: "star" | "dso" | "constellation";
    data: StarData | DeepSkyObject | { con: string; stars: StarData[] };
  } | null>(null);

  // Initialize client time on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSimulatedTime(new Date());
  }, []);

  // Listen to fullscreenchange events
  useEffect(() => {
    const handleFsChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active) {
        setIsObservatoryMode(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Live real-time clock interval (updates every 10s when isLive is true)
  useEffect(() => {
    if (!isLive || isPlaying) return;
    const interval = setInterval(() => {
      setSimulatedTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, [isLive, isPlaying]);

  // Animated Play/Simulation interval (rotates celestial sphere forward)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimulatedTime((prev) => new Date(prev.getTime() + playSpeed * 60 * 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed]);

  const activeCity = useMemo(
    () => customLocation || CITIES.find((c) => c.id === selectedCityId) || CITIES[0],
    [selectedCityId, customLocation]
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
    setIsPlaying(false);
    setIsLive(true);
    setSimulatedTime(new Date());
  }, []);

  const handleShiftTime = useCallback((hours: number) => {
    setIsPlaying(false);
    setIsLive(false);
    setSimulatedTime((prev) => new Date(prev.getTime() + hours * 3600 * 1000));
  }, []);

  const handleSetHour = useCallback((hour: number) => {
    setIsPlaying(false);
    setIsLive(false);
    setSimulatedTime((prev) => {
      const next = new Date(prev);
      next.setHours(hour, 0, 0, 0);
      return next;
    });
  }, []);

  const handleSliderTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setIsLive(false);
    const minutesTotal = parseInt(e.target.value, 10);
    const hours = Math.floor(minutesTotal / 60);
    const minutes = minutesTotal % 60;
    setSimulatedTime((prev) => {
      const next = new Date(prev);
      next.setHours(hours, minutes, 0, 0);
      return next;
    });
  }, []);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setIsObservatoryMode(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback: toggle observatory mode without native full screen
      setIsObservatoryMode((prev) => !prev);
    }
  }, []);

  // Focus on Selected Object
  const handleFocusSelected = useCallback(() => {
    triggerHaptic(20);
    if (!selectedObject) return;
    if (selectedObject.type === "star") {
      const s = selectedObject.data as StarData;
      if (s.horizontal) {
        const proj = horizontalToPlanisphere2D(s.horizontal.alt, s.horizontal.az, CX, CY, RADIUS);
        setTargetFocus({ x: proj.x, y: proj.y });
      }
    } else if (selectedObject.type === "dso") {
      const d = selectedObject.data as DeepSkyObject;
      if (d.horizontal) {
        const proj = horizontalToPlanisphere2D(d.horizontal.alt, d.horizontal.az, CX, CY, RADIUS);
        setTargetFocus({ x: proj.x, y: proj.y });
      }
    }
  }, [selectedObject]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery("");
        }
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
        }
        if (selectedObject) {
          setSelectedObject(null);
        }
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      // Do not intercept if user is typing
      if (isInput) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsLive(false);
        setIsPlaying((p) => !p);
      } else if (e.key === "[") {
        e.preventDefault();
        handleShiftTime(-1);
      } else if (e.key === "]") {
        e.preventDefault();
        handleShiftTime(1);
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFocusSelected();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setIsObservatoryMode((prev) => !prev);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        triggerHaptic(20);
        setIsNightVision((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSearchOpen,
    isShortcutsModalOpen,
    selectedObject,
    handleShiftTime,
    handleFocusSelected,
  ]);

  // GPS Geolocation
  const handleRequestGPS = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCustomLocation({
            id: "gps",
            name: "Twoja lokalizacja (GPS)",
            lat,
            lon,
            coords: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
          });
        },
        (err) => {
          console.warn("Geolocation error:", err);
          alert("Nie udało się pobrać lokalizacji GPS. Sprawdź uprawnienia w przeglądarce.");
        }
      );
    }
  }, []);

  // Format LST string (HH:MM)
  const formattedLst = useMemo(() => {
    const h = Math.floor(lstHours);
    const m = Math.floor((lstHours - h) * 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  }, [lstHours]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const starMatches = starsWithHorizontal
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.bayer.toLowerCase().includes(q) ||
          (CONSTELLATION_NAMES_PL[s.con] || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((s) => ({
        type: "star" as const,
        id: s.id,
        title: s.name,
        subtitle: `${s.bayer} • ${CONSTELLATION_NAMES_PL[s.con] || s.con} (${s.mag.toFixed(2)}m)`,
        isVisible: Boolean(s.horizontal && s.horizontal.alt > 0),
        data: s,
        coords: s.horizontal
          ? horizontalToPlanisphere2D(s.horizontal.alt, s.horizontal.az, CX, CY, RADIUS)
          : null,
      }));

    const dsoMatches = dsoWithHorizontal
      .filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.namePl.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((d) => ({
        type: "dso" as const,
        id: d.id,
        title: `${d.id} – ${d.namePl}`,
        subtitle: `${d.nameEn} • ${d.mag.toFixed(1)} mag`,
        isVisible: Boolean(d.horizontal && d.horizontal.alt > 0),
        data: d,
        coords: d.horizontal
          ? horizontalToPlanisphere2D(d.horizontal.alt, d.horizontal.az, CX, CY, RADIUS)
          : null,
      }));

    const conMatches = Object.entries(CONSTELLATION_NAMES_PL)
      .filter(
        ([code, name]) =>
          code.toLowerCase().includes(q) || name.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map(([code, name]) => {
        const conStars = starsWithHorizontal.filter((s) => s.con === code);
        const visibleStars = conStars.filter((s) => s.horizontal && s.horizontal.alt > 0);
        const avgX =
          visibleStars.length > 0
            ? visibleStars.reduce((sum, s) => {
                const proj = horizontalToPlanisphere2D(s.horizontal!.alt, s.horizontal!.az, CX, CY, RADIUS);
                return sum + proj.x;
              }, 0) / visibleStars.length
            : CX;
        const avgY =
          visibleStars.length > 0
            ? visibleStars.reduce((sum, s) => {
                const proj = horizontalToPlanisphere2D(s.horizontal!.alt, s.horizontal!.az, CX, CY, RADIUS);
                return sum + proj.y;
              }, 0) / visibleStars.length
            : CY;

        return {
          type: "constellation" as const,
          id: code,
          title: name,
          subtitle: `Gwiazdozbiór (${code})`,
          isVisible: visibleStars.length > 0,
          data: { con: code, stars: conStars },
          coords: { x: avgX, y: avgY, visible: visibleStars.length > 0 },
        };
      });

    return [...starMatches, ...dsoMatches, ...conMatches];
  }, [searchQuery, starsWithHorizontal, dsoWithHorizontal]);

  // Jump and select item from search or quick buttons
  const handleSelectSearchResult = (item: (typeof searchResults)[0]) => {
    setSelectedObject({
      type: item.type,
      data: item.data,
    });
    if (item.coords && item.coords.visible) {
      setTargetFocus({ x: item.coords.x, y: item.coords.y });
    }
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const minutesFromMidnight =
    simulatedTime.getHours() * 60 + simulatedTime.getMinutes();

  return (
    <div className={`bg-[#050508] text-zinc-100 flex flex-col ${isObservatoryMode ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      {/* Top Header (Collapsed in Observatory / Fullscreen Mode) */}
      {!isObservatoryMode && (
        <div className="border-b border-white/10 bg-zinc-950/90 px-4 sm:px-6 py-3.5 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/10 text-zinc-200 border border-white/15">
                  <Sparkles className="h-3 w-3 text-zinc-300" /> Planisfera Nieba 2D
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400 font-mono">
                  {activeCity.name} ({activeCity.coords})
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                Interaktywna Mapa Nieba
              </h1>
              <p className="text-xs text-zinc-400 max-w-xl">
                Precyzyjna projekcja azymutalna sfery niebieskiej z Polski z czasem gwiazdowym (LST), Drogą Mleczną, symulatorem FOV i wykresem widoczności 24h.
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search Input Bar */}
              <div className="relative flex-1 md:w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    placeholder="Szukaj obiektów (klawisz /)..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/80 pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/15 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-2xl z-50 max-h-72 overflow-y-auto space-y-1">
                    {searchResults.map((res) => (
                      <button
                        key={`${res.type}-${res.id}`}
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-white/10 transition-colors group cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-white">
                            {res.title}
                          </div>
                          <div className="text-[10px] text-zinc-400">{res.subtitle}</div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border ${
                            res.isVisible
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              res.isVisible ? "bg-emerald-400" : "bg-zinc-600"
                            }`}
                          />
                          {res.isVisible ? "Nad horyzontem" : "Pod horyzontem"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Red Night Vision Mode Toggle */}
              <button
                onClick={() => {
                  triggerHaptic(20);
                  setIsNightVision((prev) => !prev);
                }}
                title={
                  isNightVision
                    ? "Wyłącz czerwony tryb nocny (klawisz N)"
                    : "Włącz czerwony tryb nocny do obserwacji (klawisz N)"
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 text-xs ${
                  isNightVision
                    ? "border-red-600/60 bg-red-950/70 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.35)]"
                    : "border-white/10 bg-zinc-900/80 text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Eye className={`h-3.5 w-3.5 ${isNightVision ? "text-red-400" : "text-zinc-400"}`} />
                <span className="hidden sm:inline font-medium">
                  {isNightVision ? "Nocny aktywny" : "Tryb nocny"}
                </span>
                {isNightVision && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              {/* Shortcuts button */}
              <button
                onClick={() => setIsShortcutsModalOpen(true)}
                title="Skróty klawiszowe (klawisz ?)"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <Keyboard className="h-4 w-4" />
              </button>

              {/* Fullscreen / Observatory Toggle */}
              <button
                onClick={() => {
                  setIsObservatoryMode(true);
                  toggleFullscreen();
                }}
                title="Pełnoekranowy tryb Obserwatorium (Planetarium HUD)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-zinc-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <Maximize className="h-3.5 w-3.5 text-zinc-300" />
                <span className="hidden sm:inline font-medium">Obserwatorium</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Toolbar (Collapsed in Observatory Mode) */}
      {!isObservatoryMode && (
        <div className="border-b border-white/10 bg-zinc-950/60 px-4 sm:px-6 py-2.5 backdrop-blur-md z-10 space-y-2.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
            {/* Location Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-nowrap sm:flex-wrap">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-mono shrink-0">
                Lokalizacja:
              </span>
              <div className="flex gap-1 flex-nowrap sm:flex-wrap shrink-0">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCustomLocation(null);
                      setSelectedCityId(c.id);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                      !customLocation && selectedCityId === c.id
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {c.name.split(" ")[0]}
                  </button>
                ))}

                <button
                  onClick={handleRequestGPS}
                  title="Wykryj współrzędne z GPS w Twojej przeglądarce"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
                    customLocation
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <LocateFixed className="h-3 w-3" />
                  <span>GPS</span>
                </button>
              </div>
            </div>

            {/* Time & Simulation Controls */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 flex-nowrap sm:flex-wrap">
              <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />

              {/* Live Now Button */}
              <button
                onClick={handleLiveNow}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isLive && !isPlaying
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLive && !isPlaying ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                  }`}
                />
                Teraz
              </button>

              {/* Play / Pause Time Simulation */}
              <button
                onClick={() => {
                  setIsLive(false);
                  setIsPlaying((p) => !p);
                }}
                title={isPlaying ? "Zatrzymaj upływ czasu (Spacja)" : "Uruchom animację obrotu nieba (Spacja)"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
                  isPlaying
                    ? "bg-emerald-500 text-black font-bold border-emerald-400"
                    : "bg-white/5 text-zinc-300 hover:text-white border-white/10"
                }`}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                <span>{isPlaying ? "Pauza" : "Animuj niebo"}</span>
              </button>

              {/* Simulation Speed Dropdown */}
              {isPlaying && (
                <select
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(Number(e.target.value))}
                  className="rounded-lg bg-zinc-900 border border-white/15 px-2 py-1 text-[11px] text-white focus:outline-none shrink-0"
                >
                  <option value={10}>10 min / s</option>
                  <option value={60}>1h / s</option>
                  <option value={180}>3h / s</option>
                </select>
              )}

              {/* Step Hours */}
              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-black/40 shrink-0">
                <button
                  onClick={() => handleShiftTime(-1)}
                  title="Cofnij o 1 godzinę (klawisz [)"
                  className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                  <span className="text-[10px] font-mono">1h</span>
                </button>
                <button
                  onClick={() => handleShiftTime(1)}
                  title="W przód o 1 godzinę (klawisz ])"
                  className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center border-l border-white/10 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-[10px] font-mono">1h</span>
                </button>
              </div>

              {/* Quick Night Hours */}
              <div className="hidden sm:flex gap-1 shrink-0">
                <button
                  onClick={() => handleSetHour(21)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-zinc-300 cursor-pointer"
                >
                  21:00
                </button>
                <button
                  onClick={() => handleSetHour(0)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-zinc-300 cursor-pointer"
                >
                  00:00
                </button>
                <button
                  onClick={() => handleSetHour(3)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-zinc-300 cursor-pointer"
                >
                  03:00
                </button>
              </div>

              {/* Current Time Display */}
              <span className="font-mono text-[11px] text-white font-semibold bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 shrink-0">
                {simulatedTime.toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Layer & FOV Toggles */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 flex-nowrap sm:flex-wrap">
              {/* FOV Simulator Preset Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Crosshair className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={fovPresetId}
                  onChange={(e) => setFovPresetId(e.target.value)}
                  className="rounded-lg bg-zinc-900 border border-white/15 px-2 py-1 text-[11px] text-zinc-200 focus:outline-none cursor-pointer"
                  title="Symulator pola widzenia okularu / lornetki / szukacza (FOV)"
                >
                  {FOV_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Layer Buttons */}
              <div className="flex items-center gap-1 flex-nowrap sm:flex-wrap shrink-0">
                <button
                  onClick={() => setShowMilkyWay((v) => !v)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border shrink-0 ${
                    showMilkyWay
                      ? "bg-white text-black font-semibold border-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                  title="Włącz/wyłącz realistyczny pas Drogi Mlecznej"
                >
                  Droga Mleczna
                </button>

                <button
                  onClick={() => setShowConstellations((v) => !v)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border shrink-0 ${
                    showConstellations
                      ? "bg-white text-black font-semibold border-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                  title="Przełącz linie gwiazdozbiorów"
                >
                  Gwiazdozbiory
                </button>

                <button
                  onClick={() => setShowLabels((v) => !v)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border shrink-0 ${
                    showLabels
                      ? "bg-white text-black font-semibold border-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                  title="Przełącz etykiety i nazwy"
                >
                  Etykiety
                </button>

                <button
                  onClick={() => setShowDso((v) => !v)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border shrink-0 ${
                    showDso
                      ? "bg-white text-black font-semibold border-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                  title="Przełącz obiekty Messiera (DSO)"
                >
                  DSO
                </button>

                <button
                  onClick={() => setShowGrid((v) => !v)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border shrink-0 ${
                    showGrid
                      ? "bg-white text-black font-semibold border-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                  title="Przełącz siatkę wysokości i azymutu"
                >
                  Siatka Alt/Az
                </button>

                <button
                  onClick={() => setShowHorizon((v) => !v)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border shrink-0 ${
                    showHorizon
                      ? "bg-white text-black font-semibold border-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                  title="Przełącz linię horyzontu i kierunki kompasu"
                >
                  Horyzont
                </button>

                {/* Star Limiting Magnitude Filter */}
                <select
                  value={minMagLimit}
                  onChange={(e) => setMinMagLimit(Number(e.target.value))}
                  className="rounded-lg bg-zinc-900 border border-white/15 px-2 py-1 text-[11px] text-white focus:outline-none cursor-pointer shrink-0"
                  title="Filtr zasięgu jasności gwiazd"
                >
                  <option value={6.0}>Do 6 mag (wszystkie)</option>
                  <option value={3.5}>Do 3.5 mag (podmiejski)</option>
                  <option value={2.0}>Do 2 mag (centrum miasta)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 24h Time Slider Bar */}
          <div className="max-w-7xl mx-auto flex items-center gap-3 pt-1 border-t border-white/5 text-xs">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">
              Pora doby:
            </span>
            <input
              type="range"
              min={0}
              max={1439}
              step={5}
              value={minutesFromMidnight}
              onChange={handleSliderTimeChange}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex gap-2 text-[10px] font-mono text-zinc-400 shrink-0">
              <span>Data: {simulatedTime.toISOString().slice(0, 10)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Planisphere Canvas (Expanded to full screen in Observatory Mode) */}
      <div className={`relative flex-1 w-full bg-[#050508] overflow-hidden ${isObservatoryMode ? "h-screen" : "h-[calc(100vh-13rem)] min-h-[580px]"}`}>
        <SkyMapPlanisphere2D
          stars={starsWithHorizontal}
          constellationLines={catalog.constellationLines}
          deepSkyObjects={dsoWithHorizontal}
          showConstellations={showConstellations}
          showLabels={showLabels}
          showDso={showDso}
          showHorizon={showHorizon}
          showGrid={showGrid}
          showMilkyWay={showMilkyWay}
          minMagLimit={minMagLimit}
          lstHours={lstHours}
          latitude={activeCity.lat}
          onSelectObject={setSelectedObject}
          selectedId={
            selectedObject?.type === "star"
              ? (selectedObject.data as StarData).id
              : selectedObject?.type === "dso"
              ? (selectedObject.data as DeepSkyObject).id
              : selectedObject?.type === "constellation"
              ? (selectedObject.data as { con: string }).con
              : undefined
          }
          targetFocus={targetFocus}
          fovPresetId={fovPresetId}
          isNightVision={isNightVision}
        />

        {/* Selected Object Detail Card HUD - Desktop (With 24h Altitude vs Time Chart) */}
        <StarInfoCard
          selectedObject={selectedObject}
          onClose={() => setSelectedObject(null)}
          lat={activeCity.lat}
          lon={activeCity.lon}
          simulatedTime={simulatedTime}
          isNightVision={isNightVision}
        />

        {/* Mobile Bottom Sheet for Selected Object (3 Snap States: Peek, Half, Full) */}
        <MobileStarBottomSheet
          selectedObject={selectedObject}
          onClose={() => setSelectedObject(null)}
          lat={activeCity.lat}
          lon={activeCity.lon}
          simulatedTime={simulatedTime}
          isNightVision={isNightVision}
        />

        {/* Mobile Floating Action Dock (Search, Time, Layers, GPS/Location, Red Night Vision) */}
        <MobileFloatingDock
          isNightVision={isNightVision}
          onToggleNightVision={() => {
            triggerHaptic(20);
            setIsNightVision((prev) => !prev);
          }}
          onOpenSearch={() => {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          simulatedTime={simulatedTime}
          isPlaying={isPlaying}
          onTogglePlay={() => {
            setIsLive(false);
            setIsPlaying((p) => !p);
          }}
          onShiftTime={handleShiftTime}
          onLiveNow={handleLiveNow}
          cities={CITIES}
          selectedCityId={selectedCityId}
          activeCityName={activeCity.name}
          onSelectCity={(cityId) => {
            setCustomLocation(null);
            setSelectedCityId(cityId);
          }}
          onRequestGPS={handleRequestGPS}
          showConstellations={showConstellations}
          setShowConstellations={setShowConstellations}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          showDso={showDso}
          setShowDso={setShowDso}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showMilkyWay={showMilkyWay}
          setShowMilkyWay={setShowMilkyWay}
          fovPresetId={fovPresetId}
          setFovPresetId={setFovPresetId}
          hasSelectedObject={Boolean(selectedObject)}
        />

        {/* ======================================================== */}
        {/* OBSERVATORY MODE FLOATING HUD CORNERS                     */}
        {/* ======================================================== */}
        {isObservatoryMode && (
          <>
            {/* Top Left Floating HUD (Brand & Location) */}
            <div className="absolute left-4 top-4 z-20 flex flex-col gap-1.5 pointer-events-auto animate-in fade-in duration-300">
              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-950/85 px-3 py-2 text-xs backdrop-blur-xl shadow-2xl">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="font-bold tracking-wider text-white">GALACTI OBSERWATORIUM</span>
                <span className="text-zinc-600">|</span>
                <span className="text-[11px] font-mono text-zinc-300">{activeCity.name}</span>
                {fovPresetId !== "none" && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-zinc-200 border border-white/15">
                    FOV: {FOV_PRESETS.find((p) => p.id === fovPresetId)?.name.split(" ")[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Top Right Floating HUD (Controls & Fullscreen) */}
            <div className="absolute right-4 top-4 z-20 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-300">
              {/* Floating Clock & Play/Pause */}
              <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-zinc-950/85 px-2.5 py-1.5 text-xs backdrop-blur-xl shadow-2xl">
                <span className="font-mono text-xs font-bold text-white">
                  {simulatedTime.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button
                  onClick={() => {
                    setIsLive(false);
                    setIsPlaying((p) => !p);
                  }}
                  title={isPlaying ? "Wstrzymaj (Spacja)" : "Animuj (Spacja)"}
                  className="p-1 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleShiftTime(-1)}
                  title="Cofnij 1h ([)"
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 hover:bg-white/10"
                >
                  -1h
                </button>
                <button
                  onClick={() => handleShiftTime(1)}
                  title="Przesuń 1h (])"
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-300 hover:bg-white/10"
                >
                  +1h
                </button>
              </div>

              {/* FOV Dropdown */}
              <select
                value={fovPresetId}
                onChange={(e) => setFovPresetId(e.target.value)}
                className="rounded-xl border border-white/15 bg-zinc-950/85 px-2 py-1.5 text-xs text-white backdrop-blur-xl focus:outline-none cursor-pointer"
                title="Symulator pola widzenia (FOV)"
              >
                {FOV_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Focus on object button */}
              {selectedObject && (
                <button
                  onClick={handleFocusSelected}
                  title="Wycentruj na zaznaczonym obiekcie (klawisz F)"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-zinc-950/85 text-zinc-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer backdrop-blur-xl"
                >
                  <Target className="h-4 w-4" />
                </button>
              )}

              {/* Night Vision toggle in Observatory */}
              <button
                onClick={() => {
                  triggerHaptic(20);
                  setIsNightVision((prev) => !prev);
                }}
                title={isNightVision ? "Wyłącz czerwony tryb nocny (N)" : "Włącz czerwony tryb nocny (N)"}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer backdrop-blur-xl ${
                  isNightVision
                    ? "border-red-600/70 bg-red-950/70 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                    : "border-white/15 bg-zinc-950/85 text-zinc-200 hover:bg-white/15 hover:text-white"
                }`}
              >
                <Eye className={`h-4 w-4 ${isNightVision ? "text-red-400" : "text-zinc-300"}`} />
              </button>

              {/* Shortcuts modal button */}
              <button
                onClick={() => setIsShortcutsModalOpen(true)}
                title="Ściąga skrótów klawiszowych (klawisz ?)"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-zinc-950/85 text-zinc-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer backdrop-blur-xl"
              >
                <Keyboard className="h-4 w-4" />
              </button>

              {/* Toggle Fullscreen button */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Opuść pełny ekran" : "Włącz pełny ekran"}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-zinc-950/85 text-zinc-200 hover:bg-white/15 hover:text-white transition-colors cursor-pointer backdrop-blur-xl"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>

              {/* Exit Observatory Mode */}
              <button
                onClick={() => {
                  setIsObservatoryMode(false);
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-xl cursor-pointer"
              >
                Przywróć pasek
              </button>
            </div>

            {/* Bottom Right Floating Layer Toggles in Observatory */}
            <div className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-2xl border border-white/15 bg-zinc-950/85 p-1.5 backdrop-blur-xl shadow-2xl pointer-events-auto">
              <button
                onClick={() => setShowConstellations((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  showConstellations ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Linie
              </button>
              <button
                onClick={() => setShowLabels((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  showLabels ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Etykiety
              </button>
              <button
                onClick={() => setShowDso((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  showDso ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                DSO
              </button>
              <button
                onClick={() => setShowGrid((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  showGrid ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Siatka
              </button>
              <button
                onClick={() => setShowMilkyWay((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  showMilkyWay ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Droga Mleczna
              </button>
            </div>
          </>
        )}

        {/* Curated Highlights Quick Selector (Bottom Left Pills) */}
        <div
          className={`absolute left-4 bottom-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none max-w-[calc(100vw-2rem)] ${
            selectedObject ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Quick Info Badge */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/85 px-3 py-2 text-xs backdrop-blur-md text-zinc-300">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">
              Zenit w centrum (0°–90°). Kółko myszy = zoom, przeciągnij = pan, klawisz <kbd className="px-1 py-0.5 rounded border border-white/20 bg-zinc-800 text-[10px] font-mono text-white">?</kbd> pomoc.
            </span>
            <span className="sm:hidden">Dotknij obiektu, aby zbadać.</span>
          </div>

          {/* Telemetry HUD Badge */}
          <div className="pointer-events-auto hidden md:flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/85 px-3 py-2 text-xs font-mono backdrop-blur-md text-zinc-400">
            <div>
              LST: <span className="text-white font-semibold">{formattedLst}</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              Widoczne: <span className="text-white font-semibold">{visibleStarsCount}</span> gwiazd,{" "}
              <span className="text-white font-semibold">{visibleDsoCount}</span> DSO
            </div>
            {brightestVisibleStar && (
              <>
                <span className="text-zinc-700">|</span>
                <button
                  onClick={() => {
                    setSelectedObject({ type: "star", data: brightestVisibleStar });
                    if (brightestVisibleStar.horizontal) {
                      const proj = horizontalToPlanisphere2D(
                        brightestVisibleStar.horizontal.alt,
                        brightestVisibleStar.horizontal.az,
                        CX,
                        CY,
                        RADIUS
                      );
                      setTargetFocus({ x: proj.x, y: proj.y });
                    }
                  }}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                  title="Kliknij, aby zlokalizować najjaśniejszą gwiazdę"
                >
                  Najjaśniejsza:{" "}
                  <span className="text-emerald-400 font-semibold underline decoration-dotted">
                    {brightestVisibleStar.name} ({brightestVisibleStar.mag.toFixed(2)}m)
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
