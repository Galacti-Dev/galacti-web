# Galacti - Specyfikacja Nowego Design Systemu (Monochrome Dark & White)

## 1. Koncepcja i Inspiracja
Nowy styl wizualny Galacti czerpie bezpośrednio z minimalistycznego, eleganckiego logotypu (biała planeta z pierścieniami i gwiazdami na głębokim, ciemnoszarym/czarnym tle).
Odchodzimy od jaskrawych, neonowych gradientów (cyan/purple/blue) na rzecz **luksusowej, surowej, kontrastowej estetyki kosmicznej monochrome (Ciemny Grafit / Głęboka Czerń / Krystaliczna Biel / Srebro)**.

---

## 2. Paleta Barw i Tokeny

| Zastosowanie | Nowa Wartość / Klasa Tailwind | Poprzednia Wartość (Usuwana) |
|---|---|---|
| **Główne tło aplikacji** | `#09090b` (zinc-950) / `#0c0c0e` | `#030712` (granatowy odcień) |
| **Karty / Powierzchnie (Surfaces)** | `bg-zinc-900/70`, `bg-black/60`, `backdrop-blur-xl` | `bg-cyan-950/40`, `bg-purple-950/30` |
| **Obramowania (Borders)** | `border-white/10`, `border-zinc-800` | `border-cyan-500/20`, kolorowe ramki |
| **Główny tekst / Akcenty** | `text-white` (#ffffff), `text-zinc-100` | `text-cyan-400`, `text-purple-400` |
| **Tekst drugorzędny / Etykiety** | `text-zinc-400`, `text-zinc-300` | `text-gray-400` |
| **Aktywne elementy / Przyciski Primary**| `bg-white text-black hover:bg-zinc-200` | `bg-gradient-to-r from-cyan-500 to-blue-600 text-black` |
| **Przyciski Secondary / Pills** | `bg-white/5 border border-white/15 text-white hover:bg-white/10` | `bg-cyan-500/20 text-cyan-400` |
| **Odznaki (Badges)** | `bg-white/10 text-white border border-white/15` | `bg-cyan-500/10 text-cyan-400` |
| **Wskaźniki aktywne (Tabs/Underline)** | `bg-white` (linia), `text-white` | Gradient cyan-purple |
| **Glow / Cienie** | `shadow-white/5`, `shadow-2xl shadow-black/80` | `glow-cyan`, `glow-purple` |

---

## 3. Integracja Logotypu w Navbarze i Layoutcie
- Plik loga został umieszczony w `/public/galacti_logo.jpg` oraz `/public/logo.jpg`.
- W komponencie `Navbar.tsx`:
  - W miejscu generycznej ikony `Orbit` z gradientem umieszczamy elegancki element brandu:
    - Zaokrąglony kafelek `rounded-xl overflow-hidden border border-white/20 bg-zinc-900` zawierający grafikę `/logo.jpg` z subtelnym białym pierścieniem i hoverem.
  - Napis `GALACTI` w czystej bieli ze zmniejszonym trackingiem (`tracking-widest font-black`).
  - Badge wersji: `v0.3.0` w stylu `bg-white/10 text-zinc-300 border border-white/10`.
  - Wskaźnik stanu danych (np. "NASA Live"): minimalistyczny ciemny badge `border-white/10 bg-zinc-900/80 text-zinc-300` z subtelną białą/szmaragdową kropką.

---

## 4. Wytyczne dla Komponentów

### 4.1. `src/app/page.tsx` (Dashboard)
- Banner powitalny: `bg-gradient-to-r from-zinc-900/90 via-zinc-950/80 to-black/95 border border-white/10`.
- Główny nagłówek "Witaj w Galacti": gradient `bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent`.
- Przycisk CTA 3D: `bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10`.
- Przycisk Asystenta: `border border-white/15 bg-white/5 text-white hover:bg-white/10`.

### 4.2. `ApodHero.tsx`, `IssTrackerCard.tsx`, `UpcomingLaunchesCard.tsx`
- Zastąpienie wszystkich instancji `text-cyan-400`, `bg-cyan-500/*`, `border-cyan-500/*` przez `text-white`, `text-zinc-300`, `bg-white/10`, `border-white/10`.
- Wskaźniki ładowania (`spinner`): `text-white` lub `text-zinc-400`.
- Paski postępu / telemetryczne: minimalistyczne wypełnienie `bg-white` lub `bg-zinc-300`.

### 4.3. `SpaceWeatherCard.tsx`
- Styl ciemnoszary: tło `bg-zinc-900/60 border border-white/10`.
- Wskaźnik Kp: 9-segmentowy pasek o stonowanych odcieniach (zinc-800 dla nieaktywnych, biały/jasnoszary dla aktywnych poziomów bazowych, subtelne ostrzeżenie tylko przy realnej burzy Kp >= 5).
- Badge alertu zorzowego: biało-szare lub subtelne eleganckie barwy.

### 4.4. `SolarViewer.tsx`, `PlanetInfoOverlay.tsx`, `CelestialBody.tsx`
- Przyciski nawigacji po planetach:
  - Stan nieaktywny: `bg-black/60 text-zinc-400 border border-white/10 hover:text-white hover:bg-white/10`.
  - Stan aktywny: `bg-white text-black font-semibold shadow-md shadow-white/10`.
- Karta `PlanetInfoOverlay`: `bg-zinc-950/90 border border-white/15 text-white`, kafelki księżyców z hoverem `hover:border-white/40 hover:bg-white/10`.

### 4.5. `src/app/chat/page.tsx` (AI Asystent)
- Dymek użytkownika: `bg-zinc-800 text-white border border-zinc-700/80` (lub czysta biel na czerni).
- Dymek asystenta: `bg-zinc-900/80 text-zinc-100 border border-white/10`.
- Przycisk wysyłania: `bg-white text-black hover:bg-zinc-200`.
- Sugestie pytań: `bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10`.
