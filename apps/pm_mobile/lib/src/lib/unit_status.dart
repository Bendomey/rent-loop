/// Maps the real unit `type` field (APARTMENT/HOUSE/STUDIO/OFFICE/RETAIL —
/// the only values the backend accepts, see services/main's CreateUnitRequest
/// validation) to a display label.
String unitTypeLabel(String type) => switch (type) {
  'APARTMENT' => 'Apartment',
  'HOUSE' => 'House',
  'STUDIO' => 'Studio',
  'OFFICE' => 'Office',
  'RETAIL' => 'Retail',
  _ => type,
};

/// The property detail screen previews the first 5 units — "See all" is
/// only worth showing when there's at least one more unit beyond that.
bool shouldShowSeeAllUnits(int totalUnits) => totalUnits >= 6;
