"use client";

import { X, Keyboard, Sparkles } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "Nawigacja" | "Czas i Animacja" | "Wyszukiwanie i Obiekty";
}

const SHORTCUTS: ShortcutItem[] = [
  {
    keys: ["Spacja"],
    description: "Pauza / Wznów animację upływu czasu (obrót sfery)",
    category: "Czas i Animacja",
  },
  {
    keys: ["["],
    description: "Cofnij czas o 1 godzinę wstecz",
    category: "Czas i Animacja",
  },
  {
    keys: ["]"],
    description: "Przesuń czas o 1 godzinę w przód",
    category: "Czas i Animacja",
  },
  {
    keys: ["F"],
    description: "Wycentruj widok i przybliż na zaznaczonym obiekcie (Focus)",
    category: "Wyszukiwanie i Obiekty",
  },
  {
    keys: ["/"],
    description: "Otwórz i ustaw kursor w polu wyszukiwania obiektów",
    category: "Wyszukiwanie i Obiekty",
  },
  {
    keys: ["Esc"],
    description: "Zamknij okno, odznacz obiekt lub wyjdź z wyszukiwarki",
    category: "Wyszukiwanie i Obiekty",
  },
  {
    keys: ["P"],
    description: "Przełącz pełnoekranowy tryb Obserwatorium (Planetarium HUD)",
    category: "Nawigacja",
  },
  {
    keys: ["?"],
    description: "Otwórz / zamknij tę ściągę skrótów klawiszowych",
    category: "Nawigacja",
  },
  {
    keys: ["Scroll", "+ / -"],
    description: "Płynne przybliżanie i oddalanie widoku nieba",
    category: "Nawigacja",
  },
  {
    keys: ["Przeciągnij"],
    description: "Przesuwanie widoku planisfery (Pan)",
    category: "Nawigacja",
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories: Array<"Czas i Animacja" | "Wyszukiwanie i Obiekty" | "Nawigacja"> = [
    "Czas i Animacja",
    "Wyszukiwanie i Obiekty",
    "Nawigacja",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Skróty klawiszowe mapy nieba"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-zinc-950 p-5 sm:p-6 shadow-2xl text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                Skróty Klawiszowe <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
              </h3>
              <p className="text-xs text-zinc-400">
                Szybka nawigacja desktopowa w Obserwatorium Galacti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij pomoc skrótów"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts list grouped by category */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const catItems = SHORTCUTS.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
                  {cat}
                </span>
                <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-2 space-y-1.5">
                  {catItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 px-1.5 text-xs rounded hover:bg-white/5 transition-colors"
                    >
                      <span className="text-zinc-300 pr-2">{item.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k) => (
                          <kbd
                            key={k}
                            className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-md border border-white/20 bg-zinc-800 text-[11px] font-mono font-bold text-white shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>Wskazówka: naciśnij <kbd className="px-1.5 py-0.5 rounded border border-white/20 bg-zinc-800 text-white">?</kbd> w dowolnym momencie</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Rozumiem
          </button>
        </div>
      </div>
    </div>
  );
}
