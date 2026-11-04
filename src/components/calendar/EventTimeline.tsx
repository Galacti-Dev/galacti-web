"use client";

import { AstronomicalEvent } from "@/lib/types";
import { EventCard } from "./EventCard";
import { useIsMounted } from "@/lib/useIsMounted";
import { Clock } from "lucide-react";

interface EventTimelineProps {
  events: AstronomicalEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const mounted = useIsMounted();

  if (events.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-400">
        Brak zjawisk spełniających wybrane kryteria filtrów.
      </div>
    );
  }

  return (
    <div className="relative border-l border-white/15 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-10 py-4">
      {events.map((event, index) => {
        const peakDate = new Date(event.peakDate);
        const yearMonth = mounted
          ? peakDate.toLocaleDateString("pl-PL", {
              month: "short",
              year: "numeric",
              timeZone: "Europe/Warsaw",
            })
          : event.peakDate.slice(0, 7);

        return (
          <div key={event.id} className="relative group">
            {/* Timeline Node Point on Left Line */}
            <div className="absolute -left-[31px] sm:-left-[47px] top-6 flex items-center justify-center">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-white/20 bg-zinc-950 text-white shadow-md shadow-black group-hover:border-white/60 group-hover:scale-110 transition-all">
                <span className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            {/* Date Tag above card */}
            <div className="mb-2 flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span suppressHydrationWarning>Krok {index + 1} • {yearMonth}</span>
            </div>

            {/* Event Card */}
            <EventCard event={event} isTimeline={true} />
          </div>
        );
      })}
    </div>
  );
}
