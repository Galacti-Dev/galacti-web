import { SpaceWeatherSummary } from './types';

export interface SpaceWeatherData {
  kp: number;          // 0.0 - 9.0
  bz: number;          // w nT (może być dodatnie lub ujemne)
  speed: number;       // w km/s
  density: number;     // w p/cm3
}

export interface AuroraEvaluation {
  score: number;       // 0 - 100%
  level: 'Brak' | 'Niska' | 'Umiarkowana' | 'Wysoka' | 'Ekstremalna';
  visibilityPl: string;
  stormScale: string;
}

/**
 * Algorytm wyliczania szansy na zorzę polarną w Polsce (Aurora Visibility Index)
 * zgodny z sekcją 3 specyfikacji /home/mati/OpenBot/Shared/galacti/data/space_weather_spec.md
 */
export function calculateAuroraChancePoland(data: SpaceWeatherData): AuroraEvaluation {
  const { kp, bz, speed, density } = data;

  // 1. Ocena Kp (waga 45%)
  let kpScore = 0;
  if (kp >= 8) kpScore = 45;
  else if (kp >= 7) kpScore = 38;
  else if (kp >= 6) kpScore = 30;
  else if (kp >= 5) kpScore = 20;
  else if (kp >= 4) kpScore = 10;
  else kpScore = Math.max(0, kp * 2);

  // 2. Ocena Bz (waga 40% - kluczowy warunek rekoneksji magnetycznej)
  let bzScore = 0;
  if (bz <= -15) bzScore = 40;
  else if (bz <= -10) bzScore = 32;
  else if (bz <= -5) bzScore = 22;
  else if (bz < 0) bzScore = 10;
  else bzScore = 0; // Dodatnie Bz gwałtownie tłumi szanse

  // 3. Ocena wiatru słonecznego: prędkość i gęstość (waga 15%)
  let windScore = 0;
  if (speed >= 700) windScore += 10;
  else if (speed >= 500) windScore += 6;
  else if (speed >= 400) windScore += 3;

  if (density >= 20) windScore += 5;
  else if (density >= 10) windScore += 3;

  let totalScore = Math.min(100, Math.round(kpScore + bzScore + windScore));

  // Tłumienie: jeśli Bz jest wyraźnie dodatnie (> +3 nT), zorza jest mało prawdopodobna nawet przy wyższym Kp
  if (bz > 3 && totalScore > 35) {
    totalScore = Math.round(totalScore * 0.5);
  }

  // Mapowanie poziomu
  let level: 'Brak' | 'Niska' | 'Umiarkowana' | 'Wysoka' | 'Ekstremalna' = 'Brak';
  let visibilityPl = 'Brak szans na zorzę w Polsce.';
  let stormScale = 'G0 (Brak burzy)';

  if (totalScore >= 75 || kp >= 7) {
    level = 'Ekstremalna';
    visibilityPl = 'Zorza widoczna gołym okiem w całej Polsce!';
    stormScale = kp >= 9 ? 'G5 (Ekstremalna)' : kp >= 8 ? 'G4 (Bardzo silna)' : 'G3 (Silna)';
  } else if (totalScore >= 55 || kp >= 6) {
    level = 'Wysoka';
    visibilityPl = 'Zorza widoczna gołym okiem na północy, fotograficznie w całym kraju.';
    stormScale = 'G2 (Umiarkowana burza)';
  } else if (totalScore >= 35 || kp >= 5) {
    level = 'Umiarkowana';
    visibilityPl = 'Szansa na zorzę fotograficzną na północy Polski (pas nadmorski, Mazury).';
    stormScale = 'G1 (Słaba burza)';
  } else if (totalScore >= 20 || kp >= 4) {
    level = 'Niska';
    visibilityPl = 'Znikoma szansa, możliwa wyłącznie fotograficznie przy idealnych warunkach na północy.';
    stormScale = 'G0 (Aktywność podwyższona)';
  }

  return { score: totalScore, level, visibilityPl, stormScale };
}

/**
 * Realistyczny zestaw danych nominalnych w przypadku całkowitej niedostępności NOAA
 */
export const fallbackSpaceWeatherSummary: SpaceWeatherSummary = {
  updatedAt: new Date().toISOString(),
  kpCurrent: 1.67,
  kpForecastMax24h: 2.33,
  imfBz: 1.2,
  imfBt: 4.1,
  solarWindSpeed: 380.0,
  solarWindDensity: 3.8,
  auroraChancePoland: 4,
  activityLevel: 'Brak',
  visibilityDescriptionPl: 'Brak szans na zorzę w Polsce (dane nominalne – brak łączności z NOAA SWPC).',
  noaaStormScale: 'G0 (Brak burzy)',
  isFallback: true,
};
