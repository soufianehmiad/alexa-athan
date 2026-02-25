import SwiftUI
import StoreKit

/// In-app donation screen with preset amounts.
struct DonationView: View {
    let viewModel: DonationViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.red)

                    Text("Support Athan for Alexa")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("This app is free and open source. Your donation helps cover server costs and ongoing development.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.top, 16)

                // Thank you state
                if viewModel.hasRecentDonation {
                    VStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(.green)

                        Text("Thank you for your donation!")
                            .font(.headline)

                        Text("May Allah reward you.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                }

                // Donation buttons
                if viewModel.isLoading {
                    ProgressView("Loading...")
                        .padding()
                } else if viewModel.products.isEmpty {
                    Text("Donations are not available at this time.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding()
                } else {
                    VStack(spacing: 12) {
                        ForEach(viewModel.products, id: \.id) { product in
                            Button {
                                Task { await viewModel.purchase(product) }
                            } label: {
                                HStack {
                                    Text(product.displayName)
                                        .font(.body)

                                    Spacer()

                                    Text(product.displayPrice)
                                        .font(.body)
                                        .fontWeight(.semibold)
                                }
                                .padding()
                                .background(Color(.systemGray6))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }

                // Error
                if let error = viewModel.error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal)
                }

                Spacer(minLength: 40)
            }
        }
        .navigationTitle("Donate")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadProducts()
        }
    }
}
