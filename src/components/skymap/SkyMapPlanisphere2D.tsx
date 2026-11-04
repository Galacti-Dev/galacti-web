"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { StarData, DeepSkyObject, ConstellationLine } from "@/lib/types";
import {
  horizontalToPlanisphere2D,
  equatorialToHorizontal,
  CONSTELLATION_NAMES_PL,
} from "@/lib/astronomyMath";

interface SkyMapPlanisphere2DProps {
  stars: StarData[];
  constellationLines: Record<string, ConstellationLine[]>;
  deepSkyObjects: DeepSkyObject[];
  showConstellations: boolean;
  showLabels: boolean;
  showDso: boolean;
  showHorizon: boolean;
  showGrid: boolean;
  showMilkyWay: boolean;
  minMagLimit?: number;
  lstHours: number;
  latitude: number;
  selectedId?: string;
  onSelectObject: (item: {
    type: "star" | "dso" | "constellation";
    data: StarData | DeepSkyObject | { con: string; stars: StarData[] };
  }) => void;
  targetFocus?: { x: number; y: number } | null;
}

const CX = 300;
const CY = 300;
const RADIUS = 250;

// Galactic plane reference trajectory points in equatorial coordinates (J2000)
const GALACTIC_PLANE_POINTS = [
  { ra: 17.5, dec: -28.0 }, // Galactic Center (Sagittarius)
  { ra: 18.2, dec: -14.0 }, // Scutum
  { ra: 19.0, dec: 6.0 },   // Aquila
  { ra: 19.8, dec: 22.0 },  // Vulpecula
  { ra: 20.6, dec: 42.0 },  // Cygnus
  { ra: 21.8, dec: 54.0 },  // Lacerta / Cepheus
  { ra: 23.5, dec: 60.0 },  // Cassiopeia
  { ra: 1.2, dec: 63.0 },   // Cassiopeia
  { ra: 2.8, dec: 58.0 },   // Perseus
  { ra: 4.0, dec: 48.0 },   // Auriga
  { ra: 5.2, dec: 36.0 },   // Auriga / Taurus
  { ra: 6.1, dec: 22.0 },   // Gemini
  { ra: 6.8, dec: 8.0 },    // Monoceros
  { ra: 7.4, dec: -6.0 },   // Canis Major
  { ra: 8.0, dec: -22.0 },  // Puppis / Vela
];

export function SkyMapPlanisphere2D({
  stars,
  constellationLines,
  deepSkyObjects,
  showConstellations,
  showLabels,
  showDso,
  showHorizon,
  showGrid,
  showMilkyWay,
  minMagLimit = 6.0,
  lstHours,
  latitude,
  selectedId,
  onSelectObject,
  targetFocus,
}: SkyMapPlanisphere2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan transformation state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Hover state
  const [hoveredItem, setHoveredItem] = useState<{
    type: "star" | "dso" | "constellation";
    title: string;
    subtitle: string;
    details: string;
    x: number;
    y: number;
  } | null>(null);

  // Reset or focus when target changes
  useEffect(() => {
    if (targetFocus) {
      // Pan so that targetFocus is at CX, CY
      const dx = (CX - targetFocus.x) * 1.5;
      const dy = (CY - targetFocus.y) * 1.5;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPan({ x: dx, y: dy });
      setZoom(1.8);
    }
  }, [targetFocus]);

  // Handle Zoom In / Out / Reset
  const handleZoomIn = () => setZoom((z) => Math.min(3.5, Number((z * 1.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.9, Number((z / 1.25).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((z) => Math.min(3.5, Math.max(0.9, Number((z * factor).toFixed(2)))));
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch drag & pinch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / touchDistanceRef.current;
      setZoom((z) => Math.min(3.5, Math.max(0.9, Number((z * ratio).toFixed(2)))));
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Map stars by id
  const starsMap = useMemo(() => {
    const map = new Map<string, StarData>();
    for (const s of stars) {
      map.set(s.id, s);
    }
    return map;
  }, [stars]);

  // Projected stars with magnitude filter
  const projectedStars = useMemo(() => {
    return stars.map((star) => {
      const alt = star.horizontal?.alt ?? -90;
      const az = star.horizontal?.az ?? 0;
      const proj = horizontalToPlanisphere2D(alt, az, CX, CY, RADIUS);
      // Realistic size scaling
      const r = Math.max(1.4, 5.2 - star.mag * 0.72);
      const isVisible = proj.visible && star.mag <= minMagLimit;
      return {
        star,
        ...proj,
        visible: isVisible,
        r,
      };
    });
  }, [stars, minMagLimit]);

  // Visible constellation lines
  const visibleLines = useMemo(() => {
    if (!showConstellations) return [];

    const lines: Array<{
      key: string;
      con: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isSelected: boolean;
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
            con: conKey,
            x1: pA.x,
            y1: pA.y,
            x2: pB.x,
            y2: pB.y,
            isSelected: selectedId === conKey || selectedId === aId || selectedId === bId,
          });
        }
      }
    }
    return lines;
  }, [showConstellations, constellationLines, starsMap, selectedId]);

  // Constellation centers for labels
  const constellationCenters = useMemo(() => {
    if (!showConstellations) return [];

    const conGroups: Record<string, { stars: StarData[]; pts: Array<{ x: number; y: number }> }> = {};
    for (const ps of projectedStars) {
      if (ps.visible && ps.star.con) {
        if (!conGroups[ps.star.con]) {
          conGroups[ps.star.con] = { stars: [], pts: [] };
        }
        conGroups[ps.star.con].pts.push({ x: ps.x, y: ps.y });
        conGroups[ps.star.con].stars.push(ps.star);
      }
    }

    const centers: Array<{ con: string; name: string; stars: StarData[]; x: number; y: number }> = [];
    for (const [con, group] of Object.entries(conGroups)) {
      if (group.pts.length >= 2) {
        const avgX = group.pts.reduce((sum, p) => sum + p.x, 0) / group.pts.length;
        const avgY = group.pts.reduce((sum, p) => sum + p.y, 0) / group.pts.length;
        centers.push({
          con,
          name: CONSTELLATION_NAMES_PL[con] || con,
          stars: group.stars,
          x: avgX,
          y: avgY,
        });
      }
    }
    return centers;
  }, [showConstellations, projectedStars]);

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

  // Dynamic Milky Way curve projected in real time
  const milkyWayPath = useMemo(() => {
    if (!showMilkyWay) return "";

    const visiblePoints = GALACTIC_PLANE_POINTS.map((pt) => {
      const horiz = equatorialToHorizontal(pt, latitude, lstHours);
      const proj = horizontalToPlanisphere2D(horiz.alt, horiz.az, CX, CY, RADIUS);
      return {
        ...proj,
        alt: horiz.alt,
      };
    }).filter((p) => p.alt > -5); // Include points slightly below horizon for continuity

    if (visiblePoints.length < 2) return "";

    let path = `M ${visiblePoints[0].x.toFixed(1)} ${visiblePoints[0].y.toFixed(1)}`;
    for (let i = 1; i < visiblePoints.length; i++) {
      const prev = visiblePoints[i - 1];
      const curr = visiblePoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      path += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
    }
    const last = visiblePoints[visiblePoints.length - 1];
    path += ` T ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;

    return path;
  }, [showMilkyWay, latitude, lstHours]);

  // Radii for altitude rings (15°, 30°, 45°, 60°, 75°)
  const r15 = RADIUS * ((90 - 15) / 90);
  const r30 = RADIUS * ((90 - 30) / 90);
  const r45 = RADIUS * ((90 - 45) / 90);
  const r60 = RADIUS * ((90 - 60) / 90);
  const r75 = RADIUS * ((90 - 75) / 90);

  // Compass tick marks around the horizon ring
  const compassTicks = useMemo(() => {
    const ticks: Array<{ x1: number; y1: number; x2: number; y2: number; isMajor: boolean; angle: number }> = [];
    for (let deg = 0; deg < 360; deg += 5) {
      const theta = ((deg - 90) * Math.PI) / 180;
      const isMajor = deg % 30 === 0;
      const isMedium = deg % 15 === 0;
      const tickLen = isMajor ? 8 : isMedium ? 5 : 3;
      const rInner = RADIUS - tickLen;
      const rOuter = RADIUS;

      ticks.push({
        x1: CX + rInner * Math.cos(theta),
        y1: CY + rInner * Math.sin(theta),
        x2: CX + rOuter * Math.cos(theta),
        y2: CY + rOuter * Math.sin(theta),
        isMajor,
        angle: deg,
      });
    }
    return ticks;
  }, []);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full flex items-center justify-center select-none bg-[#050508] overflow-hidden ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Floating Interactive Canvas Controls */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-zinc-950/80 p-1.5 shadow-2xl backdrop-blur-xl pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Przybliż (Kółko myszy do góry)"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Oddal (Kółko myszy w dół)"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Zresetuj widok i wycentruj Zenit"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <div className="text-[10px] font-mono text-zinc-400 text-center py-0.5 border-t border-white/10">
          {zoom.toFixed(1)}x
        </div>
      </div>

      {/* SVG Celestial Planisphere */}
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full max-w-[850px] max-h-[850px] aspect-square transition-transform duration-75 ease-out"
      >
        <defs>
          {/* Horizon Clip Circle */}
          <clipPath id="horizon-clip">
            <circle cx={CX} cy={CY} r={RADIUS} />
          </clipPath>

          {/* Deep Space Sky Gradient */}
          <radialGradient id="sky-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0c111d" />
            <stop offset="45%" stopColor="#080c14" />
            <stop offset="85%" stopColor="#04060a" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Atmospheric Glow near Horizon */}
          <radialGradient id="horizon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="transparent" />
            <stop offset="97%" stopColor="rgba(40, 70, 110, 0.12)" />
            <stop offset="100%" stopColor="rgba(80, 120, 180, 0.22)" />
          </radialGradient>

          {/* Milky Way Soft Glow Filter */}
          <filter id="milky-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
          </filter>

          {/* Bright Star Flare Filter */}
          <filter id="star-flare" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Reticle Glow */}
          <filter id="reticle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Background Frame */}
        <rect width="600" height="600" fill="#050508" />

        {/* Master Scalable Sky Group (Transformed with Zoom & Pan) */}
        <g
          transform={`translate(${CX + pan.x}, ${CY + pan.y}) scale(${zoom}) translate(${-CX}, ${-CY})`}
          className="transition-[transform] duration-75"
        >
          {/* Deep Sky Disk */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="url(#sky-gradient)"
            stroke="#27272a"
            strokeWidth="1.5"
          />

          {/* Atmospheric Glow at Horizon */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="url(#horizon-glow)"
          />

          {/* Milky Way Layer (Dynamic & Clipped to Horizon) */}
          {showMilkyWay && milkyWayPath && (
            <g clipPath="url(#horizon-clip)" className="pointer-events-none">
              {/* Diffuse Outer Glow */}
              <path
                d={milkyWayPath}
                fill="none"
                stroke="rgba(140, 180, 240, 0.16)"
                strokeWidth="48"
                strokeLinecap="round"
                filter="url(#milky-blur)"
              />
              {/* Core Haze */}
              <path
                d={milkyWayPath}
                fill="none"
                stroke="rgba(200, 225, 255, 0.22)"
                strokeWidth="24"
                strokeLinecap="round"
                filter="url(#milky-blur)"
              />
              {/* Subtle Milky Way Star Dust Particles */}
              <path
                d={milkyWayPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="12"
                strokeDasharray="1 6"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Horizontal Coordinate Grid (Alt / Az) */}
          {showGrid && (
            <g className="transition-opacity duration-300 pointer-events-none">
              {/* Concentric Altitude Rings */}
              <circle
                cx={CX}
                cy={CY}
                r={r75}
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeDasharray="2 3"
                strokeWidth="0.75"
              />
              <circle
                cx={CX}
                cy={CY}
                r={r60}
                fill="none"
                stroke="rgba(255, 255, 255, 0.09)"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <circle
                cx={CX}
                cy={CY}
                r={r45}
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeDasharray="2 3"
                strokeWidth="0.75"
              />
              <circle
                cx={CX}
                cy={CY}
                r={r30}
                fill="none"
                stroke="rgba(255, 255, 255, 0.09)"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <circle
                cx={CX}
                cy={CY}
                r={r15}
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeDasharray="2 3"
                strokeWidth="0.75"
              />

              {/* Altitude Numeric Labels along North Meridian */}
              <text x={CX + 3} y={CY - r75 + 9} fill="#52525b" fontSize="8" fontFamily="monospace">
                75°
              </text>
              <text x={CX + 3} y={CY - r60 + 9} fill="#71717a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                60°
              </text>
              <text x={CX + 3} y={CY - r45 + 9} fill="#52525b" fontSize="8" fontFamily="monospace">
                45°
              </text>
              <text x={CX + 3} y={CY - r30 + 9} fill="#71717a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                30°
              </text>
              <text x={CX + 3} y={CY - r15 + 9} fill="#52525b" fontSize="8" fontFamily="monospace">
                15°
              </text>

              {/* Local Celestial Meridian: North to South line */}
              <line
                x1={CX}
                y1={CY - RADIUS}
                x2={CX}
                y2={CY + RADIUS}
                stroke="rgba(255, 255, 255, 0.14)"
                strokeDasharray="4 4"
                strokeWidth="0.9"
              />
              {/* Prime Vertical: East to West line */}
              <line
                x1={CX - RADIUS}
                y1={CY}
                x2={CX + RADIUS}
                y2={CY}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeDasharray="3 4"
                strokeWidth="0.8"
              />

              {/* Diagonal Spokes (NE-SW, NW-SE) */}
              <line
                x1={CX - RADIUS * 0.707}
                y1={CY - RADIUS * 0.707}
                x2={CX + RADIUS * 0.707}
                y2={CY + RADIUS * 0.707}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="2 5"
                strokeWidth="0.7"
              />
              <line
                x1={CX - RADIUS * 0.707}
                y1={CY + RADIUS * 0.707}
                x2={CX + RADIUS * 0.707}
                y2={CY - RADIUS * 0.707}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="2 5"
                strokeWidth="0.7"
              />

              {/* Central Zenith Target */}
              <circle cx={CX} cy={CY} r="3" fill="none" stroke="#a1a1aa" strokeWidth="0.9" />
              <line x1={CX - 7} y1={CY} x2={CX + 7} y2={CY} stroke="#a1a1aa" strokeWidth="0.9" />
              <line x1={CX} y1={CY - 7} x2={CX} y2={CY + 7} stroke="#a1a1aa" strokeWidth="0.9" />
              <text
                x={CX + 7}
                y={CY - 7}
                fill="#a1a1aa"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.05em"
              >
                ZENIT (90°)
              </text>
            </g>
          )}

          {/* Clipped Celestial Bodies (Inside Horizon Ring) */}
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
                    stroke={
                      line.isSelected
                        ? "#ffffff"
                        : "rgba(160, 200, 255, 0.32)"
                    }
                    strokeWidth={line.isSelected ? 1.8 : 1.1}
                    strokeDasharray="none"
                    className="transition-colors duration-200"
                  />
                ))}
              </g>
            )}

            {/* Constellation Polish Labels & Interactive Buttons */}
            {showConstellations &&
              showLabels &&
              constellationCenters.map((c) => {
                const isSelected = selectedId === c.con;
                return (
                  <g
                    key={c.con}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectObject({
                        type: "constellation",
                        data: { con: c.con, stars: c.stars },
                      });
                    }}
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: "constellation",
                        title: c.name,
                        subtitle: `Gwiazdozbiór (${c.con})`,
                        details: `${c.stars.length} gwiazd w katalogu`,
                        x: c.x,
                        y: c.y,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Subtle label background chip for crystal clear legibility */}
                    <rect
                      x={c.x - (c.name.length * 2.8 + 6)}
                      y={c.y - 7}
                      width={c.name.length * 5.6 + 12}
                      height="14"
                      rx="4"
                      fill={isSelected ? "rgba(255, 255, 255, 0.2)" : "rgba(10, 14, 24, 0.65)"}
                      stroke={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.15)"}
                      strokeWidth="0.8"
                      className="transition-all group-hover:fill-white/20 group-hover:stroke-white/40"
                    />
                    <text
                      x={c.x}
                      y={c.y + 3}
                      fill={isSelected ? "#ffffff" : "rgba(220, 235, 255, 0.85)"}
                      fontSize="8.5"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none pointer-events-none uppercase tracking-wider transition-colors"
                    >
                      {c.name}
                    </text>
                  </g>
                );
              })}

            {/* Deep Sky Objects (Messier objects) */}
            {showDso && (
              <g className="transition-opacity duration-300">
                {projectedDso.map(({ dso, x, y }) => {
                  const isSelected = selectedId === dso.id;
                  return (
                    <g
                      key={dso.id}
                      data-testid={`dso-${dso.id}`}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectObject({
                          type: "dso",
                          data: dso,
                        });
                      }}
                      onMouseEnter={() =>
                        setHoveredItem({
                          type: "dso",
                          title: dso.namePl,
                          subtitle: `${dso.id} • ${dso.nameEn}`,
                          details: `Alt: ${dso.horizontal?.alt.toFixed(1)}° | Az: ${dso.horizontal?.az.toFixed(0)}° | ${dso.mag.toFixed(1)}m`,
                          x,
                          y,
                        })
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {/* Spiral Galaxy Representation (e.g. M31) */}
                      {dso.type === "spiral_galaxy" ? (
                        <g transform={`rotate(-30 ${x} ${y})`}>
                          <ellipse
                            cx={x}
                            cy={y}
                            rx="11"
                            ry="5"
                            fill="rgba(160, 200, 255, 0.15)"
                            stroke={isSelected ? "#ffffff" : "rgba(180, 220, 255, 0.8)"}
                            strokeWidth="1.2"
                            strokeDasharray="2 2"
                          />
                          <circle cx={x} cy={y} r="2" fill="#ffffff" />
                        </g>
                      ) : dso.type === "diffuse_nebula" ? (
                        /* Diffuse Nebula (e.g. M42) */
                        <g>
                          <rect
                            x={x - 6}
                            y={y - 6}
                            width="12"
                            height="12"
                            rx="2"
                            fill="rgba(255, 140, 180, 0.15)"
                            stroke={isSelected ? "#ffffff" : "rgba(255, 160, 200, 0.8)"}
                            strokeWidth="1.2"
                            transform={`rotate(45 ${x} ${y})`}
                          />
                          <circle cx={x} cy={y} r="1.8" fill="#ffffff" />
                        </g>
                      ) : (
                        /* Open / Globular Cluster (e.g. M45 Pleiades) */
                        <g>
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill="rgba(255, 255, 255, 0.08)"
                            stroke={isSelected ? "#ffffff" : "#a1a1aa"}
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle cx={x - 3} cy={y - 2} r="1.2" fill="#ffffff" />
                          <circle cx={x + 3} cy={y - 1} r="1.2" fill="#ffffff" />
                          <circle cx={x} cy={y + 3} r="1.4" fill="#ffffff" />
                        </g>
                      )}

                      {/* Selected Reticle Highlight */}
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r="15"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          filter="url(#reticle-glow)"
                          className="animate-spin origin-center"
                          style={{ transformOrigin: `${x}px ${y}px`, animationDuration: "10s" }}
                        />
                      )}

                      {/* DSO Label */}
                      {showLabels && (
                        <text
                          x={x + 10}
                          y={y + 3}
                          fill={isSelected ? "#ffffff" : "#d4d4d8"}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          className="select-none pointer-events-none drop-shadow"
                        >
                          {dso.id}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Stars Layer */}
            <g>
              {projectedStars
                .filter((p) => p.visible)
                .map(({ star, x, y, r }) => {
                  const isSelected = selectedId === star.id;
                  const isVeryBright = star.mag <= 1.2;
                  const isMediumBright = star.mag <= 2.4;

                  return (
                    <g
                      key={star.id}
                      data-testid={`star-${star.id}`}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectObject({
                          type: "star",
                          data: star,
                        });
                      }}
                      onMouseEnter={() =>
                        setHoveredItem({
                          type: "star",
                          title: star.name,
                          subtitle: `${star.bayer} • ${CONSTELLATION_NAMES_PL[star.con] || star.con}`,
                          details: `Alt: ${star.horizontal?.alt.toFixed(1)}° | Az: ${star.horizontal?.az.toFixed(0)}° | ${star.mag.toFixed(2)}m`,
                          x,
                          y,
                        })
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {/* Diffraction Spikes for 1st Magnitude Superstars */}
                      {isVeryBright && (
                        <g className="pointer-events-none opacity-80" stroke={star.color} strokeWidth="0.8">
                          <line x1={x - r * 3.8} y1={y} x2={x + r * 3.8} y2={y} />
                          <line x1={x} y1={y - r * 3.8} x2={x} y2={y + r * 3.8} />
                        </g>
                      )}

                      {/* Soft Outer Halo Aura */}
                      {(isVeryBright || isMediumBright) && (
                        <circle
                          cx={x}
                          cy={y}
                          r={r * (isVeryBright ? 2.6 : 1.8)}
                          fill={star.color}
                          opacity={isVeryBright ? 0.35 : 0.2}
                          filter="url(#star-flare)"
                        />
                      )}

                      {/* Star Core Disk */}
                      <circle
                        cx={x}
                        cy={y}
                        r={r}
                        fill={star.color}
                        stroke={isSelected ? "#ffffff" : "none"}
                        strokeWidth={isSelected ? 1.5 : 0}
                      />

                      {/* Animated Selected Reticle Ring */}
                      {isSelected && (
                        <g className="pointer-events-none" filter="url(#reticle-glow)">
                          <circle
                            cx={x}
                            cy={y}
                            r={r + 6}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          {/* Corner alignment ticks */}
                          <line x1={x - r - 9} y1={y} x2={x - r - 4} y2={y} stroke="#ffffff" strokeWidth="1.5" />
                          <line x1={x + r + 4} y1={y} x2={x + r + 9} y2={y} stroke="#ffffff" strokeWidth="1.5" />
                          <line x1={x} y1={y - r - 9} x2={x} y2={y - r - 4} stroke="#ffffff" strokeWidth="1.5" />
                          <line x1={x} y1={y + r + 4} x2={x} y2={y + r + 9} stroke="#ffffff" strokeWidth="1.5" />
                        </g>
                      )}

                      {/* Star Name Label */}
                      {showLabels && star.mag <= 2.2 && (
                        <text
                          x={x + r + 3.5}
                          y={y + 3}
                          fill={isSelected ? "#ffffff" : "#f4f4f5"}
                          fontSize={star.mag <= 1.0 ? "10" : "8.5"}
                          fontFamily="sans-serif"
                          fontWeight={star.mag <= 1.0 ? "bold" : "normal"}
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

          {/* Compass Horizon Ring & Tick Marks */}
          {showHorizon && (
            <g className="pointer-events-none">
              {/* Main Outer Rim */}
              <circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                fill="none"
                stroke="#52525b"
                strokeWidth="2.2"
              />

              {/* Ticks along the horizon circle */}
              {compassTicks.map((t, i) => (
                <line
                  key={i}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isMajor ? "#a1a1aa" : "#52525b"}
                  strokeWidth={t.isMajor ? 1.5 : 0.8}
                />
              ))}
            </g>
          )}

          {/* 8 Cardinal Points & Azimuth Labels */}
          {showHorizon && (
            <g className="font-mono select-none pointer-events-none">
              {/* North (0°) */}
              <g transform={`translate(${CX}, ${CY - RADIUS - 14})`}>
                <circle cx="0" cy="-3" r="10" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
                <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                  N
                </text>
                <text x="0" y="13" textAnchor="middle" fill="#a1a1aa" fontSize="8">
                  PÓŁNOC (0°)
                </text>
              </g>

              {/* North-East (45°) */}
              <g transform={`translate(${CX + RADIUS * 0.707 + 10}, ${CY - RADIUS * 0.707 - 10})`}>
                <text x="0" y="0" textAnchor="start" fill="#71717a" fontSize="10" fontWeight="bold">
                  NE 45°
                </text>
              </g>

              {/* East (90°) */}
              <g transform={`translate(${CX + RADIUS + 18}, ${CY})`}>
                <circle cx="0" cy="-3" r="10" fill="#09090b" stroke="#71717a" strokeWidth="1.2" />
                <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                  E
                </text>
                <text x="0" y="12" textAnchor="middle" fill="#71717a" fontSize="7.5">
                  WSCHÓD (90°)
                </text>
              </g>

              {/* South-East (135°) */}
              <g transform={`translate(${CX + RADIUS * 0.707 + 10}, ${CY + RADIUS * 0.707 + 12})`}>
                <text x="0" y="0" textAnchor="start" fill="#71717a" fontSize="10" fontWeight="bold">
                  SE 135°
                </text>
              </g>

              {/* South (180°) */}
              <g transform={`translate(${CX}, ${CY + RADIUS + 20})`}>
                <circle cx="0" cy="-3" r="10" fill="#09090b" stroke="#71717a" strokeWidth="1.2" />
                <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                  S
                </text>
                <text x="0" y="13" textAnchor="middle" fill="#71717a" fontSize="8">
                  POŁUDNIE (180°)
                </text>
              </g>

              {/* South-West (225°) */}
              <g transform={`translate(${CX - RADIUS * 0.707 - 10}, ${CY + RADIUS * 0.707 + 12})`}>
                <text x="0" y="0" textAnchor="end" fill="#71717a" fontSize="10" fontWeight="bold">
                  SW 225°
                </text>
              </g>

              {/* West (270°) */}
              <g transform={`translate(${CX - RADIUS - 18}, ${CY})`}>
                <circle cx="0" cy="-3" r="10" fill="#09090b" stroke="#71717a" strokeWidth="1.2" />
                <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                  W
                </text>
                <text x="0" y="12" textAnchor="middle" fill="#71717a" fontSize="7.5">
                  ZACHÓD (270°)
                </text>
              </g>

              {/* North-West (315°) */}
              <g transform={`translate(${CX - RADIUS * 0.707 - 10}, ${CY - RADIUS * 0.707 - 10})`}>
                <text x="0" y="0" textAnchor="end" fill="#71717a" fontSize="10" fontWeight="bold">
                  NW 315°
                </text>
              </g>
            </g>
          )}

          {/* Interactive Hover Tooltip */}
          {hoveredItem && (
            <g
              transform={`translate(${Math.min(
                Math.max(hoveredItem.x, 80),
                520
              )}, ${Math.max(hoveredItem.y - 42, 28)})`}
              className="pointer-events-none transition-all duration-100"
            >
              <rect
                x="-75"
                y="-24"
                width="150"
                height="44"
                rx="8"
                fill="rgba(9, 9, 11, 0.94)"
                stroke="rgba(255, 255, 255, 0.22)"
                strokeWidth="1"
                filter="url(#reticle-glow)"
              />
              <text
                x="0"
                y="-9"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11.5"
                fontWeight="bold"
              >
                {hoveredItem.title}
              </text>
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="9"
              >
                {hoveredItem.subtitle}
              </text>
              <text
                x="0"
                y="14"
                textAnchor="middle"
                fill="#60a5fa"
                fontSize="8.5"
                fontFamily="monospace"
              >
                {hoveredItem.details}
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
