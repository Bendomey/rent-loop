import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/lib/property_create_mappers.dart';

void main() {
  group('mapPropertyType', () {
    test('maps UI labels to API values', () {
      expect(mapPropertyType('Single Unit'), 'SINGLE');
      expect(mapPropertyType('Multi-Unit'), 'MULTI');
    });
  });

  group('mapPropertyStatus', () {
    test('maps UI labels to dotted API values', () {
      expect(mapPropertyStatus('Active'), 'Property.Status.Active');
      expect(mapPropertyStatus('Inactive'), 'Property.Status.Inactive');
      expect(mapPropertyStatus('Maintenance'), 'Property.Status.Maintenance');
    });
  });

  group('mapRentalModes', () {
    test('maps UI labels to a modes list', () {
      expect(mapRentalModes('Long-term (Leases)'), ['LEASE']);
      expect(mapRentalModes('Short-term (Bookings)'), ['BOOKING']);
      expect(mapRentalModes('Both'), ['LEASE', 'BOOKING']);
    });
  });
}
