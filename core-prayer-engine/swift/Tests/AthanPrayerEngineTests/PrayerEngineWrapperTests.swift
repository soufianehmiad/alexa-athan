import XCTest
@testable import AthanPrayerEngine

final class PrayerEngineWrapperTests: XCTestCase {

    let engine = PrayerEngineWrapper()

    func testCalculateReturnsNonNilForValidInput() {
        let date = makeDate(year: 2026, month: 2, day: 24)
        let result = engine.calculate(
            latitude: 40.7128,
            longitude: -74.0060,
            date: date,
            method: .northAmerica,
            madhab: .shafi
        )
        XCTAssertNotNil(result)
    }

    func testPrayerTimesAreInOrder() {
        let date = makeDate(year: 2026, month: 6, day: 15)
        guard let times = engine.calculate(
            latitude: 40.7128,
            longitude: -74.0060,
            date: date,
            method: .muslimWorldLeague,
            madhab: .shafi
        ) else {
            XCTFail("Expected non-nil prayer times")
            return
        }

        XCTAssertTrue(times.fajr < times.sunrise)
        XCTAssertTrue(times.sunrise < times.dhuhr)
        XCTAssertTrue(times.dhuhr < times.asr)
        XCTAssertTrue(times.asr < times.maghrib)
        XCTAssertTrue(times.maghrib < times.isha)
    }

    func testAllMethodsProduceResults() {
        let date = makeDate(year: 2026, month: 3, day: 1)
        for method in AthanCalculationMethod.allCases {
            let result = engine.calculate(
                latitude: 21.4225,
                longitude: 39.8262,
                date: date,
                method: method,
                madhab: .shafi
            )
            XCTAssertNotNil(result, "Method \(method.rawValue) should produce results")
        }
    }

    func testObligatoryPrayersExcludesSunrise() {
        let obligatory = AthanPrayer.obligatory
        XCTAssertEqual(obligatory.count, 5)
        XCTAssertFalse(obligatory.contains(.sunrise))
    }

    // MARK: - Helpers

    private func makeDate(year: Int, month: Int, day: Int) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "America/New_York")!
        return cal.date(from: DateComponents(year: year, month: month, day: day, hour: 12))!
    }
}
