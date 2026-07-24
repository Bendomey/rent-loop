/// Maps the "Add property" wizard's UI type labels to the backend's
/// `type` enum values.
String mapPropertyType(String uiLabel) => switch (uiLabel) {
  'Single Unit' => 'SINGLE',
  'Multi-Unit' => 'MULTI',
  _ => uiLabel,
};

/// Maps the wizard's UI status labels to the backend's full dotted
/// `Property.Status.*` values.
String mapPropertyStatus(String uiLabel) => switch (uiLabel) {
  'Active' => 'Property.Status.Active',
  'Inactive' => 'Property.Status.Inactive',
  'Maintenance' => 'Property.Status.Maintenance',
  _ => uiLabel,
};

/// Maps the wizard's UI rental-mode label to the backend's `modes` array —
/// mirrors the web wizard's `modeSelection` → `modes` expansion exactly
/// ('Both' becomes both values, not a separate enum value).
List<String> mapRentalModes(String uiLabel) => switch (uiLabel) {
  'Long-term (Leases)' => ['LEASE'],
  'Short-term (Bookings)' => ['BOOKING'],
  'Both' => ['LEASE', 'BOOKING'],
  _ => const [],
};
