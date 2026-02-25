import Foundation
import AthanPrayerEngine

/// Service that wraps the Adhan-Swift-based prayer engine.
/// Provides prayer times for a given configuration and date.
@Observable
final class PrayerEngineService {

    private let engine = PrayerEngineWrapper()

    /// Calculate prayer times for the given configuration and date.
    func prayerTimes(for config: PrayerConfiguration, on date: Date = Date()) -> AthanPrayerTimes? {
        engine.calculate(
            latitude: config.latitude,
            longitude: config.longitude,
            date: date,
            method: config.method,
            madhab: config.madhab,
            offsets: config.offsets
        )
    }

    /// Determine which prayer is currently active.
    func currentPrayer(for config: PrayerConfiguration, at date: Date = Date()) -> AthanPrayer? {
        guard let times = prayerTimes(for: config, on: date) else { return nil }

        // Walk backwards through prayer times to find the most recent one that has passed.
        let allTimes = times.allTimes
        for (prayer, time) in allTimes.reversed() {
            if date >= time {
                return prayer
            }
        }
        return nil
    }

    /// Determine the next upcoming prayer and its time.
    func nextPrayer(for config: PrayerConfiguration, at date: Date = Date()) -> (prayer: AthanPrayer, time: Date)? {
        guard let times = prayerTimes(for: config, on: date) else { return nil }

        for (prayer, time) in times.allTimes {
            if time > date {
                return (prayer, time)
            }
        }

        // All prayers have passed for today; get tomorrow's Fajr.
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: date) ?? date
        guard let tomorrowTimes = prayerTimes(for: config, on: tomorrow) else { return nil }
        return (.fajr, tomorrowTimes.fajr)
    }

    /// Time interval remaining until the next prayer.
    func timeUntilNextPrayer(for config: PrayerConfiguration, at date: Date = Date()) -> TimeInterval? {
        guard let next = nextPrayer(for: config, at: date) else { return nil }
        return next.time.timeIntervalSince(date)
    }
}
