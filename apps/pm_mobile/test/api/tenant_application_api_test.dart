import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
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
  final List<String> methods = [];
  final List<Map<String, dynamic>?> bodies = [];
  final List<bool> authRequiredFlags = [];
  Object? nextData;
  int nextStatus = 200;

  @override
  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    paths.add(path);
    methods.add(method);
    bodies.add(body);
    authRequiredFlags.add(authRequired);
    if (nextStatus >= 400) throw ApiException(nextStatus, '{}');
    if (nextData != null) {
      return http.Response(jsonEncode({'data': nextData}), nextStatus);
    }
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
        'DesiredUnit,LeaseAgreementDocument,LeaseAgreementDocumentSignatures',
      );
      expect(q['populate'], isNot(contains('ApplicationPaymentInvoice')));
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

  group('writes', () {
    const base = '/api/v1/admin/clients/c1/properties/p1/tenant-applications';
    final app = {'id': 'a1', 'code': 'TA-1'};

    test('getApplication populates the detail relations', () async {
      final api = _RecordingApi()..nextData = app;
      final result = await api.getApplication(
        clientId: 'c1',
        propertyId: 'p1',
        id: 'a1',
      );

      expect(result.id, 'a1');
      expect(api.methods.single, 'GET');
      final uri = Uri.parse('https://x${api.paths.single}');
      expect(uri.path, '$base/a1');
      expect(
        uri.queryParameters['populate'],
        'DesiredUnit,CreatedBy,CreatedBy.User,CompletedBy,CancelledBy,'
        'LeaseAgreementDocument,LeaseAgreementDocumentSignatures',
      );
    });

    test('createApplication posts RFC3339 dob and omits nulls', () async {
      final api = _RecordingApi()..nextData = app;
      final result = await api.createApplication(
        clientId: 'c1',
        propertyId: 'p1',
        input: CreateTenantApplicationInput(
          desiredUnitId: 'u1',
          firstName: 'Ama',
          lastName: 'Mensah',
          phone: '+233241234567',
          gender: 'FEMALE',
          dateOfBirth: DateTime.utc(1990, 1, 2),
        ),
      );

      expect(result.code, 'TA-1');
      expect(api.methods.single, 'POST');
      expect(api.paths.single, base);
      expect(api.bodies.single, {
        'desired_unit_id': 'u1',
        'first_name': 'Ama',
        'last_name': 'Mensah',
        'phone': '+233241234567',
        'gender': 'FEMALE',
        'date_of_birth': '1990-01-02T00:00:00.000Z',
      });
    });

    test(
      'updateApplication sends the patch verbatim, nulls included',
      () async {
        final api = _RecordingApi()..nextData = app;
        await api.updateApplication(
          clientId: 'c1',
          propertyId: 'p1',
          id: 'a1',
          patch: {'other_names': null, 'first_name': 'Ama'},
        );

        expect(api.methods.single, 'PATCH');
        expect(api.paths.single, '$base/a1');
        expect(api.bodies.single, {'other_names': null, 'first_name': 'Ama'});
        expect(api.bodies.single!.containsKey('other_names'), isTrue);
      },
    );

    test('cancelApplication patches the cancel route with a reason', () async {
      final api = _RecordingApi();
      await api.cancelApplication(
        clientId: 'c1',
        propertyId: 'p1',
        id: 'a1',
        reason: 'x',
      );

      expect(api.methods.single, 'PATCH');
      expect(api.paths.single, '$base/a1/cancel');
      expect(api.bodies.single, {'reason': 'x'});
    });

    test('inviteTenant posts unit_id and only the contact given', () async {
      final api = _RecordingApi();
      await api.inviteTenant(
        clientId: 'c1',
        propertyId: 'p1',
        unitId: 'u1',
        phone: '+233241234567',
      );

      expect(api.methods.single, 'POST');
      expect(api.paths.single, '$base/invite');
      expect(api.bodies.single, {'unit_id': 'u1', 'phone': '+233241234567'});
    });
  });

  group('lookupTenantByPhone', () {
    test('is unauthenticated and URL-encodes the plus sign', () async {
      final api = _RecordingApi()
        ..nextData = {
          'id': 't1',
          'first_name': 'Ama',
          'last_name': 'Mensah',
          'phone': '+233241234567',
        };
      final tenant = await api.lookupTenantByPhone('+233241234567');

      expect(tenant?.firstName, 'Ama');
      expect(api.methods.single, 'GET');
      expect(api.paths.single, '/api/v1/tenants/phone/%2B233241234567');
      expect(api.authRequiredFlags.single, isFalse);
    });

    test('returns null on a 404', () async {
      final api = _RecordingApi()..nextStatus = 404;
      expect(await api.lookupTenantByPhone('+233241234567'), isNull);
    });

    test('rethrows other failures', () async {
      final api = _RecordingApi()..nextStatus = 500;
      expect(
        () => api.lookupTenantByPhone('+233241234567'),
        throwsA(isA<ApiException>()),
      );
    });
  });

  group('prepareCharges / approveApplication', () {
    test(
      'prepareCharges posts with no body and returns the account id',
      () async {
        final api = _RecordingApi()..nextData = {'id': 'acct1'};
        final id = await api.prepareCharges(
          clientId: 'c1',
          propertyId: 'p1',
          id: 'app1',
        );

        expect(id, 'acct1');
        expect(api.methods.single, 'POST');
        expect(
          api.paths.single,
          '/api/v1/admin/clients/c1/properties/p1/tenant-applications/app1/charges:prepare',
        );
        expect(api.bodies.single, isNull);
      },
    );

    test(
      'approveApplication patches with no body and parses the lease',
      () async {
        final api = _RecordingApi()
          ..nextData = {
            'id': 'lease1',
            'status': 'Lease.Status.Pending',
            'tenant_id': 'ten1',
          };
        final lease = await api.approveApplication(
          clientId: 'c1',
          propertyId: 'p1',
          id: 'app1',
        );

        expect(lease.id, 'lease1');
        expect(lease.tenantId, 'ten1');
        expect(lease.status, 'Lease.Status.Pending');
        expect(api.methods.single, 'PATCH');
        expect(
          api.paths.single,
          '/api/v1/admin/clients/c1/properties/p1/tenant-applications/app1/approve',
        );
        expect(api.bodies.single, isNull);
      },
    );
  });
}
