import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/unit_status.dart';

void main() {
  group('unitTypeLabel', () {
    test('maps known type codes to display labels', () {
      expect(unitTypeLabel('APARTMENT'), 'Apartment');
      expect(unitTypeLabel('HOUSE'), 'House');
      expect(unitTypeLabel('STUDIO'), 'Studio');
      expect(unitTypeLabel('OFFICE'), 'Office');
      expect(unitTypeLabel('RETAIL'), 'Retail');
    });

    test('falls back to the raw value for an unknown type', () {
      expect(unitTypeLabel('OTHER'), 'OTHER');
    });
  });

  group('shouldShowSeeAllUnits', () {
    test('is false at or below the 5-unit preview size', () {
      expect(shouldShowSeeAllUnits(0), isFalse);
      expect(shouldShowSeeAllUnits(5), isFalse);
    });

    test('is true once there is at least one more unit beyond the preview', () {
      expect(shouldShowSeeAllUnits(6), isTrue);
      expect(shouldShowSeeAllUnits(50), isTrue);
    });
  });
}
