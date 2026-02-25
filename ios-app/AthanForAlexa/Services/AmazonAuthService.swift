import Foundation
import AuthenticationServices

/// Handles Login with Amazon (LWA) OAuth flow using ASWebAuthenticationSession.
@Observable
final class AmazonAuthService {

    // Replace with your actual LWA client ID for production.
    private let clientId = "amzn1.application-oa2-client.PLACEHOLDER"
    private let redirectScheme = "athanforalexa"
    private let scopes = "alexa::devices:all:address alexa:all_reminders:read_write"

    private(set) var isAuthenticating = false
    private(set) var error: Error?

    struct AuthResult {
        let accessToken: String
        let refreshToken: String?
    }

    /// Start the LWA OAuth flow.
    /// Returns the access token and optional refresh token on success.
    @MainActor
    func authenticate() async throws -> AuthResult {
        isAuthenticating = true
        error = nil

        defer { isAuthenticating = false }

        let authURL = buildAuthURL()

        return try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: redirectScheme
            ) { callbackURL, authError in
                if let authError {
                    continuation.resume(throwing: authError)
                    return
                }

                guard let callbackURL,
                      let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
                      let accessToken = components.queryItems?.first(where: { $0.name == "access_token" })?.value else {
                    continuation.resume(throwing: AuthError.missingToken)
                    return
                }

                let refreshToken = components.queryItems?.first(where: { $0.name == "refresh_token" })?.value

                continuation.resume(returning: AuthResult(
                    accessToken: accessToken,
                    refreshToken: refreshToken
                ))
            }

            session.prefersEphemeralWebBrowserSession = false

            // ASWebAuthenticationSession requires a presentation context anchor on iOS.
            // In SwiftUI, we use a simple anchor that finds the current window scene.
            let anchor = WebAuthPresentationAnchor()
            session.presentationContextProvider = anchor

            if !session.start() {
                continuation.resume(throwing: AuthError.sessionStartFailed)
            }
        }
    }

    private func buildAuthURL() -> URL {
        var components = URLComponents(string: "https://www.amazon.com/ap/oa")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "scope", value: scopes),
            URLQueryItem(name: "response_type", value: "token"),
            URLQueryItem(name: "redirect_uri", value: "\(redirectScheme)://auth")
        ]
        return components.url!
    }

    enum AuthError: LocalizedError {
        case missingToken
        case sessionStartFailed

        var errorDescription: String? {
            switch self {
            case .missingToken: return "No access token received from Amazon."
            case .sessionStartFailed: return "Failed to start authentication session."
            }
        }
    }
}

// MARK: - Presentation Anchor

private final class WebAuthPresentationAnchor: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first else {
            return ASPresentationAnchor()
        }
        return window
    }
}
