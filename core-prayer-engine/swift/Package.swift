// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AthanPrayerEngine",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "AthanPrayerEngine", targets: ["AthanPrayerEngine"])
    ],
    dependencies: [
        .package(url: "https://github.com/batoulapps/adhan-swift", from: "1.4.0")
    ],
    targets: [
        .target(
            name: "AthanPrayerEngine",
            dependencies: [
                .product(name: "Adhan", package: "adhan-swift")
            ]
        ),
        .testTarget(
            name: "AthanPrayerEngineTests",
            dependencies: ["AthanPrayerEngine"]
        )
    ]
)
