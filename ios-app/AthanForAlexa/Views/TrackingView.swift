import SwiftUI
import AthanPrayerEngine

/// Prayer tracking tab showing daily overview with tap-to-mark and weekly grid.
struct TrackingView: View {
    let viewModel: TrackingViewModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Daily progress summary
                    VStack(spacing: 8) {
                        Text("\(viewModel.completedCount)/\(viewModel.totalCount)")
                            .font(.system(size: 36, weight: .light, design: .rounded))

                        Text("Prayers Today")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 8)

                    // Daily prayer list (tap to cycle status)
                    VStack(spacing: 4) {
                        ForEach(AthanPrayer.obligatory) { prayer in
                            Button {
                                viewModel.cyclePrayerStatus(prayer.rawValue)
                            } label: {
                                trackingRow(for: prayer)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)

                    // Weekly overview grid
                    if !viewModel.weekOverview.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("This Week")
                                .font(.headline)
                                .padding(.horizontal)

                            WeeklyGridView(weekData: viewModel.weekOverview)
                                .background(Color(.systemGray6))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .padding(.horizontal)
                        }
                    }
                }
            }
            .navigationTitle("Tracking")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                viewModel.loadToday()
                viewModel.loadWeek()
            }
        }
    }

    @ViewBuilder
    private func trackingRow(for prayer: AthanPrayer) -> some View {
        let status = viewModel.statusForPrayer(prayer.rawValue)

        HStack {
            Image(systemName: status.symbolName)
                .font(.title3)
                .foregroundStyle(colorForStatus(status))
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(prayer.displayName)
                    .font(.body)

                Text(prayer.arabicName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(status.displayName)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(.systemGray6))
                .clipShape(Capsule())
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private func colorForStatus(_ status: PrayerStatus) -> Color {
        switch status {
        case .completed: return .green
        case .completedLate: return .orange
        case .missed: return .red
        case .upcoming: return .secondary
        }
    }
}
