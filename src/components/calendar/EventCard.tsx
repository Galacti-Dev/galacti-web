"use client";

import { useState } from "react";
import {
  Sparkles,
  Flame,
  Sun,
  Moon,
  Telescope,
  Compass,
  Eye,
  Binoculars,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShieldAlert,
  Info,
} from "lucide-react";
import { AstronomicalEvent, AstronomicalEventType, EquipmentRequired, VisibilityPoland } from "@/lib/types";
import { useIsMounted } from "@/lib/useIsMounted";

interface EventCardProps {
  event: AstronomicalEvent;
  isTimeline?: boolean;
}

export function getEventTypeBadge(type: AstronomicalEventType) {
  switch (type) {
    case "meteor_shower":
      return {
        label: "Rój meteorów",
        icon: Flame,
        badgeClass: "bg-white/10 text-white border-white/20",
      };
    case "eclipse":
      return {
        label: "Zaćmienie",
        icon: Sun,
        badgeClass: "bg-white/15 text-white border-white/30",
      };
    case "planetary_event":
      return {
        label: "Planeta / Opozycja",
        icon: Telescope,
        badgeClass: "bg-white/10 text-zinc-200 border-white/15",
      };
    case "conjunction":
      return {
        label: "Koniunkcja planet",
        icon: Compass,
        badgeClass: "bg-white/10 text-zinc-200 border-white/15",
      };
    case "moon_phase":
      return {
        label: "Faza Księżyca",
        icon: Moon,
        badgeClass: "bg-white/10 text-zinc-300 border-white/15",
      };
    default:
      return {
        label: "Zjawisko",
        icon: Sparkles,
        badgeClass: "bg-white/10 text-zinc-300 border-white/15",
      };
  }
}

export function getVisibilityBadge(visibility: VisibilityPoland) {
  switch (visibility) {
    case "excellent":
      return {
        label: "Doskonała w Polsce",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      };
    case "good":
      return {
        label: "Dobra w Polsce",
        className: "bg-white/10 text-zinc-100 border-white/25",
        dotColor: "bg-white",
      };
    case "partial":
      return {
        label: "Częściowa / Trudniejsza",
        className: "bg-zinc-800/80 text-zinc-300 border-zinc-700/80",
        dotColor: "bg-zinc-400",
      };
    case "none":
    default:
      return {
        label: "Niewidoczne w Polsce",
        className: "bg-zinc-900 text-zinc-500 border-zinc-800",
        dotColor: "bg-zinc-600",
      };
  }
}

export function getEquipmentBadge(equipment: EquipmentRequired) {
  switch (equipment) {
    case "naked_eye":
      return {
        label: "Gołe oko",
        icon: Eye,
      };
    case "binoculars":
      return {
        label: "Lornetka",
        icon: Binoculars,
      };
    case "telescope":
      return {
        label: "Teleskop",
        icon: Telescope,
      };
  }
}

function formatDate(dateStr: string, mounted: boolean): string {
  if (!mounted) return dateStr.slice(0, 10);
  const date = new Date(dateStr);
  const hasTime = dateStr.includes("T");
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Warsaw",
  });
}

function getRelativeCountdown(targetDateStr: string, endDateStr: string) {
  const now = new Date();
  const peak = new Date(targetDateStr);
  const endIso = endDateStr.includes("T") ? endDateStr : `${endDateStr}T23:59:59.999Z`;
  const end = new Date(endIso);

  if (now > end) {
    return { label: "Zakończone", isPast: true, isOngoing: false };
  }

  const diffMs = peak.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { label: "Szczyt dzisiaj / w trakcie!", isPast: false, isOngoing: true };
  }
  if (diffDays === 1) {
    return { label: "Już jutro!", isPast: false, isOngoing: true };
  }
  return { label: `Za ${diffDays} dni`, isPast: false, isOngoing: false };
}

export function EventCard({ event, isTimeline = false }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mounted = useIsMounted();

  const countdown = mounted
    ? getRelativeCountdown(event.peakDate, event.endDate)
    : { label: "Szczyt zjawiska", isPast: false, isOngoing: false };

  const typeInfo = getEventTypeBadge(event.type);
  const TypeIcon = typeInfo.icon;
  const visibilityInfo = getVisibilityBadge(event.visibilityPoland);
  const equipInfo = getEquipmentBadge(event.equipmentRequired);
  const EquipIcon = equipInfo.icon;

  const isSolarEclipse = event.type === "eclipse" && event.id.includes("solar");

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/80 ${
        isTimeline ? "" : "h-full flex flex-col justify-between"
      }`}
    >
      {/* Background Subtle Monochrome Glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Event Type */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${typeInfo.badgeClass}`}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{typeInfo.label}</span>
            </span>

            {/* Equipment Required */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300">
              <EquipIcon className="h-3.5 w-3.5 text-zinc-400" />
              <span>{equipInfo.label}</span>
            </span>
          </div>

          {/* Visibility in Poland */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${visibilityInfo.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${visibilityInfo.dotColor}`} />
            <span>{visibilityInfo.label}</span>
          </span>
        </div>

        {/* Title & Countdown */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-zinc-100 transition-colors leading-snug">
              {event.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium border ${
                countdown.isOngoing
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse"
                  : countdown.isPast
                  ? "bg-zinc-800 text-zinc-500 border-zinc-700"
                  : "bg-white/10 text-zinc-200 border-white/15"
              }`}
              suppressHydrationWarning
            >
              {countdown.label}
            </span>
          </div>
        </div>

        {/* Date Timeline Banner */}
        <div className="mt-3.5 rounded-2xl border border-white/5 bg-white/5 p-3 sm:p-3.5 text-xs text-zinc-300 space-y-1.5">
          <div className="flex items-center gap-2 text-white font-medium">
            <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400">Kulminacja (szczyt):</span>
            <span className="font-semibold text-white" suppressHydrationWarning>
              {formatDate(event.peakDate, mounted)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 pt-1 border-t border-white/5">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-zinc-500" />
              <span suppressHydrationWarning>Od: {formatDate(event.startDate, mounted)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span suppressHydrationWarning>Do: {formatDate(event.endDate, mounted)}</span>
            </div>
          </div>
        </div>

        {/* Specific Key Metrics Grid */}
        {(event.zhr ||
          event.radiant ||
          event.parentBody ||
          event.magnitudeInPoland ||
          event.separation) && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {event.zhr && (
              <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-2.5">
                <span className="text-[11px] text-zinc-400 block">Aktywność (ZHR):</span>
                <span className="font-bold text-white text-sm">
                  ~{event.zhr}{" "}
                  <span className="text-[10px] font-normal text-zinc-400">meteorów/godz.</span>
                </span>
              </div>
            )}

            {event.radiant && (
              <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-2.5">
                <span className="text-[11px] text-zinc-400 block">Radiant:</span>
                <span className="font-semibold text-zinc-200 truncate block">
                  {event.radiant}
                </span>
              </div>
            )}

            {event.parentBody && (
              <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-2.5 sm:col-span-2">
                <span className="text-[11px] text-zinc-400 block">Ciało macierzyste:</span>
                <span className="font-medium text-zinc-200">{event.parentBody}</span>
              </div>
            )}

            {event.magnitudeInPoland && (
              <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-2.5 sm:col-span-2">
                <span className="text-[11px] text-zinc-400 block">Faza w Polsce:</span>
                <span className="font-bold text-white">{event.magnitudeInPoland}</span>
              </div>
            )}

            {event.separation && (
              <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-2.5 sm:col-span-2">
                <span className="text-[11px] text-zinc-400 block">Separacja kątowa:</span>
                <span className="font-semibold text-white">{event.separation}</span>
              </div>
            )}
          </div>
        )}

        {/* Physical Description Preview */}
        <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-3">
          {event.description}
        </p>
      </div>

      {/* Expandable Observation Tips & Full Educational Details */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
          aria-expanded={isExpanded}
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            <span>{isExpanded ? "Ukryj wskazówki obserwacyjne" : "Zobacz wskazówki obserwacyjne i BHP"}</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 pt-2 text-xs text-zinc-300 animate-in fade-in duration-200">
            {/* Solar Safety Warning if Solar Eclipse */}
            {isSolarEclipse && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="block font-semibold text-amber-300">
                    Ostrzeżenie BHP: Bezpieczeństwo wzroku
                  </strong>
                  Podczas obserwacji zaćmienia Słońca bezwzględnie używaj atestowanych filtrów z folią
                  słoneczną <strong>ISO 12312-2</strong> (np. Baader AstroSolar). Nigdy nie spoglądaj
                  bezpośrednio przez lornetkę ani teleskop bez dedykowanego filtra obiektywowego!
                </div>
              </div>
            )}

            {/* Observation Tips */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <MapPin className="h-3.5 w-3.5 text-zinc-300" />
                <span>Wskazówki Obserwacyjne:</span>
              </div>
              <p className="leading-relaxed text-zinc-300 text-xs pl-5">
                {event.observationTips}
              </p>
            </div>

            {/* Full description */}
            <div className="rounded-2xl border border-white/5 bg-white/5 p-3 space-y-1 text-xs">
              <span className="font-semibold text-zinc-200 block">Opis zjawiska:</span>
              <p className="leading-relaxed text-zinc-400">{event.description}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
