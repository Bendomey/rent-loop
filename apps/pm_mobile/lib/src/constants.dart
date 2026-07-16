// ── API ───────────────────────────────────────────────────────────────────────
const String kApiBaseUrl = 'https://api.rentloopapp.com';

// ── External web destinations ─────────────────────────────────────────────────
// All deep links from the mobile app carry UTM parameters so analytics can
// attribute which screen and CTA drove the traffic.
const String kPmHost = 'pm.rentloopapp.com';

// UTM source shared by every link originating from this app.
const String _kUtmSource = 'manager_app';
const String _kUtmMedium = 'mobile';

Uri pmUrl(String path, {required String campaign, required String content}) =>
    Uri.https(kPmHost, path, {
      'utm_source': _kUtmSource,
      'utm_medium': _kUtmMedium,
      'utm_campaign': campaign,
      'utm_content': content,
    });

// Convenience builders for each known destination.
Uri applyUrl({required String campaign, required String content}) =>
    pmUrl('/apply', campaign: campaign, content: content);

Uri forgotPasswordUrl({required String campaign, required String content}) =>
    pmUrl('/forgot-your-password', campaign: campaign, content: content);
