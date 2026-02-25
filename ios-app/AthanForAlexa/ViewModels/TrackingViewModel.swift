import Foundation
import SwiftData
import AthanPrayerEngine

/// ViewModel for the prayer tracking tab.
/// Manages marking prayers and viewing daily/weekly overviews.
@Observable
final class TrackingViewModel {

    private let modelContext: ModelContext

    // MARK: - State

    var selectedDate: Date = Date()
    var todayRecords: [PrayerRecord] = []

    /// 7-day overview: array of (date, records) pairs.
    var weekOverview: [(date: Date, records: [PrayerRecord])] = []

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    // MARK: - Load Data

    func loadToday() {
        todayRecords = fetchRecords(for: selectedDate)
        ensureTodayRecordsExist()
    }

    func loadWeek() {
        let calendar = Calendar.current
        var days: [(date: Date, records: [PrayerRecord])] = []

        for offset in (-6...0) {
            if let date = calendar.date(byAdding: .day, value: offset, to: Date()) {
                let dayStart = calendar.startOfDay(for: date)
                let records = fetchRecords(for: dayStart)
                days.append((date: dayStart, records: records))
            }
        }

        weekOverview = days
    }

    // MARK: - Mark Prayer

    func markPrayer(_ prayerName: String, status: PrayerStatus) {
        let dayStart = Calendar.current.startOfDay(for: selectedDate)

        if let existing = todayRecords.first(where: { $0.prayerName == prayerName }) {
            existing.prayerStatus = status
        } else {
            let record = PrayerRecord(date: dayStart, prayerName: prayerName, status: status)
            modelContext.insert(record)
            todayRecords.append(record)
        }

        try? modelContext.save()
    }

    /// Cycle through statuses: upcoming -> completed -> completedLate -> missed -> upcoming.
    func cyclePrayerStatus(_ prayerName: String) {
        let current = todayRecords.first(where: { $0.prayerName == prayerName })?.prayerStatus ?? .upcoming

        let next: PrayerStatus
        switch current {
        case .upcoming: next = .completed
        case .completed: next = .completedLate
        case .completedLate: next = .missed
        case .missed: next = .upcoming
        }

        markPrayer(prayerName, status: next)
    }

    // MARK: - Helpers

    /// Ensure that records exist for all five obligatory prayers today.
    private func ensureTodayRecordsExist() {
        let dayStart = Calendar.current.startOfDay(for: selectedDate)
        let existingNames = Set(todayRecords.map(\.prayerName))

        for prayer in AthanPrayer.obligatory {
            if !existingNames.contains(prayer.rawValue) {
                let record = PrayerRecord(date: dayStart, prayerName: prayer.rawValue)
                modelContext.insert(record)
                todayRecords.append(record)
            }
        }

        try? modelContext.save()
    }

    private func fetchRecords(for date: Date) -> [PrayerRecord] {
        let calendar = Calendar.current
        let dayStart = calendar.startOfDay(for: date)
        guard let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) else {
            return []
        }

        let predicate = #Predicate<PrayerRecord> { record in
            record.date >= dayStart && record.date < dayEnd
        }

        let descriptor = FetchDescriptor<PrayerRecord>(predicate: predicate)

        return (try? modelContext.fetch(descriptor)) ?? []
    }

    // MARK: - Stats

    var completedCount: Int {
        todayRecords.filter { $0.prayerStatus == .completed || $0.prayerStatus == .completedLate }.count
    }

    var totalCount: Int {
        AthanPrayer.obligatory.count
    }

    func statusForPrayer(_ name: String) -> PrayerStatus {
        todayRecords.first(where: { $0.prayerName == name })?.prayerStatus ?? .upcoming
    }

    func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }
}
