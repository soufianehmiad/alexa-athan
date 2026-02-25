import XCTest
@testable import AthanForAlexa

final class AthanForAlexaTests: XCTestCase {
    func testPrayerConfigurationDefaults() {
        let config = PrayerConfiguration.default
        XCTAssertEqual(config.city, "New York")
        XCTAssertEqual(config.latitude, 40.7128, accuracy: 0.001)
        XCTAssertEqual(config.longitude, -74.0060, accuracy: 0.001)
    }
}
