const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateTimeFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
}

function datePartsFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function parseParts(formatter, date) {
  const parts = formatter.formatToParts(date);
  const map = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = Number(part.value);
    }
  }

  return map;
}

function normalizeDateParts(input) {
  if (typeof input === "string" && DATE_ONLY_PATTERN.test(input)) {
    const [year, month, day] = input.split("-").map(Number);
    return { year, month, day };
  }

  if (input instanceof Date) {
    const year = input.getUTCFullYear();
    const month = input.getUTCMonth() + 1;
    const day = input.getUTCDate();
    return { year, month, day };
  }

  throw new Error("date must be YYYY-MM-DD or a valid Date/ISO date.");
}

export function assertValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
  } catch {
    throw new Error(`Invalid timezone: ${timeZone}`);
  }
}

export function getTimeZoneOffsetMinutes(timeZone, instant) {
  const parts = parseParts(dateTimeFormatter(timeZone), instant);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  return Math.round((asUtc - instant.getTime()) / 60000);
}

function zonedDateTimeToUtc({ year, month, day, hour, minute, second = 0 }, timeZone) {
  const localEpochAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let candidate = localEpochAsUtc;

  for (let i = 0; i < 4; i += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date(candidate));
    const next = localEpochAsUtc - offsetMinutes * 60000;

    if (next === candidate) {
      break;
    }

    candidate = next;
  }

  return new Date(candidate);
}

export function resolveDatePartsForCalculation(dateInput, timeZone) {
  if (typeof dateInput === "string" && DATE_ONLY_PATTERN.test(dateInput)) {
    return normalizeDateParts(dateInput);
  }

  const parsed = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("date must be valid.");
  }

  const parts = parseParts(datePartsFormatter(timeZone), parsed);
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day
  };
}

function addDays(parts, dayOffset) {
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  utcDate.setUTCDate(utcDate.getUTCDate() + dayOffset);

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate()
  };
}

export function getTimeZoneOffsetHoursForDate(dateParts, timeZone) {
  const noonUtc = zonedDateTimeToUtc({ ...dateParts, hour: 12, minute: 0, second: 0 }, timeZone);
  return getTimeZoneOffsetMinutes(timeZone, noonUtc) / 60;
}

export function localHoursToUtcDate({ dateParts, localHours, timeZone }) {
  if (!Number.isFinite(localHours)) {
    return null;
  }

  const dayMinutes = 24 * 60;
  const roundedMinutes = Math.round(localHours * 60);
  let dayOffset = Math.floor(roundedMinutes / dayMinutes);
  let minutesWithinDay = roundedMinutes - dayOffset * dayMinutes;

  if (minutesWithinDay < 0) {
    dayOffset -= 1;
    minutesWithinDay += dayMinutes;
  }

  const hour = Math.floor(minutesWithinDay / 60);
  const minute = minutesWithinDay % 60;
  const shifted = addDays(dateParts, dayOffset);

  return zonedDateTimeToUtc({ ...shifted, hour, minute, second: 0 }, timeZone);
}

export function formatLocalTime(utcDate, timeZone) {
  if (!utcDate) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(utcDate);
}
