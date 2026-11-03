export interface ApodData {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video' | string;
  copyright?: string;
  service_version?: string;
  thumbnail_url?: string;
  isFallback?: boolean;
}

export interface IssData {
  name: string;
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  footprint?: number;
  timestamp: number;
  daynum?: number;
  solar_lat?: number;
  solar_lon?: number;
  units?: string;
  isFallback?: boolean;
  error?: string;
}

export interface LaunchStatus {
  id: number;
  name: string;
  abbrev: string;
  description?: string;
}

export interface LaunchItem {
  id: string;
  name: string;
  status: LaunchStatus;
  net: string;
  window_start?: string | null;
  window_end?: string | null;
  rocket: {
    id?: number;
    configuration: {
      id?: number;
      name: string;
      family?: string;
      full_name?: string;
    };
  };
  mission?: {
    id?: number;
    name: string;
    description: string;
    type?: string;
    orbit?: {
      id?: number;
      name: string;
      abbrev: string;
    };
  } | null;
  pad: {
    id?: number;
    name: string;
    location: {
      id?: number;
      name: string;
      country_code?: string;
    };
  };
  image?: string | null;
  webcast_live?: boolean;
}

export interface LaunchesResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: LaunchItem[];
  isFallback?: boolean;
}

export type CelestialBodyType =
  | 'star'
  | 'terrestrial planet'
  | 'gas giant'
  | 'ice giant'
  | 'moon'
  | 'dwarf_planet'
  | string;

export interface CelestialBodyData {
  id: string;
  name: {
    pl: string;
    en: string;
  };
  type: CelestialBodyType;
  realRadiusKm: number;
  scaledRadius: number;
  realDistanceFromSunKm?: number;
  realDistanceFromSunAU?: number;
  realDistanceKm?: number;
  scaledDistance: number;
  orbitalPeriodDays: number;
  rotationPeriodHours: number;
  colorHex: string;
  parentBodyId?: string;
  textureUrl?: string;
  textureRecommendation?: string;
  shortDescriptionPl: string;
  funFactPl: string;
  sourceUrl: string;
}

export type PlanetData = CelestialBodyData;

export interface MoonData extends CelestialBodyData {
  type: 'moon';
  parentBodyId: string;
  realDistanceKm: number;
}

export interface DwarfPlanetData extends CelestialBodyData {
  type: 'dwarf_planet';
  parentBodyId?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  isFallback?: boolean;
}

export interface SpaceWeatherSummary {
  updatedAt: string;
  kpCurrent: number;
  kpForecastMax24h: number;
  imfBz: number;
  imfBt: number;
  solarWindSpeed: number;
  solarWindDensity: number;
  auroraChancePoland: number; // 0 - 100
  activityLevel: "Brak" | "Niska" | "Umiarkowana" | "Wysoka" | "Ekstremalna";
  visibilityDescriptionPl: string;
  noaaStormScale: string; // np. "G0", "G1", "G2"
  isFallback?: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  isFallback?: boolean;
}

export type AstronomicalEventType =
  | 'meteor_shower'
  | 'eclipse'
  | 'conjunction'
  | 'moon_phase'
  | 'planetary_event';

export type VisibilityPoland = 'excellent' | 'good' | 'partial' | 'none';

export type EquipmentRequired = 'naked_eye' | 'binoculars' | 'telescope';

export interface AstronomicalEvent {
  id: string;
  title: string;
  type: AstronomicalEventType;
  startDate: string;
  peakDate: string;
  endDate: string;
  visibilityPoland: VisibilityPoland;
  equipmentRequired: EquipmentRequired;
  radiant?: string;
  zhr?: number;
  parentBody?: string;
  eclipseType?: string;
  magnitudeInPoland?: string;
  separation?: string;
  description: string;
  observationTips: string;
}

export interface EquatorialCoord {
  ra: number;   // Rektascensja w godzinach (0 - 24)
  dec: number;  // Deklinacja w stopniach (-90 do +90)
}

export interface HorizontalCoord {
  alt: number;  // Wysokość w stopniach (-90 do +90)
  az: number;   // Azymut w stopniach (0 do 360, 0 = N, 90 = E, 180 = S, 270 = W)
  visible: boolean;
}

export interface StarData {
  id: string;
  name: string;
  bayer: string;
  con: string;
  ra: number;
  dec: number;
  mag: number;
  bv: number;
  color: string;
  spec: string;
  horizontal?: HorizontalCoord;
}

export type ConstellationLine = [string, string] | string[];

export interface DeepSkyObject {
  id: string;
  name?: string;
  namePl: string;
  nameEn: string;
  type: string;
  con: string;
  ra: number;
  dec: number;
  mag: number;
  distanceLy: number;
  equipment: string;
  descriptionPl: string;
  horizontal?: HorizontalCoord;
}

export interface SkyMapMetadata {
  version: string;
  epoch: string;
  referenceLatitudePoland: number;
  referenceLongitudePoland: number;
  starsCount: number;
  constellationsCount: number;
  dsoCount: number;
}

export interface SkyMapCatalog {
  metadata: SkyMapMetadata;
  stars: StarData[];
  constellationLines: Record<string, ConstellationLine[]>;
  deepSkyObjects: DeepSkyObject[];
}


