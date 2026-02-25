import SwiftUI
import AthanPrayerEngine

/// Settings screen organized in sections: Location, Calculation, Alexa, Donations, About.
struct SettingsView: View {
    @Bindable var viewModel: SettingsViewModel
    let deviceSetupVM: DeviceSetupViewModel
    let donationVM: DonationViewModel

    var body: some View {
        NavigationStack {
            Form {
                // MARK: - Location
                Section("Location") {
                    NavigationLink {
                        CityPickerView(viewModel: viewModel)
                    } label: {
                        HStack {
                            Text("City")
                            Spacer()
                            Text(viewModel.city)
                                .foregroundStyle(.secondary)
                        }
                    }

                    LabeledContent("Latitude") {
                        TextField("Latitude", text: $viewModel.latitude)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }

                    LabeledContent("Longitude") {
                        TextField("Longitude", text: $viewModel.longitude)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                }

                // MARK: - Calculation
                Section("Calculation Method") {
                    Picker("Method", selection: $viewModel.method) {
                        ForEach(AthanCalculationMethod.allCases) { method in
                            Text(method.displayName).tag(method)
                        }
                    }

                    Picker("Madhab (Asr)", selection: $viewModel.madhab) {
                        ForEach(AthanMadhab.allCases) { madhab in
                            Text(madhab.displayName).tag(madhab)
                        }
                    }
                }

                // MARK: - Offsets
                Section("Prayer Offsets (minutes)") {
                    OffsetStepper(label: "Fajr", value: $viewModel.offsets.fajr)
                    OffsetStepper(label: "Sunrise", value: $viewModel.offsets.sunrise)
                    OffsetStepper(label: "Dhuhr", value: $viewModel.offsets.dhuhr)
                    OffsetStepper(label: "Asr", value: $viewModel.offsets.asr)
                    OffsetStepper(label: "Maghrib", value: $viewModel.offsets.maghrib)
                    OffsetStepper(label: "Isha", value: $viewModel.offsets.isha)
                }

                // MARK: - Alexa
                Section("Alexa") {
                    NavigationLink {
                        DeviceSetupView(viewModel: deviceSetupVM)
                    } label: {
                        HStack {
                            Text("Alexa Devices")
                            Spacer()
                            Text(viewModel.isAmazonLinked ? "Linked" : "Not Linked")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // MARK: - Donations
                Section("Support") {
                    NavigationLink {
                        DonationView(viewModel: donationVM)
                    } label: {
                        Text("Donate")
                    }
                }

                // MARK: - About
                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Privacy", value: "No data collected")

                    Link("Source Code", destination: URL(string: "https://github.com/athanforalexa")!)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: viewModel.method) { _, _ in viewModel.save() }
            .onChange(of: viewModel.madhab) { _, _ in viewModel.save() }
            .onChange(of: viewModel.offsets) { _, _ in viewModel.save() }
        }
    }
}

// MARK: - Offset Stepper

private struct OffsetStepper: View {
    let label: String
    @Binding var value: Int

    var body: some View {
        Stepper(value: $value, in: -30...30) {
            HStack {
                Text(label)
                Spacer()
                Text(value == 0 ? "0" : (value > 0 ? "+\(value)" : "\(value)"))
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
        }
    }
}

// MARK: - City Picker

private struct CityPickerView: View {
    let viewModel: SettingsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    private var filteredCities: [SettingsViewModel.CityPreset] {
        if searchText.isEmpty {
            return SettingsViewModel.cityPresets
        }
        return SettingsViewModel.cityPresets.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        List(filteredCities) { preset in
            Button {
                viewModel.selectCity(preset)
                dismiss()
            } label: {
                HStack {
                    Text(preset.name)
                    Spacer()
                    if viewModel.city == preset.name {
                        Image(systemName: "checkmark")
                            .foregroundStyle(.accentColor)
                    }
                }
            }
            .foregroundStyle(.primary)
        }
        .navigationTitle("Select City")
        .searchable(text: $searchText, prompt: "Search cities")
    }
}
