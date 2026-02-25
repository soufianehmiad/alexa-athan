import SwiftUI
import AthanPrayerEngine

/// A 7-day prayer tracking grid showing completion status.
struct WeeklyGridView: View {
    let weekData: [(date: Date, records: [PrayerRecord])]

    private let prayers = AthanPrayer.obligatory

    var body: some View {
        VStack(spacing: 0) {
            // Header row: day labels
            HStack(spacing: 0) {
                // Empty corner cell
                Text("")
                    .frame(width: 60)

                ForEach(weekData, id: \.date) { day in
                    Text(dayLabel(day.date))
                        .font(.caption2)
                        .fontWeight(Calendar.current.isDateInToday(day.date) ? .bold : .regular)
                        .foregroundStyle(Calendar.current.isDateInToday(day.date) ? .primary : .secondary)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.bottom, 4)

            // Prayer rows
            ForEach(prayers) { prayer in
                HStack(spacing: 0) {
                    Text(prayer.displayName)
                        .font(.caption)
                        .frame(width: 60, alignment: .leading)

                    ForEach(weekData, id: \.date) { day in
                        let status = statusFor(prayer: prayer.rawValue, in: day.records)
                        statusDot(status)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.vertical, 3)
            }
        }
        .padding()
    }

    @ViewBuilder
    private func statusDot(_ status: PrayerStatus) -> some View {
        Image(systemName: status.symbolName)
            .font(.system(size: 12))
            .foregroundStyle(colorForStatus(status))
    }

    private func statusFor(prayer: String, in records: [PrayerRecord]) -> PrayerStatus {
        records.first(where: { $0.prayerName == prayer })?.prayerStatus ?? .upcoming
    }

    private func colorForStatus(_ status: PrayerStatus) -> Color {
        switch status {
        case .completed: return .green
        case .completedLate: return .orange
        case .missed: return .red
        case .upcoming: return .secondary.opacity(0.3)
        }
    }

    private func dayLabel(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }
}
