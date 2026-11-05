"use client";

import { useState } from "react";
import {
  Search,
  Clock,
  Play,
  Pause,
  Layers,
  MapPin,
  Eye,
  X,
} from "lucide-react";
import { FOV_PRESETS } from "@/lib/types";

interface CityConfig {
  id: string;
  name: string;
  lat: number;
  lon: number;
  coords: string;
}

function triggerHaptic(duration = 18) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // ignore
    }
  }
}

interface MobileFloatingDockProps {
  onOpenSearch: () => void;
  // Time
  isPlaying: boolean;
  onTogglePlay: () => void;
  onLiveNow: () => void;
  onShiftTime: (hours: number) => void;
  simulatedTime: Date;
  // Layers
  showConstellations: boolean;
  setShowConstellations: (v: boolean | ((v: boolean) => boolean)) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean | ((v: boolean) => boolean)) => void;
  showDso: boolean;
  setShowDso: (v: boolean | ((v: boolean) => boolean)) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean | ((v: boolean) => boolean)) => void;
  showMilkyWay: boolean;
  setShowMilkyWay: (v: boolean | ((v: boolean) => boolean)) => void;
  fovPresetId: string;
  setFovPresetId: (id: string) => void;
  // Location
  cities: CityConfig[];
  selectedCityId: string;
  onSelectCity: (id: string) => void;
  onRequestGPS: () => void;
  activeCityName: string;
  // Night Vision
  isNightVision: boolean;
  onToggleNightVision: () => void;
  // Selected object state
  hasSelectedObject: boolean;
}

export function MobileFloatingDock({
  onOpenSearch,
  isPlaying,
  onTogglePlay,
  onLiveNow,
  onShiftTime,
  simulatedTime,
  showConstellations,
  setShowConstellations,
  showLabels,
  setShowLabels,
  showDso,
  setShowDso,
  showGrid,
  setShowGrid,
  showMilkyWay,
  setShowMilkyWay,
  fovPresetId,
  setFovPresetId,
  cities,
  selectedCityId,
  onSelectCity,
  onRequestGPS,
  activeCityName,
  isNightVision,
  onToggleNightVision,
  hasSelectedObject,
}: MobileFloatingDockProps) {
  const [activeSheet, setActiveSheet] = useState<"time" | "layers" | "location" | null>(null);

  const toggleSheet = (sheet: "time" | "layers" | "location") => {
    triggerHaptic(15);
    setActiveSheet((prev) => (prev === sheet ? null : sheet));
  };

  const closeSheet = () => {
    triggerHaptic(12);
    setActiveSheet(null);
  };

  // Styling helpers
  const dockBg = isNightVision
    ? "bg-[#0d0000]/95 border-red-900/60 shadow-red-950/40 text-red-200"
    : "bg-zinc-950/90 border-white/15 shadow-2xl text-zinc-200 backdrop-blur-2xl";

  const buttonBase = isNightVision
    ? "text-red-400 hover:text-red-200 active:bg-red-950/60"
    : "text-zinc-400 hover:text-white active:bg-white/10";

  const buttonActive = isNightVision
    ? "bg-red-600 text-black font-bold shadow-md shadow-red-900/50"
    : "bg-white text-black font-bold shadow-md shadow-white/20";

  const sheetBg = isNightVision
    ? "bg-[#0d0000]/98 border-red-900/70 text-red-200"
    : "bg-zinc-950/95 border-white/20 text-zinc-100";

  return (
    <>
      {/* ======================================================== */}
      {/* MODAL POPUPS / SHEETS FOR SUB-TOOLS                      */}
      {/* ======================================================== */}
      {activeSheet && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden flex flex-col justify-end p-3 animate-in fade-in duration-200"
          onClick={closeSheet}
        >
          <div
            className={`w-full rounded-3xl border p-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-4 duration-200 ${sheetBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                {activeSheet === "time" && <Clock className="h-4 w-4 text-emerald-400" />}
                {activeSheet === "layers" && <Layers className="h-4 w-4 text-blue-400" />}
                {activeSheet === "location" && <MapPin className="h-4 w-4 text-amber-400" />}
                <h4 className="text-sm font-bold text-white">
                  {activeSheet === "time" && "Kontrola Czasu i Symulacji"}
                  {activeSheet === "layers" && "Warstwy Nieba & Symulator FOV"}
                  {activeSheet === "location" && "Lokalizacja Obserwatora"}
                </h4>
              </div>
              <button
                onClick={closeSheet}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TIME SHEET BODY */}
            {activeSheet === "time" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase">
                      Czas symulacji
                    </span>
                    <span className="text-base font-bold font-mono text-white">
                      {simulatedTime.toLocaleTimeString("pl-PL", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      onLiveNow();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                  >
                    Teraz (Live)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      onShiftTime(-1);
                    }}
                    className="py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-mono font-bold text-zinc-200"
                  >
                    -1 godz.
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      onTogglePlay();
                    }}
                    className={`py-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold ${
                      isPlaying
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-white text-black border-white"
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{isPlaying ? "Pauza" : "Start"}</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      onShiftTime(1);
                    }}
                    className="py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-mono font-bold text-zinc-200"
                  >
                    +1 godz.
                  </button>
                </div>
              </div>
            )}

            {/* LAYERS SHEET BODY */}
            {activeSheet === "layers" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic(12);
                      setShowConstellations((v) => !v);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                      showConstellations ? buttonActive : "border-white/10 bg-white/5 text-zinc-300"
                    }`}
                  >
                    <span>Linie gwiazd</span>
                    <span className="text-[10px]">{showConstellations ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(12);
                      setShowLabels((v) => !v);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                      showLabels ? buttonActive : "border-white/10 bg-white/5 text-zinc-300"
                    }`}
                  >
                    <span>Etykiety</span>
                    <span className="text-[10px]">{showLabels ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(12);
                      setShowDso((v) => !v);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                      showDso ? buttonActive : "border-white/10 bg-white/5 text-zinc-300"
                    }`}
                  >
                    <span>Obiekty DSO</span>
                    <span className="text-[10px]">{showDso ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(12);
                      setShowGrid((v) => !v);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                      showGrid ? buttonActive : "border-white/10 bg-white/5 text-zinc-300"
                    }`}
                  >
                    <span>Siatka Alt/Az</span>
                    <span className="text-[10px]">{showGrid ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(12);
                      setShowMilkyWay((v) => !v);
                    }}
                    className={`col-span-2 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                      showMilkyWay ? buttonActive : "border-white/10 bg-white/5 text-zinc-300"
                    }`}
                  >
                    <span>Droga Mleczna (Pas Galaktyczny)</span>
                    <span className="text-[10px]">{showMilkyWay ? "ON" : "OFF"}</span>
                  </button>
                </div>

                {/* FOV Simulator dropdown */}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono text-zinc-400 block uppercase mb-1.5">
                    Celownik optyczny / FOV Simulator:
                  </span>
                  <select
                    value={fovPresetId}
                    onChange={(e) => {
                      triggerHaptic(15);
                      setFovPresetId(e.target.value);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-white/15 bg-zinc-900 text-xs font-semibold text-white focus:outline-none"
                  >
                    {FOV_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* LOCATION SHEET BODY */}
            {activeSheet === "location" && (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    onRequestGPS();
                    closeSheet();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-white/15 bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/20 active:scale-98 transition-all"
                >
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>Użyj mojej pozycji (GPS)</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {cities.map((c) => {
                    const isSelected = selectedCityId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          triggerHaptic(15);
                          onSelectCity(c.id);
                          closeSheet();
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs text-left truncate transition-colors ${
                          isSelected
                            ? buttonActive
                            : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                        }`}
                      >
                        <div className="font-bold truncate">{c.name}</div>
                        <div className="text-[10px] opacity-75 font-mono truncate">{c.coords}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FLOATING ACTION DOCK (THUMB REACH)                       */}
      {/* ======================================================== */}
      <nav
        aria-label="Mobilny pasek narzędzi"
        className={`sm:hidden fixed inset-x-3 z-30 transition-all duration-300 ${
          hasSelectedObject ? "bottom-[76px]" : "bottom-3"
        }`}
      >
        <div
          className={`mx-auto max-w-sm rounded-full border px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-2xl ${dockBg}`}
        >
          {/* 1. SEARCH BUTTON */}
          <button
            onClick={() => {
              triggerHaptic(15);
              onOpenSearch();
            }}
            aria-label="Szukaj obiektów na niebie"
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-full transition-all active:scale-95 ${buttonBase}`}
          >
            <Search className="h-4 w-4" />
            <span className="text-[9px] font-medium mt-0.5">Szukaj</span>
          </button>

          {/* 2. TIME CONTROLS BUTTON */}
          <button
            onClick={() => toggleSheet("time")}
            aria-label="Czas i animacja"
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-full transition-all active:scale-95 ${
              activeSheet === "time" ? buttonActive : buttonBase
            }`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-amber-400" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="text-[9px] font-medium mt-0.5">
              {isPlaying ? "Anim" : "Czas"}
            </span>
          </button>

          {/* 3. LAYERS & FOV BUTTON */}
          <button
            onClick={() => toggleSheet("layers")}
            aria-label="Warstwy i celowniki FOV"
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-full transition-all active:scale-95 ${
              activeSheet === "layers" ? buttonActive : buttonBase
            }`}
          >
            <Layers className="h-4 w-4" />
            <span className="text-[9px] font-medium mt-0.5">Warstwy</span>
          </button>

          {/* 4. GPS / LOCATION BUTTON */}
          <button
            onClick={() => toggleSheet("location")}
            aria-label={`Zmień lokalizację (${activeCityName})`}
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-full transition-all active:scale-95 ${
              activeSheet === "location" ? buttonActive : buttonBase
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span className="text-[9px] font-medium mt-0.5 truncate max-w-[40px]">
              {activeCityName.split(" ")[0]}
            </span>
          </button>

          {/* 5. RED NIGHT VISION TOGGLE */}
          <button
            onClick={() => {
              triggerHaptic(25);
              onToggleNightVision();
            }}
            aria-label={isNightVision ? "Wyłącz tryb nocny" : "Włącz czerwony tryb nocny"}
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-full transition-all active:scale-95 ${
              isNightVision
                ? "bg-red-600 text-black font-bold shadow-lg shadow-red-600/50"
                : "text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30"
            }`}
            title="Czerwony tryb nocny (ochrona wzroku w ciemności)"
          >
            <Eye className="h-4 w-4" />
            <span className="text-[9px] font-bold mt-0.5">
              {isNightVision ? "Noc ON" : "Nocny"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
