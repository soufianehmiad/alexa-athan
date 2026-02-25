import Foundation
import SwiftData

/// ViewModel for the Alexa device setup flow.
/// Handles LWA OAuth, device discovery, and per-device prayer toggles.
@Observable
final class DeviceSetupViewModel {

    private let authService: AmazonAuthService
    private let syncService: AlexaSyncService
    private let persistence: PersistenceService

    // MARK: - State

    var availableDevices: [AlexaSyncService.AlexaDevice] = []
    var isLoadingDevices = false
    var isAuthenticating = false
    var error: String?

    var isAmazonLinked: Bool {
        persistence.isAmazonLinked
    }

    init(
        authService: AmazonAuthService,
        syncService: AlexaSyncService,
        persistence: PersistenceService
    ) {
        self.authService = authService
        self.syncService = syncService
        self.persistence = persistence
    }

    // MARK: - Authentication

    @MainActor
    func linkAmazon() async {
        isAuthenticating = true
        error = nil

        do {
            let result = try await authService.authenticate()
            persistence.lwaAccessToken = result.accessToken
            if let refresh = result.refreshToken {
                persistence.lwaRefreshToken = refresh
            }
            await discoverDevices()
        } catch {
            self.error = error.localizedDescription
        }

        isAuthenticating = false
    }

    func unlinkAmazon() {
        persistence.unlinkAmazon()
        availableDevices = []
    }

    // MARK: - Device Discovery

    @MainActor
    func discoverDevices() async {
        guard persistence.isAmazonLinked else { return }

        isLoadingDevices = true
        error = nil

        do {
            availableDevices = try await syncService.fetchDevices()
        } catch {
            self.error = error.localizedDescription
        }

        isLoadingDevices = false
    }
}
