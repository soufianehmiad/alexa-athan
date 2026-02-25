import SwiftUI
import AthanPrayerEngine

/// Main screen showing today's prayer times with countdown and next-prayer highlight.
struct PrayerTimesView: View {
    let viewModel: PrayerTimesViewModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // City and date header
                    VStack(spacing: 4) {
                        Text(viewModel.configuration.city)
                            .font(.title2)
                            .fontWeight(.semibold)

                        Text(formattedDate)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 8)

                    // Countdown to next prayer
                    CountdownView(
                        nextPrayer: viewModel.nextPrayer,
                        countdownText: viewModel.countdownText
                    )

                    // Prayer time rows
                    if let times = viewModel.prayerTimes {
                        VStack(spacing: 2) {
                            ForEach(AthanPrayer.allCases) { prayer in
                                PrayerTimeRow(
                                    prayer: prayer,
                                    time: viewModel.formattedTime(times.time(for: prayer)),
                                    isNext: viewModel.isNextPrayer(prayer),
                                    hasPassed: viewModel.hasPassed(prayer)
                                )
                            }
                        }
                        .padding(.horizontal)
                    } else {
                        ContentUnavailableView(
                            "Unable to Calculate",
                            systemImage: "exclamationmark.triangle",
                            description: Text("Check your location settings.")
                        )
                    }
                }
            }
            .navigationTitle("Prayer Times")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { viewModel.onAppear() }
            .onDisappear { viewModel.onDisappear() }
        }
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        return formatter.string(from: Date())
    }
}
