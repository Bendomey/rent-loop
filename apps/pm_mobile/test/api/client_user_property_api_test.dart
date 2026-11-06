import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

class _PagedApi extends ClientUserPropertyApi {
  _PagedApi(this.pages) : super(tokenManager: TokenManager(SecureStorage()));

  final List<List<Map<String, dynamic>>> pages;
  final List<String> paths = [];

  @override
  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    paths.add(path);
    final page = int.parse(
      Uri.parse('https://x$path').queryParameters['page']!,
    );
    return http.Response(
      jsonEncode({
        'data': {
          'rows': pages[page - 1],
          'meta': {
            'total': 3,
            'page': page,
            'page_size': 200,
            'has_next_page': page < pages.length,
            'has_previous_page': page > 1,
          },
        },
      }),
      200,
    );
  }
}

void main() {
  test(
    'getMyPropertyRoles walks every page into a property-to-role map',
    () async {
      final api = _PagedApi([
        [
          {'property_id': 'p1', 'role': 'MANAGER'},
          {'property_id': 'p2', 'role': 'STAFF'},
        ],
        [
          {'property_id': 'p3', 'role': 'MANAGER'},
        ],
      ]);

      final roles = await api.getMyPropertyRoles(clientId: 'c1');

      expect(roles, {'p1': 'MANAGER', 'p2': 'STAFF', 'p3': 'MANAGER'});
      expect(api.paths, hasLength(2));
      final first = Uri.parse('https://x${api.paths.first}');
      expect(first.path, '/api/v1/admin/clients/c1/properties/me');
      expect(first.queryParameters['page_size'], '200');
      expect(
        Uri.parse('https://x${api.paths.last}').queryParameters['page'],
        '2',
      );
    },
  );
}
