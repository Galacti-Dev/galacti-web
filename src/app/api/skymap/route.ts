import { NextRequest, NextResponse } from 'next/server';
import rawSkyMap from '@/data/skymap_data.json';
import { SkyMapCatalog, StarData, DeepSkyObject } from '@/lib/types';
import { getLocalSiderealTime, equatorialToHorizontal } from '@/lib/astronomyMath';

const skyMapData = rawSkyMap as unknown as SkyMapCatalog;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const timeParam = searchParams.get('time');

    // Default to Poland reference coordinates
    const lat = latParam ? parseFloat(latParam) : skyMapData.metadata.referenceLatitudePoland;
    const lon = lonParam ? parseFloat(lonParam) : skyMapData.metadata.referenceLongitudePoland;

    let observationDate = new Date();
    if (timeParam) {
      const parsedTime = new Date(timeParam);
      if (!isNaN(parsedTime.getTime())) {
        observationDate = parsedTime;
      }
    }

    const lstHours = getLocalSiderealTime(observationDate, lon);

    // Compute Alt/Az for all stars
    const starsWithHorizontal: StarData[] = skyMapData.stars.map((star) => {
      const horiz = equatorialToHorizontal({ ra: star.ra, dec: star.dec }, lat, lstHours);
      return {
        ...star,
        horizontal: horiz,
      };
    });

    // Compute Alt/Az for all Deep Sky Objects
    const dsoWithHorizontal: DeepSkyObject[] = skyMapData.deepSkyObjects.map((dso) => {
      const horiz = equatorialToHorizontal({ ra: dso.ra, dec: dso.dec }, lat, lstHours);
      return {
        ...dso,
        horizontal: horiz,
      };
    });

    // Visible objects above horizon (alt > 0)
    const visibleStarsCount = starsWithHorizontal.filter((s) => s.horizontal?.visible).length;
    const visibleDsoCount = dsoWithHorizontal.filter((d) => d.horizontal?.visible).length;

    const responseData = {
      metadata: {
        ...skyMapData.metadata,
        observation: {
          timestamp: observationDate.toISOString(),
          latitude: lat,
          longitude: lon,
          localSiderealTimeHours: Math.round(lstHours * 1000) / 1000,
          visibleStarsCount,
          visibleDsoCount,
        },
      },
      stars: starsWithHorizontal,
      constellationLines: skyMapData.constellationLines,
      deepSkyObjects: dsoWithHorizontal,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Visible-Stars': String(visibleStarsCount),
        'X-Visible-DSO': String(visibleDsoCount),
      },
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('[SkyMap API] Error processing sky map request:', error);
    return NextResponse.json(
      { error: 'Błąd podczas przetwarzania danych mapy nieba.' },
      { status: 500 }
    );
  }
}
