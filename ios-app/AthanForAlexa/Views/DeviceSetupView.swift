import SwiftUI
import SwiftData

/// View for linking Amazon account and managing Alexa device selections.
struct DeviceSetupView: View {
    let viewModel: DeviceSetupViewModel

    @Query private var savedDevices: [DeviceSelection]
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        List {
            // MARK: - Amazon Account
            Section("Amazon Account") {
                if viewModel.isAmazonLinked {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text("Amazon account linked")
                    }

                    Button("Unlink Amazon Account", role: .destructive) {
                        viewModel.unlinkAmazon()
                    }
                } else {
                    Button {
                        Task { await viewModel.linkAmazon() }
                    } label: {
                        HStack {
                            Image(systemName: "link")
                            Text("Link Amazon Account")
                        }
                    }
                    .disabled(viewModel.isAuthenticating)
                }

                if viewModel.isAuthenticating {
                    ProgressView("Authenticating...")
                }
            }

            // MARK: - Discovered Devices
            if viewModel.isAmazonLinked {
                Section("Available Devices") {
                    if viewModel.isLoadingDevices {
                        ProgressView("Discovering devices...")
                    } else if viewModel.availableDevices.isEmpty {
                        Text("No Alexa devices found.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.availableDevices) { device in
                            deviceRow(device)
                        }
                    }

                    Button("Refresh Devices") {
                        Task { await viewModel.discoverDevices() }
                    }
                    .disabled(viewModel.isLoadingDevices)
                }
            }

            // MARK: - Saved Devices
            if !savedDevices.isEmpty {
                Section("Configured Devices") {
                    ForEach(savedDevices) { device in
                        savedDeviceRow(device)
                    }
                    .onDelete(perform: deleteDevices)
                }
            }

            // MARK: - Error
            if let error = viewModel.error {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            }
        }
        .navigationTitle("Alexa Devices")
        .onAppear {
            if viewModel.isAmazonLinked && viewModel.availableDevices.isEmpty {
                Task { await viewModel.discoverDevices() }
            }
        }
    }

    // MARK: - Device Rows

    @ViewBuilder
    private func deviceRow(_ device: AlexaSyncService.AlexaDevice) -> some View {
        let isAdded = savedDevices.contains(where: { $0.deviceId == device.id })

        HStack {
            VStack(alignment: .leading) {
                Text(device.name)
                    .font(.body)
                if let type = device.type {
                    Text(type)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if isAdded {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else {
                Button("Add") {
                    addDevice(device)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
    }

    @ViewBuilder
    private func savedDeviceRow(_ device: DeviceSelection) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(device.deviceName)
                .font(.headline)

            Toggle("Fajr", isOn: Bindable(device).fajrEnabled)
            Toggle("Dhuhr", isOn: Bindable(device).dhuhrEnabled)
            Toggle("Asr", isOn: Bindable(device).asrEnabled)
            Toggle("Maghrib", isOn: Bindable(device).maghribEnabled)
            Toggle("Isha", isOn: Bindable(device).ishaEnabled)
        }
        .padding(.vertical, 4)
    }

    // MARK: - Actions

    private func addDevice(_ device: AlexaSyncService.AlexaDevice) {
        let selection = DeviceSelection(deviceId: device.id, deviceName: device.name)
        modelContext.insert(selection)
        try? modelContext.save()
    }

    private func deleteDevices(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(savedDevices[index])
        }
        try? modelContext.save()
    }
}
