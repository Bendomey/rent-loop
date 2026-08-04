import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/activity_counts_logic.dart';

void main() {
  group('computeActivityCounts', () {
    test('sums the open maintenance statuses and ignores the closed ones', () {
      final counts = computeActivityCounts(
        maintenanceRows: [
          {
            // Cube returns every measure as a string, even counts.
            'MaintenanceRequests.newCount': '4',
            'MaintenanceRequests.inProgressCount': '6',
            'MaintenanceRequests.inReviewCount': '2',
            // Present in the payload but must not be counted.
            'MaintenanceRequests.resolvedCount': '900',
            'MaintenanceRequests.canceledCount': '31',
          },
        ],
        applicationRows: [
          {'TenantApplications.inProgressCount': '3'},
        ],
        bookingRows: [
          {'Bookings.confirmedCount': '2', 'Bookings.checkedInCount': '3'},
        ],
      );

      expect(counts.maintenance, 12);
      expect(counts.applications, 3);
      expect(counts.bookings, 5);
    });

    test('defaults to zero for a workspace Cube returns no rows for', () {
      // Also the shape a user with no property access gets back: the cube
      // scopes them to nothing, so every measure comes back empty.
      final counts = computeActivityCounts(
        maintenanceRows: const [],
        applicationRows: const [],
        bookingRows: const [],
      );

      expect(counts.maintenance, 0);
      expect(counts.applications, 0);
      expect(counts.bookings, 0);
    });

    test('treats missing and null measures as zero rather than throwing', () {
      final counts = computeActivityCounts(
        maintenanceRows: [
          {
            'MaintenanceRequests.newCount': null,
            'MaintenanceRequests.inProgressCount': 7,
            // inReviewCount absent entirely
          },
        ],
        applicationRows: [const {}],
        bookingRows: [
          {'Bookings.confirmedCount': 'not-a-number'},
        ],
      );

      expect(counts.maintenance, 7);
      expect(counts.applications, 0);
      expect(counts.bookings, 0);
    });
  });
}
