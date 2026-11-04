"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Calendar Error Boundary caught]:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-xl shadow-rose-950/30">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Nie udało się załadować kalendarza
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Wystąpił problem z wyświetleniem zjawisk astronomicznych. Kliknij poniżej, aby spróbować ponownie lub wróć na stronę główną.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-95 shadow-md shadow-white/10 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Odśwież kalendarz</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-white/10 hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Powrót na Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
