# iOS App

SwiftUI-based iOS client for Athan for Alexa. Computes prayer times locally using Adhan-Swift, manages Alexa device linking, and provides a native prayer schedule interface.

## Prerequisites

- macOS 14+ (Sonoma)
- Xcode 15.2+ (includes Swift 5.9 and iOS 17 SDK)
- iOS 17+ deployment target
- An Apple Developer account (free tier works for device testing; paid for App Store)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (recommended, install via `brew install xcodegen`)

## Opening in Xcode

There are three ways to open this project in Xcode. Choose whichever works best for your setup.

### Option A: Using XcodeGen (Recommended)

XcodeGen generates a proper `.xcodeproj` from the `project.yml` spec file included in this directory. This is the recommended approach because it produces a fully configured project with the correct build settings, entitlements, and test target.

1. **Install XcodeGen** (if not already installed):
   ```bash
   brew install xcodegen
   ```

2. **Generate the Xcode project**:
   ```bash
   cd ios-app
   xcodegen generate
   ```
   This creates `AthanForAlexa.xcodeproj` in the `ios-app/` directory.

3. **Open in Xcode**:
   ```bash
   open AthanForAlexa.xcodeproj
   ```

4. Xcode will automatically resolve the local `AthanPrayerEngine` package and its transitive dependency on `adhan-swift`. Wait for package resolution to complete (visible in the status bar).

5. Select a simulator or device and press **Cmd+R** to build and run.

### Option B: Open as Swift Package

Xcode can open a `Package.swift` directly, which is useful for building and testing the library target. However, this does **not** create a runnable iOS app target -- it only builds the code as a library. Use this for quick iteration on code, not for running on a device.

1. Open Xcode.
2. **File > Open...** and select `ios-app/Package.swift`.
3. Xcode will resolve dependencies automatically.
4. You can build (**Cmd+B**) to verify the code compiles, but you cannot run the app directly because there is no application target.

### Option C: Manual Xcode Project Setup

If you cannot use XcodeGen and need a runnable app, create the Xcode project manually:

1. **Create a new Xcode project**:
   - Open Xcode. Select **File > New > Project...**
   - Choose **iOS > App**. Click **Next**.
   - Set these values:
     - **Product Name**: `AthanForAlexa`
     - **Organization Identifier**: `com.athanforalexa`
     - **Interface**: SwiftUI
     - **Language**: Swift
     - **Storage**: SwiftData
   - Click **Next**, then choose a temporary location (e.g., Desktop). Click **Create**.

2. **Remove the auto-generated files**:
   - In the Xcode project navigator, delete the auto-generated `AthanForAlexaApp.swift`, `ContentView.swift`, and `Item.swift` files (select **Move to Trash**).

3. **Add existing source files**:
   - Right-click the `AthanForAlexa` group in the navigator.
   - Select **Add Files to "AthanForAlexa"...**
   - Navigate to `ios-app/AthanForAlexa/` and select **all** subfolders and files:
     - `AthanApp.swift`
     - `Info.plist`
     - `AthanForAlexa.entitlements`
     - `Models/` (entire folder)
     - `ViewModels/` (entire folder)
     - `Views/` (entire folder)
     - `Services/` (entire folder)
     - `Resources/` (entire folder)
   - Make sure **"Copy items if needed"** is checked (or uncheck if you want to reference in-place).
   - Make sure **"Create groups"** is selected (not "Create folder references").
   - Click **Add**.

4. **Configure Info.plist**:
   - In the project navigator, select the project (blue icon at the top).
   - Select the **AthanForAlexa** target.
   - Go to **Build Settings** and search for `INFOPLIST_FILE`.
   - Set it to `AthanForAlexa/Info.plist` (the path relative to the project root).

5. **Configure Entitlements**:
   - In **Build Settings**, search for `CODE_SIGN_ENTITLEMENTS`.
   - Set it to `AthanForAlexa/AthanForAlexa.entitlements`.

6. **Set the deployment target**:
   - In the target **General** tab, set **Minimum Deployments > iOS** to **17.0**.

7. **Add the local prayer engine package**:
   - Select the project in the navigator (blue icon).
   - Go to **Package Dependencies** tab.
   - Click the **+** button.
   - Click **Add Local...** at the bottom of the dialog.
   - Navigate to `core-prayer-engine/swift/` and select the folder.
   - Click **Add Package**.
   - When prompted, check **AthanPrayerEngine** and ensure it is added to the **AthanForAlexa** target.
   - Click **Add Package**.

8. **Verify the dependency**:
   - The `AthanPrayerEngine` local package will automatically pull in `adhan-swift` as a transitive dependency.
   - Under **Package Dependencies** in the navigator, you should see both `AthanPrayerEngine` and `Adhan`.

9. **Build and run**:
   - Select an iOS 17+ simulator or device.
   - Press **Cmd+R**.

## Configuring Code Signing

Before running on a physical device or submitting to the App Store, you need to configure code signing.

### For Development (Personal Device)

1. Open the Xcode project (via Option A, B, or C above).
2. Select the **AthanForAlexa** target in the project navigator.
3. Go to the **Signing & Capabilities** tab.
4. Check **Automatically manage signing**.
5. Select your **Team** from the dropdown. If you do not see a team:
   - Open **Xcode > Settings > Accounts** (Cmd+,).
   - Click **+** and sign in with your Apple ID.
   - Select the newly added account as your team.
6. Xcode will create a provisioning profile automatically.
7. Connect your iOS device and select it as the run destination.
8. Press **Cmd+R** to build and deploy.

### For App Store Distribution

1. Ensure you have a paid Apple Developer Program membership ($99/year).
2. In **Signing & Capabilities**, select your paid team.
3. Set the **Bundle Identifier** to a unique value (e.g., `com.yourname.athanforalexa`).
4. In **Xcode > Product > Archive**, create an archive.
5. Use the **Organizer** window to validate and upload to App Store Connect.

### StoreKit Configuration (for Donations)

The app uses StoreKit 2 consumable in-app purchases for donations. To test in development:

1. In Xcode, go to **Product > Scheme > Edit Scheme...**
2. Under **Run > Options**, set **StoreKit Configuration** to a local `.storekit` file (you can create one via **File > New > File > StoreKit Configuration File**).
3. Add products matching the IDs in `DonationService.swift`:
   - `com.athanforalexa.donate.1`
   - `com.athanforalexa.donate.5`
   - `com.athanforalexa.donate.10`
   - `com.athanforalexa.donate.25`

## Dependencies

| Package | Version | Purpose | Source |
|---------|---------|---------|--------|
| AthanPrayerEngine | local | Prayer time calculation wrapper | `../core-prayer-engine/swift/` |
| adhan-swift | 1.4.0+ | Core prayer time algorithms | Pulled transitively via AthanPrayerEngine |

Dependencies are resolved automatically by Xcode or Swift Package Manager on first build.

## Frameworks

The following system frameworks are linked automatically:

| Framework | Purpose |
|-----------|---------|
| SwiftData | Local persistence for PrayerRecord and DeviceSelection |
| Security | Keychain access for storing LWA tokens |
| StoreKit | In-app donation purchases |
| AuthenticationServices | ASWebAuthenticationSession for Login with Amazon |

## Localization

The app supports three languages:

| Language | Code | Status |
|----------|------|--------|
| English | `en` | Base language (complete) |
| Arabic | `ar` | Complete |
| French | `fr` | Complete |

String files are located at `AthanForAlexa/Resources/{lang}.lproj/Localizable.strings`. The localized app name and Info.plist strings are in `InfoPlist.strings` within each `.lproj` directory.

To add a new language:
1. Create a new `{code}.lproj/` directory under `AthanForAlexa/Resources/`.
2. Copy `en.lproj/Localizable.strings` and `en.lproj/InfoPlist.strings` into it.
3. Translate the string values.
4. Regenerate the project (`xcodegen generate`) if using XcodeGen.

## Architecture

- **MVVM** with a service layer
- **SwiftUI** for the UI layer (iOS 17+)
- **SwiftData** for local persistence (PrayerRecord, DeviceSelection)
- **StoreKit 2** for in-app donations
- **Adhan-Swift** for prayer time computation (fully offline)
- **ASWebAuthenticationSession** for Login with Amazon OAuth

## Project Structure

```
ios-app/
├── Package.swift                          Swift Package manifest (library build only)
├── project.yml                            XcodeGen project spec (recommended)
├── AthanForAlexa/
│   ├── AthanApp.swift                     @main entry, SwiftData container setup
│   ├── Info.plist                         URL schemes, ATS, location usage
│   ├── AthanForAlexa.entitlements         App entitlements (IAP)
│   ├── Models/
│   │   ├── Enums.swift                    PrayerStatus, OnboardingStep, AppTab
│   │   ├── PrayerConfiguration.swift      City, lat/lon, method, madhab, offsets
│   │   ├── DeviceSelection.swift          @Model - Alexa device with per-prayer toggles
│   │   └── PrayerRecord.swift             @Model - date, prayer, status for tracking
│   ├── ViewModels/
│   │   ├── PrayerTimesViewModel.swift     Today's times, next prayer, countdown timer
│   │   ├── SettingsViewModel.swift        Config editing, city picker, save/sync
│   │   ├── DeviceSetupViewModel.swift     LWA OAuth, device discovery
│   │   ├── TrackingViewModel.swift        Mark prayers, daily/weekly overview
│   │   └── DonationViewModel.swift        StoreKit 2 product loading and purchase
│   ├── Views/
│   │   ├── ContentView.swift              TabView (Prayer Times, Tracking, Settings)
│   │   ├── PrayerTimesView.swift          Main screen with countdown and prayer rows
│   │   ├── TrackingView.swift             Daily tap-to-mark + weekly grid
│   │   ├── SettingsView.swift             Location, method, madhab, offsets, Alexa, donations
│   │   ├── DeviceSetupView.swift          Amazon linking + device toggles
│   │   ├── DonationView.swift             Preset donation amounts
│   │   ├── OnboardingView.swift           Step-by-step first launch flow
│   │   └── Components/
│   │       ├── PrayerTimeRow.swift        Single prayer row (name, time, status)
│   │       ├── CountdownView.swift        Countdown to next prayer
│   │       └── WeeklyGridView.swift       7-day prayer tracking grid
│   ├── Services/
│   │   ├── PrayerEngineService.swift      Wraps AthanPrayerEngine (Adhan-Swift)
│   │   ├── AlexaSyncService.swift         HTTP client for backend API
│   │   ├── AmazonAuthService.swift        LWA OAuth via ASWebAuthenticationSession
│   │   ├── DonationService.swift          StoreKit 2 consumable IAP
│   │   ├── PersistenceService.swift       UserDefaults + Keychain coordination
│   │   └── KeychainHelper.swift           Simple Keychain wrapper
│   └── Resources/
│       ├── Assets.xcassets/               App icon, accent color
│       ├── en.lproj/
│       │   ├── Localizable.strings        English strings
│       │   └── InfoPlist.strings          Localized Info.plist values
│       ├── ar.lproj/
│       │   ├── Localizable.strings        Arabic strings
│       │   └── InfoPlist.strings          Localized Info.plist values
│       └── fr.lproj/
│           ├── Localizable.strings        French strings
│           └── InfoPlist.strings          Localized Info.plist values
└── AthanForAlexaTests/
    └── AthanForAlexaTests.swift           Unit test placeholder
```

## Notes

- The iOS app works fully offline. All prayer times are computed on-device.
- Network access is only needed for Alexa device sync via the backend API.
- SwiftData is used instead of CoreData for simpler model definitions.
- The prayer engine is a local Swift package at `../core-prayer-engine/swift/`.
- The `project.yml` is the recommended way to generate the `.xcodeproj`. Run `xcodegen generate` once and the generated project file does not need to be checked into version control.
- The generated `.xcodeproj` should be added to `.gitignore`.
