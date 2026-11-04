"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Galacti App Error Boundary caught]:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-xl shadow-rose-950/30">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Wystąpił nieoczekiwany błąd
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Aplikacja napotkała chwilowy błąd podczas renderowania strony. Kliknij poniżej, aby spróbować ponownie.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-95 shadow-md shadow-white/10 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Spróbuj ponownie</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-white/10 hover:text-white active:scale-95"
        >
          <Home className="h-4 w-4" />
          <span>Strona główna</span>
        </Link>
      </div>
    </div>
  );
}
