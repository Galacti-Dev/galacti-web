import { NextResponse } from 'next/server';
import { LaunchesResponse, LaunchItem } from '@/lib/types';
import { fallbackLaunches } from '@/lib/fallbackData';

let cachedLaunches: LaunchesResponse | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  const now = Date.now();

  // If in-memory cache is fresh (< 15 mins), serve it directly to prevent burning LL2 IP rate limits
  if (cachedLaunches && (now - lastCacheUpdate < CACHE_TTL_MS)) {
    return NextResponse.json(cachedLaunches, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'X-Data-Source': 'memory-cache',
      },
    });
  }

  try {
    const url = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&mode=normal&hide_recent_previous=true';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 900 },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Launch Library 2 API] Error response: ${res.status} ${res.statusText}`);
      if (cachedLaunches) {
        return NextResponse.json(
          { ...cachedLaunches, isFallback: true },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
              'X-Data-Source': 'stale-cache-on-error',
            },
          }
        );
      }
      return NextResponse.json(fallbackLaunches, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
          'X-Data-Source': 'fallback',
        },
      });
    }

    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedResults: LaunchItem[] = (data.results || []).map((item: any) => ({
      id: item.id || `launch-${Math.random()}`,
      name: item.name || 'Upcoming Mission',
      status: {
        id: item.status?.id || 1,
        name: item.status?.name || 'TBD',
        abbrev: item.status?.abbrev || 'TBD',
        description: item.status?.description || '',
      },
      net: item.net || new Date().toISOString(),
      window_start: item.window_start || null,
      window_end: item.window_end || null,
      rocket: {
        id: item.rocket?.id,
        configuration: {
          id: item.rocket?.configuration?.id,
          name: item.rocket?.configuration?.name || 'Rocket',
          family: item.rocket?.configuration?.family || '',
          full_name: item.rocket?.configuration?.full_name || item.rocket?.configuration?.name || 'Rocket',
        },
      },
      mission: item.mission ? {
        id: item.mission.id,
        name: item.mission.name || 'Scientific Mission',
        description: item.mission.description || 'Szczegóły misji zostaną zaktualizowane w miarę zbliżania się okna startowego.',
        type: item.mission.type || 'Exploration',
        orbit: item.mission.orbit ? {
          id: item.mission.orbit.id,
          name: item.mission.orbit.name || 'Orbit',
          abbrev: item.mission.orbit.abbrev || 'LEO',
        } : undefined,
      } : null,
      pad: {
        id: item.pad?.id,
        name: item.pad?.name || 'Launch Complex',
        location: {
          id: item.pad?.location?.id,
          name: item.pad?.location?.name || 'Spaceport',
          country_code: item.pad?.location?.country_code || 'USA',
        },
      },
      image: item.image || null,
      webcast_live: Boolean(item.webcast_live),
    }));

    const responsePayload: LaunchesResponse = {
      count: data.count || normalizedResults.length,
      next: data.next || null,
      previous: data.previous || null,
      results: normalizedResults,
      isFallback: false,
    };

    cachedLaunches = responsePayload;
    lastCacheUpdate = now;

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'X-Data-Source': 'll2-api',
      },
    });
  } catch (error) {
    console.error('[Launch Library 2 API] Network error:', error);
    if (cachedLaunches) {
      return NextResponse.json(
        { ...cachedLaunches, isFallback: true },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
            'X-Data-Source': 'stale-cache-on-error',
          },
        }
      );
    }
    return NextResponse.json(fallbackLaunches, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        'X-Data-Source': 'fallback',
      },
    });
  }
}
