import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/constants.dart';

part 'analytics_api.g.dart';

class AnalyticsApi extends AbstractApi {
  AnalyticsApi({required super.tokenManager});

  Future<String> getToken({required String clientId}) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/analytics/token',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return data['token'] as String;
  }
}

@riverpod
AnalyticsApi analyticsApi(AnalyticsApiRef ref) =>
    AnalyticsApi(tokenManager: ref.watch(tokenManagerProvider));

/// Thrown by [CubeApi.load] on a non-2xx response, or on a 200 response
/// that doesn't carry the expected `data` array (Cube.js returns the
/// latter — e.g. `{"error": "Continue wait"}` — while a query is still
/// building; treated as a failure here rather than a retry-able state,
/// since [CubeApi] has no polling loop).
class CubeException implements Exception {
  final int statusCode;
  final String body;

  CubeException(this.statusCode, this.body);

  /// Cube.js error responses look like `{"error": "<message>"}` — a
  /// different shape from the main API's `{"errors": {"message": ...}}`
  /// (see [ApiException]).
  String? get message {
    try {
      final json = jsonDecode(body);
      return json['error'] as String?;
    } catch (_) {
      return null;
    }
  }

  @override
  String toString() => 'CubeException($statusCode): ${message ?? body}';
}

/// Talks directly to the Cube.js REST API — a different host and a
/// different bearer token (the short-lived Cube JWT from
/// [AnalyticsApi.getToken]) than [AbstractApi]'s app-session JWT, so it
/// doesn't extend it.
class CubeApi {
  Future<List<Map<String, dynamic>>> load({
    required String token,
    required Map<String, dynamic> query,
  }) async {
    final uri = Uri.parse('$kCubeApiUrl/cubejs-api/v1/load');
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'query': query}),
    );
    if (response.statusCode >= 400) {
      throw CubeException(response.statusCode, response.body);
    }

    final Map<String, dynamic> json;
    try {
      json = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw CubeException(response.statusCode, response.body);
    }

    final data = json['data'];
    if (data is! List) {
      throw CubeException(response.statusCode, response.body);
    }
    return data.map((e) => e as Map<String, dynamic>).toList();
  }
}

@riverpod
CubeApi cubeApi(CubeApiRef ref) => CubeApi();
