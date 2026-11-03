import { ApodData, IssData, LaunchesResponse } from './types';

export const fallbackApod: ApodData = {
  date: "2024-03-15",
  title: "Filarzy Stworzenia w obiektywie Teleskopu Webba (M16)",
  explanation: "Filarzy Stworzenia to spektakularny fragment Mgławicy Orzeł (M16), odległy o około 6500 lat świetlnych od Ziemi w gwiazdozbiorze Węża. Zdjęcie w bliskiej podczerwieni z Kosmicznego Teleskopu Jamesa Webba ukazuje gęste obłoki chłodnego gazu międzygwiazdowego i pyłu, w których rodzą się nowe gwiazdy. Młode protogwiazdy widoczne są jako jasnoróżowe i czerwone punkty świetlne z charakterystycznymi kolcami dyfrakcyjnymi.",
  hdurl: "https://apod.nasa.gov/apod/image/2210/Pillars_Webb_3000.jpg",
  url: "https://apod.nasa.gov/apod/image/2210/Pillars_Webb_1080.jpg",
  media_type: "image",
  copyright: "NASA, ESA, CSA, STScI",
  service_version: "v1",
  isFallback: true,
};

export const fallbackIss: IssData = {
  name: "iss",
  id: 25544,
  latitude: 51.4826,
  longitude: -0.0077,
  altitude: 418.52,
  velocity: 27584.2,
  visibility: "daylight",
  footprint: 4498.15,
  timestamp: Math.floor(Date.now() / 1000),
  daynum: 2460385.449,
  solar_lat: -1.98,
  solar_lon: 12.43,
  units: "kilometers",
  isFallback: true,
};

export const fallbackLaunches: LaunchesResponse = {
  count: 3,
  isFallback: true,
  results: [
    {
      id: "fallback-launch-1",
      name: "Falcon 9 Block 5 | Starlink Group 10-1",
      status: {
        id: 1,
        name: "Go for Launch",
        abbrev: "Go",
        description: "Countdown is proceeding normally."
      },
      net: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(), // ~18h from now
      window_start: new Date(Date.now() + 1000 * 60 * 60 * 17).toISOString(),
      window_end: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
      rocket: {
        id: 8021,
        configuration: {
          id: 164,
          name: "Falcon 9",
          family: "Falcon",
          full_name: "Falcon 9 Block 5"
        }
      },
      mission: {
        id: 6550,
        name: "Starlink Group 10-1",
        description: "Wdrożenie kolejnej grupy satelitów telekomunikacyjnych megakonstelacji Starlink na niskiej orbicie okołoziemskiej.",
        type: "Communications",
        orbit: {
          id: 8,
          name: "Low Earth Orbit",
          abbrev: "LEO"
        }
      },
      pad: {
        id: 80,
        name: "Space Launch Complex 40",
        location: {
          id: 12,
          name: "Cape Canaveral SFS, FL, USA",
          country_code: "USA"
        }
      },
      image: "https://thespacedevs-prod.nyc3.digitaloceanspaces.com/media/images/falcon_9_image_20230807133459.jpeg",
      webcast_live: false
    },
    {
      id: "fallback-launch-2",
      name: "Electron | " + "Owl Night Long",
      status: {
        id: 1,
        name: "Go for Launch",
        abbrev: "Go",
        description: "Vehicle and ground systems ready."
      },
      net: new Date(Date.now() + 1000 * 60 * 60 * 42).toISOString(), // ~42h from now
      window_start: new Date(Date.now() + 1000 * 60 * 60 * 40).toISOString(),
      window_end: new Date(Date.now() + 1000 * 60 * 60 * 44).toISOString(),
      rocket: {
        id: 8022,
        configuration: {
          id: 165,
          name: "Electron",
          family: "Electron",
          full_name: "Rocket Lab Electron"
        }
      },
      mission: {
        id: 6551,
        name: "StriX Satellite Mission",
        description: "Misja wyniesienia satelity radarowego SAR (Synthetic Aperture Radar) dla japońskiej firmy Synspective.",
        type: "Earth Science",
        orbit: {
          id: 8,
          name: "Sun-Synchronous Orbit",
          abbrev: "SSO"
        }
      },
      pad: {
        id: 81,
        name: "Launch Complex 1A",
        location: {
          id: 13,
          name: "Mahia Peninsula, New Zealand",
          country_code: "NZL"
        }
      },
      image: "https://thespacedevs-prod.nyc3.digitaloceanspaces.com/media/images/electron_image_20190705175640.jpeg",
      webcast_live: false
    },
    {
      id: "fallback-launch-3",
      name: "Ariane 62 | CSO-3",
      status: {
        id: 8,
        name: "To Be Confirmed",
        abbrev: "TBC",
        description: "Launch window awaiting final confirmation."
      },
      net: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(), // ~4 days from now
      window_start: new Date(Date.now() + 1000 * 60 * 60 * 94).toISOString(),
      window_end: new Date(Date.now() + 1000 * 60 * 60 * 98).toISOString(),
      rocket: {
        id: 8023,
        configuration: {
          id: 166,
          name: "Ariane 6",
          family: "Ariane",
          full_name: "Ariane 62"
        }
      },
      mission: {
        id: 6552,
        name: "CSO-3 Reconnaissance Satellite",
        description: "Francuski wojskowy satelita obserwacyjny i rozpoznawczy nowej generacji.",
        type: "Government/Secret",
        orbit: {
          id: 8,
          name: "Sun-Synchronous Orbit",
          abbrev: "SSO"
        }
      },
      pad: {
        id: 82,
        name: "ELA-4",
        location: {
          id: 14,
          name: "Guiana Space Centre, Kourou, French Guiana",
          country_code: "GUF"
        }
      },
      image: "https://thespacedevs-prod.nyc3.digitaloceanspaces.com/media/images/ariane_6_liftoff_image_20240710190538.jpeg",
      webcast_live: false
    }
  ]
};
