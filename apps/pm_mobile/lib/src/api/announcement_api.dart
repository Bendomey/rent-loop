import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/announcement_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

part 'announcement_api.g.dart';

class AnnouncementApi extends AbstractApi {
  AnnouncementApi({required super.tokenManager});

  static String _client(String clientId) => '/api/v1/admin/clients/$clientId';

  Future<AnnouncementsPage> listAnnouncements({
    required String clientId,
    String? propertyId,
    int page = 1,
    int pageSize = 20,
  }) async {
    final queryString = Uri(
      queryParameters: {
        'page': '$page',
        'page_size': '$pageSize',
        'populate': 'Property',
        if (propertyId != null) 'property_id': [propertyId],
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path: '${_client(clientId)}/announcements?$queryString',
    );
    final data =
        (jsonDecode(response.body) as Map<String, dynamic>)['data']
            as Map<String, dynamic>;
    return AnnouncementsPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => AnnouncementModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }

  Future<AnnouncementModel> createAnnouncement({
    required String clientId,
    required String propertyId,
    required String title,
    required String content,
    required String type,
    required String priority,
    String? propertyBlockId,
    List<String>? targetUnitIds,
  }) async {
    final response = await execute(
      method: 'POST',
      path: '${_client(clientId)}/properties/$propertyId/announcements',
      body: {
        'title': title,
        'content': content,
        'type': type,
        'priority': priority,
        if (propertyBlockId != null) 'property_block_id': propertyBlockId,
        if (targetUnitIds != null) 'target_unit_ids': targetUnitIds,
      },
    );
    return AnnouncementModel.fromJson(
      (jsonDecode(response.body) as Map<String, dynamic>)['data']
          as Map<String, dynamic>,
    );
  }

  Future<void> publishAnnouncement({
    required String clientId,
    required String propertyId,
    required String announcementId,
  }) async {
    await execute(
      method: 'POST',
      path:
          '${_client(clientId)}/properties/$propertyId/announcements/'
          '$announcementId/publish',
    );
  }
}

@riverpod
AnnouncementApi announcementApi(AnnouncementApiRef ref) =>
    AnnouncementApi(tokenManager: ref.watch(tokenManagerProvider));
