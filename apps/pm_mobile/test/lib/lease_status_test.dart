import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/lease_status.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';

LeaseModel _lease({
  String? moveInDate,
  String? moveOutDate,
  String? createdAt,
  int? stayDuration,
  String? stayDurationFrequency,
}) {
  return LeaseModel(
    id: 'l1',
    code: 'CODE1',
    status: 'Lease.Status.Active',
    unitId: 'u1',
    tenantId: 't1',
    rentFee: 300000,
    rentFeeCurrency: 'GHS',
    moveInDate: moveInDate,
    moveOutDate: moveOutDate,
    createdAt: createdAt,
    stayDuration: stayDuration,
    stayDurationFrequency: stayDurationFrequency,
  );
}

void main() {
  group('leaseTermProgress', () {
    test(
      'reports ~50% elapsed and correct days left for a 100-day lease at day 50',
      () {
        final now = DateTime.now();
        final lease = _lease(
          moveInDate: now.subtract(const Duration(days: 50)).toIso8601String(),
          moveOutDate: now.add(const Duration(days: 50)).toIso8601String(),
          stayDuration: 3,
          stayDurationFrequency: 'MONTHS',
        );

        final progress = leaseTermProgress(lease);

        expect(progress.percent, closeTo(50, 2));
        expect(progress.daysLeft, closeTo(50, 1));
        expect(progress.monthsTotal, 3);
      },
    );

    test('clamps percent to 100 once past the move-out date', () {
      final now = DateTime.now();
      final lease = _lease(
        moveInDate: now.subtract(const Duration(days: 200)).toIso8601String(),
        moveOutDate: now.subtract(const Duration(days: 10)).toIso8601String(),
      );

      final progress = leaseTermProgress(lease);

      expect(progress.percent, 100.0);
      expect(progress.daysLeft, lessThan(0));
    });

    test(
      'derives monthsTotal from the date span when stay_duration is not month-based',
      () {
        final now = DateTime.now();
        final lease = _lease(
          moveInDate: now.subtract(const Duration(days: 30)).toIso8601String(),
          moveOutDate: now.add(const Duration(days: 30)).toIso8601String(),
          stayDuration: 60,
          stayDurationFrequency: 'DAYS',
        );

        final progress = leaseTermProgress(lease);

        expect(progress.monthsTotal, greaterThanOrEqualTo(1));
        expect(progress.monthOf, lessThanOrEqualTo(progress.monthsTotal));
      },
    );

    test(
      'falls back to createdAt as the start date when moveInDate is null',
      () {
        final now = DateTime.now();
        final lease = _lease(
          createdAt: now.subtract(const Duration(days: 10)).toIso8601String(),
          moveOutDate: now.add(const Duration(days: 90)).toIso8601String(),
        );

        final progress = leaseTermProgress(lease);

        expect(progress.percent, closeTo(10, 2));
      },
    );
  });
}
