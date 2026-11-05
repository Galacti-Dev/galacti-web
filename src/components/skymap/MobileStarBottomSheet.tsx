"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Info,
  Target,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { StarData, DeepSkyObject } from "@/lib/types";
import { CONSTELLATION_NAMES_PL } from "@/lib/astronomyMath";
import { AltitudeTimeChart } from "./AltitudeTimeChart";

export type SheetSnapState = "peek" | "half" | "full";

const CONSTELLATION_DESCRIPTIONS: Record<string, string> = {
  UMa: "Wielka Niedźwiedzica – jeden z najbardziej znanych gwiazdozbiorów nieba północnego. Siedem najjaśniejszych gwiazd tworzy charakterystyczny asteryzm Wielkiego Wozu, służący do odnajdywania Gwiazdy Polarnej.",
  UMi: "Mała Niedźwiedzica – gwiazdozbiór okołobiegunowy. Na końcu dyszla Małego Wozu znajduje się Gwiazda Polarna (Polaris), wyznaczająca północny biegun nieba.",
  Cas: "Kasjopeja – charakterystyczny układ gwiazd w kształcie litery 'W' lub 'M', leżący bezpośrednio w jasnym paśmie Drogi Mlecznej.",
  Ori: "Orion – majestatyczny gwiazdozbiór zimowego nieba, zawierający jasnego czerwonego nadolbrzyma Betelgezę, błękitnego Rigela oraz słynny Pas Oriona z Wielką Mgławicą M42.",
  Cyg: "Łabędź (Krzyż Północy) – dominujący gwiazdozbiór letniego nieba. Jego najjaśniejsza gwiazda Deneb tworzy wraz z Wegą i Altairem słynny Trójkąt Letni.",
  Gem: "Bliźnięta – gwiazdozbiór zodiakalny z dwiema jasnymi gwiazdami bliźniaczymi: Kastorem i Polluksem. Radiant grudniowego roju Geminidów.",
  Leo: "Lew – wiosenny gwiazdozbiór z jasną gwiazdą Regulus. Kształtem przypomina leżącego lwa lub odwrócony znak zapytania.",
  Tau: "Byk – zodiakalna konstelacja zawierająca pomarańczowego olbrzyma Aldebarana oraz dwie wspaniałe gromady otwarte: Plejady (M45) i Hiady.",
  Lyr: "Lutnia – niewielki, ale wyrazisty gwiazdozbiór z jedną z najjaśniejszych gwiazd nocnego nieba: szafirowo-białą Wegą.",
  Her: "Herkules – rozległy gwiazdozbiór zawierający jedną z najwspanialszych gromad kulistych północnego nieba: Wielką Gromadę w Herkulesie (M13).",
  Peg_And: "Pegaz i Andromeda – wielki kwadrat Pegaza połączony z łańcuchem gwiazd Andromedy, w której znajduje się słynna galaktyka M31.",
  And: "Andromeda – gwiazdozbiór sąsiadujący z Pegazem i Kasjopeją, kryjący Wielką Galaktykę Andromedy (M31).",
};

function triggerHaptic(duration = 18) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // ignore
    }
  }
}

function getCompassBearing(az: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  const index = Math.round((az % 360) / 45);
  return directions[index];
}

interface MobileStarBottomSheetProps {
  selectedObject: {
    type: "star" | "dso" | "constellation";
    data: StarData | DeepSkyObject | { con: string; stars: StarData[] };
  } | null;
  onClose: () => void;
  lat?: number;
  lon?: number;
  simulatedTime?: Date;
  isNightVision?: boolean;
  onFocusObject?: () => void;
}

export function MobileStarBottomSheet({
  selectedObject,
  onClose,
  lat = 52.23,
  lon = 21.01,
  simulatedTime = new Date(),
  isNightVision = false,
  onFocusObject,
}: MobileStarBottomSheetProps) {
  const [snap, setSnap] = useState<SheetSnapState>("peek");
  const [activeTab, setActiveTab] = useState<"info" | "altitude">("info");

  // Touch tracking for drag gestures
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // When selected object changes, open in peek mode or preserve current view
  const lastSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedObject) {
      lastSelectedIdRef.current = null;
      return;
    }
    const currentId =
      selectedObject.type === "star"
        ? (selectedObject.data as StarData).id
        : selectedObject.type === "dso"
        ? (selectedObject.data as DeepSkyObject).id
        : (selectedObject.data as { con: string }).con;

    if (currentId !== lastSelectedIdRef.current) {
      lastSelectedIdRef.current = currentId;
      triggerHaptic(20);
    }
  }, [selectedObject]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;
    // Allow dragging down or up with dampening
    setDragOffset(deltaY);
  };

  const handleTouchEnd = () => {
    if (touchStartY === null) return;
    setIsDragging(false);

    // Dragging DOWN
    if (dragOffset > 45) {
      if (snap === "full") {
        setSnap("half");
        triggerHaptic(15);
      } else if (snap === "half") {
        setSnap("peek");
        triggerHaptic(15);
      } else if (snap === "peek") {
        triggerHaptic(25);
        onClose();
      }
    }
    // Dragging UP
    else if (dragOffset < -35) {
      if (snap === "peek") {
        setSnap("half");
        triggerHaptic(15);
      } else if (snap === "half") {
        setSnap("full");
        triggerHaptic(15);
      }
    }

    setTouchStartY(null);
    setDragOffset(0);
  };

  const cycleSnap = useCallback(() => {
    triggerHaptic(15);
    if (snap === "peek") setSnap("half");
    else if (snap === "half") setSnap("full");
    else setSnap("peek");
  }, [snap]);

  if (!selectedObject) return null;

  const { type, data } = selectedObject;

  // Derive common object fields
  let title = "";
  let subtitle = "";
  let magText = "";
  let altText = "—";
  let azText = "—";
  let compass = "";
  let isVisibleAboveHorizon = false;
  let ra = 0;
  let dec = 0;
  let dotColor = "#ffffff";
  let description = "";

  if (type === "star") {
    const star = data as StarData;
    title = star.name;
    const conName = CONSTELLATION_NAMES_PL[star.con] || star.con;
    subtitle = `${star.bayer} • ${conName}`;
    magText = `${star.mag.toFixed(2)} mag`;
    dotColor = isNightVision ? "#ff4444" : star.color;
    ra = star.ra;
    dec = star.dec;
    if (star.horizontal) {
      altText = `${star.horizontal.alt > 0 ? "+" : ""}${star.horizontal.alt.toFixed(1)}°`;
      azText = `${star.horizontal.az.toFixed(0)}°`;
      compass = getCompassBearing(star.horizontal.az);
      isVisibleAboveHorizon = star.horizontal.alt > 0;
    }
    description =
      CONSTELLATION_DESCRIPTIONS[star.con] ||
      `Gwiazda ${star.name} należąca do gwiazdozbioru ${conName}. Typ widmowy ${star.spec}.`;
  } else if (type === "dso") {
    const dso = data as DeepSkyObject;
    title = `${dso.id} – ${dso.namePl}`;
    const conName = CONSTELLATION_NAMES_PL[dso.con] || dso.con;
    subtitle = `${dso.nameEn} • ${conName}`;
    magText = `${dso.mag.toFixed(1)} mag`;
    dotColor = isNightVision ? "#ff4444" : "#60a5fa";
    ra = dso.ra;
    dec = dso.dec;
    if (dso.horizontal) {
      altText = `${dso.horizontal.alt > 0 ? "+" : ""}${dso.horizontal.alt.toFixed(1)}°`;
      azText = `${dso.horizontal.az.toFixed(0)}°`;
      compass = getCompassBearing(dso.horizontal.az);
      isVisibleAboveHorizon = dso.horizontal.alt > 0;
    }
    description = dso.descriptionPl || `${dso.namePl} (${dso.nameEn}) w gwiazdozbiorze ${conName}.`;
  } else {
    const conObj = data as { con: string; stars: StarData[] };
    const conName = CONSTELLATION_NAMES_PL[conObj.con] || conObj.con;
    title = conName;
    subtitle = `Gwiazdozbiór (${conObj.con})`;
    magText = `${conObj.stars.length} gwiazd`;
    dotColor = isNightVision ? "#ff4444" : "#ffffff";
    description =
      CONSTELLATION_DESCRIPTIONS[conObj.con] ||
      `Gwiazdozbiór ${conName} widoczny na niebie północnym.`;
  }

  // Height and translate styling per snap state
  const heightClasses =
    snap === "peek"
      ? "h-[68px]"
      : snap === "half"
      ? "h-[44vh] max-h-[380px]"
      : "h-[84vh] max-h-[720px]";

  const containerBg = isNightVision
    ? "bg-[#0d0000]/98 border-red-900/60 text-red-200 shadow-red-950/50"
    : "bg-zinc-950/95 border-white/20 text-zinc-100 shadow-black/80";

  const handlePillBg = isNightVision ? "bg-red-500/40" : "bg-white/30";
  const chipBg = isNightVision
    ? "bg-red-950/40 border-red-900/50 text-red-300"
    : "bg-white/5 border-white/10 text-zinc-300";
  const primaryText = isNightVision ? "text-red-100" : "text-white";
  const secondaryText = isNightVision ? "text-red-400" : "text-zinc-400";
  const accentAlt = isNightVision ? "text-red-400" : "text-emerald-400";

  return (
    <div
      ref={sheetRef}
      role="region"
      aria-label={`Arkusz obiektu: ${title}`}
      className={`sm:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-3xl border-t border-x backdrop-blur-2xl shadow-2xl transition-all duration-300 ease-out select-none touch-none ${heightClasses} ${containerBg}`}
      style={{
        transform: isDragging
          ? `translateY(${Math.max(-30, Math.min(120, dragOffset))}px)`
          : "translateY(0)",
      }}
    >
      {/* Drag Handle & Gesture Header Area */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={cycleSnap}
        className="w-full pt-2 pb-1.5 flex flex-col items-center cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className={`h-1 w-12 rounded-full ${handlePillBg} transition-colors`} />
      </div>

      {/* ======================================================== */}
      {/* 1. PEEK VIEW SNAP (~68px)                                */}
      {/* ======================================================== */}
      {snap === "peek" && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={cycleSnap}
          className="flex-1 px-4 pb-3 flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className="h-3 w-3 rounded-full shrink-0 shadow-sm ring-2 ring-white/20"
              style={{ backgroundColor: dotColor }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className={`font-bold text-sm truncate ${primaryText}`}>{title}</span>
                <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.2 rounded border ${chipBg}`}>
                  {magText}
                </span>
              </div>
              <div className={`text-[11px] truncate ${secondaryText}`}>
                {altText !== "—" ? (
                  <span>
                    Alt <strong className={accentAlt}>{altText}</strong> • Az {azText} ({compass})
                  </span>
                ) : (
                  <span>{subtitle}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Peek Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onFocusObject && (
              <button
                onClick={() => {
                  triggerHaptic(20);
                  onFocusObject();
                }}
                title="Wycentruj na niebie"
                className={`p-1.5 rounded-lg border transition-colors ${chipBg}`}
              >
                <Target className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => {
                triggerHaptic(15);
                setSnap("half");
              }}
              title="Rozwiń arkusz"
              className={`p-1.5 rounded-lg border transition-colors ${chipBg}`}
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic(20);
                onClose();
              }}
              title="Zamknij"
              className={`p-1.5 rounded-lg border transition-colors ${chipBg}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. HALF & FULL VIEW SNAP CONTENT                         */}
      {/* ======================================================== */}
      {snap !== "peek" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4">
          {/* Header Row */}
          <div className="flex items-start justify-between border-b pb-2 mb-2 border-white/10 shrink-0">
            <div className="flex-1 pr-2 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: dotColor }}
                />
                <h3 className={`text-base font-bold truncate ${primaryText}`}>{title}</h3>
              </div>
              <span className={`text-xs block truncate mt-0.5 ${secondaryText}`}>{subtitle}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onFocusObject && (
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    onFocusObject();
                  }}
                  title="Wycentruj w celowniku"
                  className={`p-1.5 rounded-lg border transition-colors ${chipBg}`}
                >
                  <Target className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => {
                  triggerHaptic(15);
                  setSnap(snap === "full" ? "half" : "full");
                }}
                title={snap === "full" ? "Zmniejsz arkusz" : "Maksymalizuj arkusz"}
                className={`p-1.5 rounded-lg border transition-colors ${chipBg}`}
              >
                {snap === "full" ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  setSnap("peek");
                }}
                title="Zwiń do paska"
                className={`p-1.5 rounded-lg border transition-colors ${chipBg}`}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  onClose();
                }}
                title="Zamknij"
                className={`p-1.5 rounded-lg border transition-colors ${chipBg}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar (Always in Half & Full) */}
          <div className="grid grid-cols-3 gap-2 shrink-0 mb-2">
            <div className={`rounded-xl p-2 text-center border ${chipBg}`}>
              <span className="text-[9px] uppercase tracking-wider block font-mono opacity-75">
                Wysokość (Alt)
              </span>
              <span className={`text-xs font-bold ${accentAlt}`}>{altText}</span>
            </div>
            <div className={`rounded-xl p-2 text-center border ${chipBg}`}>
              <span className="text-[9px] uppercase tracking-wider block font-mono opacity-75">
                Azymut (Az)
              </span>
              <span className={`text-xs font-bold ${primaryText}`}>
                {azText} ({compass})
              </span>
            </div>
            <div className={`rounded-xl p-2 text-center border ${chipBg}`}>
              <span className="text-[9px] uppercase tracking-wider block font-mono opacity-75">
                Jasność
              </span>
              <span className={`text-xs font-bold ${primaryText}`}>{magText}</span>
            </div>
          </div>

          {/* ================= HALF SNAP VIEW BODY ================= */}
          {snap === "half" && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-2">
                {/* Visibility Status Pill */}
                <div className={`rounded-xl p-2.5 border text-xs flex items-center justify-between ${chipBg}`}>
                  <span className="font-medium">Status widoczności:</span>
                  <span
                    className={`font-bold font-mono ${
                      isVisibleAboveHorizon ? accentAlt : "text-zinc-500"
                    }`}
                  >
                    {isVisibleAboveHorizon ? "Nad horyzontem" : "Pod horyzontem"}
                  </span>
                </div>

                {/* Short Description */}
                <p className={`text-xs leading-relaxed line-clamp-3 ${secondaryText}`}>
                  {description}
                </p>
              </div>

              {/* Action button to expand to Full & Altitude chart */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setSnap("full");
                    setActiveTab("altitude");
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md active:scale-98 ${
                    isNightVision
                      ? "bg-red-600 text-black border-red-500 shadow-red-950/50"
                      : "bg-white text-black border-white/20 shadow-white/10 hover:bg-zinc-200"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Otwórz wykres widoczności 24h & pełne dane</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= FULL SNAP VIEW BODY ================= */}
          {snap === "full" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Tabs Switcher */}
              <div className={`flex rounded-xl p-0.5 border mb-2.5 text-xs shrink-0 ${chipBg}`}>
                <button
                  onClick={() => {
                    triggerHaptic(10);
                    setActiveTab("info");
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === "info"
                      ? isNightVision
                        ? "bg-red-600 text-black shadow-sm"
                        : "bg-white text-black shadow-sm"
                      : secondaryText
                  }`}
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>Szczegóły obiektu</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(10);
                    setActiveTab("altitude");
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === "altitude"
                      ? isNightVision
                        ? "bg-red-600 text-black shadow-sm"
                        : "bg-white text-black shadow-sm"
                      : secondaryText
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Wykres 24h</span>
                </button>
              </div>

              {/* Tab content area - scrollable */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 touch-auto">
                {activeTab === "info" ? (
                  <>
                    {/* Equatorial Coordinates Card */}
                    <div className={`rounded-xl p-3 border text-xs space-y-1.5 font-mono ${chipBg}`}>
                      <div className="flex justify-between">
                        <span className="opacity-75">Rektascensja (RA):</span>
                        <span className={`font-bold ${primaryText}`}>{ra.toFixed(3)} h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Deklinacja (Dec):</span>
                        <span className={`font-bold ${primaryText}`}>
                          {dec > 0 ? `+${dec.toFixed(2)}°` : `${dec.toFixed(2)}°`}
                        </span>
                      </div>
                    </div>

                    {/* Scientific Lore and Details */}
                    <div className={`rounded-xl p-3 border text-xs space-y-1.5 ${chipBg}`}>
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] opacity-80">
                        <Sparkles className="h-3 w-3" />
                        <span>Opis astronomiczny</span>
                      </div>
                      <p className={`leading-relaxed ${secondaryText}`}>{description}</p>
                    </div>

                    {/* Equipment recommendation */}
                    <div className={`rounded-xl p-3 border text-xs space-y-1 ${chipBg}`}>
                      <span className="font-bold text-[10px] uppercase tracking-wider block opacity-80">
                        Rekomendowane narzędzia
                      </span>
                      <p className={secondaryText}>
                        {type === "star"
                          ? (data as StarData).mag < 5.0
                            ? "Widoczna gołym okiem pod dobrym niebem."
                            : "Wskazana lornetka (np. 10x50) lub teleskop."
                          : type === "dso"
                          ? (data as DeepSkyObject).mag < 5.5
                            ? "Widoczny nieuzbrojonym okiem w ciemnym miejscu (np. Bieszczady) lub przez lornetkę."
                            : "Wymaga lornetki astronomicznej lub teleskopu amatorskiego."
                          : "Cały gwiazdozbiór – obserwacja gołym okiem."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <AltitudeTimeChart
                      coord={{ ra, dec }}
                      lat={lat}
                      lon={lon}
                      simulatedTime={simulatedTime}
                      objectName={title}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
