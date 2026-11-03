"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ArrowRight,
  Clock,
  ChevronRight,
} from "lucide-react";
import { AstronomicalEvent } from "@/lib/types";
import rawEvents from "@/data/astronomical_events.json";
import { useIsMounted } from "@/lib/useIsMounted";
import { getEventTypeBadge, getVisibilityBadge, getEquipmentBadge } from "@/components/calendar/EventCard";

const defaultEvents = rawEvents as AstronomicalEvent[];

export function UpcomingEventsCard() {
  const [events, setEvents] = useState<AstronomicalEvent[]>(defaultEvents);
  const mounted = useIsMounted();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events?upcoming=true");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setEvents(data);
          }
        }
      } catch {
        // Fallback defaultEvents already active
      }
    }
    fetchEvents();
  }, []);

  // Take the 3 closest upcoming events sorted by peakDate
  const upcomingThree = events.slice(0, 3);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      {/* Background Accent Glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/5 blur-3xl opacity-50" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 shadow-inner">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Najbliższe Zjawiska Astronomiczne
                </h3>
                <span className="hidden sm:inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-white/15">
                  Polska
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kluczowe efemerydy, roje meteorów i zaćmienia (2026–2027)
              </p>
            </div>
          </div>

          <Link
            href="/calendar"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all"
          >
            <span>Pełny kalendarz</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Events Grid / List */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingThree.map((event) => {
            const typeInfo = getEventTypeBadge(event.type);
            const TypeIcon = typeInfo.icon;
            const visibilityInfo = getVisibilityBadge(event.visibilityPoland);
            const equipInfo = getEquipmentBadge(event.equipmentRequired);
            const EquipIcon = equipInfo.icon;
            const peakDate = mounted ? new Date(event.peakDate) : null;

            return (
              <div
                key={event.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-950/60 p-4 transition-all duration-200 hover:border-white/20 hover:bg-zinc-950/90"
              >
                <div>
                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${typeInfo.badgeClass}`}
                    >
                      <TypeIcon className="h-3 w-3" />
                      <span>{typeInfo.label}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${visibilityInfo.className}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${visibilityInfo.dotColor}`} />
                      <span>{visibilityInfo.label.replace(" w Polsce", "")}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-white group-hover:text-zinc-100 line-clamp-2 leading-snug">
                    {event.title}
                  </h4>

                  {/* Peak Date */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-300">
                    <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="font-medium text-white">
                      {mounted && peakDate
                        ? peakDate.toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "Europe/Warsaw",
                          })
                        : event.peakDate.slice(0, 10)}
                    </span>
                  </div>

                  {/* Description preview */}
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Bottom info */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1">
                    <EquipIcon className="h-3 w-3 text-zinc-400" />
                    <span>{equipInfo.label}</span>
                  </div>

                  {event.zhr ? (
                    <span className="font-semibold text-zinc-200">ZHR: {event.zhr}</span>
                  ) : event.magnitudeInPoland ? (
                    <span className="font-semibold text-zinc-200">Faza: {event.magnitudeInPoland.split(" ")[0]}</span>
                  ) : event.separation ? (
                    <span className="font-semibold text-zinc-200">{event.separation.split(" ")[1]}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link on Mobile / Desktop */}
      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-xs text-zinc-400">
          Dane efemerydalne: International Meteor Organization & NASA Eclipse Web
        </span>

        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-zinc-300 transition-colors"
        >
          <span>Otwórz interaktywny kalendarz z osią czasu</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
