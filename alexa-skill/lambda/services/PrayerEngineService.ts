import { Coordinates, PrayerTimes, CalculationMethod, Prayer } from 'adhan';
import {
  PrayerName,
  PrayerTime,
  PrayerTimesResult,
  NextPrayerResult,
  CityCoordinates,
  PRAYER_DISPLAY_NAMES,
} from '../models/types';

export class PrayerEngineService {
  getPrayerTimes(coords: CityCoordinates, date: Date, city: string): PrayerTimesResult {
    const coordinates = new Coordinates(coords.latitude, coords.longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    const prayers: PrayerTime[] = [
      { name: 'fajr', displayName: PRAYER_DISPLAY_NAMES.fajr, time: prayerTimes.fajr },
      { name: 'sunrise', displayName: PRAYER_DISPLAY_NAMES.sunrise, time: prayerTimes.sunrise },
      { name: 'dhuhr', displayName: PRAYER_DISPLAY_NAMES.dhuhr, time: prayerTimes.dhuhr },
      { name: 'asr', displayName: PRAYER_DISPLAY_NAMES.asr, time: prayerTimes.asr },
      { name: 'maghrib', displayName: PRAYER_DISPLAY_NAMES.maghrib, time: prayerTimes.maghrib },
      { name: 'isha', displayName: PRAYER_DISPLAY_NAMES.isha, time: prayerTimes.isha },
    ];

    return { city, date, prayers };
  }

  getNextPrayer(coords: CityCoordinates, now: Date, city: string): NextPrayerResult | null {
    const coordinates = new Coordinates(coords.latitude, coords.longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    const prayerTimes = new PrayerTimes(coordinates, now, params);

    const nextPrayer = prayerTimes.nextPrayer(now);
    if (nextPrayer === Prayer.None) {
      return null;
    }

    const prayerNameMap: Record<string, PrayerName> = {
      fajr: 'fajr',
      sunrise: 'sunrise',
      dhuhr: 'dhuhr',
      asr: 'asr',
      maghrib: 'maghrib',
      isha: 'isha',
    };

    const name = prayerNameMap[nextPrayer] ?? 'fajr';
    const time = prayerTimes.timeForPrayer(nextPrayer);
    if (!time) return null;

    const diffMs = time.getTime() - now.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let timeUntil: string;
    if (hours > 0 && minutes > 0) {
      timeUntil = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      timeUntil = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      timeUntil = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    return {
      name,
      displayName: PRAYER_DISPLAY_NAMES[name],
      time,
      timeUntil,
    };
  }

  formatTimeForSpeech(date: Date, timezone: string): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    });
  }
}
