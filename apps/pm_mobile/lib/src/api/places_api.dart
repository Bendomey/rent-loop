import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'places_api.g.dart';

class PlacePrediction {
  const PlacePrediction({required this.placeId, required this.description});
  final String placeId;
  final String description;
}

/// City/region/country/lat/lng resolved from a Place Details lookup. The
/// human-readable address line itself comes from the prediction's own
/// `description` (what the user actually selected), not reconstructed here.
class ResolvedPlace {
  const ResolvedPlace({
    required this.city,
    required this.region,
    required this.country,
    required this.latitude,
    required this.longitude,
  });
  final String city;
  final String region;
  final String country;
  final double latitude;
  final double longitude;
}

/// Pulled out as a top-level function (rather than inline in [PlacesApi])
/// so it's testable without a network call — mirrors this app's convention
/// of unit-testing pure response-parsing logic (e.g.
/// `property_stats_logic_test.dart`'s `computePropertyStats`).
List<PlacePrediction> parseAutocompletePredictions(Map<String, dynamic> json) {
  if (json['status'] != 'OK') return [];
  final predictions = (json['predictions'] as List<dynamic>?) ?? [];
  return predictions
      .cast<Map<String, dynamic>>()
      .map(
        (p) => PlacePrediction(
          placeId: p['place_id'] as String,
          description: p['description'] as String,
        ),
      )
      .toList();
}

String? _findComponent(List<dynamic> components, String type) {
  for (final c in components.cast<Map<String, dynamic>>()) {
    final types = (c['types'] as List<dynamic>?)?.cast<String>() ?? [];
    if (types.contains(type)) return c['long_name'] as String?;
  }
  return null;
}

ResolvedPlace? parsePlaceDetails(Map<String, dynamic> json) {
  if (json['status'] != 'OK') return null;
  final result = json['result'] as Map<String, dynamic>?;
  if (result == null) return null;

  final components = (result['address_components'] as List<dynamic>?) ?? [];
  final city =
      _findComponent(components, 'locality') ??
      _findComponent(components, 'administrative_area_level_2');
  final region = _findComponent(components, 'administrative_area_level_1');
  final country = _findComponent(components, 'country');

  final location =
      (result['geometry'] as Map<String, dynamic>?)?['location']
          as Map<String, dynamic>?;
  final lat = (location?['lat'] as num?)?.toDouble();
  final lng = (location?['lng'] as num?)?.toDouble();

  if (city == null ||
      region == null ||
      country == null ||
      lat == null ||
      lng == null) {
    return null;
  }
  return ResolvedPlace(
    city: city,
    region: region,
    country: country,
    latitude: lat,
    longitude: lng,
  );
}

/// Direct REST calls to the Google Places Web Service — deliberately not a
/// native Maps/Places SDK, so no iOS/Android platform config is needed,
/// matching this app's existing lean dependency footprint. Not an
/// `AbstractApi` subclass: this hits an unauthenticated (key-based) third
/// party, not this app's own backend.
class PlacesApi {
  const PlacesApi();

  Future<List<PlacePrediction>> autocomplete(String input) async {
    if (input.trim().isEmpty) return [];
    final uri =
        Uri.https('maps.googleapis.com', '/maps/api/place/autocomplete/json', {
          'input': input,
          'components': 'country:gh',
          'key': dotenv.env['GOOGLE_PLACES_API_KEY'] ?? '',
        });
    try {
      final response = await http.get(uri);
      if (response.statusCode != 200) return [];
      return parseAutocompletePredictions(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    } catch (_) {
      return [];
    }
  }

  Future<ResolvedPlace?> details(String placeId) async {
    final uri =
        Uri.https('maps.googleapis.com', '/maps/api/place/details/json', {
          'place_id': placeId,
          'fields': 'address_component,geometry',
          'key': dotenv.env['GOOGLE_PLACES_API_KEY'] ?? '',
        });
    try {
      final response = await http.get(uri);
      if (response.statusCode != 200) return null;
      return parsePlaceDetails(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    } catch (_) {
      return null;
    }
  }
}

@riverpod
PlacesApi placesApi(PlacesApiRef ref) => const PlacesApi();
