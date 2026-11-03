import Link from "next/link";
import { Orbit, Bot, ArrowRight, Sparkles, Calendar } from "lucide-react";
import { ApodHero } from "@/components/dashboard/ApodHero";
import { IssTrackerCard } from "@/components/dashboard/IssTrackerCard";
import { UpcomingLaunchesCard } from "@/components/dashboard/UpcomingLaunchesCard";
import { SpaceWeatherCard } from "@/components/dashboard/SpaceWeatherCard";
import { UpcomingEventsCard } from "@/components/dashboard/UpcomingEventsCard";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome & Quick Launch CTA */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-950/80 to-black/95 p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
              <span>Centrum Operacji Kosmicznych</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Witaj w <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Galacti</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl">
              Poznaj kosmos dzięki interaktywnym symulacjom 3D w skali naukowej, telemetrii NASA na żywo oraz asystentowi wiedzy kosmicznej.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/solar-system"
              className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-white/10 transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95"
            >
              <Orbit className="h-4 w-4 text-black group-hover:rotate-45 transition-transform" />
              <span>Eksploruj Układ Słoneczny 3D</span>
              <ArrowRight className="h-4 w-4 text-black" />
            </Link>

            <Link
              href="/calendar"
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              <Calendar className="h-4 w-4 text-zinc-300" />
              <span>Kalendarz Zjawisk</span>
            </Link>

            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors active:scale-95"
            >
              <Bot className="h-4 w-4 text-zinc-300" />
              <span>AI Asystent</span>
            </Link>
          </div>
        </div>
      </div>

      {/* APOD Featured Hero */}
      <section>
        <ApodHero />
      </section>

      {/* Astronomical Events Preview */}
      <section>
        <UpcomingEventsCard />
      </section>

      {/* Space Weather & Aurora Live Monitor */}
      <section>
        <SpaceWeatherCard />
      </section>

      {/* Grid: ISS Telemetry & Launches */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <IssTrackerCard />
        <UpcomingLaunchesCard />
      </section>
    </div>
  );
}
