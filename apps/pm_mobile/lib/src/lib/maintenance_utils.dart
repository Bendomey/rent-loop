/// Bidirectional label <-> API-enum-value mapping for maintenance request
/// status/priority/category/visibility. The board and detail work in display
/// labels; API calls use the backend's enum strings (e.g. "CANCELED" — single
/// L — "EMERGENCY", "SAFETY_FIRE"). Priority, category and visibility labels
/// come from [repair_labels.dart] so the add form, board and detail agree.
library;

import 'package:rentloop_manager/src/lib/repair_labels.dart';

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

final _kPriorityToApi = {for (final p in repairPriorities) p.$2: p.$1};

final _kApiToPriority = {for (final p in repairPriorities) p.$1: p.$2};

/// Lowest to highest, as the board's priority filter lists them.
final kMaintenancePriorityLabels = [
  for (final p in repairPriorities.reversed) p.$2,
];

const kUrgentPriorityLabel = 'Urgent';

String mrPriorityApiValue(String label) => _kPriorityToApi[label] ?? label;

String mrPriorityLabelFromApi(String apiValue) =>
    _kApiToPriority[apiValue] ?? apiValue;

final kMaintenanceCategoryLabels = [for (final c in repairCategories) c.$2];

final _kCategoryToApi = {for (final c in repairCategories) c.$2: c.$1};

final _kApiToCategory = {for (final c in repairCategories) c.$1: c.$2};

String mrCategoryApiValue(String label) => _kCategoryToApi[label] ?? label;

String mrCategoryLabelFromApi(String apiValue) =>
    _kApiToCategory[apiValue] ?? apiValue;

final _kVisibilityToApi = {for (final v in repairVisibilities) v.$2: v.$1};

final _kApiToVisibility = {for (final v in repairVisibilities) v.$1: v.$2};

String mrVisibilityApiValue(String label) => _kVisibilityToApi[label] ?? label;

String mrVisibilityLabelFromApi(String apiValue) =>
    _kApiToVisibility[apiValue] ?? apiValue;
