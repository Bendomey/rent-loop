/// Bidirectional label <-> API-enum-value mapping for maintenance request
/// status/priority/category. The UI (maintenance_board.dart) works entirely
/// in display labels (e.g. "Cancelled", "Emergency", "Safety & Fire"); API
/// calls/responses use the backend's exact enum strings (e.g. "CANCELED" —
/// single L — "EMERGENCY", "SAFETY_FIRE"). All API boundary code goes
/// through these functions so the rest of the app never has to know the
/// difference.
library;

const kMaintenanceStatusOrder = [
  'New',
  'In Progress',
  'In Review',
  'Resolved',
  'Cancelled',
];

const _kStatusToApi = {
  'New': 'NEW',
  'In Progress': 'IN_PROGRESS',
  'In Review': 'IN_REVIEW',
  'Resolved': 'RESOLVED',
  'Cancelled': 'CANCELED',
};

final _kApiToStatus = {for (final e in _kStatusToApi.entries) e.value: e.key};

String mrStatusApiValue(String label) => _kStatusToApi[label] ?? label;

String mrStatusLabel(String apiValue) => _kApiToStatus[apiValue] ?? apiValue;

const _kPriorityToApi = {
  'Low': 'LOW',
  'Medium': 'MEDIUM',
  'High': 'HIGH',
  'Emergency': 'EMERGENCY',
};

final _kApiToPriority = {
  for (final e in _kPriorityToApi.entries) e.value: e.key,
};

String mrPriorityApiValue(String label) => _kPriorityToApi[label] ?? label;

String mrPriorityLabelFromApi(String apiValue) =>
    _kApiToPriority[apiValue] ?? apiValue;

const kMaintenanceCategoryLabels = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Structural',
  'Roofing',
  'Pest Control',
  'Landscaping & Grounds',
  'Locks & Security',
  'Painting',
  'Flooring',
  'Windows & Doors',
  'Safety & Fire',
  'Cleaning',
  'Utilities',
  'Other',
];

const _kCategoryToApi = {
  'Plumbing': 'PLUMBING',
  'Electrical': 'ELECTRICAL',
  'HVAC': 'HVAC',
  'Appliance': 'APPLIANCE',
  'Structural': 'STRUCTURAL',
  'Roofing': 'ROOFING',
  'Pest Control': 'PEST_CONTROL',
  'Landscaping & Grounds': 'LANDSCAPING',
  'Locks & Security': 'LOCKS_SECURITY',
  'Painting': 'PAINTING',
  'Flooring': 'FLOORING',
  'Windows & Doors': 'WINDOWS_DOORS',
  'Safety & Fire': 'SAFETY_FIRE',
  'Cleaning': 'CLEANING',
  'Utilities': 'UTILITIES',
  'Other': 'OTHER',
};

final _kApiToCategory = {
  for (final e in _kCategoryToApi.entries) e.value: e.key,
};

String mrCategoryApiValue(String label) => _kCategoryToApi[label] ?? label;

String mrCategoryLabelFromApi(String apiValue) =>
    _kApiToCategory[apiValue] ?? apiValue;
