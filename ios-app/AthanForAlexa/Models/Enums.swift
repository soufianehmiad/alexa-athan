import Foundation
import AthanPrayerEngine

// MARK: - Prayer Status (for tracking)

/// Status of a tracked prayer.
enum PrayerStatus: String, Codable, CaseIterable, Identifiable {
    case upcoming
    case completed
    case completedLate
    case missed

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .upcoming: return "Upcoming"
        case .completed: return "Prayed"
        case .completedLate: return "Prayed Late"
        case .missed: return "Missed"
        }
    }

    var symbolName: String {
        switch self {
        case .upcoming: return "clock"
        case .completed: return "checkmark.circle.fill"
        case .completedLate: return "clock.badge.checkmark"
        case .missed: return "xmark.circle.fill"
        }
    }
}

// MARK: - Onboarding Step

enum OnboardingStep: Int, CaseIterable {
    case welcome = 0
    case location
    case method
    case alexaLink
    case done
}

// MARK: - App Tab

enum AppTab: String, CaseIterable, Identifiable {
    case prayerTimes
    case tracking
    case settings

    var id: String { rawValue }

    var title: String {
        switch self {
        case .prayerTimes: return "Prayer Times"
        case .tracking: return "Tracking"
        case .settings: return "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .prayerTimes: return "sun.max"
        case .tracking: return "checklist"
        case .settings: return "gearshape"
        }
    }
}
