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
