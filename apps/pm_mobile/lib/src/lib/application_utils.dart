import 'package:rentloop_manager/src/lib/property_roles.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

/// Tenant application enum ↔ display label mapping. Screens never handle raw
/// dotted API values; the api layer converts labels back on the way out. Same
/// split as `maintenance_utils.dart`.

const String _inProgress = 'TenantApplication.Status.InProgress';
const String _completed = 'TenantApplication.Status.Completed';
const String _cancelled = 'TenantApplication.Status.Cancelled';

/// Status filter options, in the order the web controller lists them.
const List<String> kApplicationStatusLabels = [
  'In Progress',
  'Cancelled',
  'Completed',
];

const List<String> kApplicationGenderLabels = ['Male', 'Female'];

const List<String> kApplicationMaritalStatusLabels = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
];

String applicationStatusLabel(String? apiValue) => switch (apiValue) {
  _inProgress => 'In Progress',
  _completed => 'Completed',
  _cancelled => 'Cancelled',
  _ => 'Unknown',
};

String applicationStatusApiValue(String label) => switch (label) {
  'In Progress' => _inProgress,
  'Completed' => _completed,
  'Cancelled' => _cancelled,
  _ => label,
};

String applicationGenderApiValue(String label) => label.toUpperCase();

String applicationMaritalStatusApiValue(String label) => label.toUpperCase();

/// Only a still-in-progress application shows a completeness bar — a completed
/// one is complete by definition and a cancelled one is moot.
bool isApplicationPending(String? apiValue) => apiValue == _inProgress;

bool canEditApplication(TenantApplicationModel a, Map<String, String>? roles) =>
    isApplicationPending(a.status) && canManageProperty(roles, a.propertyId);

const List<String> kApplicationIdTypeLabels = [
  'Ghana Card',
  'National ID',
  'Passport',
  "Driver's licence",
];

String _capitalise(String s) =>
    s.isEmpty ? s : s[0].toUpperCase() + s.substring(1).toLowerCase();

String? applicationGenderLabel(String? apiValue) =>
    apiValue == null || apiValue.isEmpty ? null : _capitalise(apiValue);

String? applicationMaritalStatusLabel(String? apiValue) =>
    apiValue == null || apiValue.isEmpty ? null : _capitalise(apiValue);

String applicationIdTypeApiValue(String label) => switch (label) {
  'Ghana Card' => 'GHANA_CARD',
  'National ID' => 'NATIONAL_ID',
  'Passport' => 'PASSPORT',
  "Driver's licence" => 'DRIVER_LICENSE',
  _ => label,
};

String? applicationIdTypeLabel(String? apiValue) => switch (apiValue) {
  'GHANA_CARD' => 'Ghana Card',
  'NATIONAL_ID' => 'National ID',
  'PASSPORT' => 'Passport',
  'DRIVER_LICENSE' => "Driver's licence",
  _ => null,
};
