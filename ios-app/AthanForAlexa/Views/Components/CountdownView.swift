import SwiftUI
import AthanPrayerEngine

/// Displays the countdown to the next prayer.
struct CountdownView: View {
    let nextPrayer: AthanPrayer?
    let countdownText: String

    var body: some View {
        VStack(spacing: 8) {
            if let nextPrayer {
                Text("Next: \(nextPrayer.displayName)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Text(countdownText)
                    .font(.system(size: 48, weight: .light, design: .monospaced))
                    .foregroundStyle(.primary)
                    .contentTransition(.numericText())
            } else {
                Text("All prayers completed")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }
}
