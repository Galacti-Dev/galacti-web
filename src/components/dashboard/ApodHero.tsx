"use client";

import { useEffect, useState } from "react";
import { Sparkles, Calendar, ExternalLink } from "lucide-react";
import { ApodData } from "@/lib/types";
import { fallbackApod } from "@/lib/fallbackData";

export function ApodHero() {
  const [apod, setApod] = useState<ApodData>(fallbackApod);

  useEffect(() => {
    async function loadApod() {
      try {
        const res = await fetch("/api/apod");
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            setApod(data);
          }
        }
      } catch {
        // Fallback already set
      }
    }
    loadApod();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Background Accent Glow */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Description & Metadata */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
              NASA Astronomy Picture of the Day (APOD)
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              {apod.date}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {apod.title}
          </h2>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed line-clamp-5">
            {apod.explanation}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {apod.copyright && (
              <span className="text-xs text-zinc-400">
                Prawa autorskie: <span className="text-zinc-200">{apod.copyright}</span>
              </span>
            )}

            {apod.hdurl && (
              <a
                href={apod.hdurl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 hover:border-white/30 transition-colors"
              >
                <span>Otwórz w pełnej rozdzielczości</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column: APOD Visual Media */}
        <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl border border-white/10 bg-black/50 aspect-video lg:aspect-[4/3] flex items-center justify-center">
          {apod.media_type === "video" ? (
            <iframe
              src={apod.url}
              title={apod.title}
              className="w-full h-full border-0"
              allowFullScreen
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={apod.url}
                alt={apod.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-xs text-white/90">Kliknij link obok, aby powiększyć</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
