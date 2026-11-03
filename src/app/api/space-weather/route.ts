import { NextRequest, NextResponse } from 'next/server';
import { SpaceWeatherSummary } from '@/lib/types';
import { calculateAuroraChancePoland, fallbackSpaceWeatherSummary } from '@/lib/spaceWeather';

// In-memory cache for emergency fallback if live NOAA endpoints temporarily fail
let cachedLiveSummary: SpaceWeatherSummary | null = null;

async function fetchWithTimeout<T>(url: string, timeoutMs = 4500): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Galacti-Space-App/1.0',
      },
    });
    if (!res.ok) {
      console.warn(`[SpaceWeather API] NOAA fetch failed for ${url}: status ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[SpaceWeather API] Error or timeout fetching ${url}:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface KpRecord {
  time_tag: string;
  Kp: number;
}

interface KpForecastRecord {
  time_tag: string;
  kp: number;
  observed: string;
  noaa_scale?: string | null;
}

interface RtswMagRecord {
  time_tag: string;
  active?: boolean;
  bt?: number | null;
  bz_gsm?: number | null;
}

interface MagSummaryRecord {
  time_tag: string;
  bt?: number;
  bz_gsm?: number;
}

interface RtswWindRecord {
  time_tag: string;
  active?: boolean;
  proton_speed?: number | null;
  proton_density?: number | null;
}

interface WindSummaryRecord {
  time_tag: string;
  proton_speed?: number;
}

export async function GET(request: NextRequest) {
  // Read searchParams to enforce dynamic execution per request
  void request.nextUrl.searchParams.get('t');

  try {
    // 1. Parallel fetch from NOAA SWPC endpoints with 4.5s timeout
    const [
      kpResult,
      kpForecastResult,
      rtswMagResult,
      magSummaryResult,
      rtswWindResult,
      windSummaryResult,
    ] = await Promise.allSettled([
      fetchWithTimeout<KpRecord[]>('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'),
      fetchWithTimeout<KpForecastRecord[]>('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json'),
      fetchWithTimeout<RtswMagRecord[]>('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json'),
      fetchWithTimeout<MagSummaryRecord[]>('https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json'),
      fetchWithTimeout<RtswWindRecord[]>('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json'),
      fetchWithTimeout<WindSummaryRecord[]>('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json'),
    ]);

    const kpData = kpResult.status === 'fulfilled' ? kpResult.value : null;
    const kpForecastData = kpForecastResult.status === 'fulfilled' ? kpForecastResult.value : null;
    const rtswMagData = rtswMagResult.status === 'fulfilled' ? rtswMagResult.value : null;
    const magSummaryData = magSummaryResult.status === 'fulfilled' ? magSummaryResult.value : null;
    const rtswWindData = rtswWindResult.status === 'fulfilled' ? rtswWindResult.value : null;
    const windSummaryData = windSummaryResult.status === 'fulfilled' ? windSummaryResult.value : null;

    let hasLiveSignal = false;

    // 2. Parse Kp Index
    let kpCurrent = fallbackSpaceWeatherSummary.kpCurrent;
    if (Array.isArray(kpData) && kpData.length > 0) {
      for (let i = kpData.length - 1; i >= 0; i--) {
        const val = Number(kpData[i]?.Kp);
        if (!isNaN(val) && val >= 0) {
          kpCurrent = Math.round(val * 100) / 100;
          hasLiveSignal = true;
          break;
        }
      }
    }

    // 3. Parse Kp Forecast (max next 24h)
    let kpForecastMax24h = kpCurrent;
    if (Array.isArray(kpForecastData) && kpForecastData.length > 0) {
      const nowMs = Date.now();
      const next24hMs = nowMs + 24 * 3600 * 1000;
      const forecastValues: number[] = [];

      for (const item of kpForecastData) {
        const timeMs = new Date(item.time_tag).getTime();
        if (!isNaN(timeMs) && timeMs >= nowMs - 3 * 3600 * 1000 && timeMs <= next24hMs) {
          const val = Number(item.kp);
          if (!isNaN(val)) forecastValues.push(val);
        }
      }

      if (forecastValues.length > 0) {
        kpForecastMax24h = Math.round(Math.max(kpCurrent, ...forecastValues) * 100) / 100;
      }
    }

    // 4. Parse IMF (Bt and Bz)
    let imfBt = fallbackSpaceWeatherSummary.imfBt;
    let imfBz = fallbackSpaceWeatherSummary.imfBz;
    let gotMag = false;

    if (Array.isArray(rtswMagData)) {
      for (const item of rtswMagData) {
        if (
          typeof item.bt === 'number' &&
          !isNaN(item.bt) &&
          typeof item.bz_gsm === 'number' &&
          !isNaN(item.bz_gsm)
        ) {
          imfBt = Math.round(item.bt * 10) / 10;
          imfBz = Math.round(item.bz_gsm * 10) / 10;
          gotMag = true;
          hasLiveSignal = true;
          break;
        }
      }
    }

    if (!gotMag && Array.isArray(magSummaryData) && magSummaryData.length > 0) {
      const sum = magSummaryData[0];
      if (typeof sum.bt === 'number' && !isNaN(sum.bt)) {
        imfBt = Math.round(sum.bt * 10) / 10;
      }
      if (typeof sum.bz_gsm === 'number' && !isNaN(sum.bz_gsm)) {
        imfBz = Math.round(sum.bz_gsm * 10) / 10;
        hasLiveSignal = true;
      }
    }

    // 5. Parse Solar Wind Plasma (Speed and Density)
    let solarWindSpeed = fallbackSpaceWeatherSummary.solarWindSpeed;
    let solarWindDensity = fallbackSpaceWeatherSummary.solarWindDensity;
    let gotWind = false;

    if (Array.isArray(rtswWindData)) {
      for (const item of rtswWindData) {
        if (typeof item.proton_speed === 'number' && !isNaN(item.proton_speed)) {
          solarWindSpeed = Math.round(item.proton_speed * 10) / 10;
          if (typeof item.proton_density === 'number' && !isNaN(item.proton_density)) {
            solarWindDensity = Math.round(item.proton_density * 10) / 10;
          }
          gotWind = true;
          hasLiveSignal = true;
          break;
        }
      }
    }

    if (!gotWind && Array.isArray(windSummaryData) && windSummaryData.length > 0) {
      const sum = windSummaryData[0];
      if (typeof sum.proton_speed === 'number' && !isNaN(sum.proton_speed)) {
        solarWindSpeed = Math.round(sum.proton_speed * 10) / 10;
        hasLiveSignal = true;
      }
    }

    // 6. If none of the NOAA endpoints responded with live data, use cache or fallback
    if (!hasLiveSignal) {
      if (cachedLiveSummary) {
        return NextResponse.json(
          { ...cachedLiveSummary, isFallback: true },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
              'X-Data-Source': 'cached-fallback',
            },
          }
        );
      }

      return NextResponse.json(
        {
          ...fallbackSpaceWeatherSummary,
          updatedAt: new Date().toISOString(),
          isFallback: true,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
            'X-Data-Source': 'nominal-fallback',
          },
        }
      );
    }

    // 7. Calculate aurora visibility and storm scale using scientific algorithm
    const evaluation = calculateAuroraChancePoland({
      kp: kpCurrent,
      bz: imfBz,
      speed: solarWindSpeed,
      density: solarWindDensity,
    });

    const summary: SpaceWeatherSummary = {
      updatedAt: new Date().toISOString(),
      kpCurrent,
      kpForecastMax24h,
      imfBz,
      imfBt,
      solarWindSpeed,
      solarWindDensity,
      auroraChancePoland: evaluation.score,
      activityLevel: evaluation.level,
      visibilityDescriptionPl: evaluation.visibilityPl,
      noaaStormScale: evaluation.stormScale,
      isFallback: false,
    };

    // Update in-memory cache
    cachedLiveSummary = summary;

    return NextResponse.json(summary, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Data-Source': 'noaa-swpc-live',
      },
    });
  } catch (error) {
    console.error('[SpaceWeather API] Unexpected handler error:', error);

    const fallbackResponse: SpaceWeatherSummary = cachedLiveSummary
      ? { ...cachedLiveSummary, isFallback: true }
      : {
          ...fallbackSpaceWeatherSummary,
          updatedAt: new Date().toISOString(),
          isFallback: true,
        };

    return NextResponse.json(fallbackResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        'X-Data-Source': 'error-fallback',
      },
    });
  }
}
