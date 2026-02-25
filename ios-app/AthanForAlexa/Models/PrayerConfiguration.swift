import Foundation
import AthanPrayerEngine

/// Stores the user's prayer time configuration.
/// Persisted via UserDefaults through PersistenceService.
struct PrayerConfiguration: Codable, Equatable {
    var city: String
    var latitude: Double
    var longitude: Double
    var timeZoneIdentifier: String
    var method: AthanCalculationMethod
    var madhab: AthanMadhab
    var offsets: PrayerOffsets

    static let `default` = PrayerConfiguration(
        city: "New York",
        latitude: 40.7128,
        longitude: -74.0060,
        timeZoneIdentifier: "America/New_York",
        method: .northAmerica,
        madhab: .shafi,
        offsets: .zero
    )
}
