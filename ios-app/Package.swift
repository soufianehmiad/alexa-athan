// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AthanForAlexa",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "AthanForAlexa", targets: ["AthanForAlexa"])
    ],
    dependencies: [
        .package(path: "../core-prayer-engine/swift")
    ],
    targets: [
        .target(
            name: "AthanForAlexa",
            dependencies: [
                .product(name: "AthanPrayerEngine", package: "AthanPrayerEngine")
            ],
            path: "AthanForAlexa",
            exclude: [
                "Info.plist",
                "AthanForAlexa.entitlements"
            ],
            resources: [
                .process("Resources")
            ]
        )
    ]
)
