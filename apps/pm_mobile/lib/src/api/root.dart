import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'package:rentloop_manager/src/constants.dart';
import 'package:rentloop_manager/src/lib/auth_event_bus.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

abstract class AbstractApi {
  final TokenManager tokenManager;
  final http.Client _client;

  AbstractApi({required this.tokenManager, http.Client? client})
    : _client = client ?? sharedClient;

  /// One client for the whole app: the top-level `http.get`/`http.post`
  /// helpers open a fresh connection per call, so sharing one here also buys
  /// connection reuse. Assignable so tests can substitute a fake.
  static http.Client sharedClient = http.Client();

  /// The in-flight refresh, shared by EVERY AbstractApi instance.
  ///
  /// Static on purpose. There is one AbstractApi per API class (~16 of them),
  /// so an instance field would mean one refresh per class: a screen loading
  /// properties, leases and invoices at once would present the same rotated
  /// token three times, which the backend correctly treats as theft and
  /// answers by revoking the entire session.
  static Future<bool>? _refreshInFlight;

  @visibleForTesting
  static void debugResetRefreshState() => _refreshInFlight = null;

  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    final response = await _send(
      method: method,
      path: path,
      body: body,
      authRequired: authRequired,
    );

    // A 401 on a request that carried a token means that token is spent —
    // the expected state once an hour. Rotate and replay before giving up.
    if (response.statusCode == 401 && authRequired) {
      final refreshed = await _refreshOnce();

      if (refreshed) {
        final retry = await _send(
          method: method,
          path: path,
          body: body,
          authRequired: authRequired,
        );
        if (retry.statusCode >= 400) {
          // A second 401 after a good refresh means the token is genuinely
          // rejected, not stale. Retry exactly once; never loop.
          if (retry.statusCode == 401) {
            AuthEventBus.instance.notifyUnauthorized();
          }
          throw ApiException(retry.statusCode, retry.body);
        }
        return retry;
      }

      // Refresh failed: the session is over.
      AuthEventBus.instance.notifyUnauthorized();
      throw ApiException(response.statusCode, response.body);
    }

    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }

    return response;
  }

  /// Coordinates all concurrent refresh attempts onto ONE request.
  Future<bool> _refreshOnce() =>
      _refreshInFlight ??= _performRefresh().whenComplete(() {
        _refreshInFlight = null;
      });

  Future<bool> _performRefresh() async {
    final refreshToken = await tokenManager.getRefresh();
    if (refreshToken == null) return false;

    try {
      // authRequired: false — this call IS the credential, and routing it
      // through the 401 branch above would recurse.
      final response = await _send(
        method: 'POST',
        path: '/api/v1/admin/users/refresh',
        body: {'refresh_token': refreshToken},
        authRequired: false,
      );
      if (response.statusCode >= 400) return false;

      final data =
          (jsonDecode(response.body) as Map<String, dynamic>)['data']
              as Map<String, dynamic>;
      await tokenManager.save(data['token'] as String);
      await tokenManager.saveRefresh(data['refresh_token'] as String);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<http.Response> _send({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    required bool authRequired,
  }) async {
    final uri = Uri.parse('$kApiBaseUrl$path');
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (authRequired) {
      final token = await tokenManager.get();
      if (token == null) throw Exception('Unauthenticated');
      headers['Authorization'] = 'Bearer $token';
    }

    final encodedBody = body != null ? jsonEncode(body) : null;

    switch (method.toUpperCase()) {
      case 'GET':
        return _client.get(uri, headers: headers);
      case 'POST':
        return _client.post(uri, headers: headers, body: encodedBody);
      case 'PATCH':
        return _client.patch(uri, headers: headers, body: encodedBody);
      case 'PUT':
        return _client.put(uri, headers: headers, body: encodedBody);
      case 'DELETE':
        return _client.delete(uri, headers: headers, body: encodedBody);
      default:
        throw Exception('Unsupported HTTP method: $method');
    }
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String body;

  ApiException(this.statusCode, this.body);

  String? get message {
    try {
      final json = jsonDecode(body);
      return json['errors']?['message'] as String?;
    } catch (_) {
      return null;
    }
  }

  @override
  String toString() => 'ApiException($statusCode): ${message ?? body}';
}
