import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';

void main() {
  group('propertyStatusLabel', () {
    test('extracts the last dot segment', () {
      expect(propertyStatusLabel('Property.Status.Active'), 'Active');
      expect(propertyStatusLabel('Property.Status.Maintenance'), 'Maintenance');
      expect(propertyStatusLabel('Property.Status.Inactive'), 'Inactive');
    });

    test('returns the raw value when there is no dot segment', () {
      expect(propertyStatusLabel('Active'), 'Active');
    });
  });

  group('propertyTypeLabel', () {
    test('maps known type codes to display labels', () {
      expect(propertyTypeLabel('SINGLE'), 'Single unit');
      expect(propertyTypeLabel('MULTI'), 'Multi unit');
    });

    test('falls back to the raw value for an unknown type', () {
      expect(propertyTypeLabel('OTHER'), 'OTHER');
    });
  });
}
