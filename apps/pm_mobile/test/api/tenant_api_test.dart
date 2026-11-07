import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/tenant_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

class _RecordingApi extends TenantApi {
  _RecordingApi() : super(tokenManager: TokenManager(SecureStorage()));

  String? method;
  String? path;

  @override
  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    this.method = method;
    this.path = path;
    final tenant = {
      'id': 't1',
      'first_name': 'Ama',
      'last_name': 'Mensah',
      'phone': '0244551190',
      'gender': 'FEMALE',
      'recent_lease': {
        'id': 'l1',
        'status': 'Lease.Status.Active',
        'rent_fee': 120000,
        'rent_fee_currency': 'GHS',
        'unit': {
          'id': 'u1',
          'name': 'Unit 101',
          'type': 'APARTMENT',
          'status': 'Unit.Status.Occupied',
          'rent_fee': 120000,
          'rent_fee_currency': 'GHS',
          'property_id': 'p1',
        },
      },
    };
    if (path.contains('/tenants?')) {
      return http.Response(
        jsonEncode({
          'data': {
            'rows': [tenant],
            'meta': {
              'total': 1,
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
    return http.Response(jsonEncode({'data': tenant}), 200);
  }
}

void main() {
  test('getTenant calls the property-scoped tenant endpoint', () async {
    final api = _RecordingApi();
    final t = await api.getTenant(
      clientId: 'c1',
      propertyId: 'p1',
      tenantId: 't1',
    );
    expect(api.method, 'GET');
    final uri = Uri.parse(api.path!);
    expect(uri.path, '/api/v1/admin/clients/c1/properties/p1/tenants/t1');
    expect(uri.queryParameters['populate'], 'Leases.Unit.Property');
    expect(t.recentLease?.id, 'l1');
    expect(t.recentLease?.unit?.propertyId, 'p1');
  });

  test('getTenants populates the lease unit and property', () async {
    final api = _RecordingApi();
    final page = await api.getTenants(clientId: 'c1', propertyId: 'p1');
    final uri = Uri.parse(api.path!);
    expect(uri.path, '/api/v1/admin/clients/c1/tenants');
    expect(uri.queryParameters['populate'], 'Leases.Unit.Property');
    expect(uri.queryParameters['page'], '1');
    expect(page.rows.single.recentLease?.unit?.propertyId, 'p1');
  });
}
