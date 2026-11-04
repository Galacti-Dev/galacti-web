"use client";

import { useMemo } from "react";
import {
  X,
  ExternalLink,
  Globe,
  Compass,
  Clock,
  RotateCw,
  Sparkles,
  ArrowUpRight,
  Disc,
  Scale,
} from "lucide-react";
import { CelestialBodyData } from "@/lib/types";
import planetsRaw from "@/data/planets.json";
import moonsAndDwarfsRaw from "@/data/moons_and_dwarfs.json";

const allBodies = [
  ...(planetsRaw as CelestialBodyData[]),
  ...(moonsAndDwarfsRaw as CelestialBodyData[]),
];

interface PlanetInfoOverlayProps {
  planet: CelestialBodyData | null;
  onClose: () => void;
  onSelectPlanet?: (planet: CelestialBodyData) => void;
  onOpenScaleComparator?: () => void;
}

function formatType(type: string): string {
  switch (type) {
    case "star":
      return "Gwiazda";
    case "terrestrial planet":
      return "Planeta skalista";
    case "gas giant":
      return "Gazowy olbrzym";
    case "ice giant":
      return "Lodowy olbrzym";
    case "dwarf_planet":
      return "Planeta karłowata";
    case "moon":
      return "Księżyc";
    default:
      return type;
  }
}

export function PlanetInfoOverlay({
  planet,
  onClose,
  onSelectPlanet,
  onOpenScaleComparator,
}: PlanetInfoOverlayProps) {
  const moons = useMemo(() => {
    if (!planet) return [];
    return allBodies.filter((b) => b.parentBodyId === planet.id);
  }, [planet]);

  const parentBody = useMemo(() => {
    if (!planet || !planet.parentBodyId || planet.parentBodyId === "sun") return null;
    return allBodies.find((b) => b.id === planet.parentBodyId) || null;
  }, [planet]);

  if (!planet) return null;

  const isMoon = planet.type === "moon";
  const isDwarf = planet.type === "dwarf_planet";
  const isSun = planet.id === "sun";

  return (
    <aside
      aria-label={`Szczegóły: ${planet.name.pl}`}
      className="fixed inset-x-2 bottom-2 max-h-[65vh] sm:max-h-[calc(100vh-7rem)] sm:absolute sm:inset-auto sm:bottom-6 sm:right-6 sm:top-20 sm:w-96 overflow-y-auto rounded-3xl sm:rounded-2xl border border-white/15 bg-zinc-950/90 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl text-zinc-100 z-30 touch-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-right-4"
    >
      {/* Mobile drag / indicator handle */}
      <div className="mx-auto -mt-1 mb-3 h-1 w-12 rounded-full bg-white/25 sm:hidden" />

      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white">
              {planet.name.pl}
            </h2>
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-zinc-400">
              ({planet.name.en})
            </span>
          </div>
          <span className="inline-block mt-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-zinc-200 border border-white/15">
            {formatType(planet.type)}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Zamknij panel informacyjny"
          className="rounded-full sm:rounded-lg p-2 sm:p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors bg-white/5 sm:bg-transparent"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Parent Body Quick Switcher for Moons */}
      {isMoon && parentBody && (
        <div className="my-3 rounded-xl border border-white/10 bg-white/5 p-2.5 flex items-center justify-between">
          <div className="text-xs text-zinc-300">
            Księżyc planety:{" "}
            <span className="font-semibold text-white">{parentBody.name.pl}</span>
          </div>
          <button
            onClick={() => onSelectPlanet?.(parentBody)}
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-white/20 transition-colors"
          >
            <span>Widok planety</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quick Scientific Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 my-3 sm:my-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400">
            <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-300" />
            <span>Promień</span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-white">
            {planet.realRadiusKm.toLocaleString("pl-PL")} km
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400">
            <Compass className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-300" />
            <span>{isMoon ? "Dystans od planety" : "Dystans od Słońca"}</span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-white">
            {isMoon ? (
              `${(planet.realDistanceKm || 0).toLocaleString("pl-PL")} km`
            ) : isDwarf ? (
              `${(((planet.realDistanceKm || 0) / 149597870.7)).toFixed(2)} AU`
            ) : isSun ? (
              "0 AU (Centrum)"
            ) : (
              `${planet.realDistanceFromSunAU} AU`
            )}
          </div>
          {!isMoon && !isSun && (
            <div className="text-[9px] sm:text-[10px] text-zinc-400">
              {(
                ((planet.realDistanceFromSunKm || planet.realDistanceKm || 0) / 1e6)
              ).toFixed(1)}{" "}
              mln km
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-300" />
            <span>Okres orbitalny</span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-white">
            {planet.orbitalPeriodDays > 0 ? (
              planet.orbitalPeriodDays < 100 ? (
                `${planet.orbitalPeriodDays.toFixed(2)} dni`
              ) : (
                `${Math.round(planet.orbitalPeriodDays).toLocaleString("pl-PL")} dni`
              )
            ) : (
              "Brak (Gwiazda)"
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400">
            <RotateCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-300" />
            <span>Obrót wokół osi</span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-white">
            {planet.rotationPeriodHours !== 0
              ? `${planet.rotationPeriodHours.toFixed(1)} h`
              : "—"}
          </div>
        </div>
      </div>

      {/* Scale comparator quick action */}
      {onOpenScaleComparator && (
        <div className="mt-3">
          <button
            onClick={onOpenScaleComparator}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all shadow-md active:scale-98"
          >
            <Scale className="h-4 w-4" />
            <span>Porównaj skalę z Ziemią / Słońcem</span>
          </button>
        </div>
      )}

      {/* Moons Sub-System Quick Selector for Parent Bodies */}
      {moons.length > 0 && (
        <div className="my-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-2">
            <span className="flex items-center gap-1.5">
              <Disc className="h-3.5 w-3.5 text-zinc-300" />
              <span>Księżyce ({moons.length})</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-normal">
              Kliknij, aby przybliżyć
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {moons.map((moon) => (
              <button
                key={moon.id}
                onClick={() => onSelectPlanet?.(moon)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:border-white/40 hover:bg-white/10 transition-all group active:scale-95"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: moon.colorHex }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                    {moon.name.pl}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    r: {moon.realRadiusKm.toLocaleString("pl-PL")} km
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm leading-relaxed text-zinc-300">
        <div>
          <h3 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Opis naukowy
          </h3>
          <p className="line-clamp-4 sm:line-clamp-none">{planet.shortDescriptionPl}</p>
        </div>

        {/* Fun Fact */}
        <div className="rounded-xl border border-white/15 bg-zinc-900/70 p-3.5 text-zinc-200">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
            <span>Ciekawostka</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-300">
            {planet.funFactPl}
          </p>
        </div>

        {/* NASA Source */}
        {planet.sourceUrl && (
          <div className="pt-2">
            <a
              href={planet.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white underline underline-offset-4 transition-colors"
            >
              <span>Źródło danych: NASA Solar System</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
