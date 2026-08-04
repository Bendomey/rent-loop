/// Extracts the display label from a dotted API status string, e.g.
/// "Property.Status.Active" -> "Active". Mirrors the last-dot-segment
/// matching convention in workspace_resolution.dart, applied here purely
/// for display (statusTone() does the actual tone lookup on the result).
String propertyStatusLabel(String status) => status.split('.').last;

/// Maps the real property `type` field (only SINGLE/MULTI exist on the
/// API today) to a user-facing label.
String propertyTypeLabel(String type) => switch (type) {
  'SINGLE' => 'Single unit',
  'MULTI' => 'Multi unit',
  _ => type,
};
