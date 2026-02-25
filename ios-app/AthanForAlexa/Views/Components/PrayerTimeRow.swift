import SwiftUI
import AthanPrayerEngine

/// A single row showing prayer name (English + Arabic), time, and status indicator.
struct PrayerTimeRow: View {
    let prayer: AthanPrayer
    let time: String
    let isNext: Bool
    let hasPassed: Bool

    var body: some View {
        HStack {
            // Status indicator
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)

            // Prayer names
            VStack(alignment: .leading, spacing: 2) {
                Text(prayer.displayName)
                    .font(.body)
                    .fontWeight(isNext ? .semibold : .regular)

                Text(prayer.arabicName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            // Time
            Text(time)
                .font(.system(.body, design: .monospaced))
                .fontWeight(isNext ? .semibold : .regular)
                .foregroundStyle(isNext ? Color.accentColor : .primary)
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 12)
        .background(isNext ? Color.accentColor.opacity(0.08) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var statusColor: Color {
        if isNext {
            return .accentColor
        } else if hasPassed {
            return .secondary.opacity(0.4)
        } else {
            return .secondary.opacity(0.2)
        }
    }
}
