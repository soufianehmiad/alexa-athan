/**
 * Derive an approximate IANA timezone from longitude.
 * This is a rough heuristic: longitude / 15 gives the UTC offset in hours,
 * and we map that to a fixed-offset timezone name like "Etc/GMT+5".
 *
 * Note: Etc/GMT timezone signs are inverted from convention:
 *   Etc/GMT+5  = UTC-5  (west of prime meridian)
 *   Etc/GMT-5  = UTC+5  (east of prime meridian)
 */
export function timezoneFromLongitude(longitude: number): string {
  const offsetHours = Math.round(longitude / 15);
  // Etc/GMT sign convention is inverted
  const etcOffset = -offsetHours;

  if (etcOffset === 0) return "Etc/GMT";
  return etcOffset > 0 ? `Etc/GMT+${etcOffset}` : `Etc/GMT${etcOffset}`;
}

/**
 * Get the local date for a given timezone.
 * Returns a Date object representing the start of the local day in that timezone.
 */
export function getLocalDate(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(now); // YYYY-MM-DD
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date as a local time string in a given timezone.
 * Returns "YYYY-MM-DDTHH:mm:ss" format suitable for Alexa Reminders API.
 */
export function formatLocalDateTime(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}
