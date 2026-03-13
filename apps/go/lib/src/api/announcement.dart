import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/announcement_model.dart';

part 'announcement.g.dart';

class AnnouncementQuery {
  final int page;
  final int? limit;
  final String? sort;
  final String? type;
  final String? priority;
  final String? status;
  final bool? isUnread;

  const AnnouncementQuery({
    this.page = 1,
    this.limit,
    this.sort,
    this.type,
    this.priority,
    this.status,
    this.isUnread,
  });

  String toQueryString() {
    final params = <String, String>{'page': '$page'};
    if (limit != null) params['limit'] = '$limit';
    if (sort != null) params['sort'] = sort!;
    if (type != null) params['type'] = type!;
    if (priority != null) params['priority'] = priority!;
    if (status != null) params['status'] = status!;
    if (isUnread != null) params['is_unread'] = isUnread.toString();
    return params.entries.map((e) => '${e.key}=${e.value}').join('&');
  }

  @override
  bool operator ==(Object other) =>
      other is AnnouncementQuery &&
      page == other.page &&
      limit == other.limit &&
      sort == other.sort &&
      type == other.type &&
      priority == other.priority &&
      status == other.status &&
      isUnread == other.isUnread;

  @override
  int get hashCode =>
      Object.hash(page, limit, sort, type, priority, status, isUnread);
}

class AnnouncementMeta {
  final int total;

  const AnnouncementMeta({required this.total});

  factory AnnouncementMeta.fromJson(Map<String, dynamic> json) =>
      AnnouncementMeta(total: (json['total'] as num?)?.toInt() ?? 0);
}

class AnnouncementPageResult {
  final List<AnnouncementModel> rows;
  final AnnouncementMeta meta;

  const AnnouncementPageResult({required this.rows, required this.meta});
}

class AnnouncementApi extends AbstractApi {
  AnnouncementApi({required super.tokenManager});

  Future<AnnouncementPageResult> getAnnouncements({
    required String leaseId,
    AnnouncementQuery query = const AnnouncementQuery(),
  }) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/leases/$leaseId/announcements?${query.toQueryString()}',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    final rows = (data['rows'] as List<dynamic>)
        .map((e) => AnnouncementModel.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = AnnouncementMeta.fromJson(
      (data['meta'] as Map<String, dynamic>?) ?? {},
    );
    return AnnouncementPageResult(rows: rows, meta: meta);
  }

  Future<void> markAsRead(String id) async {
    await execute(method: 'POST', path: '/api/v1/announcements/$id/read');
  }
}

@riverpod
AnnouncementApi announcementApi(AnnouncementApiRef ref) {
  return AnnouncementApi(tokenManager: ref.watch(tokenManagerProvider));
}
