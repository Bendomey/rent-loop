// ── API ───────────────────────────────────────────────────────────────────────
const String kApiBaseUrl = 'https://api.rentloopapp.com';

const String kCubeApiUrl = 'https://rentloop-cube.fly.dev';

// R2 image upload proxy — hosted by the property-manager web app (not
// services/main), same endpoint apps/go's tenant app already uploads
// through. Unauthenticated by design (trusts objectKey/file blindly); this
// mirrors a pattern already shipped in two other apps, not a new surface.
const String kR2UploadUrl = 'https://pm.rentloopapp.com/api/r2/upload';

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

/// A lease's web occupancy page — used as the "use web" deep link for
/// actions mobile deliberately doesn't build a native flow for (starting a
/// new document, editing one in the Lexical editor). Landing there rather
/// than a deeper document-specific route since "start a new document" is a
/// dialog on this same page, not its own URL.
Uri leaseOccupancyUrl(
  String propertyId,
  String leaseId, {
  required String campaign,
  required String content,
}) => pmUrl(
  '/properties/$propertyId/occupancy/leases/$leaseId',
  campaign: campaign,
  content: content,
);

/// The Lexical document editor — used only as a "use web" deep link, never
/// rendered natively (rich-text editing with embedded signature nodes is a
/// rendering-engine-scale sub-system, out of scope for mobile).
Uri leaseDocumentEditorUrl(
  String propertyId,
  String documentId,
  String leaseId, {
  required String campaign,
  required String content,
}) =>
    Uri.https(kPmHost, '/properties/$propertyId/documents/$documentId/editor', {
      'utm_source': _kUtmSource,
      'utm_medium': _kUtmMedium,
      'utm_campaign': campaign,
      'utm_content': content,
      'leaseId': leaseId,
      'returnUrl': '/properties/$propertyId/occupancy/leases/$leaseId',
    });

/// The document's signing page — where the manager (or tenant, via their
/// own token link) reviews the full rendered document before signing.
/// Offered as a "review before you sign" link alongside mobile's native
/// signature pad, since mobile can't render the document content itself.
Uri leaseDocumentSigningUrl(
  String propertyId,
  String documentId,
  String leaseId, {
  required String campaign,
  required String content,
}) => Uri.https(
  kPmHost,
  '/properties/$propertyId/documents/$documentId/signing',
  {
    'utm_source': _kUtmSource,
    'utm_medium': _kUtmMedium,
    'utm_campaign': campaign,
    'utm_content': content,
    'leaseId': leaseId,
  },
);
