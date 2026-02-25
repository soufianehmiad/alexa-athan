import SwiftUI
import SwiftData

/// Main app entry point. Sets up SwiftData container and injects dependencies.
@main
struct AthanApp: App {
    let modelContainer: ModelContainer

    // Services (shared across the app)
    let persistence: PersistenceService
    let engineService: PrayerEngineService
    let authService: AmazonAuthService
    let syncService: AlexaSyncService
    let donationService: DonationService

    init() {
        // Initialize SwiftData container
        let schema = Schema([
            PrayerRecord.self,
            DeviceSelection.self
        ])
        let modelConfiguration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false
        )

        do {
            modelContainer = try ModelContainer(
                for: schema,
                configurations: [modelConfiguration]
            )
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }

        // Initialize services
        persistence = PersistenceService()
        engineService = PrayerEngineService()
        authService = AmazonAuthService()
        syncService = AlexaSyncService(persistence: persistence)
        donationService = DonationService()
    }

    var body: some Scene {
        WindowGroup {
            RootView(
                persistence: persistence,
                engineService: engineService,
                authService: authService,
                syncService: syncService,
                donationService: donationService
            )
        }
        .modelContainer(modelContainer)
    }
}

// MARK: - Root View (handles onboarding vs main app)

private struct RootView: View {
    let persistence: PersistenceService
    let engineService: PrayerEngineService
    let authService: AmazonAuthService
    let syncService: AlexaSyncService
    let donationService: DonationService

    @Environment(\.modelContext) private var modelContext
    @State private var isOnboardingComplete: Bool

    init(
        persistence: PersistenceService,
        engineService: PrayerEngineService,
        authService: AmazonAuthService,
        syncService: AlexaSyncService,
        donationService: DonationService
    ) {
        self.persistence = persistence
        self.engineService = engineService
        self.authService = authService
        self.syncService = syncService
        self.donationService = donationService
        self._isOnboardingComplete = State(initialValue: persistence.isOnboardingComplete)
    }

    var body: some View {
        if isOnboardingComplete {
            mainContent
        } else {
            OnboardingView(
                isComplete: $isOnboardingComplete,
                settingsVM: makeSettingsVM(),
                deviceSetupVM: makeDeviceSetupVM()
            )
            .onChange(of: isOnboardingComplete) { _, newValue in
                if newValue {
                    persistence.isOnboardingComplete = true
                }
            }
        }
    }

    @ViewBuilder
    private var mainContent: some View {
        ContentView(
            prayerTimesVM: makePrayerTimesVM(),
            trackingVM: makeTrackingVM(),
            settingsVM: makeSettingsVM(),
            deviceSetupVM: makeDeviceSetupVM(),
            donationVM: makeDonationVM()
        )
    }

    // MARK: - ViewModel Factories

    private func makePrayerTimesVM() -> PrayerTimesViewModel {
        PrayerTimesViewModel(engineService: engineService, persistence: persistence)
    }

    private func makeTrackingVM() -> TrackingViewModel {
        TrackingViewModel(modelContext: modelContext)
    }

    private func makeSettingsVM() -> SettingsViewModel {
        SettingsViewModel(persistence: persistence, syncService: syncService)
    }

    private func makeDeviceSetupVM() -> DeviceSetupViewModel {
        DeviceSetupViewModel(
            authService: authService,
            syncService: syncService,
            persistence: persistence
        )
    }

    private func makeDonationVM() -> DonationViewModel {
        DonationViewModel(donationService: donationService)
    }
}
