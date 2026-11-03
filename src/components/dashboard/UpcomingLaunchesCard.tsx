"use client";

import { useEffect, useState } from "react";
import { Rocket, MapPin, Calendar, Clock } from "lucide-react";
import { LaunchItem } from "@/lib/types";
import { fallbackLaunches } from "@/lib/fallbackData";
import { useIsMounted } from "@/lib/useIsMounted";

export function UpcomingLaunchesCard() {
  const [launches, setLaunches] = useState<LaunchItem[]>(fallbackLaunches.results);
  const mounted = useIsMounted();

  useEffect(() => {
    async function fetchLaunches() {
      try {
        const res = await fetch("/api/launches");
        if (res.ok) {
          const data = await res.json();
          const items = data.results || (Array.isArray(data) ? data : []);
          if (items.length > 0) {
            setLaunches(items);
          }
        }
      } catch {
        // Fallback already active
      }
    }
    fetchLaunches();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white border border-white/15">
              <Rocket className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nadchodzące Starty Rakiet</h3>
              <p className="text-[11px] text-zinc-400">Dane ze Space Devs & Launch Library</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 border border-white/15">
            {launches.length} misje
          </span>
        </div>

        {/* Launches List */}
        <div className="mt-4 divide-y divide-white/5 space-y-3">
          {launches.slice(0, 3).map((item) => {
            const launchDate = new Date(item.net);
            return (
              <div key={item.id} className="pt-3 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white leading-snug line-clamp-1">
                    {item.name}
                  </h4>
                  <span className="shrink-0 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                    {item.status.abbrev}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <div className="flex items-center gap-1 text-zinc-300" suppressHydrationWarning>
                    <Calendar className="h-3 w-3 text-zinc-400" />
                    <span suppressHydrationWarning>
                      {mounted
                        ? launchDate.toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : item.net.slice(0, 10)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="h-3 w-3 text-zinc-400" />
                    <span suppressHydrationWarning>
                      {mounted
                        ? `${launchDate.toLocaleTimeString("pl-PL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} UTC`
                        : "—"}
                    </span>
                  </div>

                  {item.pad?.location?.name && (
                    <div className="flex items-center gap-1 text-zinc-400">
                      <MapPin className="h-3 w-3 text-zinc-500" />
                      <span className="line-clamp-1">{item.pad.location.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-3 text-right">
        <span className="text-[11px] text-zinc-400">
          Oficjalna telemetria dostarczana przez LL2
        </span>
      </div>
    </div>
  );
}
