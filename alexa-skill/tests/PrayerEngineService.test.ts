import { PrayerEngineService } from '../lambda/services/PrayerEngineService';
import { CityCoordinates, CITY_COORDINATES } from '../lambda/models/types';

describe('PrayerEngineService', () => {
  const service = new PrayerEngineService();
  const meccaCoords = CITY_COORDINATES['mecca'];
  const nycCoords = CITY_COORDINATES['new york'];

  describe('getPrayerTimes', () => {
    it('returns all 6 prayer times for Mecca', () => {
      const result = service.getPrayerTimes(meccaCoords, new Date('2026-03-15'), 'Mecca');

      expect(result.city).toBe('Mecca');
      expect(result.prayers).toHaveLength(6);

      const names = result.prayers.map((p) => p.name);
      expect(names).toEqual(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
    });

    it('returns valid Date objects for all prayers', () => {
      const result = service.getPrayerTimes(nycCoords, new Date('2026-06-21'), 'New York');

      for (const prayer of result.prayers) {
        expect(prayer.time).toBeInstanceOf(Date);
        expect(prayer.time.getTime()).not.toBeNaN();
      }
    });

    it('returns display names for all prayers', () => {
      const result = service.getPrayerTimes(meccaCoords, new Date('2026-01-01'), 'Mecca');

      const displayNames = result.prayers.map((p) => p.displayName);
      expect(displayNames).toEqual(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);
    });

    it('calculates different times for different cities', () => {
      const meccaTimes = service.getPrayerTimes(meccaCoords, new Date('2026-03-15'), 'Mecca');
      const nycTimes = service.getPrayerTimes(nycCoords, new Date('2026-03-15'), 'New York');

      expect(meccaTimes.prayers[0].time.getTime()).not.toBe(
        nycTimes.prayers[0].time.getTime()
      );
    });
  });

  describe('getNextPrayer', () => {
    it('returns the next prayer when one exists', () => {
      // Use a morning time in NYC where there should be upcoming prayers
      const morning = new Date('2026-03-15T12:00:00Z'); // ~8am ET
      const result = service.getNextPrayer(nycCoords, morning, 'New York');

      expect(result).not.toBeNull();
      expect(result!.displayName).toBeTruthy();
      expect(result!.time).toBeInstanceOf(Date);
      expect(result!.timeUntil).toBeTruthy();
    });

    it('returns null when no more prayers today', () => {
      // Use a very late time in Mecca, after Isha
      // Isha in Mecca is roughly ~7:30 PM local = 4:30 PM UTC
      const lateNight = new Date('2026-03-15T22:00:00Z'); // well past Isha
      const result = service.getNextPrayer(meccaCoords, lateNight, 'Mecca');

      expect(result).toBeNull();
    });

    it('includes timeUntil string', () => {
      const morning = new Date('2026-03-15T08:00:00Z');
      const result = service.getNextPrayer(nycCoords, morning, 'New York');

      if (result) {
        expect(result.timeUntil).toMatch(/hour|minute/);
      }
    });
  });

  describe('formatTimeForSpeech', () => {
    it('formats time in 12-hour format', () => {
      const date = new Date('2026-03-15T17:30:00Z'); // 5:30 PM UTC
      const formatted = service.formatTimeForSpeech(date, 'UTC');

      expect(formatted).toContain('5:30');
      expect(formatted).toMatch(/PM/i);
    });

    it('uses correct timezone', () => {
      const date = new Date('2026-03-15T12:00:00Z');
      const nycFormatted = service.formatTimeForSpeech(date, 'America/New_York');
      const londonFormatted = service.formatTimeForSpeech(date, 'Europe/London');

      // The hour should be different for different timezones
      expect(nycFormatted).not.toBe(londonFormatted);
    });
  });
});
