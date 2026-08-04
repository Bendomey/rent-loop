import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

/// Captures the request path instead of hitting the network.
///
/// `AbstractApi.execute` is the single choke point every call goes through, so
/// overriding it here needs no production seam and no HTTP mocking.
class _RecordingApi extends MaintenanceRequestApi {
  _RecordingApi() : super(tokenManager: TokenManager(SecureStorage()));

  final List<String> paths = [];
  Map<String, dynamic> nextBody = {
    'data': {'rows': <dynamic>[]},
  };

  @override
  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    paths.add(path);
    return http.Response(jsonEncode(nextBody), 200);
  }
}

const _args = (clientId: 'c1', propertyId: 'p1', requestId: 'r1');

void main() {
  // Relations are only serialized when explicitly requested, so a missing
  // populate does not fail loudly — it silently returns nulls and the UI
  // renders "Unknown". These pin the populate paths the web portal sends.
  group('detail sub-resource populate', () {
    test('activity logs request the performer relations', () async {
      final api = _RecordingApi();
      await api.getActivityLogs(
        clientId: _args.clientId,
        propertyId: _args.propertyId,
        requestId: _args.requestId,
      );

      expect(
        api.paths.single,
        contains(
          'populate=PerformedByClientUser,PerformedByClientUser.User,'
          'PerformedByTenant',
        ),
      );
    });

    test('comments request the author relations', () async {
      final api = _RecordingApi();
      await api.getComments(
        clientId: _args.clientId,
        propertyId: _args.propertyId,
        requestId: _args.requestId,
      );

      expect(
        api.paths.single,
        contains('populate=CreatedByClientUser,CreatedByClientUser.User'),
      );
    });

    test('expenses request no relations', () async {
      final api = _RecordingApi();
      await api.getExpenses(
        clientId: _args.clientId,
        propertyId: _args.propertyId,
        requestId: _args.requestId,
      );

      // Deliberate: the web portal populates `Invoices` here, but the mobile
      // expenses tab shows only amount/description/date, so requesting them
      // would be dead payload.
      expect(api.paths.single, isNot(contains('populate=')));
    });

    test('the single request populates assets, assignees and creators', () async {
      final api = _RecordingApi()
        ..nextBody = {
          'data': {
            'id': 'r1',
            'code': 'ABC',
            'title': 'T',
            'category': 'OTHER',
            'priority': 'LOW',
            'status': 'NEW',
            'property_id': 'p1',
          },
        };
      await api.getMaintenanceRequest(
        clientId: _args.clientId,
        propertyId: _args.propertyId,
        requestId: _args.requestId,
      );

      final path = api.paths.single;
      for (final relation in [
        'Assets',
        'Assets.Unit',
        'Assets.PropertyBlock',
        'AssignedWorker.User',
        'AssignedManager.User',
        'CreatedByTenant',
        'CreatedByClientUser.User',
      ]) {
        expect(path, contains(relation), reason: 'missing populate=$relation');
      }
    });
  });
}
