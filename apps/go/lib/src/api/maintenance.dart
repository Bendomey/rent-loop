import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/maintenance_request_model.dart';

part 'maintenance.g.dart';

class MaintenanceRequestQuery {
  final int page;
  final int pageSize;
  final List<String>? statuses;
  final String? search;
  final String? sort;
  final String? priority;
  final String? category;

  const MaintenanceRequestQuery({
    this.page = 1,
    this.pageSize = 20,
    this.statuses,
    this.search,
    this.sort,
    this.priority,
    this.category,
  });

  String toQueryString() {
    final parts = <String>[
      'page=${Uri.encodeComponent('$page')}',
      'page_size=${Uri.encodeComponent('$pageSize')}',
      'populate=${Uri.encodeComponent('ActivityLogs')}',
      'order=${Uri.encodeComponent('desc')}',
      'order_by=${Uri.encodeComponent('created_at')}',
    ];
    if (statuses != null && statuses!.isNotEmpty) {
      for (final s in statuses!) {
        parts.add('status=${Uri.encodeComponent(s)}');
      }
    }
    if (search != null && search!.isNotEmpty) {
      parts.add('query=${Uri.encodeComponent(search!)}');
      parts.add('search_fields=${Uri.encodeComponent('title,description')}');
    }
    if (priority != null) {
      parts.add('priority=${Uri.encodeComponent(priority!)}');
    }
    if (category != null) {
      parts.add('category=${Uri.encodeComponent(category!)}');
    }
    return parts.join('&');
  }

  MaintenanceRequestQuery copyWith({
    int? page,
    int? pageSize,
    List<String>? statuses,
    String? search,
    String? sort,
    String? priority,
    String? category,
    bool clearStatus = false,
    bool clearSearch = false,
    bool clearPriority = false,
    bool clearCategory = false,
  }) {
    return MaintenanceRequestQuery(
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      statuses: clearStatus ? null : (statuses ?? this.statuses),
      search: clearSearch ? null : (search ?? this.search),
      sort: sort ?? this.sort,
      priority: clearPriority ? null : (priority ?? this.priority),
      category: clearCategory ? null : (category ?? this.category),
    );
  }

  @override
  bool operator ==(Object other) =>
      other is MaintenanceRequestQuery &&
      page == other.page &&
      pageSize == other.pageSize &&
      listEquals(statuses, other.statuses) &&
      search == other.search &&
      sort == other.sort &&
      priority == other.priority &&
      category == other.category;

  @override
  int get hashCode => Object.hash(
    page,
    pageSize,
    Object.hashAll(statuses ?? []),
    search,
    sort,
    priority,
    category,
  );
}

class MaintenanceApi extends AbstractApi {
  MaintenanceApi({required super.tokenManager});

  Future<({List<MaintenanceRequestModel> rows, bool hasNextPage, int total})>
  getMaintenanceRequests(String leaseId, MaintenanceRequestQuery query) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/leases/$leaseId/maintenance-requests?${query.toQueryString()}',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    final rows = (data['rows'] as List<dynamic>)
        .map((e) => MaintenanceRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();
    final meta = data['meta'] as Map<String, dynamic>?;
    final hasNextPage = (meta?['has_next_page'] as bool?) ?? false;
    final total = (meta?['total'] as int?) ?? 0;
    return (rows: rows, hasNextPage: hasNextPage, total: total);
  }

  Future<MaintenanceRequestModel> getMaintenanceRequest(
    String leaseId,
    String id,
  ) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/leases/$leaseId/maintenance-requests/$id?populate=ActivityLogs,Expenses,Expenses.Invoices',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return MaintenanceRequestModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }

  Future<Map<String, int>> getMaintenanceRequestStats(String leaseId) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/leases/$leaseId/maintenance-requests/stats',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return data.map((k, v) => MapEntry(k, (v as num).toInt()));
  }

  Future<MaintenanceRequestModel> createMaintenanceRequest(
    String leaseId,
    Map<String, dynamic> body,
  ) async {
    final response = await execute(
      method: 'POST',
      path: '/api/v1/leases/$leaseId/maintenance-requests',
      body: body,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return MaintenanceRequestModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }
}

@riverpod
MaintenanceApi maintenanceApi(MaintenanceApiRef ref) {
  return MaintenanceApi(tokenManager: ref.watch(tokenManagerProvider));
}
