import Foundation

/// HTTP client for syncing configuration with the backend and discovering Alexa devices.
@Observable
final class AlexaSyncService {

    // Replace with actual backend URL for production.
    private let baseURL = URL(string: "https://api.athanforalexa.com")!

    private let session: URLSession
    private let persistence: PersistenceService

    init(persistence: PersistenceService, session: URLSession = .shared) {
        self.persistence = persistence
        self.session = session
    }

    // MARK: - Device Discovery

    struct AlexaDevice: Codable, Identifiable {
        let id: String
        let name: String
        let type: String?
    }

    /// Fetch Alexa devices linked to the user's Amazon account.
    func fetchDevices() async throws -> [AlexaDevice] {
        guard let accessToken = persistence.lwaAccessToken else {
            throw SyncError.notAuthenticated
        }

        var request = URLRequest(url: baseURL.appendingPathComponent("/api/devices"))
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(persistence.deviceToken, forHTTPHeaderField: "X-Device-Token")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw SyncError.serverError
        }

        return try JSONDecoder().decode([AlexaDevice].self, from: data)
    }

    // MARK: - Configuration Sync

    struct SyncPayload: Codable {
        let deviceToken: String
        let city: String
        let latitude: Double
        let longitude: Double
        let method: String
        let madhab: String
        let offsets: OffsetPayload
        let devices: [DevicePayload]
    }

    struct OffsetPayload: Codable {
        let fajr: Int
        let sunrise: Int
        let dhuhr: Int
        let asr: Int
        let maghrib: Int
        let isha: Int
    }

    struct DevicePayload: Codable {
        let deviceId: String
        let enabledPrayers: [String]
    }

    /// Sync the user's prayer configuration to the backend.
    func syncConfiguration(
        config: PrayerConfiguration,
        devices: [DevicePayload]
    ) async throws {
        let payload = SyncPayload(
            deviceToken: persistence.deviceToken,
            city: config.city,
            latitude: config.latitude,
            longitude: config.longitude,
            method: config.method.rawValue,
            madhab: config.madhab.rawValue,
            offsets: OffsetPayload(
                fajr: config.offsets.fajr,
                sunrise: config.offsets.sunrise,
                dhuhr: config.offsets.dhuhr,
                asr: config.offsets.asr,
                maghrib: config.offsets.maghrib,
                isha: config.offsets.isha
            ),
            devices: devices
        )

        var request = URLRequest(url: baseURL.appendingPathComponent("/api/config"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(persistence.deviceToken, forHTTPHeaderField: "X-Device-Token")

        if let accessToken = persistence.lwaAccessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONEncoder().encode(payload)

        let (_, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw SyncError.serverError
        }
    }

    // MARK: - Errors

    enum SyncError: LocalizedError {
        case notAuthenticated
        case serverError

        var errorDescription: String? {
            switch self {
            case .notAuthenticated: return "Please link your Amazon account first."
            case .serverError: return "Failed to communicate with the server. Please try again."
            }
        }
    }
}
