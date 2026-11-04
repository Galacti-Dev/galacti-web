import { AstronomicalEvent } from "@/lib/types";

// Base reference date for deterministic static prerendering
export const STATIC_REFERENCE_DATE = new Date("2026-11-01T00:00:00Z");

/**
 * Checks if an astronomical event is active or upcoming at a given timestamp.
 */
export function isEventActiveOrUpcomingTime(
  event: AstronomicalEvent,
  timestamp: number = STATIC_REFERENCE_DATE.getTime()
): boolean {
  const endIso = event.endDate.includes("T") ? event.endDate : `${event.endDate}T23:59:59.999Z`;
  const endTime = new Date(endIso).getTime();
  return endTime >= timestamp;
}

/**
 * Checks if an astronomical event is currently active or upcoming relative to a given date.
 */
export function isEventActiveOrUpcoming(
  event: AstronomicalEvent,
  referenceDate: Date = STATIC_REFERENCE_DATE
): boolean {
  return isEventActiveOrUpcomingTime(event, referenceDate.getTime());
}

/**
 * Filters and sorts events so that only currently ongoing and future events are returned.
 */
export function getActiveAndUpcomingEvents(
  events: AstronomicalEvent[],
  referenceDate: Date = STATIC_REFERENCE_DATE
): AstronomicalEvent[] {
  const timestamp = referenceDate.getTime();
  return events
    .filter((event) => isEventActiveOrUpcomingTime(event, timestamp))
    .sort((a, b) => new Date(a.peakDate).getTime() - new Date(b.peakDate).getTime());
}
