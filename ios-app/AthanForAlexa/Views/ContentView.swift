import SwiftUI

/// Root view with tab-based navigation.
struct ContentView: View {
    @State private var selectedTab: AppTab = .prayerTimes

    let prayerTimesVM: PrayerTimesViewModel
    let trackingVM: TrackingViewModel
    let settingsVM: SettingsViewModel
    let deviceSetupVM: DeviceSetupViewModel
    let donationVM: DonationViewModel

    var body: some View {
        TabView(selection: $selectedTab) {
            PrayerTimesView(viewModel: prayerTimesVM)
                .tabItem {
                    Label(AppTab.prayerTimes.title, systemImage: AppTab.prayerTimes.systemImage)
                }
                .tag(AppTab.prayerTimes)

            TrackingView(viewModel: trackingVM)
                .tabItem {
                    Label(AppTab.tracking.title, systemImage: AppTab.tracking.systemImage)
                }
                .tag(AppTab.tracking)

            SettingsView(
                viewModel: settingsVM,
                deviceSetupVM: deviceSetupVM,
                donationVM: donationVM
            )
            .tabItem {
                Label(AppTab.settings.title, systemImage: AppTab.settings.systemImage)
            }
            .tag(AppTab.settings)
        }
    }
}
