"use client";

import { X, Sparkles } from "lucide-react";
import { StarData, DeepSkyObject } from "@/lib/types";
import { CONSTELLATION_NAMES_PL } from "@/lib/astronomyMath";

const CONSTELLATION_DESCRIPTIONS: Record<string, string> = {
  UMa: "Wielka Niedźwiedzica – jeden z najbardziej znanych gwiazdozbiorów nieba północnego. Siedem najjaśniejszych gwiazd tworzy charakterystyczny asteryzm Wielkiego Wozu, służący do odnajdywania Gwiazdy Polarnej.",
  UMi: "Mała Niedźwiedzica – gwiazdozbiór okołobiegunowy. Na końcu dyszla Małego Wozu znajduje się Gwiazda Polarna (Polaris), wyznaczająca północny biegun nieba.",
  Cas: "Kasjopeja – charakterystyczny układ gwiazd w kształcie litery 'W' lub 'M', leżący bezpośrednio w jasnym paśmie Drogi Mlecznej.",
  Ori: "Orion – majestatyczny gwiazdozbiór zimowego nieba, zawierający jasnego czerwonego nadolbrzyma Betelgezę, błękitnego Rigela oraz słynny Pas Oriona z Wielką Mgławicą M42.",
  Cyg: "Łabędź (Krzyż Północy) – dominujący gwiazdozbiór letniego nieba. Jego najjaśniejsza gwiazda Deneb tworzy wraz z Wegą i Altairem słynny Trójkąt Letni.",
  Gem: "Bliźnięta – gwiazdozbiór zodiakalny z dwiema jasnymi gwiazdami bliźniaczymi: Kastorem i Polluksem. Radiant grudniowego roju Geminidów.",
  Leo: "Lew – wiosenny gwiazdozbiór z jasną gwiazdą Regulus. Kształtem przypomina leżącego lwa lub odwrócony znak zapytania.",
  Tau: "Byk – zodiakalna konstelacja zawierająca pomarańczowego olbrzyma Aldebarana oraz dwie wspaniałe gromady otwarte: Plejady (M45) i Hiady.",
  Lyr: "Lutnia – niewielki, ale wyrazisty gwiazdozbiór z jedną z najjaśniejszych gwiazd nocnego nieba: szafirowo-białą Wegą.",
  Her: "Herkules – rozległy gwiazdozbiór zawierający jedną z najwspanialszych gromad kulistych północnego nieba: Wielką Gromadę w Herkulesie (M13).",
  Peg_And: "Pegaz i Andromeda – wielki kwadrat Pegaza połączony z łańcuchem gwiazd Andromedy, w której znajduje się słynna galaktyka M31.",
  And: "Andromeda – gwiazdozbiór sąsiadujący z Pegazem i Kasjopeją, kryjący Wielką Galaktykę Andromedy (M31).",
};

interface SelectedObjectInfoProps {
  selectedObject: {
    type: "star" | "dso" | "constellation";
    data: StarData | DeepSkyObject | { con: string; stars: StarData[] };
  } | null;
  onClose: () => void;
}

export function StarInfoCard({ selectedObject, onClose }: SelectedObjectInfoProps) {
  if (!selectedObject) return null;

  const { type, data } = selectedObject;

  if (type === "star") {
    const star = data as StarData;
    const conPl = CONSTELLATION_NAMES_PL[star.con] || star.con;

    return (
      <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto sm:w-88 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 bg-zinc-950/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-zinc-100 z-30 transition-all animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0 shadow-sm ring-2 ring-white/20"
                style={{ backgroundColor: star.color }}
              />
              <h3 className="text-lg font-bold text-white leading-tight">{star.name}</h3>
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">
              {star.bayer} • {conPl}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Jasność (V)</span>
            <span className="font-bold text-white text-sm">{star.mag.toFixed(2)} mag</span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Typ widmowy</span>
            <span className="font-bold text-white text-sm">{star.spec}</span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Wysokość (Alt)</span>
            <span className="font-semibold text-white">
              {star.horizontal ? `${star.horizontal.alt.toFixed(1)}°` : "—"}
            </span>
            <span className="text-[9px] text-zinc-400 block">
              {star.horizontal && star.horizontal.alt > 0 ? "Nad horyzontem" : "Pod horyzontem"}
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Azymut (Az)</span>
            <span className="font-semibold text-white">
              {star.horizontal ? `${star.horizontal.az.toFixed(1)}°` : "—"}
            </span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-2.5 text-[11px] text-zinc-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-zinc-400">Rektascensja (RA):</span>
            <span className="font-mono">{star.ra.toFixed(3)} h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Deklinacja (Dec):</span>
            <span className="font-mono">{star.dec > 0 ? `+${star.dec.toFixed(2)}°` : `${star.dec.toFixed(2)}°`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Wskaźnik barwy (B-V):</span>
            <span className="font-mono">{star.bv.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "dso") {
    const dso = data as DeepSkyObject;
    const conPl = CONSTELLATION_NAMES_PL[dso.con] || dso.con;

    return (
      <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto sm:w-88 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 bg-zinc-950/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-zinc-100 z-30 transition-all animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/15">
                M
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">{dso.id}</h3>
            </div>
            <span className="text-xs text-zinc-300 font-medium mt-0.5 block">{dso.namePl}</span>
            <span className="text-[11px] text-zinc-400 block">{dso.nameEn} • {conPl}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Jasność (mag)</span>
            <span className="font-bold text-white text-sm">{dso.mag.toFixed(1)} mag</span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Dystans</span>
            <span className="font-bold text-white text-sm">
              {dso.distanceLy >= 1000000
                ? `${(dso.distanceLy / 1000000).toFixed(1)} mln ly`
                : `${dso.distanceLy.toLocaleString("pl-PL")} ly`}
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Pozycja (Alt/Az)</span>
            <span className="font-semibold text-white">
              {dso.horizontal
                ? `${dso.horizontal.alt.toFixed(1)}° / ${dso.horizontal.az.toFixed(0)}°`
                : "—"}
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Wymagany sprzęt</span>
            <span className="font-semibold text-zinc-200 truncate block">{dso.equipment}</span>
          </div>
        </div>

        {/* Physical Description */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-2.5 text-xs text-zinc-300 leading-relaxed">
          {dso.descriptionPl}
        </div>
      </div>
    );
  }

  if (type === "constellation") {
    const { con, stars } = data as { con: string; stars: StarData[] };
    const conPl = CONSTELLATION_NAMES_PL[con] || con;
    const desc = CONSTELLATION_DESCRIPTIONS[con] || "Jeden z oficjalnych 88 gwiazdozbiorów Międzynarodowej Unii Astronomicznej (IAU).";
    const visibleCount = stars.filter((s) => s.horizontal && s.horizontal.alt > 0).length;
    const brightestStar = [...stars].sort((a, b) => a.mag - b.mag)[0];

    return (
      <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto sm:w-88 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 bg-zinc-950/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-zinc-100 z-30 transition-all animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-white/10 text-white text-[10px] font-bold border border-white/15">
                <Sparkles className="h-3 w-3" />
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">{conPl}</h3>
            </div>
            <span className="text-xs text-zinc-400 mt-0.5 block">
              Skrót IAU: {con} • Gwiazdozbiór
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Gwiazdy w katalogu</span>
            <span className="font-bold text-white text-sm">{stars.length}</span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Widoczne teraz</span>
            <span className="font-bold text-emerald-400 text-sm">
              {visibleCount} / {stars.length}
            </span>
          </div>

          {brightestStar && (
            <div className="col-span-2 rounded-xl border border-white/5 bg-white/5 p-2.5">
              <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Najjaśniejsza gwiazda</span>
              <span className="font-semibold text-white">
                {brightestStar.name} ({brightestStar.bayer}) – {brightestStar.mag.toFixed(2)} mag
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-2.5 text-xs text-zinc-300 leading-relaxed">
          {desc}
        </div>
      </div>
    );
  }

  return null;
}
