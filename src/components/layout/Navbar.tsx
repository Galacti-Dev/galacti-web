"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Orbit, Compass, Bot, Calendar, Sparkles, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: Compass,
      description: "APOD, ISS i Starty",
    },
    {
      href: "/solar-system",
      label: "Układ Słoneczny 3D",
      icon: Orbit,
      description: "Eksploracja planet",
    },
    {
      href: "/skymap",
      label: "Mapa Nieba",
      icon: Sparkles,
      description: "Interaktywna planisfera",
    },
    {
      href: "/calendar",
      label: "Kalendarz Zjawisk",
      icon: Calendar,
      description: "Zjawiska 2026–2027",
    },
    {
      href: "/chat",
      label: "Galacti AI",
      icon: Bot,
      description: "Edukacyjny asystent",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3 shrink-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-zinc-900 shadow-md shadow-black/50 transition-all duration-300 group-hover:border-white/40 group-hover:scale-105">
            <Image
              src="/logo.jpg"
              alt="Galacti Logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/30 transition-all" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-widest text-white">GALACTI</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-white/10">
                v0.5.0
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">Space Telemetry & 3D Explorer</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full shadow-sm shadow-white/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Live Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-medium tracking-wide">NASA Data Ready</span>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={isMobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/90 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-[#09090b]/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1" aria-label="Nawigacja mobilna">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-md shadow-white/10"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-black" : "text-zinc-400"}`} />
                    <div>
                      <div className="leading-tight">{item.label}</div>
                      <div className={`text-[11px] mt-0.5 ${isActive ? "text-zinc-700" : "text-zinc-500"}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-black shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Live Status Badge */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 px-2">
            <span className="font-mono text-[11px]">Galacti v0.5.0</span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-medium text-zinc-300 text-[11px]">NASA Data Ready</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
