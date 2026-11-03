"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Orbit, Compass, Bot, Calendar } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

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
      href: "/calendar",
      label: "Kalendarz Zjawisk",
      icon: Calendar,
      description: "Zjawiska 2026–2027",
    },
    {
      href: "/chat",
      label: "AI Kosmonauta",
      icon: Bot,
      description: "Edukacyjny asystent",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
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
                v0.4.0
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Space Telemetry & 3D Explorer</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
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

        {/* Live Status Indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-medium tracking-wide">NASA Data Ready</span>
        </div>
      </div>
    </header>
  );
}
