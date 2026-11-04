import { EquatorialCoord, HorizontalCoord } from "./types";

/**
 * Oblicza Lokalny Czas Gwiazdowy (LST) w godzinach
 * na podstawie daty UTC oraz długości geograficznej (dla Warszawy: 21.01°E)
 */
export function getLocalSiderealTime(date: Date, longitudeDeg: number = 21.01): number {
  const jd = date.getTime() / 86400000.0 + 2440587.5;
  const d = jd - 2451545.0;
  let gmst = 18.697374558 + 24.06570982441908 * d;
  gmst = ((gmst % 24) + 24) % 24;
  const lst = (((gmst + longitudeDeg / 15.0) % 24) + 24) % 24;
  return lst;
}

/**
 * Konwertuje współrzędne równikowe (RA / Dec) na horyzontalne (Alt / Az)
 * dla podanej szerokości geograficznej i czasu gwiazdowego
 */
export function equatorialToHorizontal(
  coord: EquatorialCoord,
  latDeg: number = 52.23,
  lstHours: number
): HorizontalCoord {
  const haDeg = ((lstHours - coord.ra) * 15.0 + 360) % 360;
  const haRad = (haDeg * Math.PI) / 180;
  const decRad = (coord.dec * Math.PI) / 180;
  const latRad = (latDeg * Math.PI) / 180;

  // Wysokość nad horyzontem (Alt)
  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altDeg = (altRad * 180) / Math.PI;

  // Azymut (Az) liczony od Północy przez Wschód
  const cosAz =
    (Math.sin(decRad) - Math.sin(latRad) * Math.sin(altRad)) /
    (Math.cos(latRad) * Math.cos(altRad));
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  let azDeg = (Math.acos(clampedCosAz) * 180) / Math.PI;
  if (Math.sin(haRad) > 0) {
    azDeg = 360 - azDeg;
  }

  return {
    alt: altDeg,
    az: azDeg,
    visible: altDeg > 0,
  };
}

/**
 * Przelicza współrzędne horyzontalne (Alt, Az) na pozycję w przestrzeni 3D Three.js
 * Promień sfery domyślnie R = 100
 * Układ: +Y Zenit, -Z Północ, +Z Południe, +X Wschód, -X Zachód
 */
export function horizontalToCartesian3D(
  altDeg: number,
  azDeg: number,
  radius: number = 100
): [number, number, number] {
  const altRad = (altDeg * Math.PI) / 180;
  const azRad = (azDeg * Math.PI) / 180;

  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const y = radius * Math.sin(altRad);
  const z = -radius * Math.cos(altRad) * Math.cos(azRad);

  return [x, y, z];
}

/**
 * Przelicza współrzędne horyzontalne (Alt, Az) na płaszczyznę 2D Planisfery (rzut azymutalny równoodległościowy)
 * Centrum w (cx, cy), promień horyzontu (Alt = 0) to maxRadius
 */
export function horizontalToPlanisphere2D(
  altDeg: number,
  azDeg: number,
  cx: number,
  cy: number,
  maxRadius: number
): { x: number; y: number; visible: boolean } {
  // Dla obiektów nad horyzontem promień rośnie od Zenitu (Alt = 90 -> r = 0) do Horyzontu (Alt = 0 -> r = maxRadius)
  const r = maxRadius * Math.max(0, (90 - altDeg) / 90);
  // Kąt azymutu: 0 (N) na górze (-Y), 90 (E) po lewej lub prawej w rzucie nieba.
  // W astronomii patrząc w niebo: Północ na górze, Wschód po lewej, Zachód po prawej.
  const thetaRad = ((azDeg - 90) * Math.PI) / 180;

  const x = cx + r * Math.cos(thetaRad);
  const y = cy + r * Math.sin(thetaRad);

  return {
    x,
    y,
    visible: altDeg > 0,
  };
}

/**
 * Zwraca polską nazwę konstelacji na podstawie kodu IAU
 */
export const CONSTELLATION_NAMES_PL: Record<string, string> = {
  UMa: "Wielka Niedźwiedzica (Wielki Wóz)",
  UMi: "Mała Niedźwiedzica (Mały Wóz)",
  Cas: "Kasjopeja",
  Ori: "Orion",
  Cyg: "Łabędź (Krzyż Północy)",
  Peg_And: "Pegaz i Andromeda",
  Gem: "Bliźnięta",
  Leo: "Lew",
  Tau: "Byk",
  Her: "Herkules",
  Lyr: "Lutnia",
  And: "Andromeda",
};

/**
 * Zwięzłe polskie nazwy gwiazdozbiorów do czystego wyświetlania na planisferze (bez dublowania nawiasów)
 */
export const CONSTELLATION_SHORT_NAMES_PL: Record<string, string> = {
  UMa: "Wielka Niedźwiedzica",
  UMi: "Mała Niedźwiedzica",
  Cas: "Kasjopeja",
  Ori: "Orion",
  Cyg: "Łabędź",
  Peg_And: "Pegaz",
  Gem: "Bliźnięta",
  Leo: "Lew",
  Tau: "Byk",
  Her: "Herkules",
  Lyr: "Lutnia",
  And: "Andromeda",
};

export interface AltitudePoint {
  date: Date;
  hourLabel: string;
  alt: number;
  isNight: boolean;
}

export interface AltitudeCurveResult {
  points: AltitudePoint[];
  maxAlt: number;
  culminationTime: string;
  currentAlt: number;
  isCurrentlyVisible: boolean;
  riseTime: string | null;
  setTime: string | null;
  isCircumpolar: boolean;
  isNeverVisible: boolean;
}

/**
 * Oblicza 24-godzinną krzywą wysokości obiektu astronomicznego (Alt vs Time)
 * dla wybranej daty i współrzędnych obserwatora (domyślnie wycentrowaną wokół nocy od 12:00 do 12:00)
 */
export function calculateAltitudeCurve(
  coord: EquatorialCoord,
  latDeg: number,
  lonDeg: number,
  simulatedTime: Date
): AltitudeCurveResult {
  // Początek okna 24h: godzina 12:00 w południe danego dnia
  const baseDate = new Date(simulatedTime);
  // Jeśli aktualna godzina to np. przed południem (00:00 - 11:59), weź południe wczoraj
  if (baseDate.getHours() < 12) {
    baseDate.setDate(baseDate.getDate() - 1);
  }
  baseDate.setHours(12, 0, 0, 0);

  const points: AltitudePoint[] = [];
  let maxAlt = -90;
  let maxAltDate: Date = baseDate;
  let minAlt = 90;

  let riseDate: Date | null = null;
  let setDate: Date | null = null;
  let prevAlt: number | null = null;

  // Próbkowanie co 30 minut przez 24 godziny (49 punktów)
  const totalSteps = 48;
  for (let i = 0; i <= totalSteps; i++) {
    const pointDate = new Date(baseDate.getTime() + i * 30 * 60 * 1000);
    const lst = getLocalSiderealTime(pointDate, lonDeg);
    const horiz = equatorialToHorizontal(coord, latDeg, lst);
    const alt = Math.round(horiz.alt * 10) / 10;

    const hour = pointDate.getHours();
    // Przybliżona strefa zmierzchu/nocy dla Polski (od 18:00 do 06:00)
    const isNight = hour >= 18 || hour < 6;

    if (alt > maxAlt) {
      maxAlt = alt;
      maxAltDate = pointDate;
    }
    if (alt < minAlt) {
      minAlt = alt;
    }

    // Wykrywanie wschodu i zachodu
    if (prevAlt !== null) {
      if (prevAlt <= 0 && alt > 0 && !riseDate) {
        riseDate = pointDate;
      } else if (prevAlt >= 0 && alt < 0 && !setDate) {
        setDate = pointDate;
      }
    }
    prevAlt = alt;

    const hourLabel = pointDate.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    points.push({
      date: pointDate,
      hourLabel,
      alt,
      isNight,
    });
  }

  // Aktualna wysokość w zadanym simulatedTime
  const currentLst = getLocalSiderealTime(simulatedTime, lonDeg);
  const currentHoriz = equatorialToHorizontal(coord, latDeg, currentLst);
  const currentAlt = Math.round(currentHoriz.alt * 10) / 10;

  const culminationTime = maxAltDate.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCircumpolar = minAlt > 0;
  const isNeverVisible = maxAlt < 0;

  return {
    points,
    maxAlt,
    culminationTime,
    currentAlt,
    isCurrentlyVisible: currentAlt > 0,
    riseTime: isCircumpolar ? "Niezachodzący (okołobiegunowy)" : riseDate ? riseDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : null,
    setTime: isCircumpolar ? "Niezachodzący" : setDate ? setDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : null,
    isCircumpolar,
    isNeverVisible,
  };
}

