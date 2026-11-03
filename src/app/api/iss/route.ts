import { NextRequest, NextResponse } from 'next/server';
import { IssData } from '@/lib/types';

export async function GET(request: NextRequest) {
  // Read request URL / searchParams to ensure dynamic per-request execution
  void request.nextUrl.searchParams.get('t');

  // 1. Try primary provider: Where The ISS At
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Galacti-Space-App/1.0',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const raw = await res.json();
      const lat = Number(raw.latitude);
      const lon = Number(raw.longitude);
      const altitude = Number(raw.altitude);
      const velocity = Number(raw.velocity);

      if (
        !isNaN(lat) && lat >= -90 && lat <= 90 &&
        !isNaN(lon) && lon >= -180 && lon <= 180
      ) {
        const issData: IssData = {
          name: raw.name || 'iss',
          id: raw.id || 25544,
          latitude: lat,
          longitude: lon,
          altitude: isNaN(altitude) ? 420.0 : Math.round(altitude * 100) / 100,
          velocity: isNaN(velocity) ? 27600.0 : Math.round(velocity * 10) / 10,
          visibility: raw.visibility || 'daylight',
          footprint: Number(raw.footprint) || 4500,
          timestamp: Number(raw.timestamp) || Math.floor(Date.now() / 1000),
          daynum: Number(raw.daynum) || 0,
          solar_lat: Number(raw.solar_lat) || 0,
          solar_lon: Number(raw.solar_lon) || 0,
          units: raw.units || 'kilometers',
          isFallback: false,
        };

        return NextResponse.json(issData, {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Data-Source': 'wheretheiss-api',
          },
        });
      }
    } else {
      console.warn(`[ISS API] Where The ISS At returned status ${res.status}`);
    }
  } catch (primaryErr) {
    console.warn('[ISS API] Primary API (WhereTheISSAt) failed, trying secondary:', primaryErr);
  }

  // 2. Try secondary live provider: Open-Notify
  try {
    const secController = new AbortController();
    const secTimeoutId = setTimeout(() => secController.abort(), 3500);

    const openNotifyRes = await fetch('http://api.open-notify.org/iss-now.json', {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: secController.signal,
    });
    clearTimeout(secTimeoutId);

    if (openNotifyRes.ok) {
      const onRaw = await openNotifyRes.json();
      if (onRaw && onRaw.message === 'success' && onRaw.iss_position) {
        const lat = Number(onRaw.iss_position.latitude);
        const lon = Number(onRaw.iss_position.longitude);

        if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lon) && lon >= -180 && lon <= 180) {
          const issData: IssData = {
            name: 'iss',
            id: 25544,
            latitude: lat,
            longitude: lon,
            altitude: 420.0,
            velocity: 27580.0,
            visibility: 'daylight',
            timestamp: Number(onRaw.timestamp) || Math.floor(Date.now() / 1000),
            units: 'kilometers',
            isFallback: false,
          };

          return NextResponse.json(issData, {
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Data-Source': 'open-notify-api',
            },
          });
        }
      }
    }
  } catch (secErr) {
    console.warn('[ISS API] Secondary API (OpenNotify) also failed:', secErr);
  }

  // 3. Both external APIs failed - do not return fake live data, report error explicitly
  return NextResponse.json(
    {
      error: 'Usługa telemetrii ISS jest chwilowo niedostępna. Serwery nie odpowiadają na zapytania.',
      isFallback: true,
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Data-Source': 'unavailable',
      },
    }
  );
}
