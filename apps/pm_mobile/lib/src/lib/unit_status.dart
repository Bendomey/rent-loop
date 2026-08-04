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

/// Maps the real unit `payment_frequency` field (WEEKLY/DAILY/MONTHLY/
/// QUARTERLY/BIANNUALLY/ANNUALLY) to a display label.
String paymentFrequencyLabel(String frequency) => switch (frequency) {
  'WEEKLY' => 'Weekly',
  'DAILY' => 'Daily',
  'MONTHLY' => 'Monthly',
  'QUARTERLY' => 'Quarterly',
  'BIANNUALLY' => 'Biannually',
  'ANNUALLY' => 'Annually',
  _ => frequency,
};
