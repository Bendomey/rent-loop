import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/places_api.dart';

void main() {
  group('parseAutocompletePredictions', () {
    test('maps predictions from an OK response', () {
      final json = {
        'status': 'OK',
        'predictions': [
          {'place_id': 'p1', 'description': '12 Labone Crescent, Accra, Ghana'},
          {'place_id': 'p2', 'description': 'Labone, Accra, Ghana'},
        ],
      };

      final result = parseAutocompletePredictions(json);

      expect(result.length, 2);
      expect(result[0].placeId, 'p1');
      expect(result[0].description, '12 Labone Crescent, Accra, Ghana');
    });

    test('returns an empty list for ZERO_RESULTS', () {
      final result = parseAutocompletePredictions({
        'status': 'ZERO_RESULTS',
        'predictions': [],
      });
      expect(result, isEmpty);
    });

    test('returns an empty list for a non-OK status', () {
      final result = parseAutocompletePredictions({'status': 'REQUEST_DENIED'});
      expect(result, isEmpty);
    });
  });

  group('parsePlaceDetails', () {
    test('resolves city/region/country/lat/lng from address_components', () {
      final json = {
        'status': 'OK',
        'result': {
          'address_components': [
            {
              'long_name': 'Accra',
              'types': ['locality', 'political'],
            },
            {
              'long_name': 'Greater Accra Region',
              'types': ['administrative_area_level_1', 'political'],
            },
            {
              'long_name': 'Ghana',
              'types': ['country', 'political'],
            },
          ],
          'geometry': {
            'location': {'lat': 5.6037, 'lng': -0.187},
          },
        },
      };

      final result = parsePlaceDetails(json);

      expect(result, isNotNull);
      expect(result!.city, 'Accra');
      expect(result.region, 'Greater Accra Region');
      expect(result.country, 'Ghana');
      expect(result.latitude, 5.6037);
      expect(result.longitude, -0.187);
    });

    test('falls back to administrative_area_level_2 when locality is absent', () {
      final json = {
        'status': 'OK',
        'result': {
          'address_components': [
            {
              'long_name': 'Some District',
              'types': ['administrative_area_level_2', 'political'],
            },
            {
              'long_name': 'Greater Accra Region',
              'types': ['administrative_area_level_1', 'political'],
            },
            {
              'long_name': 'Ghana',
              'types': ['country', 'political'],
            },
          ],
          'geometry': {
            'location': {'lat': 5.6, 'lng': -0.2},
          },
        },
      };

      final result = parsePlaceDetails(json);

      expect(result?.city, 'Some District');
    });

    test('returns null when a required component is missing', () {
      final json = {
        'status': 'OK',
        'result': {
          'address_components': [
            {
              'long_name': 'Ghana',
              'types': ['country', 'political'],
            },
          ],
          'geometry': {
            'location': {'lat': 5.6, 'lng': -0.2},
          },
        },
      };

      expect(parsePlaceDetails(json), isNull);
    });

    test('returns null for a non-OK status', () {
      expect(parsePlaceDetails({'status': 'NOT_FOUND'}), isNull);
    });
  });
}
