export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTime {
  name: PrayerName;
  displayName: string;
  time: Date;
}

export interface PrayerTimesResult {
  city: string;
  date: Date;
  prayers: PrayerTime[];
}

export interface NextPrayerResult {
  name: PrayerName;
  displayName: string;
  time: Date;
  timeUntil: string;
}

export interface CityCoordinates {
  latitude: number;
  longitude: number;
  timezone: string;
}

export const CITY_COORDINATES: Record<string, CityCoordinates> = {
  'mecca': { latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
  'medina': { latitude: 24.4686, longitude: 39.6142, timezone: 'Asia/Riyadh' },
  'riyadh': { latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
  'jeddah': { latitude: 21.5433, longitude: 39.1728, timezone: 'Asia/Riyadh' },
  'cairo': { latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  'istanbul': { latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  'dubai': { latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  'london': { latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  'new york': { latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  'los angeles': { latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  'chicago': { latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
  'houston': { latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago' },
  'toronto': { latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  'paris': { latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  'berlin': { latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
  'kuala lumpur': { latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  'jakarta': { latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  'islamabad': { latitude: 33.6844, longitude: 73.0479, timezone: 'Asia/Karachi' },
  'karachi': { latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  'lahore': { latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi' },
  'dhaka': { latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka' },
  'amman': { latitude: 31.9454, longitude: 35.9284, timezone: 'Asia/Amman' },
  'beirut': { latitude: 33.8938, longitude: 35.5018, timezone: 'Asia/Beirut' },
  'casablanca': { latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  'tunis': { latitude: 36.8065, longitude: 10.1815, timezone: 'Africa/Tunis' },
  'washington': { latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York' },
  'dearborn': { latitude: 42.3223, longitude: -83.1763, timezone: 'America/Detroit' },
  'san francisco': { latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
  'dallas': { latitude: 32.7767, longitude: -96.7970, timezone: 'America/Chicago' },
  'atlanta': { latitude: 33.7490, longitude: -84.3880, timezone: 'America/New_York' },
};

export const PRAYER_DISPLAY_NAMES: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export interface SessionAttributes {
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}
