import Foundation
import AthanPrayerEngine

/// Handles local persistence of user preferences via UserDefaults,
/// and sensitive tokens via Keychain.
@Observable
final class PersistenceService {

    private let defaults: UserDefaults
    private let configKey = "prayer_configuration"
    private let onboardingCompleteKey = "onboarding_complete"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    // MARK: - Prayer Configuration

    var configuration: PrayerConfiguration {
        get {
            guard let data = defaults.data(forKey: configKey),
                  let config = try? JSONDecoder().decode(PrayerConfiguration.self, from: data) else {
                return .default
            }
            return config
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: configKey)
            }
        }
    }

    // MARK: - Onboarding

    var isOnboardingComplete: Bool {
        get { defaults.bool(forKey: onboardingCompleteKey) }
        set { defaults.set(newValue, forKey: onboardingCompleteKey) }
    }

    // MARK: - Device Token

    /// Returns an existing device token or generates and saves a new one.
    var deviceToken: String {
        if let existing = KeychainHelper.load(key: KeychainHelper.deviceTokenKey) {
            return existing
        }
        let newToken = UUID().uuidString
        try? KeychainHelper.save(key: KeychainHelper.deviceTokenKey, value: newToken)
        return newToken
    }

    // MARK: - LWA Tokens

    var lwaAccessToken: String? {
        get { KeychainHelper.load(key: KeychainHelper.lwaAccessTokenKey) }
        set {
            if let value = newValue {
                try? KeychainHelper.save(key: KeychainHelper.lwaAccessTokenKey, value: value)
            } else {
                try? KeychainHelper.delete(key: KeychainHelper.lwaAccessTokenKey)
            }
        }
    }

    var lwaRefreshToken: String? {
        get { KeychainHelper.load(key: KeychainHelper.lwaRefreshTokenKey) }
        set {
            if let value = newValue {
                try? KeychainHelper.save(key: KeychainHelper.lwaRefreshTokenKey, value: value)
            } else {
                try? KeychainHelper.delete(key: KeychainHelper.lwaRefreshTokenKey)
            }
        }
    }

    var isAmazonLinked: Bool {
        lwaAccessToken != nil
    }

    func unlinkAmazon() {
        lwaAccessToken = nil
        lwaRefreshToken = nil
    }
}
