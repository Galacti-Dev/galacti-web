"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Gauge,
  Wind,
  Activity,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { SpaceWeatherSummary } from "@/lib/types";

export function SpaceWeatherCard() {
  const [data, setData] = useState<SpaceWeatherSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchData(isPolling = false) {
      if (isPolling) setIsUpdating(true);
      try {
        const res = await fetch(`/api/space-weather?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Błąd podczas pobierania danych kosmicznej pogody.");
        }

        const json: SpaceWeatherSummary = await res.json();
        if (isMounted) {
          setData(json);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Nie udało się pobrać danych z NOAA SWPC.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsUpdating(false);
        }
      }
    }

    fetchData(refreshTrigger > 0);

    const interval = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshTrigger]);

  const getChanceBadge = (level?: string) => {
    switch (level) {
      case "Ekstremalna":
        return {
          bg: "bg-white/20 text-white border-white/40 shadow-white/10",
          barColor: "from-zinc-400 via-zinc-200 to-white",
          textColor: "text-white font-extrabold",
        };
      case "Wysoka":
        return {
          bg: "bg-white/15 text-white border-white/30 shadow-white/5",
          barColor: "from-zinc-500 via-zinc-300 to-white",
          textColor: "text-white",
        };
      case "Umiarkowana":
        return {
          bg: "bg-white/10 text-zinc-200 border-white/20 shadow-black/20",
          barColor: "from-zinc-700 via-zinc-500 to-zinc-200",
          textColor: "text-zinc-200",
        };
      case "Niska":
        return {
          bg: "bg-white/5 text-zinc-400 border-white/10 shadow-black/10",
          barColor: "from-zinc-800 to-zinc-400",
          textColor: "text-zinc-300",
        };
      case "Brak":
      default:
        return {
          bg: "bg-zinc-800/40 text-zinc-500 border-zinc-700/50 shadow-none",
          barColor: "from-zinc-800 to-zinc-600",
          textColor: "text-zinc-400",
        };
    }
  };

  const badgeStyle = getChanceBadge(data?.activityLevel);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-all">
      {/* Background Subtle Monochrome Glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl opacity-30 transition-all duration-1000" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/15 text-white shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Pogoda Kosmiczna & Zorze Polarne
              </h2>
              <span className="hidden sm:inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-white/15">
                Polska (Live)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Telemetria NOAA SWPC & satelity DSCOVR w punkcie L1
            </p>
          </div>
        </div>

        {/* Live indicator & refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            <span
              className={`h-2 w-2 rounded-full ${
                data?.isFallback ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="font-mono text-[11px]">
              {data?.isFallback ? "Tryb zapasowy" : "NOAA Live"}
            </span>
          </div>

          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={isUpdating || isLoading}
            aria-label="Odśwież dane kosmicznej pogody"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
            title="Odśwież pomiary"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin text-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-14 text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-zinc-300 mb-3" />
          <p className="text-sm text-zinc-400">Pobieranie telemetrii magnetycznej i wiatru słonecznego...</p>
        </div>
      )}

      {error && !data && (
        <div className="py-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
          <p className="text-sm text-rose-300">{error}</p>
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="relative z-10 mt-6 space-y-6">
          {/* Main Aurora Chance Banner */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-black/40 to-white/5 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Szansa na zorzę w Polsce
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={`text-4xl sm:text-5xl font-black tracking-tight ${badgeStyle.textColor}`}>
                    {data.auroraChancePoland}%
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${badgeStyle.bg}`}
                  >
                    Poziom: {data.activityLevel}
                  </span>
                </div>
              </div>

              {/* NOAA Storm Scale Tag */}
              <div className="sm:text-right">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Skala Burzy NOAA
                </span>
                <div className="mt-1 flex sm:justify-end items-center gap-1.5 font-bold text-sm text-white">
                  <ShieldAlert className="h-4 w-4 text-zinc-300" />
                  <span>{data.noaaStormScale}</span>
                </div>
              </div>
            </div>

            {/* Visual Probability Bar */}
            <div className="mt-4">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${badgeStyle.barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(5, Math.min(100, data.auroraChancePoland))}%` }}
                />
              </div>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
                {data.visibilityDescriptionPl}
              </p>
            </div>
          </div>

          {/* 4 Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Indeks Kp */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-all relative">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Gauge className="h-3.5 w-3.5 text-zinc-300" />
                  <span>Indeks Kp</span>
                </div>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === "kp" ? null : "kp")}
                  className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
                  aria-label="Informacja o indeksie Kp"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{data.kpCurrent}</span>
                <span className="text-xs text-zinc-400">/ 9.0</span>
              </div>

              {/* Mini Kp scale meter (0-9) */}
              <div className="mt-2 grid grid-cols-9 gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => {
                  const isActive = data.kpCurrent >= val - 0.5;
                  const isHigh = val >= 7;
                  const isMed = val >= 5;
                  return (
                    <div
                      key={val}
                      className={`h-1.5 rounded-sm transition-all ${
                        isActive
                          ? isHigh
                            ? "bg-white shadow-sm shadow-white/50"
                            : isMed
                            ? "bg-zinc-200"
                            : "bg-zinc-400"
                          : "bg-zinc-800"
                      }`}
                    />
                  );
                })}
              </div>

              {activeTooltip === "kp" && (
                <div className="mt-3 rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-[11px] text-zinc-300 leading-snug">
                  Globalny wskaźnik zaburzeń magnetosfery (0–9). Kp ≥ 5 daje szansę na zorzę na północy Polski, Kp ≥ 7 w całym kraju.
                </div>
              )}
            </div>

            {/* 2. IMF Bz (Southward / Northward) */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-all relative">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Compass className="h-3.5 w-3.5 text-zinc-300" />
                  <span>IMF Bz (Pole)</span>
                </div>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === "bz" ? null : "bz")}
                  className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
                  aria-label="Informacja o IMF Bz"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    data.imfBz < -5
                      ? "text-emerald-400"
                      : data.imfBz < 0
                      ? "text-white"
                      : "text-zinc-400"
                  }`}
                >
                  {data.imfBz > 0 ? `+${data.imfBz}` : data.imfBz} nT
                </span>

                <span
                  className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    data.imfBz < 0
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/5 text-zinc-400 border border-white/10"
                  }`}
                >
                  {data.imfBz < 0 ? (
                    <>
                      <ArrowDown className="h-3 w-3" />
                      <span>Południe</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp className="h-3 w-3" />
                      <span>Północ</span>
                    </>
                  )}
                </span>
              </div>

              <div className="mt-2 text-[11px] text-zinc-400">
                Całkowite pole Bt: <span className="text-zinc-200 font-semibold">{data.imfBt} nT</span>
              </div>

              {activeTooltip === "bz" && (
                <div className="mt-3 rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-[11px] text-zinc-300 leading-snug">
                  Zwrot składowej pionowej pola. Wartość ujemna (kierunek na południe) łączy linie pola z Ziemią i otwiera magnetosferę dla cząstek.
                </div>
              )}
            </div>

            {/* 3. Prędkość Wiatru Słonecznego */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-all relative">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Wind className="h-3.5 w-3.5 text-zinc-300" />
                  <span>Prędkość Wiatru</span>
                </div>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === "speed" ? null : "speed")}
                  className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
                  aria-label="Informacja o prędkości wiatru"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">{data.solarWindSpeed}</span>
                <span className="text-xs text-zinc-400">km/s</span>
              </div>

              <div className="mt-2 text-[11px] text-zinc-400">
                Status:{" "}
                <span
                  className={
                    data.solarWindSpeed >= 600
                      ? "text-white font-semibold"
                      : data.solarWindSpeed >= 450
                      ? "text-zinc-200 font-semibold"
                      : "text-zinc-400"
                  }
                >
                  {data.solarWindSpeed >= 600
                    ? "Bardzo szybki (CME)"
                    : data.solarWindSpeed >= 450
                    ? "Podwyższony"
                    : "Standardowy (300-400)"}
                </span>
              </div>

              {activeTooltip === "speed" && (
                <div className="mt-3 rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-[11px] text-zinc-300 leading-snug">
                  Prędkość strumienia plazmy w punkcie L1. Prędkości powyżej 500 km/s gwałtownie zwiększają transfer energii do ziemskiej atmosfery.
                </div>
              )}
            </div>

            {/* 4. Gęstość Plazmy */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-all relative">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Activity className="h-3.5 w-3.5 text-zinc-300" />
                  <span>Gęstość Plazmy</span>
                </div>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === "density" ? null : "density")}
                  className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
                  aria-label="Informacja o gęstości plazmy"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">{data.solarWindDensity}</span>
                <span className="text-xs text-zinc-400">p/cm³</span>
              </div>

              <div className="mt-2 text-[11px] text-zinc-400">
                Ciśnienie:{" "}
                <span
                  className={
                    data.solarWindDensity >= 15
                      ? "text-white font-semibold"
                      : "text-zinc-400"
                  }
                >
                  {data.solarWindDensity >= 15 ? "Ściśnięcie tarczy" : "Normalne (2-6)"}
                </span>
              </div>

              {activeTooltip === "density" && (
                <div className="mt-3 rounded-lg border border-white/15 bg-zinc-950 p-2.5 text-[11px] text-zinc-300 leading-snug">
                  Liczba protonów w cm³ plazmy. Skok gęstości (&gt; 15 p/cm³) oznacza uderzenie fali uderzeniowej koronalnego wyrzutu masy (CME).
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-zinc-400">
            <span>
              Ostatnia aktualizacja NOAA: {new Date(data.updatedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span>
              Prognoza Kp max (24h): <strong className="text-white">{data.kpForecastMax24h}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
