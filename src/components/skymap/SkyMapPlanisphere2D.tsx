"use client";

import { useMemo, useState } from "react";
import { StarData, DeepSkyObject, ConstellationLine } from "@/lib/types";
import { horizontalToPlanisphere2D, CONSTELLATION_NAMES_PL } from "@/lib/astronomyMath";

interface SkyMapPlanisphere2DProps {
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
}

const CX = 300;
const CY = 300;
const RADIUS = 250;

export function SkyMapPlanisphere2D({
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
}: SkyMapPlanisphere2DProps) {
  const [hoveredItem, setHoveredItem] = useState<{
    type: "star" | "dso";
    name: string;
    sub: string;
    x: number;
    y: number;
  } | null>(null);

  // Map stars by id
  const starsMap = useMemo(() => {
    const map = new Map<string, StarData>();
    for (const s of stars) {
      map.set(s.id, s);
    }
    return map;
  }, [stars]);

  // Projected stars
  const projectedStars = useMemo(() => {
    return stars.map((star) => {
      const alt = star.horizontal?.alt ?? -90;
      const az = star.horizontal?.az ?? 0;
      const proj = horizontalToPlanisphere2D(alt, az, CX, CY, RADIUS);
      // Size scaled inversely with magnitude
      const r = Math.max(1.8, 5.0 - star.mag * 0.7);
      return {
        star,
        ...proj,
        r,
      };
    });
  }, [stars]);

  // Visible constellation lines
  const visibleLines = useMemo(() => {
    if (!showConstellations) return [];

    const lines: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    for (const [conKey, conLineList] of Object.entries(constellationLines)) {
      for (let i = 0; i < conLineList.length; i++) {
        const [aId, bId] = conLineList[i];
        const sA = starsMap.get(aId);
        const sB = starsMap.get(bId);

        if (
          sA?.horizontal &&
          sB?.horizontal &&
          sA.horizontal.alt > 0 &&
          sB.horizontal.alt > 0
        ) {
          const pA = horizontalToPlanisphere2D(
            sA.horizontal.alt,
            sA.horizontal.az,
            CX,
            CY,
            RADIUS
          );
          const pB = horizontalToPlanisphere2D(
            sB.horizontal.alt,
            sB.horizontal.az,
            CX,
            CY,
            RADIUS
          );

          lines.push({
            key: `${conKey}-${i}`,
            x1: pA.x,
            y1: pA.y,
            x2: pB.x,
            y2: pB.y,
          });
        }
      }
    }
    return lines;
  }, [showConstellations, constellationLines, starsMap]);

  // Constellation centers for labels
  const constellationCenters = useMemo(() => {
    if (!showConstellations || !showLabels) return [];

    const conGroups: Record<string, Array<{ x: number; y: number }>> = {};
    for (const ps of projectedStars) {
      if (ps.visible && ps.star.con) {
        if (!conGroups[ps.star.con]) {
          conGroups[ps.star.con] = [];
        }
        conGroups[ps.star.con].push({ x: ps.x, y: ps.y });
      }
    }

    const centers: Array<{ con: string; name: string; x: number; y: number }> =
      [];
    for (const [con, pts] of Object.entries(conGroups)) {
      if (pts.length >= 2) {
        const avgX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
        const avgY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
        centers.push({
          con,
          name: CONSTELLATION_NAMES_PL[con] || con,
          x: avgX,
          y: avgY,
        });
      }
    }
    return centers;
  }, [showConstellations, showLabels, projectedStars]);

  // Projected DSOs
  const projectedDso = useMemo(() => {
    if (!showDso) return [];
    return deepSkyObjects
      .map((dso) => {
        const alt = dso.horizontal?.alt ?? -90;
        const az = dso.horizontal?.az ?? 0;
        const proj = horizontalToPlanisphere2D(alt, az, CX, CY, RADIUS);
        return {
          dso,
          ...proj,
        };
      })
      .filter((d) => d.visible);
  }, [showDso, deepSkyObjects]);

  // Radius for 30° and 60° altitude circles
  const r30 = RADIUS * ((90 - 30) / 90);
  const r60 = RADIUS * ((90 - 60) / 90);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none bg-zinc-950 p-2 sm:p-4">
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full max-w-[680px] max-h-[680px] aspect-square"
      >
        <defs>
          <clipPath id="horizon-clip">
            <circle cx={CX} cy={CY} r={RADIUS} />
          </clipPath>

          {/* Radial gradient for the night sky bowl */}
          <radialGradient id="sky-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="70%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Star glow filter */}
          <filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Background */}
        <rect width="600" height="600" fill="#09090b" />

        {/* Sky Disk (Inside Horizon) */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="url(#sky-gradient)"
          stroke="#27272a"
          strokeWidth="1.5"
        />

        {/* Alt/Az Grid Lines */}
        {showGrid && (
          <g className="transition-opacity duration-300">
            {/* Altitude rings */}
            <circle
              cx={CX}
              cy={CY}
              r={r60}
              fill="none"
              stroke="#27272a"
              strokeDasharray="3 3"
              strokeWidth="0.8"
            />
            <circle
              cx={CX}
              cy={CY}
              r={r30}
              fill="none"
              stroke="#27272a"
              strokeDasharray="3 3"
              strokeWidth="0.8"
            />

            {/* Altitude labels */}
            <text
              x={CX + 4}
              y={CY - r60 + 12}
              fill="#52525b"
              fontSize="9"
              fontFamily="monospace"
            >
              60°
            </text>
            <text
              x={CX + 4}
              y={CY - r30 + 12}
              fill="#52525b"
              fontSize="9"
              fontFamily="monospace"
            >
              30°
            </text>

            {/* Cardinal spokes */}
            <line
              x1={CX}
              y1={CY - RADIUS}
              x2={CX}
              y2={CY + RADIUS}
              stroke="#27272a"
              strokeDasharray="2 4"
              strokeWidth="0.75"
            />
            <line
              x1={CX - RADIUS}
              y1={CY}
              x2={CX + RADIUS}
              y2={CY}
              stroke="#27272a"
              strokeDasharray="2 4"
              strokeWidth="0.75"
            />

            {/* Zenith cross */}
            <line
              x1={CX - 5}
              y1={CY}
              x2={CX + 5}
              y2={CY}
              stroke="#71717a"
              strokeWidth="1"
            />
            <line
              x1={CX}
              y1={CY - 5}
              x2={CX}
              y2={CY + 5}
              stroke="#71717a"
              strokeWidth="1"
            />
            <text
              x={CX + 6}
              y={CY - 6}
              fill="#71717a"
              fontSize="9"
              fontFamily="monospace"
            >
              ZENIT
            </text>
          </g>
        )}

        {/* Elements clipped inside horizon */}
        <g clipPath="url(#horizon-clip)">
          {/* Constellation Lines */}
          {showConstellations && (
            <g className="transition-opacity duration-300">
              {visibleLines.map((line) => (
                <line
                  key={line.key}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="rgba(255, 255, 255, 0.28)"
                  strokeWidth="1"
                  strokeDasharray="none"
                />
              ))}
            </g>
          )}

          {/* Constellation Labels */}
          {showConstellations &&
            showLabels &&
            constellationCenters.map((c) => (
              <text
                key={c.con}
                x={c.x}
                y={c.y}
                fill="rgba(255, 255, 255, 0.45)"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="600"
                textAnchor="middle"
                className="select-none pointer-events-none uppercase tracking-wider"
              >
                {c.name}
              </text>
            ))}

          {/* Deep Sky Objects */}
          {showDso && (
            <g className="transition-opacity duration-300">
              {projectedDso.map(({ dso, x, y }) => {
                const isSelected = selectedId === dso.id;
                return (
                  <g
                    key={dso.id}
                    data-testid={`dso-${dso.id}`}
                    className="cursor-pointer group"
                    onClick={() =>
                      onSelectObject({
                        type: "dso",
                        data: dso,
                      })
                    }
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: "dso",
                        name: dso.namePl,
                        sub: `${dso.type} • ${dso.mag.toFixed(1)} mag`,
                        x,
                        y,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* DSO Icon */}
                    {dso.type === "Galaktyka" ? (
                      <ellipse
                        cx={x}
                        cy={y}
                        rx="8"
                        ry="4"
                        fill="rgba(255, 255, 255, 0.08)"
                        stroke="#a1a1aa"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        transform={`rotate(-25 ${x} ${y})`}
                      />
                    ) : (
                      <rect
                        x={x - 5}
                        y={y - 5}
                        width="10"
                        height="10"
                        fill="rgba(255, 255, 255, 0.08)"
                        stroke="#a1a1aa"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        transform={`rotate(45 ${x} ${y})`}
                      />
                    )}

                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {showLabels && (
                      <text
                        x={x + 9}
                        y={y + 3}
                        fill="#d4d4d8"
                        fontSize="9"
                        fontFamily="monospace"
                        className="select-none pointer-events-none"
                      >
                        {dso.id}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Stars */}
          <g>
            {projectedStars
              .filter((p) => p.visible)
              .map(({ star, x, y, r }) => {
                const isSelected = selectedId === star.id;
                const isBright = star.mag <= 1.5;

                return (
                  <g
                    key={star.id}
                    data-testid={`star-${star.id}`}
                    className="cursor-pointer"
                    onClick={() =>
                      onSelectObject({
                        type: "star",
                        data: star,
                      })
                    }
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: "star",
                        name: star.name,
                        sub: `${star.bayer} • ${star.mag.toFixed(2)} mag`,
                        x,
                        y,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Halo for bright stars */}
                    {isBright && (
                      <circle
                        cx={x}
                        cy={y}
                        r={r * 2.5}
                        fill={star.color}
                        opacity="0.25"
                      />
                    )}

                    {/* Star core */}
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={star.color}
                      stroke={isSelected ? "#ffffff" : "none"}
                      strokeWidth={isSelected ? 1.5 : 0}
                    />

                    {/* Selected animation ring */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r={r + 5}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Star name label */}
                    {showLabels && star.mag <= 2.2 && (
                      <text
                        x={x + r + 3}
                        y={y + 3}
                        fill="#e4e4e7"
                        fontSize="9"
                        fontFamily="sans-serif"
                        className="select-none pointer-events-none drop-shadow"
                      >
                        {star.name}
                      </text>
                    )}
                  </g>
                );
              })}
          </g>
        </g>

        {/* Horizon Ring & Glow */}
        {showHorizon && (
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke="#52525b"
            strokeWidth="2"
          />
        )}

        {/* Cardinal Points Labels */}
        <g className="font-mono text-xs font-bold select-none">
          {/* North */}
          <text
            x={CX}
            y={CY - RADIUS - 12}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13"
          >
            N
          </text>
          <text
            x={CX}
            y={CY - RADIUS - 2}
            textAnchor="middle"
            fill="#71717a"
            fontSize="9"
          >
            PÓŁNOC (0°)
          </text>

          {/* East */}
          <text
            x={CX + RADIUS + 18}
            y={CY - 2}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13"
          >
            E
          </text>
          <text
            x={CX + RADIUS + 18}
            y={CY + 10}
            textAnchor="middle"
            fill="#71717a"
            fontSize="8"
          >
            WSCHÓD (90°)
          </text>

          {/* South */}
          <text
            x={CX}
            y={CY + RADIUS + 20}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13"
          >
            S
          </text>
          <text
            x={CX}
            y={CY + RADIUS + 31}
            textAnchor="middle"
            fill="#71717a"
            fontSize="9"
          >
            POŁUDNIE (180°)
          </text>

          {/* West */}
          <text
            x={CX - RADIUS - 18}
            y={CY - 2}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13"
          >
            W
          </text>
          <text
            x={CX - RADIUS - 18}
            y={CY + 10}
            textAnchor="middle"
            fill="#71717a"
            fontSize="8"
          >
            ZACHÓD (270°)
          </text>
        </g>

        {/* Hover Tooltip */}
        {hoveredItem && (
          <g
            transform={`translate(${Math.min(
              Math.max(hoveredItem.x, 80),
              520
            )}, ${Math.max(hoveredItem.y - 30, 30)})`}
            className="pointer-events-none transition-all"
          >
            <rect
              x="-65"
              y="-20"
              width="130"
              height="34"
              rx="6"
              fill="#09090b"
              stroke="#3f3f46"
              strokeWidth="1"
            />
            <text
              x="0"
              y="-5"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
            >
              {hoveredItem.name}
            </text>
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontFamily="monospace"
            >
              {hoveredItem.sub}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
