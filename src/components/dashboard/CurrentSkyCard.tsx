"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Telescope, ArrowRight, Sparkles, Eye } from "lucide-react";
import rawSkyMap from "@/data/skymap_data.json";
import { SkyMapCatalog } from "@/lib/types";
import {
  getLocalSiderealTime,
  equatorialToHorizontal,
  CONSTELLATION_NAMES_PL,
} from "@/lib/astronomyMath";

const catalog = rawSkyMap as unknown as SkyMapCatalog;
const LAT_POLAND = 52.23; // Warszawa
const LON_POLAND = 21.01;

const BASELINE_DATE = new Date("2026-11-03T21:00:00Z");

export function CurrentSkyCard() {
  const [currentTime, setCurrentTime] = useState<Date>(BASELINE_DATE);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setCurrentTime(new Date());
    }, 0);
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, []);

  const { lstHours, visibleStars, visibleDso, highAltitudeObjects } = useMemo(() => {
    const lst = getLocalSiderealTime(currentTime, LON_POLAND);

    const starsWithHoriz = catalog.stars
      .map((star) => ({
        ...star,
        horizontal: equatorialToHorizontal(
          { ra: star.ra, dec: star.dec },
          LAT_POLAND,
          lst
        ),
      }))
      .filter((s) => s.horizontal && s.horizontal.alt > 0);

    const dsoWithHoriz = catalog.deepSkyObjects
      .map((dso) => ({
        ...dso,
        horizontal: equatorialToHorizontal(
          { ra: dso.ra, dec: dso.dec },
          LAT_POLAND,
          lst
        ),
      }))
      .filter((d) => d.horizontal && d.horizontal.alt > 0);

    // Objects highest in the sky (alt >= 30°)
    const topObjects = [...starsWithHoriz]
      .sort((a, b) => (b.horizontal?.alt ?? 0) - (a.horizontal?.alt ?? 0))
      .slice(0, 4);

    return {
      lstHours: lst,
      visibleStars: starsWithHoriz,
      visibleDso: dsoWithHoriz,
      highAltitudeObjects: topObjects,
    };
  }, [currentTime]);

  const formattedLst = useMemo(() => {
    const h = Math.floor(lstHours);
    const m = Math.floor((lstHours - h) * 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  }, [lstHours]);

  // Mini preview stars for SVG
  const miniStars = useMemo(() => {
    const cx = 100;
    const cy = 100;
    const rMax = 80;

    return visibleStars.map((s) => {
      const alt = s.horizontal?.alt ?? 0;
      const az = s.horizontal?.az ?? 0;
      const r = rMax * Math.max(0, (90 - alt) / 90);
      const theta = ((az - 90) * Math.PI) / 180;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      const size = Math.max(1.2, 3.2 - s.mag * 0.5);
      return { id: s.id, x, y, size, color: s.color, mag: s.mag };
    });
  }, [visibleStars]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 via-zinc-950/80 to-black/95 p-6 sm:p-8 backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-white/10 text-zinc-300 border border-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live • Warszawa 52.2°N
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-400 font-mono">
              LST: <span className="text-white">{formattedLst}</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-zinc-300" />
            Aktualne Niebo nad Polską
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Lokalna sfera niebieska przeliczana w czasie rzeczywistym. Sprawdź, które gwiazdozbiory, jasne gwiazdy i obiekty Messiera górują obecnie nad krajem.
          </p>
        </div>

        <Link
          href="/skymap"
          className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-white/10 transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 shrink-0"
        >
          <Telescope className="h-4 w-4 text-black group-hover:rotate-12 transition-transform" />
          <span>Otwórz Mapę Nieba</span>
          <ArrowRight className="h-4 w-4 text-black" />
        </Link>
      </div>

      {/* Grid: Mini Planisphere & Visible Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Mini Planisphere View */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5 bg-zinc-900/40">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer boundary */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="#09090b"
                stroke="#3f3f46"
                strokeWidth="1.5"
              />
              {/* Altitude 45° ring */}
              <circle
                cx="100"
                cy="100"
                r="40"
                fill="none"
                stroke="#27272a"
                strokeDasharray="2 3"
              />
              {/* Cardinal axis */}
              <line
                x1="100"
                y1="20"
                x2="100"
                y2="180"
                stroke="#27272a"
                strokeDasharray="2 3"
              />
              <line
                x1="20"
                y1="100"
                x2="180"
                y2="100"
                stroke="#27272a"
                strokeDasharray="2 3"
              />
              {/* Zenith dot */}
              <circle cx="100" cy="100" r="1.5" fill="#71717a" />

              {/* Stars */}
              {miniStars.map((s) => (
                <circle
                  key={s.id}
                  cx={s.x}
                  cy={s.y}
                  r={s.size}
                  fill={s.color}
                  opacity={s.mag <= 2 ? 1 : 0.75}
                />
              ))}

              {/* Cardinals */}
              <text
                x="100"
                y="14"
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                N
              </text>
              <text
                x="190"
                y="103"
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                E
              </text>
              <text
                x="100"
                y="194"
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                S
              </text>
              <text
                x="10"
                y="103"
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                W
              </text>
            </svg>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 mt-2">
            Rzut planisfery nad horyzontem
          </span>
        </div>

        {/* Top Visible Objects */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>OBIEKTY NAJWYŻEJ NA NIEBIE</span>
            <span>
              {visibleStars.length} gwiazd | {visibleDso.length} DSO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {highAltitudeObjects.map((star) => {
              const conPl = CONSTELLATION_NAMES_PL[star.con] || star.con;
              const alt = Math.round(star.horizontal?.alt ?? 0);
              const az = Math.round(star.horizontal?.az ?? 0);

              return (
                <div
                  key={star.id}
                  className="p-3.5 rounded-xl border border-white/5 bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: star.color }}
                        />
                        <h4 className="font-semibold text-sm text-white">
                          {star.name}
                        </h4>
                      </div>
                      <span className="text-xs text-zinc-400 block mt-0.5">
                        {star.bayer} • {conPl}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {star.mag.toFixed(2)} mag
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/5 pt-2">
                    <span>
                      Wysokość: <strong className="text-zinc-200">+{alt}°</strong>
                    </span>
                    <span>
                      Azymut: <strong className="text-zinc-200">{az}°</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/30 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-zinc-300" />
              Warunki optymalne do obserwacji lornetkowych i teleskopowych
            </span>
            <Link
              href="/skymap"
              className="text-white hover:underline flex items-center gap-1 font-medium"
            >
              Zobacz gwiazdozbiory &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
