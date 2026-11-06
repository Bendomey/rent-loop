import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/payment_account_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

class _RecordingApi extends PaymentAccountApi {
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
    return http.Response(
      jsonEncode({
        'data': {
          'rows': [
            {
              'id': 'pa1',
              'rail': 'OFFLINE',
              'provider': 'CASH',
              'identifier': null,
              'status': 'ACTIVE',
              'is_default': true,
            },
          ],
          'meta': {
            'total': 1,
            'page': 1,
            'page_size': 50,
            'has_next_page': false,
            'has_previous_page': false,
          },
        },
      }),
      200,
    );
  }
}

void main() {
  test('getCollectionAccounts asks for owner and system accounts', () async {
    final api = _RecordingApi();
    final page = await api.getCollectionAccounts(clientId: 'c1');

    final uri = Uri.parse('https://x${api.paths.single}');
    expect(uri.path, '/api/v1/admin/clients/c1/payment-accounts');
    expect(uri.queryParametersAll['owner_types'], ['PROPERTY_OWNER', 'SYSTEM']);
    expect(uri.queryParameters['page_size'], '50');
    expect(uri.queryParameters['rail'], 'OFFLINE');
    expect(uri.queryParameters['status'], 'ACTIVE');

    final account = page.rows.single;
    expect(account.rail, 'OFFLINE');
    expect(account.provider, 'CASH');
    expect(account.identifier, isNull);
    expect(account.status, 'ACTIVE');
    expect(account.isDefault, isTrue);
  });
}
