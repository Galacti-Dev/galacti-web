import { NextRequest, NextResponse } from "next/server";
import { AstronomicalEvent, AstronomicalEventType, VisibilityPoland } from "@/lib/types";
import rawEvents from "@/data/astronomical_events.json";
import { isEventActiveOrUpcoming } from "@/lib/eventUtils";

const events = rawEvents as AstronomicalEvent[];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get("type");
    const visibilityParam = searchParams.get("visibility");
    const includePast = searchParams.get("include_past") === "true" || searchParams.get("all") === "true";

    let filtered = [...events];

    // By default, filter out past events so that only currently ongoing or future events appear
    if (!includePast) {
      const now = new Date();
      filtered = filtered.filter((event) => isEventActiveOrUpcoming(event, now));
    }

    if (typeParam) {
      filtered = filtered.filter((event) => event.type === (typeParam as AstronomicalEventType));
    }

    if (visibilityParam) {
      filtered = filtered.filter(
        (event) => event.visibilityPoland === (visibilityParam as VisibilityPoland)
      );
    }

    // Sort chronologically by peakDate
    filtered.sort((a, b) => new Date(a.peakDate).getTime() - new Date(b.peakDate).getTime());

    return NextResponse.json(filtered, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Total-Count": String(filtered.length),
      },
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error("[Astronomical Events API] Error:", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać zjawisk astronomicznych." },
      { status: 500 }
    );
  }
}
