import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/repository/models/property_stats_model.dart';

void main() {
  group('PropertyStats.occupancyPercent', () {
    test('computes the occupied fraction as a percentage', () {
      const stats = PropertyStats(unitsTotal: 20, unitsOccupied: 15);
      expect(stats.occupancyPercent, 75);
    });

    test('is 0 when there are no units, not a division-by-zero error', () {
      const stats = PropertyStats();
      expect(stats.occupancyPercent, 0);
    });
  });

  test('defaults every field to 0 when unset', () {
    const stats = PropertyStats();
    expect(stats.unitsTotal, 0);
    expect(stats.unitsOccupied, 0);
    expect(stats.unitsAvailable, 0);
    expect(stats.unitsMaintenance, 0);
    expect(stats.unitsDraft, 0);
    expect(stats.unitsPartiallyOccupied, 0);
    expect(stats.monthlyRevenuePesewas, 0);
    expect(stats.activeLeases, 0);
    expect(stats.activeBookings, 0);
    expect(stats.pendingApplications, 0);
  });
}
