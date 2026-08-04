import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/property_stats_logic.dart';

void main() {
  group('parseCubeNum', () {
    test('parses a Cube-style string measure', () {
      expect(parseCubeNum('42'), 42);
    });

    test('parses a numeric value as-is', () {
      expect(parseCubeNum(7), 7);
    });

    test('defaults null to 0', () {
      expect(parseCubeNum(null), 0);
    });

    test('defaults an unparseable string to 0', () {
      expect(parseCubeNum('not-a-number'), 0);
    });
  });

  group('currentMonthDateRange', () {
    test('returns the first and last day of the given month', () {
      final range = currentMonthDateRange(DateTime(2026, 2, 15));
      expect(range, ['2026-02-01', '2026-02-28']);
    });

    test('handles a leap-year February', () {
      final range = currentMonthDateRange(DateTime(2028, 2, 10));
      expect(range, ['2028-02-01', '2028-02-29']);
    });

    test('handles a December-to-January month-end rollover', () {
      final range = currentMonthDateRange(DateTime(2026, 12, 25));
      expect(range, ['2026-12-01', '2026-12-31']);
    });
  });

  group('computePropertyStats', () {
    test('parses a full set of Cube rows into PropertyStats', () {
      final stats = computePropertyStats(
        unitsRows: [
          {
            'Units.count': '24',
            'Units.occupiedCount': '20',
            'Units.availableCount': '3',
            'Units.maintenanceCount': '1',
            'Units.draftCount': '0',
            'Units.partiallyOccupiedCount': '0',
          },
        ],
        invoiceRows: [
          {'Invoices.paidAmount': '8600000'},
        ],
        leaseRows: [
          {'Leases.activeCount': '20'},
        ],
        bookingRows: [
          {'Bookings.confirmedCount': '3', 'Bookings.checkedInCount': '1'},
        ],
        applicationRows: [
          {'TenantApplications.inProgressCount': '2'},
        ],
      );

      expect(stats.unitsTotal, 24);
      expect(stats.unitsOccupied, 20);
      expect(stats.unitsAvailable, 3);
      expect(stats.unitsMaintenance, 1);
      expect(stats.unitsDraft, 0);
      expect(stats.unitsPartiallyOccupied, 0);
      expect(stats.monthlyRevenuePesewas, 8600000);
      expect(stats.activeLeases, 20);
      expect(stats.activeBookings, 4);
      expect(stats.pendingApplications, 2);
    });

    test('defaults every field to 0 when Cube returns no rows', () {
      final stats = computePropertyStats(
        unitsRows: const [],
        invoiceRows: const [],
        leaseRows: const [],
        bookingRows: const [],
        applicationRows: const [],
      );

      expect(stats.unitsTotal, 0);
      expect(stats.monthlyRevenuePesewas, 0);
      expect(stats.activeBookings, 0);
      expect(stats.pendingApplications, 0);
    });
  });
}
