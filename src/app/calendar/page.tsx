"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  LayoutGrid,
  ListOrdered,
  Search,
  Filter,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { AstronomicalEvent, AstronomicalEventType } from "@/lib/types";
import rawEvents from "@/data/astronomical_events.json";
import { NextEventHero } from "@/components/calendar/NextEventHero";
import { EventCard } from "@/components/calendar/EventCard";
import { EventTimeline } from "@/components/calendar/EventTimeline";

const fallbackEvents = rawEvents as AstronomicalEvent[];

type FilterCategory = "all" | AstronomicalEventType;

export default function CalendarPage() {
  const [events, setEvents] = useState<AstronomicalEvent[]>(fallbackEvents);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [onlyPolandVisible, setOnlyPolandVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setEvents(data);
          }
        }
      } catch {
        // Fallback already populated
      }
    }
    loadEvents();
  }, []);

  const filterButtons: { id: FilterCategory; label: string; count?: number }[] = [
    { id: "all", label: "Wszystkie zjawiska" },
    { id: "meteor_shower", label: "Roje meteorów" },
    { id: "eclipse", label: "Zaćmienia Słońca i Księżyca" },
    { id: "planetary_event", label: "Opozycje i Planety" },
    { id: "conjunction", label: "Koniunkcje" },
    { id: "moon_phase", label: "Fazy Księżyca & Superksiężyce" },
  ];

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Category filter
      if (activeCategory !== "all" && event.type !== activeCategory) {
        return false;
      }

      // Visibility filter
      if (onlyPolandVisible) {
        if (event.visibilityPoland !== "excellent" && event.visibilityPoland !== "good") {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDesc = event.description.toLowerCase().includes(query);
        const matchesTips = event.observationTips.toLowerCase().includes(query);
        const matchesRadiant = event.radiant?.toLowerCase().includes(query) ?? false;
        const matchesParent = event.parentBody?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesDesc || matchesTips || matchesRadiant || matchesParent;
      }

      return true;
    });
  }, [events, activeCategory, onlyPolandVisible, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300 border border-white/15">
          <Calendar className="h-3.5 w-3.5 text-zinc-300" />
          <span>Efemerydy i Zjawiska 2026–2027</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
          Kalendarz Zjawisk <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Astronomicznych</span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
          Oficjalne efemerydy roczne zweryfikowane w oparciu o bazy IMO, NASA Eclipse Web Site oraz JPL Horizons.
          Szczególny nacisk na widoczność, warunki fazy Księżyca oraz wskazówki obserwacyjne dla terytorium Polski.
        </p>
      </div>

      {/* Featured Next Event Hero Banner */}
      <section>
        <NextEventHero events={events} />
      </section>

      {/* Controls & Filter Bar */}
      <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 sm:p-6 backdrop-blur-xl shadow-xl">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {filterButtons.map((btn) => {
            const isActive = activeCategory === btn.id;
            const count =
              btn.id === "all"
                ? events.length
                : events.filter((e) => e.type === btn.id).length;

            return (
              <button
                key={btn.id}
                onClick={() => setActiveCategory(btn.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-md shadow-white/10"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{btn.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-black/20 text-black font-bold" : "bg-white/10 text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Row: Search, Poland Visibility Toggle, View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj (np. Perseidy, Zaćmienie, Saturn, Lirydy)..."
              className="w-full rounded-xl border border-white/10 bg-zinc-950/60 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
            {/* Poland Visibility Filter Toggle */}
            <button
              onClick={() => setOnlyPolandVisible((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                onlyPolandVisible
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title="Pokaż tylko zjawiska z dobrą lub doskonałą widocznością w Polsce"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Dobra widoczność w PL</span>
              {onlyPolandVisible && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </button>

            {/* View Mode Toggle: Grid vs Timeline */}
            <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Widok kafelków"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Karty</span>
              </button>

              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  viewMode === "timeline"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Widok osi czasu"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Oś czasu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Presentation (Grid or Timeline) */}
      <section>
        {filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-12 text-center space-y-3">
            <Filter className="mx-auto h-8 w-8 text-zinc-500" />
            <h3 className="text-base font-semibold text-white">Brak pasujących zjawisk</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Nie znaleziono wydarzeń spełniających wybrane kryteria wyszukiwania lub filtrów. Spróbuj zmienić parametry.
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setOnlyPolandVisible(false);
                setSearchQuery("");
              }}
              className="mt-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-all"
            >
              Zresetuj filtry
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} isTimeline={false} />
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <EventTimeline events={filteredEvents} />
          </div>
        )}
      </section>
    </div>
  );
}
