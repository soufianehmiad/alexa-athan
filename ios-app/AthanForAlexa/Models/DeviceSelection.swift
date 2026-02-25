import Foundation
import SwiftData

/// Represents an Alexa device that can play the Athan.
/// Persisted with SwiftData.
@Model
final class DeviceSelection {
    var deviceId: String
    var deviceName: String
    var fajrEnabled: Bool
    var dhuhrEnabled: Bool
    var asrEnabled: Bool
    var maghribEnabled: Bool
    var ishaEnabled: Bool

    init(
        deviceId: String,
        deviceName: String,
        fajrEnabled: Bool = true,
        dhuhrEnabled: Bool = true,
        asrEnabled: Bool = true,
        maghribEnabled: Bool = true,
        ishaEnabled: Bool = true
    ) {
        self.deviceId = deviceId
        self.deviceName = deviceName
        self.fajrEnabled = fajrEnabled
        self.dhuhrEnabled = dhuhrEnabled
        self.asrEnabled = asrEnabled
        self.maghribEnabled = maghribEnabled
        self.ishaEnabled = ishaEnabled
    }

    /// Returns a list of enabled prayer names for this device.
    var enabledPrayers: [String] {
        var prayers: [String] = []
        if fajrEnabled { prayers.append("fajr") }
        if dhuhrEnabled { prayers.append("dhuhr") }
        if asrEnabled { prayers.append("asr") }
        if maghribEnabled { prayers.append("maghrib") }
        if ishaEnabled { prayers.append("isha") }
        return prayers
    }
}
