import { NextRequest, NextResponse } from 'next/server';
import { ApodData } from '@/lib/types';
import { fallbackApod } from '@/lib/fallbackData';

// In-memory cache for emergency fallback if remote API fails after succeeding
let cachedApod: ApodData | null = null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  try {
    const url = new URL('https://api.nasa.gov/planetary/apod');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('thumbs', 'true');
    if (date) {
      url.searchParams.set('date', date);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    // Revalidate every 1 hour (3600 seconds)
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[NASA APOD API] Error response: ${res.status} ${res.statusText}`);
      // If we have an in-memory cache, return it
      if (cachedApod && !date) {
        return NextResponse.json(
          { ...cachedApod, isFallback: true },
          {
            status: 200,
            headers: { 'X-Data-Source': 'in-memory-cache' },
          }
        );
      }
      return NextResponse.json(
        fallbackApod,
        {
          status: 200,
          headers: { 'X-Data-Source': 'fallback' },
        }
      );
    }

    const data = await res.json();

    const normalizedData: ApodData = {
      date: data.date || new Date().toISOString().split('T')[0],
      title: data.title || 'Astronomy Picture of the Day',
      explanation: data.explanation || '',
      url: data.url || '',
      hdurl: data.hdurl || data.url,
      media_type: data.media_type || 'image',
      copyright: data.copyright || undefined,
      service_version: data.service_version || 'v1',
      thumbnail_url: data.thumbnail_url || undefined,
      isFallback: false,
    };

    if (!date) {
      cachedApod = normalizedData;
    }

    return NextResponse.json(normalizedData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Data-Source': 'nasa-api',
      },
    });
  } catch (error) {
    console.error('[NASA APOD API] Network error:', error);
    if (cachedApod && !date) {
      return NextResponse.json(
        { ...cachedApod, isFallback: true },
        { status: 200, headers: { 'X-Data-Source': 'in-memory-cache' } }
      );
    }
    return NextResponse.json(fallbackApod, {
      status: 200,
      headers: { 'X-Data-Source': 'fallback' },
    });
  }
}
