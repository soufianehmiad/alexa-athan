import Foundation
import AthanPrayerEngine

/// ViewModel for the Settings screen.
/// Manages city/location, calculation method, madhab, and offsets.
@Observable
final class SettingsViewModel {

    private let persistence: PersistenceService
    private let syncService: AlexaSyncService

    // MARK: - Editable State (bound to UI)

    var city: String
    var latitude: String
    var longitude: String
    var timeZoneIdentifier: String
    var method: AthanCalculationMethod
    var madhab: AthanMadhab
    var offsets: PrayerOffsets

    var isSyncing = false
    var syncError: String?

    var isAmazonLinked: Bool {
        persistence.isAmazonLinked
    }

    init(persistence: PersistenceService, syncService: AlexaSyncService) {
        self.persistence = persistence
        self.syncService = syncService

        let config = persistence.configuration
        self.city = config.city
        self.latitude = String(config.latitude)
        self.longitude = String(config.longitude)
        self.timeZoneIdentifier = config.timeZoneIdentifier
        self.method = config.method
        self.madhab = config.madhab
        self.offsets = config.offsets
    }

    // MARK: - Save

    func save() {
        let lat = Double(latitude) ?? persistence.configuration.latitude
        let lon = Double(longitude) ?? persistence.configuration.longitude

        let config = PrayerConfiguration(
            city: city,
            latitude: lat,
            longitude: lon,
            timeZoneIdentifier: timeZoneIdentifier,
            method: method,
            madhab: madhab,
            offsets: offsets
        )

        persistence.configuration = config
    }

    // MARK: - Sync to Backend

    func syncToBackend(devices: [AlexaSyncService.DevicePayload]) async {
        save()
        isSyncing = true
        syncError = nil

        do {
            try await syncService.syncConfiguration(
                config: persistence.configuration,
                devices: devices
            )
        } catch {
            syncError = error.localizedDescription
        }

        isSyncing = false
    }

    // MARK: - Unlink Amazon

    func unlinkAmazon() {
        persistence.unlinkAmazon()
    }

    // MARK: - Location Presets

    struct CityPreset: Identifiable {
        let id = UUID()
        let name: String
        let latitude: Double
        let longitude: Double
        let timeZone: String
    }

    static let cityPresets: [CityPreset] = [
        CityPreset(name: "New York", latitude: 40.7128, longitude: -74.0060, timeZone: "America/New_York"),
        CityPreset(name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles"),
        CityPreset(name: "Chicago", latitude: 41.8781, longitude: -87.6298, timeZone: "America/Chicago"),
        CityPreset(name: "Houston", latitude: 29.7604, longitude: -95.3698, timeZone: "America/Chicago"),
        CityPreset(name: "London", latitude: 51.5074, longitude: -0.1278, timeZone: "Europe/London"),
        CityPreset(name: "Paris", latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris"),
        CityPreset(name: "Toronto", latitude: 43.6532, longitude: -79.3832, timeZone: "America/Toronto"),
        CityPreset(name: "Dubai", latitude: 25.2048, longitude: 55.2708, timeZone: "Asia/Dubai"),
        CityPreset(name: "Riyadh", latitude: 24.7136, longitude: 46.6753, timeZone: "Asia/Riyadh"),
        CityPreset(name: "Cairo", latitude: 30.0444, longitude: 31.2357, timeZone: "Africa/Cairo"),
        CityPreset(name: "Istanbul", latitude: 41.0082, longitude: 28.9784, timeZone: "Europe/Istanbul"),
        CityPreset(name: "Kuala Lumpur", latitude: 3.1390, longitude: 101.6869, timeZone: "Asia/Kuala_Lumpur"),
    ]

    func selectCity(_ preset: CityPreset) {
        city = preset.name
        latitude = String(preset.latitude)
        longitude = String(preset.longitude)
        timeZoneIdentifier = preset.timeZone
        save()
    }
}
