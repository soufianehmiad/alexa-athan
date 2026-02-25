import { acosDeg, asinDeg, atan2Deg, cosDeg, fixAngle, fixHour, sinDeg } from "../utils/math.js";

export function julianDate({ year, month, day }) {
  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

export function sunPosition(julianDay) {
  const daysSinceEpoch = julianDay - 2451545.0;
  const meanAnomaly = fixAngle(357.529 + 0.98560028 * daysSinceEpoch);
  const meanLongitude = fixAngle(280.459 + 0.98564736 * daysSinceEpoch);

  const eclipticLongitude = fixAngle(
    meanLongitude + 1.915 * sinDeg(meanAnomaly) + 0.02 * sinDeg(2 * meanAnomaly)
  );

  const obliquity = 23.439 - 0.00000036 * daysSinceEpoch;
  const rightAscension = fixHour(atan2Deg(cosDeg(obliquity) * sinDeg(eclipticLongitude), cosDeg(eclipticLongitude)) / 15);
  const declination = asinDeg(sinDeg(obliquity) * sinDeg(eclipticLongitude));
  const equationOfTime = meanLongitude / 15 - rightAscension;

  return {
    declination,
    equationOfTime
  };
}

export function solarNoon(julianDay, dayPortion) {
  const { equationOfTime } = sunPosition(julianDay + dayPortion);
  return fixHour(12 - equationOfTime);
}

export function sunAngleTime({ angle, julianDay, dayPortion, latitude, direction }) {
  const { declination } = sunPosition(julianDay + dayPortion);
  const noon = solarNoon(julianDay, dayPortion);

  const numerator = -sinDeg(angle) - sinDeg(declination) * sinDeg(latitude);
  const denominator = cosDeg(declination) * cosDeg(latitude);
  const ratio = numerator / denominator;

  if (ratio < -1 || ratio > 1) {
    return Number.NaN;
  }

  const delta = acosDeg(ratio) / 15;
  return direction === "ccw" ? noon - delta : noon + delta;
}

export function riseSetAngle(elevation = 0) {
  return 0.833 + 0.0347 * Math.sqrt(Math.max(0, elevation));
}
