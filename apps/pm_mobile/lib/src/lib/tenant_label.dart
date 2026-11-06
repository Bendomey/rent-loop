import 'package:rentloop_manager/src/repository/models/tenant_model.dart';

/// "Unit 4B · Cantonments Court", or null when the tenant has no unit.
String? tenantUnitLabel(TenantLeaseRef? lease) {
  final unit = lease?.unit;
  if (unit == null) return null;
  final label = [
    unit.name,
    unit.property?.name,
  ].whereType<String>().where((v) => v.isNotEmpty).join(' · ');
  return label.isEmpty ? null : label;
}
