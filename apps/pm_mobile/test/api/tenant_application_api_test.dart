import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

/// Captures the request path instead of hitting the network.
///
/// `AbstractApi.execute` is the single choke point every call goes through, so
/// overriding it here needs no production seam and no HTTP mocking. Unlike the
/// maintenance stub, `nextBody` carries a `meta` block — getTenantApplications
/// parses `data['meta']` unconditionally and would throw on a rows-only body.
class _RecordingApi extends TenantApplicationApi {
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
          'rows': <dynamic>[],
          'meta': {
            'total': 0,
            'page': 1,
            'page_size': 20,
            'has_next_page': false,
            'has_previous_page': false,
          },
        },
      }),
      200,
    );
  }
}

/// All query params of the single captured request, values grouped so repeated
/// keys are visible.
Future<Map<String, List<String>>> _capture(
  Future<void> Function(TenantApplicationApi api) call,
) async {
  final api = _RecordingApi();
  await call(api);
  return Uri.parse('https://x${api.paths.single}').queryParametersAll;
}

void main() {
  test(
    'hits the cross-property path with pagination, populate and order',
    () async {
      final api = _RecordingApi();
      await api.getTenantApplications(clientId: 'c1');

      expect(
        api.paths.single,
        startsWith('/api/v1/admin/clients/c1/tenant-applications?'),
      );

      final q = Uri.parse('https://x${api.paths.single}').queryParameters;
      expect(q['page'], '1');
      expect(q['page_size'], '20');
      expect(
        q['populate'],
        'DesiredUnit,ApplicationPaymentInvoice,LeaseAgreementDocument,'
        'LeaseAgreementDocumentSignatures',
      );
      // GenerateQuery reads order/order_by — NOT the web sorter's sort/sort_by.
      expect(q['order'], 'desc');
      expect(q['order_by'], 'created_at');
    },
  );

  test('converts display labels to API enum values', () async {
    final q = await _capture(
      (api) => api.getTenantApplications(
        clientId: 'c1',
        statusLabel: 'In Progress',
        gender: 'Female',
        maritalStatus: 'Widowed',
      ),
    );

    expect(q['status'], ['TenantApplication.Status.InProgress']);
    expect(q['gender'], ['FEMALE']);
    expect(q['marital_status'], ['WIDOWED']);
  });

  test(
    'repeats property_id and desired_unit_id once per selected id',
    () async {
      final q = await _capture(
        (api) => api.getTenantApplications(
          clientId: 'c1',
          propertyIds: ['p1', 'p2'],
          desiredUnitIds: ['u1', 'u2'],
        ),
      );

      expect(q['property_id'], ['p1', 'p2']);
      expect(q['desired_unit_id'], ['u1', 'u2']);
    },
  );

  test('search sends query AND search_fields together', () async {
    final q = await _capture(
      (api) => api.getTenantApplications(clientId: 'c1', search: 'ama'),
    );

    // The backend ignores either without the other.
    expect(q['query'], ['ama']);
    expect(q['search_fields'], ['first_name,last_name,email,phone']);
  });

  test('omitted filters are absent from the query string entirely', () async {
    final q = await _capture(
      (api) => api.getTenantApplications(clientId: 'c1'),
    );

    for (final key in [
      'status',
      'gender',
      'marital_status',
      'property_id',
      'desired_unit_id',
      'query',
      'search_fields',
    ]) {
      expect(q.containsKey(key), isFalse, reason: '$key should be absent');
    }
  });

  test('an empty search string is treated as no search', () async {
    final q = await _capture(
      (api) => api.getTenantApplications(clientId: 'c1', search: ''),
    );

    expect(q.containsKey('query'), isFalse);
    expect(q.containsKey('search_fields'), isFalse);
  });

  test('honours an explicit page and page size', () async {
    final q = await _capture(
      (api) => api.getTenantApplications(clientId: 'c1', page: 3, pageSize: 50),
    );

    expect(q['page'], ['3']);
    expect(q['page_size'], ['50']);
  });
}
