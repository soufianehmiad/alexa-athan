export function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function toDegrees(value) {
  return (value * 180) / Math.PI;
}

export function sinDeg(value) {
  return Math.sin(toRadians(value));
}

export function cosDeg(value) {
  return Math.cos(toRadians(value));
}

export function tanDeg(value) {
  return Math.tan(toRadians(value));
}

export function asinDeg(value) {
  return toDegrees(Math.asin(value));
}

export function acosDeg(value) {
  return toDegrees(Math.acos(value));
}

export function atan2Deg(y, x) {
  return toDegrees(Math.atan2(y, x));
}

export function arccotDeg(value) {
  return toDegrees(Math.atan(1 / value));
}

export function fixAngle(angle) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function fixHour(hour) {
  const normalized = hour % 24;
  return normalized < 0 ? normalized + 24 : normalized;
}
