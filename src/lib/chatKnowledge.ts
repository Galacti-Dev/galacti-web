import planetsData from '@/data/planets.json';
import moonsAndDwarfsData from '@/data/moons_and_dwarfs.json';
import astronomicalEventsData from '@/data/astronomical_events.json';
import { CelestialBodyData, AstronomicalEvent } from '@/lib/types';

export const SYSTEM_PROMPT = `Jesteś Galacti AI – interaktywnym, edukacyjnym asystentem kosmicznym w aplikacji Galacti. Twoim celem jest inspirowanie użytkowników oraz rzetelne wyjaśnianie zagadnień związanych z astronomią, astrofizyką, eksploracją kosmosu, misjami rakietowymi i Układem Słonecznym.

### GŁÓWNE ZASADY I INTEGRALNOŚĆ FAKTOGRAFICZNA:
1. **Niezachwiana wierność faktom naukowym:** Opieraj się wyłącznie na potwierdzonej wiedzy naukowej (NASA, ESA, IAU, JPL, publikacje recenzowane). Nigdy nie wymyślaj danych, misji, dat ani parametrów fizycznych.
2. **Ścisłe odróżnianie FAKTÓW od HIPOTEZ i TEORII:**
   - Gdy omawiasz udowodnione zjawiska i pomiary (np. promień Marsa, okres obiegu Ziemi, lądowania misji Apollo), przedstawiaj je jako twarde fakty.
   - Gdy omawiasz kwestie nierozstrzygnięte lub teoretyczne (np. natura ciemnej materii i ciemnej energii, paradoks Fermiego, hipotezy o życiu na Europie lub Enceladusie, osobliwość wewnątrz czarnych dziur, teorie przed Wielkim Wybuchem), ZAWSZE wyraźnie zaznaczaj: „Według obecnych teorii...”, „Jest to wciąż otwarta hipoteza naukowa...”, „Dotychczas nie ma bezpośrednich dowodów...”.
3. **Przyznawanie się do niewiedzy:** Jeśli nauka nie zna jeszcze odpowiedzi na dane pytanie lub pytanie wykracza poza Twoją bazę wiedzy, powiedz to wprost i wyjaśnij, na jakim etapie są aktualne badania.
4. **Dopasowanie poziomu wyjaśnień (Przystępność bez spłycania):**
   - Tłumacz złożone zjawiska prostym, obrazowym językiem.
   - Używaj intuicyjnych porównań i analogii z życia codziennego.
   - Zachowaj szacunek dla inteligencji użytkownika – unikaj infantylizmu, lecz nie zniechęcaj hermetycznym żargonem bez wyjaśnienia definicji.
5. **Kontekst misji i technologii kosmicznych:** Posiadasz aktualną wiedzę o teleskopach (JWST, Hubble), misjach księżycowych (Artemis, Apollo), marsjańskich (Perseverance, Curiosity), jowiszowych i saturnowych (Europa Clipper, JUICE, Cassini-Huygens, Dragonfly), stacjach kosmicznych (ISS, Tiangong) i komercyjnych rakietach (Falcon 9, Starship, SLS, Ariane 6).
6. **Zjawiska astronomiczne i kalendarz nieba:** Znasz daty, trajektorie i optymalne metody obserwacji kluczowych zjawisk na niebie w Polsce i Europie w latach 2026–2027:
   - Zaćmienia Słońca (Wielkie Zaćmienie 12 sierpnia 2026 r. z zakryciem 80–86% w Polsce oraz Zaćmienie Stulecia 2 sierpnia 2027 r. z 50% w Polsce i 6m 23s fazy całkowitej w Egipcie; konieczność filtrów ISO 12312-2 / Baader ND5.0).
   - Roje meteorów (Perseidy 12/13 sierpnia w nowiu Księżyca w 2026 r., Geminidy 13/14 grudnia o ZHR 150, Kwadrantydy w styczniu, Lirydy w kwietniu, Leonidy w listopadzie).
   - Opozycje planetarne (Opozycja Saturna 4 października 2026 r. ze znikającymi pierścieniami ustawionymi krawędzią 'Ring-Plane Crossing', Wielka Opozycja Marsa 19 lutego 2027 r. o jasności -1,2 mag, Opozycja Jowisza 11 lutego 2027 r. o jasności -2,6 mag).
   - Koniunkcje planet (Wenus i Jowisz w odległości 0,5° w czerwcu 2026 r.) oraz Superksiężyce (perygeum w listopadzie 2026 r.).
7. **Granice tematyczne:** Skupiasz się na astronomii, astrofizyce, astronautyce, fizyce planetarnej i naukach o Ziemi z perspektywy kosmicznej. Jeśli użytkownik zapyta o temat całkowicie niezwiązany (np. polityka, przepisy kulinarne, finanse), uprzejmie i krótko nawiąż do kosmosu lub poproś o pytanie dotyczące Wszechświata.

### STYL ODPOWIEDZI:
- Odpowiadaj w języku polskim, z nienaganną gramatyką i entuzjazmem do nauki.
- Używaj przejrzystego formatowania Markdown: pogrubienia dla pojęć kluczowych, punktorów dla list, krótkich akapitów.
- Jeśli odpowiedź zawiera dane liczbowe, stosuj układ SI (kilometry, tony, metry na sekundę, jednostki astronomiczne AU, lata świetlne).
- Na koniec dłuższych odpowiedzi możesz zaproponować jedno ciekawe powiązane pytanie lub zjawisko do zgłębienia.`;

export interface KnowledgeEntry {
  keywords: string[];
  response: string;
}

const allCelestialBodies: CelestialBodyData[] = [
  ...(planetsData as unknown as CelestialBodyData[]),
  ...(moonsAndDwarfsData as unknown as CelestialBodyData[]),
];

const allAstronomicalEvents: AstronomicalEvent[] = astronomicalEventsData as AstronomicalEvent[];

export function generateEducationalFallback(userQuery: string): string {
  const query = userQuery.toLowerCase().trim();

  // A. Zaćmienia Słońca i Księżyca (Eclipses 2026-2027)
  if (
    query.includes('zaćmieni') ||
    query.includes('zacmieni') ||
    query.includes('zaćmienie') ||
    query.includes('zacmienie')
  ) {
    return `### Zaćmienia Słońca w Polsce i Europie (2026–2027)\n\n` +
      `Przed nami dwa niezwykłe zjawiska zaćmieniowe, które będzie można obserwować na polskim niebie:\n\n` +
      `1. **Wielkie Zaćmienie Słońca – 12 sierpnia 2026 r. (Głębokie częściowe w Polsce):**\n` +
      `   - **Faza w Polsce:** Tarcza Księżyca zasłoni od **80% do 86%** tarczy słonecznej (najwyższa faza w południowo-zachodniej Polsce: Dolny Śląsk, Ziemia Lubuska).\n` +
      `   - **Przebieg (czas CEST):** Początek ok. 18:40, apogeum zaćmienia ok. 19:40, tuż przed zachodem Słońca, powodując wyraźny spadek jasności i ochłodzenie otoczenia.\n` +
      `   - **Pas całkowity:** Grenlandia, zachodnia Islandia oraz północna i centralna Hiszpania (pierwsze zaćmienie całkowite w Europie kontynentalnej od 1999 r.!).\n` +
      `   - **BEZPIECZEŃSTWO:** Do bezpośrednich obserwacji niezbędne są certyfikowane filtry z normą **ISO 12312-2** lub folia słoneczna Baader ND5.0. Zwykłe okulary przeciwsłoneczne nie chronią przed uszkodzeniem siatkówki!\n\n` +
      `2. **Zaćmienie Stulecia – 2 sierpnia 2027 r. (Częściowe w Polsce):**\n` +
      `   - **Faza w Polsce:** Częściowe zakrycie ok. **45%–54%** tarczy Słońca w godzinach przedpołudniowych.\n` +
      `   - **Faza całkowita:** Spektakularne zaćmienie całkowite w Egipcie o rekordowym czasie fazy ciemnej aż **6 minut i 23 sekundy** w okolicach Luksoru.`;
  }

  // B. Perseidy (Perseids meteor shower)
  if (
    query.includes('perseid') ||
    query.includes('wawrzyńc') ||
    query.includes('wawrzync')
  ) {
    return `### Maksimum Roju Perseidów 2026 (Noc 12/13 sierpnia)\n\n` +
      `Perseidy (potocznie *„Łzy świętego Wawrzyńca”*) to najpopularniejszy letni rój meteorów na półkuli północnej.\n\n` +
      `- **Ciało macierzyste:** Drobinki pyłu pozostawione przez kometę **109P/Swift-Tuttle**, wpadające w ziemską atmosferę z prędkością **59 km/s**.\n` +
      `- **Aktywność (ZHR):** Do **100 zjawisk na godzinę** w szczycie aktywności.\n` +
      `- **WYJĄTKOWE WARUNKI W 2026 ROKU:** **NÓW KSIĘŻYCA!** Dokładnie 12 sierpnia 2026 r. przypada nów Księżyca (tego samego dnia ma miejsce zaćmienie Słońca). Oznacza to całkowity brak zaświetlenia naturalnym światłem i krystalicznie ciemne niebo!\n` +
      `- **Jak obserwować:** Najlepsze warunki panują w drugiej połowie nocy, gdy radiant w gwiazdozbiorze Perseusza wznosi się wysoko nad północno-wschodni horyzont. Obserwuj gołym okiem, leżąc wygodnie na leżaku z dala od świateł miejskich.`;
  }

  // C. Geminidy (Geminids meteor shower)
  if (query.includes('geminid')) {
    return `### Maksimum Roju Geminidów 2026 (Noc 13/14 grudnia)\n\n` +
      `Geminidy to najobfitszy i najbardziej przewidywalny deszcz meteorów w całym roku kalendarzowym.\n\n` +
      `- **Aktywność (ZHR):** Aż **120–150 meteorów na godzinę** w maksimum!\n` +
      `- **Skaliste pochodzenie:** W przeciwieństwie do większości rojów kometarnych, źródłem Geminidów jest skalisto-węglowa planetoida **(3200) Phaethon**.\n` +
      `- **Charakterystyka zjawiska:** Odłamki są gęstsze i wolniejsze (ok. 35 km/s), co sprawia, że palą się wolniej i dłużej na niebie, tworząc wielobarwne, jasne smugi i bolidy.\n` +
      `- **Warunki w 2026:** Księżyc w fazie przybywającego sierpa zajdzie przed północą, pozostawiając kluczowe godziny nocne w idealnej ciemności. Radiant w Bliźniętach jest widoczny przez całą noc.`;
  }

  // D. Kwadrantydy / Lirydy / Leonidy
  if (query.includes('kwadrantyd') || query.includes('quadrantid')) {
    return `### Maksimum Roju Kwadrantydów (Początek stycznia)\n\n` +
      `- **Szczyt aktywności:** Noc z 3 na 4 stycznia (pik trwa krótko, ok. 6 godzin).\n` +
      `- **Aktywność (ZHR):** Aż **110 zjawisk na godzinę**.\n` +
      `- **Źródło:** Planetoida 2003 EH1 (dawny gwiazdozbiór Kwadrant Ścienny / Wolarz).\n` +
      `- **Wskazówka:** Obserwacje najlepiej prowadzić w godzinach nadranem przed wschodem Słońca.`;
  }

  if (query.includes('liryd') || query.includes('lyrid')) {
    return `### Maksimum Roju Lirydów (22/23 kwietnia)\n\n` +
      `- **Pochodzenie:** Kometa długookresowa C/1861 G1 (Thatcher), okres orbitalny ok. 415 lat.\n` +
      `- **Aktywność:** Średnio 18 zjawisk/h z niespodziewanymi wybuchami do 90/h.\n` +
      `- **Radiant:** W pobliżu jasnej gwiazdy Wega w gwiazdozbiorze Lutni.`;
  }

  if (query.includes('leonid')) {
    return `### Maksimum Roju Leonidów (17/18 listopada)\n\n` +
      `- **Najszybsze meteory:** Prędkość wpadania w atmosferę wynosi rekordowe **71 km/s**!\n` +
      `- **Pochodzenie:** Kometa 55P/Tempel-Tuttle.\n` +
      `- **Cechy:** Pozostawiają długo świecące zielonkawe smugi zjonizowanego gazu utrzymujące się nawet kilkadziesiąt sekund.`;
  }

  // E. Opozycje planetarne (Saturn bez pierścieni, Mars 2027, Jowisz 2027)
  if (
    (query.includes('saturn') && (query.includes('opozycj') || query.includes('pierścien') || query.includes('pierscien') || query.includes('ring-plane') || query.includes('znik'))) ||
    query.includes('ring-plane')
  ) {
    return `### Opozycja Saturna 2026 i Zjawisko „Znikających Pierścieni” (4 października 2026)\n\n` +
      `Saturn znajdzie się w opozycji do Słońca 4 października 2026 r., świecąc z jasnością +0,4 mag w gwiazdozbiorze Ryb w minimalnej odległości od Ziemi (ok. 1,28 mld km).\n\n` +
      `- **Niezwykłe zjawisko 'Ring-Plane Crossing':** W latach 2025–2026 Ziemia przecina płaszczyznę pierścieni Saturna. Dla ziemskiego obserwatora potężny układ pierścieni o szerokości niemal 300 000 km ustawia się niemal idealnie **krawędzią (kąt bliski 0°)**.\n` +
      `- **Obraz w teleskopie:** Pierścienie widoczne są jako niewiarygodnie cienka kreska przecinająca glob planety, a w mniejszych teleskopach zdają się niemal całkowicie znikać!\n` +
      `- **Okazja naukowa:** Zniknięcie oślepiającego blasku pierścieni pozwala łatwiej dostrzec mniejsze księżyce Saturna krążące wokół planety (Tytan, Rea, Dione, Tetyda).`;
  }

  if (query.includes('mars') && (query.includes('opozycj') || query.includes('wielka opozycja') || query.includes('2027'))) {
    return `### Wielka Opozycja Marsa 2027 (19 lutego 2027)\n\n` +
      `Opozycja Marsa zachodzi średnio co 26 miesięcy (780 dni), gdy Ziemia wyprzedza Czerwoną Planetę na wewnętrznej orbicie.\n\n` +
      `- **Widoczność w Polsce:** Doskonała – Mars wzniesie się bardzo wysoko na zimowym niebie w gwiazdozbiorze Lwa.\n` +
      `- **Jasność:** Osiągnie jasność aż **-1,2 mag** (jaśniejszy od Syriusza!), mieniąc się intensywną pomarańczowo-rdzawą barwą.\n` +
      `- **Obserwacje teleskopowe:** Tarcza planety powiększy się na tyle, że teleskop amatorski (100–150 mm) z filtrem pomarańczowym lub czerwonym pozwoli zaobserwować białą północną czapę lodową oraz ciemne równiny bazaltowe (np. Syrtis Major).`;
  }

  if (query.includes('jowisz') && (query.includes('opozycj') || query.includes('2027'))) {
    return `### Opozycja Jowisza 2027 (11 lutego 2027)\n\n` +
      `- **Blask i wielkość:** Jowisz osiągnie jasność **-2,6 mag**, stając się najjaśniejszym obiektem nocnego nieba po Księżycu na granicy Raka i Lwa.\n` +
      `- **Tarcza planety:** Średnica kątowa 45 sekund łuku odsłania pasy równikowe i Wielką Czerwoną Plamę w małym teleskopie.\n` +
      `- **Księżyce galileuszowe:** Już zwykła lornetka 7x–10x ukazuje cztery wielkie księżyce (Io, Europa, Ganimedes, Kallisto) w jednej linii wokół planety.`;
  }

  // F. Koniunkcje planet i Superksiężyc
  if (query.includes('koniunkcj') || (query.includes('wenus') && query.includes('jowisz'))) {
    return `### Wielka Koniunkcja Wenus i Jowisza (9 czerwca 2026 r.)\n\n` +
      `Dwie najjaśniejsze planety nocnego nieba spotkają się na porannym niebie przed wschodem Słońca w odległości zaledwie **0,5 stopnia** (dokładnie tyle, ile wynosi pozorna średnica tarczy Księżyca w pełni!). Obie planety zmieszczą się w jednym polu widzenia lornetki lub małego teleskopu.`;
  }

  if (query.includes('superksiężyc') || query.includes('superksiezyc') || query.includes('supermoon')) {
    return `### Superksiężyc w Perygeum (24 listopada 2026 r.)\n\n` +
      `Pełnia zbiega się z przejściem Księżyca przez perygeum – punkt orbity najbliższy Ziemi (ok. **356 500 km**).\n\n` +
      `- **Tarcza na niebie:** Do 14% większa i nawet do 30% jaśniejsza niż podczas pełni w apogeum.\n` +
      `- **Najlepszy moment:** Wschód Księżyca tuż po zachodzie Słońca, gdy zjawisko potęguje złudzenie optyczne (złudzenie księżycowe przy horyzoncie).`;
  }

  // G. Ogólne zapytania o zjawiska astronomiczne, kalendarz, deszcze meteorów
  if (
    query.includes('zjawisk') ||
    query.includes('kalendarz') ||
    query.includes('deszcz meteor') ||
    query.includes('deszcze meteor') ||
    query.includes('rój meteor') ||
    query.includes('roje meteor') ||
    query.includes('spadając') ||
    query.includes('spadajac') ||
    query.includes('co na niebie') ||
    query.includes('co widać na niebie') ||
    query.includes('co widac na niebie')
  ) {
    return `### Kluczowe Zjawiska Astronomiczne (2026–2027)\n\n` +
      `Oto najważniejsze zjawiska astronomiczne widoczne z terenu Polski:\n\n` +
      `1. **Wielkie Zaćmienie Słońca (12 sierpnia 2026 r.):** Głębokie zaćmienie częściowe w Polsce (**80%–86%** tarczy) przed zachodem Słońca.\n` +
      `2. **Maksimum Perseidów (12/13 sierpnia 2026 r.):** Do 100 meteorów/h podczas **nowiu Księżyca** – idealnie ciemne niebo!\n` +
      `3. **Opozycja Saturna (4 października 2026 r.):** Zjawisko *Ring-Plane Crossing* – pierścienie widoczne krawędzią, wyglądające jak cienka igła.\n` +
      `4. **Superksiężyc w perygeum (24 listopada 2026 r.):** Największa i najjaśniejsza pełnia roku (356 500 km od Ziemi).\n` +
      `5. **Maksimum Geminidów (13/14 grudnia 2026 r.):** Królewski rój meteorów o ZHR 150 z planetoidy Phaethon.\n` +
      `6. **Wielka Opozycja Marsa (19 lutego 2027 r.):** Blask -1,2 mag i znakomita widoczność czap lodowych.\n` +
      `7. **Zaćmienie Słońca Stulecia (2 sierpnia 2027 r.):** W Polsce częściowe (~50%), w Egipcie całkowite przez 6m 23s.\n\n` +
      `Pełną listę z odliczaniem i wskazówkami obserwacyjnymi znajdziesz w module **Kalendarz Zjawisk** w aplikacji Galacti!`;
  }

  // 1. Ziemia & Księżyc Ziemi (Earth's Moon)
  if (
    query.includes('oddalanie') ||
    query.includes('oddala się') ||
    query.includes('oddala sie') ||
    query.includes('księżyc') ||
    query.includes('ksiezyc') ||
    query.includes('księżycu') ||
    query.includes('ksiezycu') ||
    query.includes('księżyca') ||
    query.includes('ksiezyca') ||
    query.includes('srebrny glob')
  ) {
    return `### Księżyc Ziemi (Moon)\n\n` +
      `Księżyc jest jedynym naturalnym satelitą Ziemi i piątym co do wielkości księżycem w całym Układzie Słonecznym.\n\n` +
      `- **Oddalanie się od Ziemi:** Na skutek tarcia pływowego Ziemia powoli zwalnia swój obrót, przekazując moment pędu na orbitę Księżyca. W rezultacie **Księżyc oddala się od Ziemi w tempie ok. 3,8 cm rocznie** (zjawisko to mierzymy z dokładnością do milimetrów dzięki laserom odbijanym od retroreflektorów pozostawionych przez astronautów Apollo).\n` +
      `- **Pływy morskie:** Grawitacja Księżyca (wspomagana w mniejszym stopniu przez Słońce) wywołuje zjawisko pływów morskich (przypływów i odpływów) oraz stabilizuje nachylenie osi obrotu Ziemi na poziomie ~23,4°, gwarantując stabilny klimat na przestrzeni setek milionów lat.\n` +
      `- **Lądowania misji Apollo:** W latach 1969–1972 w ramach programu Apollo na powierzchni Księżyca wylądowało łącznie **12 astronautów** (pierwszym był Neil Armstrong w misji Apollo 11, a ostatnim Eugene Cernan w misji Apollo 17).\n\n` +
      `💡 **Ciekawostka:** Księżyc znajduje się w rotacji synchronicznej z Ziemią – czas jednego obrotu wokół własnej osi jest dokładnie równy czasowi jednego obiegu wokół Ziemi (~27,3 dnia), dlatego z Ziemi widzimy zawsze tę samą stronę Srebrnego Globu!`;
  }

  // 2. Europa (Księżyc Jowisza) - ocean, życie pozaziemskie, Europa Clipper, JUICE
  if (
    query.includes('europ') ||
    query.includes('clipper')
  ) {
    return `### Europa – Lodowy Księżyc Jowisza\n\n` +
      `Europa jest jednym z czterech wielkich księżyców galileuszowych Jowisza i jednym z najbardziej fascynujących obiektów w poszukiwaniu życia pozaziemskiego.\n\n` +
      `- **Podlodowy ocean ciekłej wody:** Pod zewnętrzną skorupą z lodu wodnego o grubości 15–25 km znajduje się globalny ocean słonej wody o głębokości dochodzącej do 100 km. Szacuje się, że ocean Europy zawiera **2 do 3 razy więcej wody niż wszystkie oceany na Ziemi razem wzięte**!\n` +
      `- **Źródło ciepła:** Woda pozostaje płynna dzięki gigantycznemu ogrzewaniu pływowemu – potężna grawitacja Jowisza oraz oddziaływanie sąsiednich księżyców (Io i Ganimedesa) nieustannie uginają i rozciągają wnętrze Europy, generując ciepło tarcia.\n` +
      `- **Potencjał astrobiologiczny (Hipoteza):** Na dnie oceanu woda ma bezpośredni kontakt ze skalistym płaszczem, co umożliwia powstawanie kominów hydrotermalnych dostarczających energii i związków chemicznych, podobnie jak na dnach ziemskich oceanów.\n` +
      `- **Misje badawcze:** Sonda NASA **Europa Clipper** (wystrzelona w październiku 2024 r.) oraz europejska misja **JUICE** mają za zadanie zbadać grubość lodu, skład gejzerów i warunki sprzyjające powstawaniu życia.\n\n` +
      `💡 **Wymiary:** Promień 1560,8 km, okres obiegu wokół Jowisza wynosi zaledwie 3,55 dnia ziemskiego.`;
  }

  // 3. Io (Księżyc Jowisza) - wulkany, erupcje siarki
  if (
    query.includes('io') &&
    (query === 'io' || query.includes(' io ') || query.startsWith('io ') || query.endsWith(' io') || query.includes('wulkan') || query.includes('jowisz') || query.includes('księżyc') || query.includes('ksiezyc') || query.includes('siark'))
  ) {
    return `### Io – Najbardziej Wulkaniczny Świat Układu Słonecznego\n\n` +
      `Io, najbardziej wewnętrzny z księżyców galileuszowych Jowisza, jest **najbardziej aktywnym wulkanicznie obiektem w całym Układzie Słonecznym**.\n\n` +
      `- **Ponad 400 czynnych wulkanów:** Powierzchnia Io jest nieustannie przekształcana przez wypływy lawy bazaltowej i siarkowej. Erupcje wyrzucają pióropusze dwutlenku siarki na wysokość ponad 500 km w przestrzeń kosmiczną z prędkością przekraczającą 1 km/s!\n` +
      `- **Przyczyna piekielnej aktywności:** Ogrzewanie pływowe. Io krąży bardzo blisko potężnego Jowisza i znajduje się w rezonansie orbitalnym 4:2:1 z Europą i Ganimedesem. Siły grawitacyjne unoszą i opuszczają stałą skorupę Io w pływach o amplitudzie dochodzącej do 100 metrów!\n` +
      `- **Niezwykły wygląd:** Ze względu na związki siarki w różnych odmianach alotropowych Io przypomina wyglądem wielką pizzę lub ser z plamami czerni, żółci, pomarańczu i czerwieni.\n\n` +
      `💡 **Parametry:** Promień 1821,6 km, średnia odległość od Jowisza 421 700 km, obieg wokół planety trwa zaledwie 42,5 godziny.`;
  }

  // 4. Tytan (Księżyc Saturna) - atmosfera, jeziora metanu, Dragonfly
  if (query.includes('tytan') || query.includes('titan')) {
    return `### Tytan – Księżyc Saturna z Jeziorami Węglowodorów\n\n` +
      `Tytan to drugi co do wielkości księżyc w Układzie Słonecznym (większy od planety Merkury) i jedyny znany naturalny satelita posiadający **gęstą atmosferę**.\n\n` +
      `- **Atmosfera bogatsza niż na Ziemi:** Składa się w 95% z azotu i 5% z metanu. Ciśnienie przy powierzchni jest o 50% wyższe niż na Ziemi na poziomie morza (1,5 atm).\n` +
      `- **Cykl metanowy:** Na Tytanie panuje pełny obieg hydrologiczny, w którym zamiast wody krążą węglowodory. W temperaturze -179°C ciekły metan i etan tworzą chmury, deszcze, rzeki oraz gigantyczne morza i jeziora polarne (np. *Kraken Mare*, *Ligeia Mare*).\n` +
      `- **Latanie siłą ludzkich mięśni:** Ze względu na gęstą atmosferę i małą grawitację (ok. 14% ziemskiej), człowiek w skafandrze termicznym z prostymi skrzydłami na rękach mógłby latać w powietrzu Tytana jak ptak!\n` +
      `- **Misja Dragonfly (NASA):** Planowany autonomiczny dron-wiropłat o napędzie jądrowym MMRTG ma wylądować na Tytanie w latach 30. XXI wieku, by badać prebiotyczną chemię organiczną.\n\n` +
      `💡 W 2005 roku europejski lądownik **Huygens** osiadł na powierzchni Tytana, przesyłając pierwsze w historii zdjęcia spomiędzy otoczaków z lodu wodnego.`;
  }

  // 5. Enceladus (Księżyc Saturna) - kriowulkany, gejzery lodu
  if (query.includes('enceladus') || query.includes('encelad')) {
    return `### Enceladus – Lodowe Gejzery i Podpowierzchniowy Ocean\n\n` +
      `Enceladus, niewielki księżyc Saturna o średnicy zaledwie 504 km, jest jednym z najważniejszych miejsc badań nad potencjalnym życiem pozaziemskim.\n\n` +
      `- **Kriowulkanizm i 'Tygrysie Pasy':** W rejonie bieguna południowego Enceladusa występują cztery równoległe szczeliny tektoniczne (*Tiger Stripes*). Gejzery kriowulkaniczne wystrzeliwują z nich w kosmos pióropusze pary wodnej, kryształków lodu, soli morskich oraz cząsteczek organicznych.\n` +
      `- **Zasilanie pierścienia E:** Cząstki wyrzucane z gejzerów Enceladusa uciekają w przestrzeń kosmiczną i bezpośrednio tworzą rozległy, mgławicowy pierścień E Saturna.\n` +
      `- **Globalny ocean słonej wody:** Pod lodową skorupą znajduje się ocean ogrzewany przez siły pływowe i porowate jądro krzemianowe. Sonda Cassini wykryła w gejzerach wodór cząsteczkowy ($H_2$) i metan, co świadczy o aktywnych kominach hydrotermalnych na dnie morza.\n` +
      `- **Najjaśniejszy glob:** Powierzchnia ze świeżego lodu odbija niemal 100% światła słonecznego (albedo geometryczne ~1,4).\n\n` +
      `💡 **Wymiary:** Promień 252,1 km, obieg wokół Saturna trwa zaledwie 32,9 godziny.`;
  }

  // 6. Pluton & Charon (Pluto & Charon) - planeta karłowata, serce, układ podwójny
  if (query.includes('pluton') || query.includes('charon') || query.includes('pluto')) {
    return `### Pluton i Charon – Podwójny Świat Pasa Kuipera\n\n` +
      `- **Status planety karłowatej:** Odkryty w 1930 r. przez Clyde'a Tombaugha, przez 76 lat był uznawany za dziewiątą planetę. W 2006 roku Międzynarodowa Unia Astronomiczna (IAU) zaliczyła go do nowo utworzonej klasy **planet karłowatych** (*dwarf planets*), ponieważ Pluton nie oczyścił otoczenia swojej orbity w Pasie Kuipera.\n` +
      `- **Słynne Azotowe Serce (Tombaugh Regio):** Misja sondy New Horizons w 2015 r. odkryła ogromny lodowiec z zamarzniętego azotu, tlenku węgla i metanu (*Sputnik Planitia*), otoczony górami z twardego jak granit lodu wodnego o wysokości do 3500 metrów!\n` +
      `- **Układ podwójny z Charonem:** Charon ma średnicę ponad połowy średnicy Plutona (1212 km vs 2376 km). Środek ciężkości (barycentrum) ich układu znajduje się w otwartej przestrzeni nad powierzchnią Plutona – oba ciała krążą wokół wspólnego punktu.\n` +
      `- **Podwójna blokada pływowa:** Pluton i Charon są stale zwrócone ku sobie tą samą stroną; doba na obu ciałach i okres wzajemnego obiegu trwają dokładnie tyle samo: **6,387 dnia ziemskiego** (ok. 153,3 godziny).\n` +
      `- **Czerwona czapa polarna Charona:** Na biegunie Charona znajduje się *Mordor Macula* – ciemnoczerwony rejon pokryty tolinami (złożonymi makromolekułami organicznymi powstałymi z uciekającego z Plutona gazu).\n\n` +
      `💡 Średnia odległość Plutona od Słońca to 39,5 AU (~5,9 mld km), a jeden pełny rok plutoński trwa aż 248 lat ziemskich!`;
  }

  // 7. Ceres – Planeta Karłowata Pasa Planetoid
  if (query.includes('ceres')) {
    return `### Ceres – Królowa Pasa Planetoid\n\n` +
      `Ceres jest największym obiektem w głównym pasie planetoid rozciągającym się między Marsem a Jowiszem i jedyną planetą karłowatą w wewnętrznym Układzie Słonecznym.\n\n` +
      `- **Jedna trzecia masy pasa planetoid:** Ceres skupia około 30–35% całej masy pasa planetoid. Dzięki własnej grawitacji osiągnęła kształt równowagi hydrostatycznej (spłaszczonej sferoidy) o średnicy ok. 940 km.\n` +
      `- **Historia klasyfikacji:** Odkryta 1 stycznia 1801 r. przez Giuseppe Piazziego, przez niemal pół wieku była uznawana za pełnoprawną planetę Układu Słonecznego, potem za planetoidę nr 1, a w 2006 roku uzyskała status planety karłowatej.\n` +
      `- **Kriowulkan Ahuna Mons:** Sonda Dawn (NASA) odkryła na Ceres samotną górę lodową o wysokości ok. 4 km, będącą wygasłym kriowulkanem, który w przeszłości wyrzucał błoto solankowe.\n` +
      `- **Świecące plamy w kraterze Occator:** Niezwykle jasne faculae (plamy *Cerealia Facula*) to osady soli (głównie węglanu sodu), które wykrystalizowały po odparowaniu podpowierzchniowej solanki.\n\n` +
      `💡 **Parametry:** Promień 469,7 km, okres obiegu wokół Słońca: 4,6 roku (1682 dni), rotacja wokół osi: 9,07 godziny.`;
  }

  // 8. Mars life / czy na Marsie jest życie
  if ((query.includes('mars') && (query.includes('życie') || query.includes('zycie'))) || query.includes('życie na marsie') || query.includes('zycie na marsie')) {
    return `Na tę chwilę **nie mamy bezpośrednich dowodów** na istnienie życia na Marsie – ani obecnie, ani w przeszłości.\n\n` +
      `Oto co wiemy na pewno na podstawie badań łazików NASA (Curiosity, Perseverance):\n` +
      `- **Fakt:** W odległej przeszłości (około 3,5–4 miliardy lat temu) na powierzchni Marsa znajdowały się rzeki i jeziora z ciekłą wodą, a planeta posiadała gęstszą atmosferę i warunki sprzyjające rozwojowi mikroorganizmów.\n` +
      `- **Fakt:** W marsjańskich skałach osadowych odkryto cząsteczki organiczne, które stanowią chemiczne cegiełki życia.\n` +
      `- **Hipoteza badawcza:** Naukowcy badają hipotezę, czy proste formy życia mikrobiologicznego mogły przetrwać głęboko pod powierzchnią planety, gdzie są chronione przed zabójczym promieniowaniem kosmicznym.\n\n` +
      `Misja łazika Perseverance koncentruje się obecnie w kraterze Jezero na zbieraniu próbek skał, które przyszła misja *Mars Sample Return* ma sprowadzić na Ziemię w celu ostatecznej analizy.`;
  }

  // 9. Black holes / czarne dziury
  if (query.includes('czarn') && query.includes('dziur')) {
    return `Wszystko sprowadza się do pojęcia **prędkości ucieczki** – czyli minimalnej prędkości, jaką musisz rozwinąć, by wyrwać się z pola grawitacyjnego danego ciała.\n\n` +
      `Aby rakieta wystrzelona z Ziemi poleciała w kosmos, musi osiągnąć tzw. drugą prędkość kosmiczną (ok. **11,2 km/s**). Im ciało jest masywniejsze i bardziej zwarte, tym większa prędkość jest potrzebna.\n\n` +
      `Czarna dziura ma masę skupioną w tak niewyobrażalnie małej objętości, że poza granicą zwaną **horyzontem zdarzeń** prędkość ucieczki staje się **większa niż prędkość światła** (ok. 300 000 km/s). Ponieważ według Szczególnej Teorii Względności Einsteina nic we Wszechświecie nie może poruszać się szybciej niż światło, żaden obiekt ani nawet promień światła nie jest w stanie zawrócić zza horyzontu zdarzeń.\n\n` +
      `*Czy wiesz, że w centrum naszej Drogi Mlecznej znajduje się supermasywna czarna dziura Sagittarius A\\* o masie ponad 4 milionów Słońc?*`;
  }

  // 10. ISS / Stacja kosmiczna
  if (query.includes('iss') || query.includes('stacja kosmiczna')) {
    return `**Międzynarodowa Stacja Kosmiczna (ISS)** to największe laboratorium badawcze krążące na niskiej orbicie okołoziemskiej (LEO).\n\n` +
      `- **Wysokość orbity:** ok. 415–425 km nad powierzchnią Ziemi.\n` +
      `- **Prędkość orbitalna:** ok. 27 600 km/h (ponad 7,6 km na sekundę!).\n` +
      `- **Czas okrążenia Ziemi:** ok. 92 minuty (astronauci widzą 16 wschodów i zachodów Słońca w ciągu jednej doby).\n` +
      `- **Stała załoga:** stacja jest nieprzerwanie zamieszkana przez ludzi od listopada 2000 roku.\n\n` +
      `W zakładce głównego Dashboardu Galacti możesz śledzić aktualną pozycję stacji ISS w czasie rzeczywistym!`;
  }

  // 11. Artemis / Powrót na Księżyc
  if (query.includes('artemis')) {
    return `Program **Artemis** prowadzony przez NASA we współpracy z ESA, JAXA i CSA to misja powrotu człowieka na Srebrny Glob.\n\n` +
      `- **Artemis I (2022):** Udany bezzałogowy lot testowy kapsuły Orion wokół Księżyca wyniesionej przez superciężką rakietę SLS.\n` +
      `- **Artemis II:** Planowany załogowy przelot wokół Księżyca z czteroosobową załogą.\n` +
      `- **Artemis III:** Planowane lądowanie pierwszej kobiety i kolejnego mężczyzny w rejonie południowego bieguna Księżyca przy użyciu lądownika Starship HLS.\n\n` +
      `Biegun południowy Księżyca został wybrany ze względu na obecność lodu wodnego w wiecznie zacienionych kraterach, który w przyszłości posłuży jako źródło wody pitnej i paliwa rakietowego.`;
  }

  // 12. JWST / Kosmiczny Teleskop Jamesa Webba
  if (query.includes('webb') || query.includes('jwst') || query.includes('hubble')) {
    return `**Kosmiczny Teleskop Jamesa Webba (JWST)** to najpotężniejsze orbitalne obserwatorium astronomiczne w historii ludzkości.\n\n` +
      `- **Położenie:** Punkt Lagrange'a L2 (ok. 1,5 miliona kilometrów od Ziemi po przeciwnej stronie niż Słońce).\n` +
      `- **Zwierciadło:** Złożone z 18 berylowych segmentów pokrytych ultracienką warstwą złota o łącznej średnicy 6,5 metra.\n` +
      `- **Zakres fal:** Obserwacje w podczerwieni, co pozwala zajrzeć przez gęste obłoki pyłu i badać pierwsze galaktyki uformowane zaledwie kilkaset milionów lat po Wielkim Wybuchu.\n\n` +
      `W odróżnieniu od Teleskopu Hubble'a (który obserwuje głównie w świetle widzialnym i ultrafiolecie), JWST bada najstarsze i najzimniejsze obszary kosmosu.`;
  }

  // 13. Przeszukiwanie bazy zjawisk astronomicznych (jeśli zapytanie pasuje do tytułu, identyfikatora lub obiektu)
  for (const event of allAstronomicalEvents) {
    const titleLower = event.title.toLowerCase();
    const idLower = event.id.toLowerCase();
    if (query.includes(idLower) || query.includes(titleLower)) {
      return `### ${event.title}\n\n` +
        `- **Typ zjawiska:** ${event.type}\n` +
        `- **Data apogeum (szczyt):** ${new Date(event.peakDate).toLocaleString('pl-PL')}\n` +
        `- **Czas trwania:** ${event.startDate} do ${event.endDate}\n` +
        `- **Widoczność w Polsce:** ${event.visibilityPoland}\n` +
        `- **Wymagany sprzęt:** ${event.equipmentRequired}\n` +
        (event.zhr ? `- **Zenitalna liczba godzinna (ZHR):** ${event.zhr}\n` : '') +
        (event.radiant ? `- **Radiant:** ${event.radiant}\n` : '') +
        (event.parentBody ? `- **Ciało macierzyste:** ${event.parentBody}\n` : '') +
        (event.magnitudeInPoland ? `- **Faza w Polsce:** ${event.magnitudeInPoland}\n` : '') +
        `\n${event.description}\n\n` +
        `🔭 **Wskazówki obserwacyjne:**\n${event.observationTips}`;
    }
  }

  // 14. Przeszukiwanie wszystkich ciał (Słońce, 8 planet, księżyce, planety karłowate)
  for (const body of allCelestialBodies) {
    const plName = body.name.pl.toLowerCase();
    const enName = body.name.en.toLowerCase();
    if (query.includes(plName) || query.includes(enName)) {
      const distanceInfo =
        body.realDistanceFromSunAU && body.realDistanceFromSunAU > 0
          ? `**Średnia odległość od Słońca:** ${body.realDistanceFromSunKm?.toLocaleString('pl-PL')} km (${body.realDistanceFromSunAU} AU)\n`
          : body.realDistanceKm
          ? `**Średnia odległość od ciała macierzystego:** ${body.realDistanceKm.toLocaleString('pl-PL')} km\n`
          : '';

      const parentInfo = body.parentBodyId
        ? `**Ciało macierzyste:** ${body.parentBodyId}\n`
        : '';

      return `### ${body.name.pl} (${body.name.en})\n\n` +
        `**Typ obiektu:** ${body.type}\n` +
        parentInfo +
        `**Promień równikowy:** ${body.realRadiusKm.toLocaleString('pl-PL')} km\n` +
        distanceInfo +
        `**Okres orbitalny:** ${body.orbitalPeriodDays} dni ziemskich\n` +
        `**Okres rotacji wokół własnej osi:** ${Math.abs(body.rotationPeriodHours)} godzin\n\n` +
        `${body.shortDescriptionPl}\n\n` +
        `💡 **Ciekawostka naukowa:**\n${body.funFactPl}\n\n` +
        `*Źródło danych: NASA Solar System Exploration / Science NASA.*`;
    }
  }

  // Generic fallback if question is not in common list
  return `Witaj! Jestem **Galacti AI** – Twoim edukacyjnym przewodnikiem po kosmosie.\n\n` +
    `Mogę opowiedzieć Ci o:\n` +
    `- **Planetach Układu Słonecznego** (np. Merkury, Wenus, Mars, Jowisz...)\n` +
    `- **Księżycach i Planetach Karłowatych** (Księżyc Ziemi, Europa, Io, Tytan, Enceladus, Pluton, Charon, Ceres)\n` +
    `- **Zjawiskach astronomicznych i kalendarzu nieba** (zaćmienia Słońca 2026/2027, Perseidy i Geminidy, opozycje Saturna i Marsa)\n` +
    `- **Tajemnicach astrofizyki** (czarne dziury, horyzont zdarzeń, grawitacja)\n` +
    `- **Eksploracji kosmosu** (stacja ISS, program Artemis, Teleskop Jamesa Webba, Europa Clipper)\n\n` +
    `Zadaj mi konkretne pytanie, np. *„Kiedy jest najbliższe zaćmienie Słońca w Polsce?”*, *„Na czym polega opozycja Saturna bez pierścieni?”* lub *„Kiedy przypadają Perseidy i jak je obserwować?”*.`;
}
