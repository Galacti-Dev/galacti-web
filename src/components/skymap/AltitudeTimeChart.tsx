"use client";

import { useMemo, useState } from "react";
import { EquatorialCoord } from "@/lib/types";
import { calculateAltitudeCurve } from "@/lib/astronomyMath";
import { Clock, TrendingUp, Sun, Moon } from "lucide-react";

interface AltitudeTimeChartProps {
  coord: EquatorialCoord;
  lat: number;
  lon: number;
  simulatedTime: Date;
  objectName: string;
}

export function AltitudeTimeChart({
  coord,
  lat,
  lon,
  simulatedTime,
  objectName,
}: AltitudeTimeChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const curveData = useMemo(() => {
    return calculateAltitudeCurve(coord, lat, lon, simulatedTime);
  }, [coord, lat, lon, simulatedTime]);

  // SVG dimensions
  const width = 360;
  const height = 150;
  const padLeft = 32;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 26;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Altitude range: from -30° to +90°
  const minAlt = -30;
  const maxAlt = 90;
  const altRange = maxAlt - minAlt;

  // Convert (index, alt) to SVG (x, y)
  const getX = (idx: number) => padLeft + (idx / (curveData.points.length - 1)) * chartW;
  const getY = (alt: number) => padTop + chartH - ((alt - minAlt) / altRange) * chartH;

  const yZero = getY(0); // Altitude 0° (horizon line)
  const y30 = getY(30);
  const y60 = getY(60);

  // SVG points path
  const pointsString = curveData.points
    .map((p, idx) => `${getX(idx).toFixed(1)},${getY(p.alt).toFixed(1)}`)
    .join(" ");

  // Fill area between curve and yZero
  const areaString = `${getX(0).toFixed(1)},${yZero.toFixed(1)} ` +
    pointsString +
    ` ${getX(curveData.points.length - 1).toFixed(1)},${yZero.toFixed(1)}`;

  // Find index of culmination
  const culminationIndex = curveData.points.findIndex(
    (p) => Math.abs(p.alt - curveData.maxAlt) < 0.05
  );

  // Find index closest to simulatedTime
  const currentTimeMs = simulatedTime.getTime();
  let currentIndex = 0;
  let minDiff = Infinity;
  curveData.points.forEach((p, idx) => {
    const diff = Math.abs(p.date.getTime() - currentTimeMs);
    if (diff < minDiff) {
      minDiff = diff;
      currentIndex = idx;
    }
  });

  const activePoint = hoverIndex !== null ? curveData.points[hoverIndex] : curveData.points[currentIndex];
  const activeX = hoverIndex !== null ? getX(hoverIndex) : getX(currentIndex);
  const activeY = activePoint ? getY(activePoint.alt) : yZero;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 p-3 sm:p-4 text-zinc-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-300" />
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[200px]">
            {objectName ? `Widoczność: ${objectName}` : "Wykres Widoczności (Wysokość vs Czas)"}
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          24h cykl nocy
        </span>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            if (relX >= padLeft && relX <= width - padRight) {
              const ratio = (relX - padLeft) / chartW;
              const idx = Math.round(ratio * (curveData.points.length - 1));
              setHoverIndex(Math.max(0, Math.min(curveData.points.length - 1, idx)));
            }
          }}
        >
          <defs>
            {/* Gradient fill for visible area above horizon */}
            <linearGradient id="altAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="80%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            {/* Night-time shading pattern */}
            <linearGradient id="nightZoneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#09090b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#030305" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Chart Background */}
          <rect
            x={padLeft}
            y={padTop}
            width={chartW}
            height={chartH}
            fill="#09090b"
            rx="4"
          />

          {/* Shaded Night Zone (18:00 to 06:00 is approx index 12 to 36 of 48) */}
          <rect
            x={getX(12)}
            y={padTop}
            width={getX(36) - getX(12)}
            height={chartH}
            fill="#050508"
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeDasharray="2 3"
            opacity="0.8"
          />
          <text
            x={(getX(12) + getX(36)) / 2}
            y={padTop + 10}
            textAnchor="middle"
            fill="#52525b"
            fontSize="8"
            fontFamily="monospace"
            letterSpacing="1"
          >
            STREFA NOCY
          </text>

          {/* Horizontal Grid lines (Altitude) */}
          {/* 60 deg */}
          <line
            x1={padLeft}
            y1={y60}
            x2={width - padRight}
            y2={y60}
            stroke="#27272a"
            strokeDasharray="2 2"
            strokeWidth="0.75"
          />
          <text x={padLeft - 4} y={y60 + 3} textAnchor="end" fill="#71717a" fontSize="8" fontFamily="monospace">
            60°
          </text>

          {/* 30 deg */}
          <line
            x1={padLeft}
            y1={y30}
            x2={width - padRight}
            y2={y30}
            stroke="#27272a"
            strokeDasharray="2 2"
            strokeWidth="0.75"
          />
          <text x={padLeft - 4} y={y30 + 3} textAnchor="end" fill="#71717a" fontSize="8" fontFamily="monospace">
            30°
          </text>

          {/* 0 deg - Horizon line */}
          <line
            x1={padLeft}
            y1={yZero}
            x2={width - padRight}
            y2={yZero}
            stroke="#71717a"
            strokeWidth="1.2"
          />
          <text x={padLeft - 4} y={yZero + 3} textAnchor="end" fill="#a1a1aa" fontSize="8" fontWeight="bold" fontFamily="monospace">
            0°
          </text>

          {/* Below horizon label */}
          <text x={width - padRight - 2} y={yZero + 10} textAnchor="end" fill="#3f3f46" fontSize="7" fontFamily="monospace">
            POD HORYZONTEM
          </text>

          {/* Visible area fill under curve */}
          <polygon points={areaString} fill="url(#altAreaGradient)" />

          {/* The Altitude Curve */}
          <polyline
            points={pointsString}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Culmination peak marker */}
          {culminationIndex >= 0 && (
            <g>
              <circle
                cx={getX(culminationIndex)}
                cy={getY(curveData.maxAlt)}
                r="3.5"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="1.5"
              />
              <text
                x={getX(culminationIndex)}
                y={Math.max(padTop + 8, getY(curveData.maxAlt) - 6)}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                Max {curveData.maxAlt > 0 ? `+${curveData.maxAlt.toFixed(0)}°` : `${curveData.maxAlt.toFixed(0)}°`}
              </text>
            </g>
          )}

          {/* Active / Current Time Vertical Indicator */}
          {activePoint && (
            <g>
              <line
                x1={activeX}
                y1={padTop}
                x2={activeX}
                y2={padTop + chartH}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={activeX}
                cy={activeY}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Time Axis Labels (Every 4 hours: 12:00, 16:00, 20:00, 00:00, 04:00, 08:00, 12:00) */}
          {[0, 8, 16, 24, 32, 40, 48].map((idx) => {
            const p = curveData.points[idx];
            if (!p) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - padBottom + 12}
                textAnchor="middle"
                fill="#71717a"
                fontSize="8"
                fontFamily="monospace"
              >
                {p.hourLabel}
              </text>
            );
          })}
        </svg>

        {/* Live Hover Tooltip Badge */}
        {activePoint && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Clock className="h-3 w-3 text-emerald-400" />
              <span>Godzina: <strong className="text-white">{activePoint.hourLabel}</strong></span>
              {activePoint.isNight ? (
                <span className="flex items-center gap-1 text-[10px] text-zinc-400 ml-1">
                  <Moon className="h-2.5 w-2.5" /> (Noc)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-400 ml-1">
                  <Sun className="h-2.5 w-2.5" /> (Dzień)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Wysokość:</span>
              <span
                className={`font-bold ${
                  activePoint.alt > 0 ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                {activePoint.alt > 0 ? `+${activePoint.alt.toFixed(1)}°` : `${activePoint.alt.toFixed(1)}°`}
              </span>
              <span className="text-[10px] text-zinc-400">
                {activePoint.alt > 0 ? "(nad horyzontem)" : "(pod horyzontem)"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ephemeris Summary Info */}
      <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-white/10 pt-2 text-[10px] sm:text-[11px] font-mono">
        <div className="rounded-lg bg-zinc-900/60 p-1.5 text-center border border-white/5">
          <span className="text-zinc-500 block uppercase tracking-wider text-[9px]">Wschód</span>
          <span className="font-semibold text-zinc-200">
            {curveData.riseTime || "—"}
          </span>
        </div>
        <div className="rounded-lg bg-zinc-900/60 p-1.5 text-center border border-white/5">
          <span className="text-zinc-500 block uppercase tracking-wider text-[9px]">Kulminacja</span>
          <span className="font-semibold text-emerald-400">
            {curveData.culminationTime} (+{curveData.maxAlt.toFixed(0)}°)
          </span>
        </div>
        <div className="rounded-lg bg-zinc-900/60 p-1.5 text-center border border-white/5">
          <span className="text-zinc-500 block uppercase tracking-wider text-[9px]">Zachód</span>
          <span className="font-semibold text-zinc-200">
            {curveData.setTime || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
