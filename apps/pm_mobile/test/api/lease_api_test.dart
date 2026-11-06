import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/lease_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

class _RecordingApi extends LeaseApi {
  _RecordingApi() : super(tokenManager: TokenManager(SecureStorage()));

  final List<String> paths = [];

  @override
  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    paths.add(path);
    return http.Response(jsonEncode({'data': <String, dynamic>{}}), 200);
  }
}

void main() {
  test('getLease no longer preloads the removed invoice relation', () async {
    final api = _RecordingApi();
    try {
      await api.getLease(clientId: 'c1', propertyId: 'p1', leaseId: 'l1');
    } catch (_) {}

    final populate = Uri.parse(
      'https://x${api.paths.single}',
    ).queryParameters['populate']!;
    expect(populate, isNot(contains('ApplicationPaymentInvoice')));
    expect(populate, contains('TenantApplication'));
  });
}
