import SwiftUI
import AthanPrayerEngine

/// Step-by-step first-launch onboarding flow.
struct OnboardingView: View {
    @Binding var isComplete: Bool

    let settingsVM: SettingsViewModel
    let deviceSetupVM: DeviceSetupViewModel

    @State private var currentStep: OnboardingStep = .welcome

    var body: some View {
        NavigationStack {
            VStack {
                // Progress indicator
                ProgressView(value: Double(currentStep.rawValue), total: Double(OnboardingStep.allCases.count - 1))
                    .padding(.horizontal)
                    .padding(.top, 8)

                TabView(selection: $currentStep) {
                    welcomeStep
                        .tag(OnboardingStep.welcome)

                    locationStep
                        .tag(OnboardingStep.location)

                    methodStep
                        .tag(OnboardingStep.method)

                    alexaStep
                        .tag(OnboardingStep.alexaLink)

                    doneStep
                        .tag(OnboardingStep.done)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentStep)
            }
        }
    }

    // MARK: - Steps

    private var welcomeStep: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "moon.stars")
                .font(.system(size: 72))
                .foregroundStyle(.accentColor)

            Text("Athan for Alexa")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Hear the call to prayer on your Alexa devices at the correct times. Free, open source, and privacy-first.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            nextButton("Get Started")
        }
        .padding()
    }

    private var locationStep: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "location.circle")
                .font(.system(size: 48))
                .foregroundStyle(.accentColor)

            Text("Select Your City")
                .font(.title2)
                .fontWeight(.semibold)

            VStack(spacing: 8) {
                ForEach(SettingsViewModel.cityPresets.prefix(6)) { preset in
                    Button {
                        settingsVM.selectCity(preset)
                    } label: {
                        HStack {
                            Text(preset.name)
                                .foregroundStyle(.primary)
                            Spacer()
                            if settingsVM.city == preset.name {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(.accentColor)
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .padding(.horizontal)

            Spacer()

            nextButton("Continue")
        }
        .padding()
    }

    private var methodStep: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "function")
                .font(.system(size: 48))
                .foregroundStyle(.accentColor)

            Text("Calculation Method")
                .font(.title2)
                .fontWeight(.semibold)

            VStack(spacing: 4) {
                Picker("Method", selection: $settingsVM.method) {
                    ForEach(AthanCalculationMethod.allCases) { method in
                        Text(method.displayName).tag(method)
                    }
                }
                .pickerStyle(.wheel)
                .frame(height: 120)

                Picker("Madhab", selection: $settingsVM.madhab) {
                    ForEach(AthanMadhab.allCases) { madhab in
                        Text(madhab.displayName).tag(madhab)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
            }

            Spacer()

            nextButton("Continue")
        }
        .padding()
        .onChange(of: settingsVM.method) { _, _ in settingsVM.save() }
        .onChange(of: settingsVM.madhab) { _, _ in settingsVM.save() }
    }

    private var alexaStep: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "hifispeaker.2")
                .font(.system(size: 48))
                .foregroundStyle(.accentColor)

            Text("Link Your Alexa")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Connect your Amazon account to play the Athan on your Alexa devices. You can do this later from Settings.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            if deviceSetupVM.isAmazonLinked {
                Label("Amazon account linked", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else {
                Button {
                    Task { await deviceSetupVM.linkAmazon() }
                } label: {
                    Text("Link Amazon Account")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .disabled(deviceSetupVM.isAuthenticating)
            }

            Spacer()

            VStack(spacing: 12) {
                nextButton("Continue")

                if !deviceSetupVM.isAmazonLinked {
                    Button("Skip for Now") {
                        advance()
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
    }

    private var doneStep: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 72))
                .foregroundStyle(.green)

            Text("You're All Set!")
                .font(.title)
                .fontWeight(.bold)

            Text("Your prayer times are ready. The Athan will play automatically on your linked Alexa devices.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            Button {
                isComplete = true
            } label: {
                Text("Start Using Athan")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal)
        }
        .padding()
    }

    // MARK: - Helpers

    @ViewBuilder
    private func nextButton(_ title: String) -> some View {
        Button {
            advance()
        } label: {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.accentColor)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal)
    }

    private func advance() {
        if let nextIndex = OnboardingStep(rawValue: currentStep.rawValue + 1) {
            currentStep = nextIndex
        }
    }
}
