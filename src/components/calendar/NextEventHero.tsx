"use client";

import { useSyncExternalStore } from "react";
import { Sparkles, Clock, Calendar } from "lucide-react";
import { AstronomicalEvent } from "@/lib/types";
import { useIsMounted } from "@/lib/useIsMounted";
import { getEventTypeBadge, getVisibilityBadge, getEquipmentBadge } from "./EventCard";

interface NextEventHeroProps {
  events: AstronomicalEvent[];
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function subscribe(callback: () => void) {
  const timer = setInterval(callback, 1000);
  return () => clearInterval(timer);
}

function getClientTime(): number {
  return Date.now();
}

function getServerTime(): number | null {
  return null;
}

function calculateTimeLeft(targetIso: string, currentTime: number | null): TimeLeft {
  if (!currentTime) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  }
  const difference = new Date(targetIso).getTime() - currentTime;
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isPast: false,
  };
}

export function NextEventHero({ events }: NextEventHeroProps) {
  const mounted = useIsMounted();
  const currentTime = useSyncExternalStore(subscribe, getClientTime, getServerTime);

  // Find next upcoming event (or default to first)
  const nextEvent =
    (currentTime
      ? events.find((e) => new Date(e.endDate).getTime() >= currentTime)
      : null) ||
    events[0] ||
    null;

  if (!nextEvent) return null;

  const timeLeft = calculateTimeLeft(nextEvent.peakDate, currentTime);
  const typeInfo = getEventTypeBadge(nextEvent.type);
  const TypeIcon = typeInfo.icon;
  const visibilityInfo = getVisibilityBadge(nextEvent.visibilityPoland);
  const equipInfo = getEquipmentBadge(nextEvent.equipmentRequired);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-zinc-900/90 via-zinc-950/80 to-black/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Background Accent Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
              <span>Główne Zjawisko Sezonu</span>
            </span>

            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${visibilityInfo.className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${visibilityInfo.dotColor}`} />
              <span>{visibilityInfo.label}</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {nextEvent.title}
          </h2>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl line-clamp-3">
            {nextEvent.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-200">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {mounted
                  ? new Date(nextEvent.peakDate).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Europe/Warsaw",
                    })
                  : nextEvent.peakDate.slice(0, 10)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-200">
              <TypeIcon className="h-3.5 w-3.5 text-zinc-400" />
              <span>{typeInfo.label}</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-200">
              <span>Sprzęt: {equipInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Countdown Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/70 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            <Clock className="h-4 w-4 text-zinc-300" />
            <span>Odliczanie do apogeum:</span>
          </div>

          {timeLeft.isPast ? (
            <div className="py-4 text-center">
              <span className="text-xl font-bold text-emerald-400">Zjawisko w trakcie lub zakończone!</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3">
                <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                  {timeLeft.days}
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider">
                  Dni
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3">
                <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider">
                  Godz.
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3">
                <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider">
                  Min.
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3">
                <span className="block text-2xl sm:text-3xl font-black font-mono text-white">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider">
                  Sek.
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-zinc-400">
            Godziny podawane dla strefy czasowej Polski (CET/CEST)
          </div>
        </div>
      </div>
    </div>
  );
}
