/// Placeholder data for the parts of My Account that have no API yet: the
/// email-verified badge and the password last-changed date. Sessions are live
/// — see api/session_api.dart and providers/sessions_provider.dart.
/// Replace each of these with real data when the corresponding endpoints
/// land — nothing here is wired to the backend.
///
/// Three actions are deliberately not built yet — two-factor auth, email
/// updates and account deletion. Their controls stay visible and show a
/// "coming soon" toast instead of opening anything, matching the web
/// portal (apps/property-manager Settings › My Account).
library;

const bool kPlaceholderEmailVerified = true;
const String kPlaceholderPasswordChanged = '4 Mar 2026';
