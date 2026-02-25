import Foundation
import StoreKit

/// Handles in-app donations via StoreKit 2 consumable products.
@Observable
final class DonationService {

    /// Product identifiers for donation tiers.
    static let productIds: Set<String> = [
        "com.athanforalexa.donate.1",
        "com.athanforalexa.donate.5",
        "com.athanforalexa.donate.10",
        "com.athanforalexa.donate.25"
    ]

    private(set) var products: [Product] = []
    private(set) var isLoading = false
    private(set) var purchaseError: Error?
    private(set) var hasRecentDonation = false

    private var updateListenerTask: Task<Void, Never>?

    init() {
        updateListenerTask = listenForTransactions()
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Load Products

    func loadProducts() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let storeProducts = try await Product.products(for: Self.productIds)
            products = storeProducts.sorted { $0.price < $1.price }
        } catch {
            purchaseError = error
        }
    }

    // MARK: - Purchase

    func purchase(_ product: Product) async throws {
        purchaseError = nil

        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await transaction.finish()
            hasRecentDonation = true

        case .userCancelled:
            break

        case .pending:
            break

        @unknown default:
            break
        }
    }

    // MARK: - Transaction Listener

    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                do {
                    let transaction = try self.checkVerified(result)
                    await transaction.finish()
                } catch {
                    // Verification failed; ignore.
                }
            }
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }
}
