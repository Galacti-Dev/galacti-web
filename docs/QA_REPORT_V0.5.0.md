# Raport QA i Audyt Astrofizyczny – Galacti v0.5.0
**Moduł:** Interaktywna Mapa Nieba 2D/3D (SkyMap dla Polski)  
**Data audytu:** 2026-11-03  
**Audytor:** QA & Astrofizyk (agent-76770881-3d14-433c-a1b3-92a7c258d704)  
**Status wydania:** **PASSED (Zatwierdzone do wdrożenia)**

---

## 1. Podsumowanie wykonawcze

Wydanie **Galacti v0.5.0** wprowadza zaawansowany moduł obserwacyjny: Interaktywną Mapę Nieba (2D Planisfera stereograficzna + 3D Sfera Niebieska Three.js) dostosowaną do współrzędnych geograficznych Polski (Warszawa, Gdańsk, Kraków i dowolne lokalizacje customowe).

W toku audytu przeprowadzono pełną weryfikację aparatu matematycznego astrometrii, poprawności katalogów gwiezdnych i obiektów głębokiego nieba (Messier DSO), wydajności API `/api/skymap`, testy interfejsu użytkownika w przeglądarce headless/live oraz audyt odporności renderera Three.js na brak akceleracji WebGL.

Wszystkie kryteria akceptacyjne zostały spełnione, a wykryty błąd obsługi braku kontekstu WebGL został natychmiast załatany mechanizmem automatycznego przełączania (graceful fallback) na wektorową planisferę SVG.

---

## 2. Audyt Aparatu Astrofizycznego i Matematycznego

Plik źródłowy: `src/lib/astronomyMath.ts`

### 2.1. Czas Gwiazdowy (GMST / LST)
- **Implementacja algorytmu:** Obliczanie Julian Date (JD) oraz stuleci juliańskich $T$ od epoki J2000.0 z formułą IAU:
  $$\theta_0 = 280.46061837 + 360.98564736629 \cdot (JD - 2451545.0) + 0.000387933 \cdot T^2 - \frac{T^3}{38710000}$$
- **Lokalny Czas Gwiazdowy (LST):** $LST = (GMST + \lambda / 15) \pmod{24}$.
- **Walidacja różnicy długości geograficznej:**
  - Warszawa ($\lambda = 21.0122^\circ\text{E}$): $\Delta t \approx +1.4008\,\text{h}$ (+1h 24m 03s względem Greenwich).
  - Gdańsk ($\lambda = 18.6466^\circ\text{E}$): $\Delta t \approx +1.2431\,\text{h}$ (+1h 14m 35s względem Greenwich).
  - Różnica czasu gwiazdowego pomiędzy Warszawą a Gdańskiem: dokładnie **9 minut i 28 sekund**, potwierdzona w testach jednostkowych i w interfejsie użytkownika.

### 2.2. Kąt Godzinny i Transformacja Równikowa $\to$ Horyzontalna
- **Równania:**
  - $HA = (LST - RA) \pmod{24}$
  - $\sin(\text{Alt}) = \sin(\delta)\sin(\phi) + \cos(\delta)\cos(\phi)\cos(HA)$
  - $\cos(\text{Az}) = \frac{\sin(\delta) - \sin(\phi)\sin(\text{Alt})}{\cos(\phi)\cos(\text{Alt})}$
- **Weryfikacja Gwiazdy Polarnej (Polaris / $\alpha\text{ UMi}$):**
  - Współrzędne katalogowe: $RA = 2.5303\,\text{h}$, $\delta = +89.2641^\circ$.
  - Wynik dla Warszawy ($\phi = 52.2297^\circ\text{N}$):
    - **Wysokość horyzontalna (Alt):** $+52.93^\circ$ (dokładnie odpowiada szerokości geograficznej obserwatora powiększonej o niewielkie odchylenie bieguna $\sim 0.7^\circ$).
    - **Azymut (Az):** $0.39^\circ$ (odchylenie poniżej $0.5^\circ$ od idealnej północy astronomicznej $0^\circ$).
- **Weryfikacja Gwiazd Okołobiegunowych (Circumpolar Stars):**
  - Warunek braku zachodu gwiazdy pod horyzont: $\delta > 90^\circ - \phi$ (dla Polski $\delta > 37.77^\circ$).
  - Wszystkie 27 gwiazd okołobiegunowych z katalogu (m.in. Wielka Niedźwiedzica, Kasjopeja, Mała Niedźwiedzica, Smok, Cefeusz) zachowują $\text{Alt} > 0^\circ$ w każdym punkcie 24-godzinnego cyklu dobowego.

### 2.3. Katalog Ciał Niebieskich (`skymap_data.json`)
- **Gwiazdy:** 60 jasnych gwiazd nieba północnego z poprawnymi danymi (nazwy tradycyjne, łacińskie oznaczenia Bayera, typ widmowy Morgana-Keenana O/B/A/F/G/K/M, magnitudo wizualne $V$, odległość w latach świetlnych).
- **Konstelacje:** 8 głównych gwiazdozbiorów widocznych z Polski (Ursa Major, Ursa Minor, Cassiopeia, Orion, Cygnus, Lyra, Taurus, Canis Major). Sprawdzono 100% połączeń asteryzmów – **0 nieistniejących identyfikatorów gwiazd**.
- **Messier DSO:** 6 kluczowych obiektów głębokiego nieba:
  - M31 (Galaktyka Andromedy)
  - M42 (Wielka Mgławica w Orionie)
  - M45 (Plejady)
  - M13 (Gromada Kulista w Herkulesie)
  - M57 (Mgławica Pierścień w Lutni)
  - M81/M82 (Galaktyki Bodego i Cygaro w Wielkiej Niedźwiedzicy)

---

## 3. Audyt Backend i API (`/api/skymap`)

- **Metoda HTTP:** `GET /api/skymap`
- **Parametry zapytania:** `lat`, `lon`, `time` (ISO 8601 string)
- **Wyniki testów obciążeniowych i funkcjonalnych:**
  - Status HTTP: `200 OK`
  - Nagłówki:
    - `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
    - `X-Visible-Stars: 51`
    - `X-Visible-DSO: 6`
  - Czas odpowiedzi: $\le 12\,\text{ms}$ (optymalna kalkulacja wektorowa w pamięci).
  - Format odpowiedzi: pełna struktura z metadanymi obserwatora (`observer.lst`, `observer.julianDate`), gwiazdami (`visibleStarsCount`, `stars[]` z przeliczonym `altitude` i `azimuth`), gwiazdozbiorami (`constellations[]`) oraz obiektami Messiera (`dso[]`).

---

## 4. Audyt Frontend i Interfejsu Użytkownika

### 4.1. Widok 2D: Planisfera Stereograficzna SVG (`SkyMapPlanisphere2D.tsx`)
- Projekcja stereograficzna z zenitem w centrum i horyzontem na obwodzie okręgu.
- Wyrysowane siatki wysokości: pierścienie $30^\circ$ i $60^\circ$ oraz krzyż zenitalny.
- Oznaczenia stron świata: N, E, S, W (z orientacją astronomiczną E po lewej stronie przy patrzeniu w niebo).
- Skalowanie wielkości punktów gwiezdnych proporcjonalnie do jasności pozornej (magnitudo).
- Kodowanie barwne gwiazd zgodne z klasyfikacją widmową Harvard (błękit dla O/B, biel dla A/F, żółć dla G, pomarańcz dla K, czerwień dla M).
- Interaktywność: kliknięcie gwiazdy lub obiektu DSO otwiera kartę szczegółów (`StarInfoCard`).

### 4.2. Karta Szczegółów Obiektu (`StarInfoCard.tsx`)
- Wyświetlanie nazwy polskiej, łacińskiej i oznaczenia katalogowego.
- Informacja o typie obiektu, odległości (l.św.), współrzędnych równikowych (RA/Dec) oraz bieżących współrzędnych horyzontalnych (Wysokość/Azymut).
- Oznaczenie widoczności: "Nad horyzontem" vs "Pod horyzontem".

### 4.3. Symulator Czasu i Kontrolery
- Tryb czasu rzeczywistego ("Na żywo").
- Krokowy selektor godzinowy (-1h, +1h, Reset, Północ, Zachód słońca).
- Dynamiczna rotacja dobowego ruchu sfery niebieskiej (ruch wsteczny ze wschodu na zachód).
- Szybki selektor miast: Warszawa ($52.23^\circ\text{N}, 21.01^\circ\text{E}$), Gdańsk ($54.35^\circ\text{N}, 18.65^\circ\text{E}$), Kraków ($50.06^\circ\text{N}, 19.94^\circ\text{E}$).

### 4.4. Widok 3D: Sfera Niebieska Three.js i Załatana Podatność WebGL
- **Wykryty problem:** W środowiskach bez natywnego wsparcia WebGL (np. wirtualne maszyny bez akceleracji 3D, przeglądarki headless) Three.js `<Canvas>` rzucał błąd krytyczny `Error creating WebGL context`, powodując awarię całej podstrony `/skymap`.
- **Wdrożona poprawka:**
  1. Zaimplementowano funkcję detekcji `isWebGLAvailable()` badającą możliwość utworzenia kontekstu `webgl2` lub `webgl`.
  2. W `src/app/skymap/page.tsx` wprowadzono bezpieczną subskrypcję stanu środowiska z użyciem `useSyncExternalStore` zapobiegającą błędom hydracji SSR.
  3. W przypadku braku WebGL, aplikacja domyślnie i bezbłędnie uruchamia wektorowy widok Planisfery 2D.
  4. Komponent `SkyMapViewer3D.tsx` zyskał elegancką kartę fallbackową w stylistyce Monochrome z informacją o braku akceleracji sprzętowej i przyciskiem natychmiastowego przełączenia na Planisferę 2D.

### 4.5. Integracja z Dashboardem (`CurrentSkyCard.tsx`)
- Nowy widget na stronie głównej (`/`) prezentujący w czasie rzeczywistym gwiazdy górujące w Polsce (o najwyższej elewacji w danej chwili, np. gwiazdy Kasjopei: Schedar $+85^\circ$, Caph $+83^\circ$ blisko zenitu).
- Bezpośredni odnośnik "Otwórz pełną mapę nieba 2D/3D $\to$" kierujący do `/skymap`.

### 4.6. Nawigacja i Identyfikacja Wizualna (`Navbar.tsx`)
- Wersja aplikacji zaktualizowana do **v0.5.0** (zarówno w nagłówku strony, jak i w pliku `package.json`).
- Dodana nowa pozycja w menu: **Mapa Nieba 2D/3D** prowadząca do `/skymap`.
- Ścisłe zachowanie stylistyki *Monochrome Dark & White* (tła `bg-neutral-900`/`bg-neutral-950`, ramki `border-neutral-800`, akcenty `text-white` i `text-neutral-400`).

---

## 5. Metryki Kompilacji i Jakości Kodu

- **Test lintera (`npm run lint`):**  
  `✔ No ESLint warnings or errors`
- **Test kompilatora TypeScript i builda (`npm run build`):**  
  `✓ Compiled successfully in 1370ms`  
  `✓ 15/15 routes generated (SSG & ISR/Dynamic API)`
- **Pokrycie tras:**
  - `/` (Dashboard z `CurrentSkyCard`)
  - `/skymap` (Planisfera 2D + Sfera 3D)
  - `/iss` (Śledzenie ISS)
  - `/launches` (Katalog startów)
  - `/weather` (Kosmiczna pogoda i zorze)
  - `/api/skymap` (Astrometryczny silnik API)
  - Pozostałe trasy i endpointy Galacti

---

## 6. Wnioski i Rekomendacja

Wydanie **Galacti v0.5.0** jest w pełni stabilne, precyzyjne pod względem astrofizycznym i gotowe do wdrożenia na środowisko produkcyjne.

**Rekomendacja:** **PASS / RELEASE APPROVED**
