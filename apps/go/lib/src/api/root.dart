import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:rentloop_go/src/constants.dart';
import 'package:rentloop_go/src/lib/token_manager.dart';

abstract class AbstractApi {
  final TokenManager tokenManager;

  AbstractApi({required this.tokenManager});

  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    final uri = Uri.parse('$API_BASE_URL$path');
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (authRequired) {
      final token = await tokenManager.get();
      if (token == null) throw Exception('Unauthenticated');
      headers['Authorization'] = 'Bearer $token';
    }

    final encodedBody = body != null ? jsonEncode(body) : null;

    late http.Response response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await http.get(uri, headers: headers);
      case 'POST':
        response = await http.post(uri, headers: headers, body: encodedBody);
      case 'PATCH':
        response = await http.patch(uri, headers: headers, body: encodedBody);
      case 'DELETE':
        response = await http.delete(uri, headers: headers, body: encodedBody);
      default:
        throw Exception('Unsupported HTTP method: $method');
    }

    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }

    return response;
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
