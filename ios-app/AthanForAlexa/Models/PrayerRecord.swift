import Foundation
import SwiftData

/// A record of a prayer's status for tracking purposes.
/// Stored locally with SwiftData. Never synced to cloud.
@Model
final class PrayerRecord {
    /// The date of the prayer (date-only, no time component).
    var date: Date
    /// The prayer name (fajr, dhuhr, asr, maghrib, isha).
    var prayerName: String
    /// The tracking status.
    var status: String
    /// When the status was last updated.
    var timestamp: Date

    init(date: Date, prayerName: String, status: PrayerStatus = .upcoming) {
        self.date = date
        self.prayerName = prayerName
        self.status = status.rawValue
        self.timestamp = Date()
    }

    /// Typed accessor for the prayer status.
    var prayerStatus: PrayerStatus {
        get { PrayerStatus(rawValue: status) ?? .upcoming }
        set {
            status = newValue.rawValue
            timestamp = Date()
        }
    }
}
