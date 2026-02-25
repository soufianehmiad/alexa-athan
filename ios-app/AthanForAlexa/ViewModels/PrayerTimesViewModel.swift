import Foundation
import SwiftUI
import AthanPrayerEngine

/// ViewModel for the main prayer times screen.
/// Computes today's times, highlights the next prayer, and drives the countdown timer.
@Observable
final class PrayerTimesViewModel {

    private let engineService: PrayerEngineService
    private let persistence: PersistenceService
    private var timer: Timer?

    // MARK: - Published State

    var prayerTimes: AthanPrayerTimes?
    var nextPrayer: AthanPrayer?
    var nextPrayerTime: Date?
    var countdownText: String = ""
    var currentPrayer: AthanPrayer?

    var configuration: PrayerConfiguration {
        persistence.configuration
    }

    init(engineService: PrayerEngineService, persistence: PersistenceService) {
        self.engineService = engineService
        self.persistence = persistence
    }

    // MARK: - Lifecycle

    func onAppear() {
        recalculate()
        startTimer()
    }

    func onDisappear() {
        stopTimer()
    }

    // MARK: - Calculation

    func recalculate() {
        let config = persistence.configuration
        let now = Date()

        prayerTimes = engineService.prayerTimes(for: config, on: now)
        currentPrayer = engineService.currentPrayer(for: config, at: now)

        if let next = engineService.nextPrayer(for: config, at: now) {
            nextPrayer = next.prayer
            nextPrayerTime = next.time
        } else {
            nextPrayer = nil
            nextPrayerTime = nil
        }

        updateCountdown()
    }

    // MARK: - Timer

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    private func tick() {
        updateCountdown()

        // Re-check if the next prayer has changed (a prayer time just passed).
        let config = persistence.configuration
        let now = Date()
        let newCurrent = engineService.currentPrayer(for: config, at: now)
        if newCurrent != currentPrayer {
            recalculate()
        }
    }

    private func updateCountdown() {
        guard let interval = engineService.timeUntilNextPrayer(for: persistence.configuration) else {
            countdownText = ""
            return
        }

        let totalSeconds = Int(max(interval, 0))
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            countdownText = String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            countdownText = String(format: "%02d:%02d", minutes, seconds)
        }
    }

    // MARK: - Helpers

    /// Format a Date as a time string in the user's local time zone.
    func formattedTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        formatter.timeZone = TimeZone(identifier: configuration.timeZoneIdentifier)
            ?? TimeZone.current
        return formatter.string(from: date)
    }

    /// Check if a prayer is the next upcoming one.
    func isNextPrayer(_ prayer: AthanPrayer) -> Bool {
        prayer == nextPrayer
    }

    /// Check if a prayer time has already passed today.
    func hasPassed(_ prayer: AthanPrayer) -> Bool {
        guard let times = prayerTimes else { return false }
        return Date() >= times.time(for: prayer)
    }
}
