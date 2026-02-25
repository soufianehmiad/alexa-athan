import Foundation
import Adhan

/// A thin wrapper around Adhan-Swift that provides a clean interface
/// matching the shared PrayerEngine contract used across the project.
public struct PrayerEngineWrapper {

    public init() {}

    /// Calculate prayer times for a given location, date, method, and madhab.
    public func calculate(
        latitude: Double,
        longitude: Double,
        date: Date,
        method: AthanCalculationMethod,
        madhab: AthanMadhab,
        offsets: PrayerOffsets = .zero
    ) -> AthanPrayerTimes? {
        let coordinates = Coordinates(latitude: latitude, longitude: longitude)
        var params = method.adhanParameters
        params.madhab = madhab.adhanMadhab

        // Apply user offsets
        params.adjustments.fajr = offsets.fajr
        params.adjustments.sunrise = offsets.sunrise
        params.adjustments.dhuhr = offsets.dhuhr
        params.adjustments.asr = offsets.asr
        params.adjustments.maghrib = offsets.maghrib
        params.adjustments.isha = offsets.isha

        let cal = Calendar(identifier: .gregorian)
        guard let components = cal.dateComponents([.year, .month, .day], from: date) as DateComponents?,
              let prayerTimes = PrayerTimes(coordinates: coordinates, date: components, calculationParameters: params) else {
            return nil
        }

        return AthanPrayerTimes(
            fajr: prayerTimes.fajr,
            sunrise: prayerTimes.sunrise,
            dhuhr: prayerTimes.dhuhr,
            asr: prayerTimes.asr,
            maghrib: prayerTimes.maghrib,
            isha: prayerTimes.isha
        )
    }

    /// Determine which prayer is next given the current time.
    public func nextPrayer(
        latitude: Double,
        longitude: Double,
        date: Date,
        method: AthanCalculationMethod,
        madhab: AthanMadhab,
        offsets: PrayerOffsets = .zero
    ) -> Prayer? {
        let coordinates = Coordinates(latitude: latitude, longitude: longitude)
        var params = method.adhanParameters
        params.madhab = madhab.adhanMadhab
        params.adjustments.fajr = offsets.fajr
        params.adjustments.sunrise = offsets.sunrise
        params.adjustments.dhuhr = offsets.dhuhr
        params.adjustments.asr = offsets.asr
        params.adjustments.maghrib = offsets.maghrib
        params.adjustments.isha = offsets.isha

        let cal = Calendar(identifier: .gregorian)
        let components = cal.dateComponents([.year, .month, .day], from: date)
        guard let prayerTimes = PrayerTimes(coordinates: coordinates, date: components, calculationParameters: params) else {
            return nil
        }

        return prayerTimes.currentPrayer(at: date)
    }
}

// MARK: - Supporting Types

/// Result type for calculated prayer times.
public struct AthanPrayerTimes: Sendable, Equatable {
    public let fajr: Date
    public let sunrise: Date
    public let dhuhr: Date
    public let asr: Date
    public let maghrib: Date
    public let isha: Date

    /// Return the time for a specific prayer.
    public func time(for prayer: AthanPrayer) -> Date {
        switch prayer {
        case .fajr: return fajr
        case .sunrise: return sunrise
        case .dhuhr: return dhuhr
        case .asr: return asr
        case .maghrib: return maghrib
        case .isha: return isha
        }
    }

    /// All prayer times as an ordered array of (prayer, time) pairs.
    public var allTimes: [(prayer: AthanPrayer, time: Date)] {
        AthanPrayer.allCases.map { ($0, time(for: $0)) }
    }
}

/// Enum for the six prayer-time slots (including sunrise).
public enum AthanPrayer: String, CaseIterable, Codable, Sendable, Identifiable {
    case fajr
    case sunrise
    case dhuhr
    case asr
    case maghrib
    case isha

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .fajr: return "Fajr"
        case .sunrise: return "Sunrise"
        case .dhuhr: return "Dhuhr"
        case .asr: return "Asr"
        case .maghrib: return "Maghrib"
        case .isha: return "Isha"
        }
    }

    public var arabicName: String {
        switch self {
        case .fajr: return "\u{0627}\u{0644}\u{0641}\u{062C}\u{0631}"
        case .sunrise: return "\u{0627}\u{0644}\u{0634}\u{0631}\u{0648}\u{0642}"
        case .dhuhr: return "\u{0627}\u{0644}\u{0638}\u{0647}\u{0631}"
        case .asr: return "\u{0627}\u{0644}\u{0639}\u{0635}\u{0631}"
        case .maghrib: return "\u{0627}\u{0644}\u{0645}\u{063A}\u{0631}\u{0628}"
        case .isha: return "\u{0627}\u{0644}\u{0639}\u{0634}\u{0627}\u{0621}"
        }
    }

    /// Only the five obligatory prayers (excludes sunrise).
    public static var obligatory: [AthanPrayer] {
        [.fajr, .dhuhr, .asr, .maghrib, .isha]
    }
}

/// Supported calculation methods, mapped to Adhan-Swift parameters.
public enum AthanCalculationMethod: String, CaseIterable, Codable, Sendable, Identifiable {
    case muslimWorldLeague = "MUSLIM_WORLD_LEAGUE"
    case egyptian = "EGYPTIAN"
    case karachi = "KARACHI"
    case ummAlQura = "UMM_AL_QURA"
    case northAmerica = "NORTH_AMERICA"
    case dubai = "DUBAI"
    case tehran = "TEHRAN"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .muslimWorldLeague: return "Muslim World League"
        case .egyptian: return "Egyptian General Authority"
        case .karachi: return "University of Islamic Sciences, Karachi"
        case .ummAlQura: return "Umm al-Qura, Makkah"
        case .northAmerica: return "ISNA (North America)"
        case .dubai: return "Dubai"
        case .tehran: return "Institute of Geophysics, Tehran"
        }
    }

    var adhanParameters: CalculationParameters {
        switch self {
        case .muslimWorldLeague: return CalculationMethod.muslimWorldLeague.params
        case .egyptian: return CalculationMethod.egyptian.params
        case .karachi: return CalculationMethod.karachi.params
        case .ummAlQura: return CalculationMethod.ummAlQura.params
        case .northAmerica: return CalculationMethod.northAmerica.params
        case .dubai: return CalculationMethod.dubai.params
        case .tehran: return CalculationMethod.tehran.params
        }
    }
}

/// Supported madhab selections.
public enum AthanMadhab: String, CaseIterable, Codable, Sendable, Identifiable {
    case shafi = "SHAFI"
    case hanafi = "HANAFI"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .shafi: return "Shafi / Hanbali / Maliki"
        case .hanafi: return "Hanafi"
        }
    }

    var adhanMadhab: Madhab {
        switch self {
        case .shafi: return .shafi
        case .hanafi: return .hanafi
        }
    }
}

/// Per-prayer minute offsets.
public struct PrayerOffsets: Codable, Sendable, Equatable {
    public var fajr: Int
    public var sunrise: Int
    public var dhuhr: Int
    public var asr: Int
    public var maghrib: Int
    public var isha: Int

    public static let zero = PrayerOffsets(fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0)

    public init(fajr: Int = 0, sunrise: Int = 0, dhuhr: Int = 0, asr: Int = 0, maghrib: Int = 0, isha: Int = 0) {
        self.fajr = fajr
        self.sunrise = sunrise
        self.dhuhr = dhuhr
        self.asr = asr
        self.maghrib = maghrib
        self.isha = isha
    }
}
