"use client";

import { useEffect, useState } from "react";
import { Satellite, Gauge, Mountain, Sun, Moon, RefreshCw, AlertTriangle } from "lucide-react";
import { IssData } from "@/lib/types";

export function IssTrackerCard() {
  const [iss, setIss] = useState<IssData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadIss(isPolling: boolean) {
      if (isPolling) {
        setIsUpdating(true);
      }
      try {
        const res = await fetch(`/api/iss?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const errMsg = errJson?.error || "Zewnętrzne API telemetrii ISS jest chwilowo niedostępne.";
          if (isMounted) setError(errMsg);
          return;
        }

        const data: IssData = await res.json();
        if (!isMounted) return;

        if (data.error || data.isFallback) {
          setError(data.error || "Dane telemetryczne są chwilowo niedostępne.");
        } else if (typeof data.latitude === "number" && typeof data.longitude === "number") {
          setIss(data);
          setError(null);
          setLastUpdated(new Date(data.timestamp ? data.timestamp * 1000 : Date.now()));
        }
      } catch {
        if (isMounted) {
          setError("Brak połączenia z siecią lub błąd serwera przy pobieraniu pozycji ISS.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsUpdating(false);
        }
      }
    }

    loadIss(false);
    const interval = setInterval(() => {
      loadIss(true);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [retryTrigger]);

  const isDaylight = iss?.visibility === "daylight";

  const formatCoord = (val: number, posSuffix: string, negSuffix: string) => {
    const formatted = Math.abs(val).toFixed(4);
    return `${formatted}° ${val >= 0 ? posSuffix : negSuffix}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between min-h-[300px]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              error && !iss
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-white/10 text-white border-white/15"
            }`}>
              <Satellite className={`h-4 w-4 ${!error ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Stacja ISS na Żywo</h3>
              <p className="text-[11px] text-zinc-400">NORAD ID: 25544</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {error ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border border-rose-500/20 bg-rose-500/10 text-rose-300">
                <AlertTriangle className="h-3 w-3" />
                {iss ? "Błąd aktualizacji" : "Brak sygnału"}
              </span>
            ) : iss ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border border-white/15 bg-white/10 text-zinc-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                    isDaylight
                      ? "border-white/15 bg-white/5 text-zinc-200"
                      : "border-zinc-700/60 bg-zinc-800/40 text-zinc-400"
                  }`}
                >
                  {isDaylight ? (
                    <>
                      <Sun className="h-3 w-3 text-zinc-300" />
                      Dzień
                    </>
                  ) : (
                    <>
                      <Moon className="h-3 w-3 text-zinc-400" />
                      Noc (Cień)
                    </>
                  )}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !iss && !error && (
          <div className="mt-8 flex flex-col items-center justify-center py-6 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-300 mb-3" />
            <p className="text-sm font-medium text-zinc-300">Nawiązywanie łączności telemetrycznej z ISS...</p>
            <p className="text-xs text-zinc-400 mt-1">Pobieranie koordynatów orbitalnych</p>
          </div>
        )}

        {/* Error State with No Data */}
        {error && !iss && (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-rose-200">Telemetria ISS niedostępna</h4>
                <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">{error}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setRetryTrigger((c) => c + 1)}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isUpdating ? "animate-spin" : ""}`} />
                    Ponów próbę
                  </button>
                  <span className="text-[11px] text-zinc-400">Automatyczne ponawianie co 5s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Telemetry Metrics */}
        {iss && (
          <>
            {/* Warning if stale update error */}
            {error && (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Ostatnia próba aktualizacji nie powiodła się. Pokazywane są dane z ostatniego stabilnego pomiaru.</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Gauge className="h-3.5 w-3.5 text-zinc-300" />
                  <span>Prędkość orbitalna</span>
                </div>
                <div className="mt-1 text-lg font-bold text-white">
                  {Math.round(iss.velocity).toLocaleString("pl-PL")}{" "}
                  <span className="text-xs font-normal text-zinc-400">km/h</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  ~{(iss.velocity / 3600).toFixed(2)} km/s
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Mountain className="h-3.5 w-3.5 text-zinc-300" />
                  <span>Wysokość</span>
                </div>
                <div className="mt-1 text-lg font-bold text-white">
                  {iss.altitude.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-zinc-400">km</span>
                </div>
                <div className="text-[10px] text-zinc-400">Niska orbita (LEO)</div>
              </div>
            </div>

            {/* Coordinates */}
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-zinc-400">Szerokość: </span>
                <span className="font-mono font-semibold text-white">
                  {formatCoord(iss.latitude, "N", "S")}
                </span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div>
                <span className="text-zinc-400">Długość: </span>
                <span className="font-mono font-semibold text-white">
                  {formatCoord(iss.longitude, "E", "W")}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Update info */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${
            error && !iss ? "bg-rose-400" : "bg-emerald-400 animate-ping"
          }`} />
          <span>Odświeżanie co 5s</span>
        </div>
        <div className="flex items-center gap-1">
          <RefreshCw
            className={`h-3 w-3 ${isUpdating ? "animate-spin text-zinc-300" : ""}`}
          />
          <span>
            {lastUpdated ? `Aktualizacja: ${lastUpdated.toLocaleTimeString("pl-PL")}` : "Oczekiwanie..."}
          </span>
        </div>
      </div>
    </div>
  );
}
