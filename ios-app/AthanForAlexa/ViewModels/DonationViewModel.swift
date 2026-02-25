import Foundation
import StoreKit

/// ViewModel for the donation screen.
@Observable
final class DonationViewModel {

    private let donationService: DonationService

    var products: [Product] { donationService.products }
    var isLoading: Bool { donationService.isLoading }
    var hasRecentDonation: Bool { donationService.hasRecentDonation }
    var error: String?

    init(donationService: DonationService) {
        self.donationService = donationService
    }

    func loadProducts() async {
        await donationService.loadProducts()
    }

    func purchase(_ product: Product) async {
        error = nil
        do {
            try await donationService.purchase(product)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
