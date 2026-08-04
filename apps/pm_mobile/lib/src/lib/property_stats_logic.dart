import 'package:rentloop_manager/src/repository/models/property_stats_model.dart';

/// Cube returns every measure as a string (even counts/sums) — parses to
/// an int, defaulting missing/unparseable values to 0.
int parseCubeNum(dynamic value) {
  if (value == null) return 0;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString()) ?? 0;
}

/// [now]'s calendar month as an ISO 'YYYY-MM-DD' date range, used to scope
/// the Cube Invoices.paidAt query to "this month" without depending on
/// Cube's relative-range handling — Cube's relative "last N months" range
/// excludes the current, in-progress month (see apps/property-manager's
/// PropertySectionCards for the same precedent on web).
List<String> currentMonthDateRange(DateTime now) {
  final start = DateTime(now.year, now.month, 1);
  final end = DateTime(now.year, now.month + 1, 0);
  String iso(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
  return [iso(start), iso(end)];
}

/// Combines the raw `data` rows from 5 separate Cube `/load` queries
/// (Units, Invoices, Leases, Bookings, TenantApplications — each scoped to
/// one property) into a single [PropertyStats]. Every list is empty rather
/// than null when Cube has no matching rows (e.g. a property with zero
/// units, or zero paid invoices this month) — that must default every
/// field to 0, not throw.
PropertyStats computePropertyStats({
  required List<Map<String, dynamic>> unitsRows,
  required List<Map<String, dynamic>> invoiceRows,
  required List<Map<String, dynamic>> leaseRows,
  required List<Map<String, dynamic>> bookingRows,
  required List<Map<String, dynamic>> applicationRows,
}) {
  final unitsRow = unitsRows.isNotEmpty ? unitsRows.first : const {};
  final invoiceRow = invoiceRows.isNotEmpty ? invoiceRows.first : const {};
  final leaseRow = leaseRows.isNotEmpty ? leaseRows.first : const {};
  final bookingRow = bookingRows.isNotEmpty ? bookingRows.first : const {};
  final applicationRow = applicationRows.isNotEmpty
      ? applicationRows.first
      : const {};

  return PropertyStats(
    unitsTotal: parseCubeNum(unitsRow['Units.count']),
    unitsOccupied: parseCubeNum(unitsRow['Units.occupiedCount']),
    unitsAvailable: parseCubeNum(unitsRow['Units.availableCount']),
    unitsMaintenance: parseCubeNum(unitsRow['Units.maintenanceCount']),
    unitsDraft: parseCubeNum(unitsRow['Units.draftCount']),
    unitsPartiallyOccupied: parseCubeNum(
      unitsRow['Units.partiallyOccupiedCount'],
    ),
    monthlyRevenuePesewas: parseCubeNum(invoiceRow['Invoices.paidAmount']),
    activeLeases: parseCubeNum(leaseRow['Leases.activeCount']),
    activeBookings:
        parseCubeNum(bookingRow['Bookings.confirmedCount']) +
        parseCubeNum(bookingRow['Bookings.checkedInCount']),
    pendingApplications: parseCubeNum(
      applicationRow['TenantApplications.inProgressCount'],
    ),
  );
}
