import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/announcement_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/announcement_model.dart';

const _meta = {
  'total': 1,
  'page': 1,
  'page_size': 20,
  'has_next_page': false,
  'has_previous_page': false,
};

Map<String, dynamic> _json() => {
  'id': 'a1',
  'title': 'Water off',
  'content': 'Tomorrow 9am',
  'type': 'MAINTENANCE',
  'priority': 'URGENT',
  'status': 'PUBLISHED',
  'published_at': '2024-06-15T00:00:00Z',
  'created_at': '2024-06-14T00:00:00Z',
  'property_id': 'p1',
  'property': {
    'id': 'p1',
    'name': 'Palm Court',
    'type': 'APARTMENT',
    'status': 'ACTIVE',
  },
  'target_unit_ids': ['u1'],
};

class _RecordingApi extends AnnouncementApi {
  _RecordingApi() : super(tokenManager: TokenManager(SecureStorage()));

  final List<String> paths = [];
  final List<String> methods = [];
  final List<Map<String, dynamic>?> bodies = [];

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
    if (method == 'POST' && path.endsWith('/publish')) {
      return http.Response('', 204);
    }
    if (method == 'POST') {
      return http.Response(jsonEncode({'data': _json()}), 201);
    }
    return http.Response(
      jsonEncode({
        'data': {
          'rows': [_json()],
          'meta': _meta,
        },
      }),
      200,
    );
  }
}

void main() {
  test(
    'listAnnouncements calls the cross-property list with populate',
    () async {
      final api = _RecordingApi();
      final page = await api.listAnnouncements(clientId: 'c1');

      final uri = Uri.parse('https://x${api.paths.single}');
      expect(uri.path, '/api/v1/admin/clients/c1/announcements');
      final q = uri.queryParametersAll;
      expect(q['page'], ['1']);
      expect(q['page_size'], ['20']);
      expect(q['populate'], ['Property']);
      expect(q.containsKey('property_id'), isFalse);
      expect(page.rows.single.property?.name, 'Palm Court');
    },
  );

  test('listAnnouncements narrows by property_id', () async {
    final api = _RecordingApi();
    await api.listAnnouncements(clientId: 'c1', propertyId: 'p9', page: 2);
    final q = Uri.parse('https://x${api.paths.single}').queryParametersAll;
    expect(q['property_id'], ['p9']);
    expect(q['page'], ['2']);
  });

  test('createAnnouncement posts only the chosen audience field', () async {
    final api = _RecordingApi();
    await api.createAnnouncement(
      clientId: 'c1',
      propertyId: 'p1',
      title: 't',
      content: 'c',
      type: 'COMMUNITY',
      priority: 'NORMAL',
      propertyBlockId: 'b1',
    );
    expect(api.methods.single, 'POST');
    expect(
      api.paths.single,
      '/api/v1/admin/clients/c1/properties/p1/announcements',
    );
    expect(api.bodies.single!['property_block_id'], 'b1');
    expect(api.bodies.single!.containsKey('target_unit_ids'), isFalse);

    await api.createAnnouncement(
      clientId: 'c1',
      propertyId: 'p1',
      title: 't',
      content: 'c',
      type: 'COMMUNITY',
      priority: 'NORMAL',
    );
    expect(api.bodies.last!.containsKey('property_block_id'), isFalse);
    expect(api.bodies.last!.containsKey('target_unit_ids'), isFalse);

    await api.createAnnouncement(
      clientId: 'c1',
      propertyId: 'p1',
      title: 't',
      content: 'c',
      type: 'COMMUNITY',
      priority: 'NORMAL',
      targetUnitIds: const ['u1', 'u2'],
    );
    expect(api.bodies.last!['target_unit_ids'], ['u1', 'u2']);
    expect(api.bodies.last!.containsKey('property_block_id'), isFalse);
  });

  test(
    'publishAnnouncement posts to the property-scoped publish path',
    () async {
      final api = _RecordingApi();
      await api.publishAnnouncement(
        clientId: 'c1',
        propertyId: 'p1',
        announcementId: 'a1',
      );
      expect(api.methods.single, 'POST');
      expect(
        api.paths.single,
        '/api/v1/admin/clients/c1/properties/p1/announcements/a1/publish',
      );
    },
  );

  test(
    'AnnouncementModel tolerates a null property and missing target_unit_ids',
    () {
      final json = _json()
        ..remove('property')
        ..remove('property_id')
        ..remove('target_unit_ids');
      final model = AnnouncementModel.fromJson(json);
      expect(model.property, isNull);
      expect(model.targetUnitIds, isEmpty);
      final explicitNull = AnnouncementModel.fromJson(
        _json()..['property'] = null,
      );
      expect(explicitNull.property, isNull);
    },
  );
}
