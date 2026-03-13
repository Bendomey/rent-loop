import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/maintenance_request_model.dart';

part 'maintenance.g.dart';

class MaintenanceRequestQuery {
  final int page;
  final int pageSize;
  final String? status;
  final String? search;
  final String? sort;
  final String? priority;
  final String? category;

  const MaintenanceRequestQuery({
    this.page = 1,
    this.pageSize = 20,
    this.status,
    this.search,
    this.sort,
    this.priority,
    this.category,
  });

  String toQueryString() {
    final params = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
      'populate': 'ActivityLogs',
    };
    if (status != null) params['status'] = status!;
    if (search != null && search!.isNotEmpty) {
      params['search'] = search!;
      params['search_fields'] = 'title,description';
    }
    if (sort != null) params['sort'] = sort!;
    if (priority != null) params['priority'] = priority!;
    if (category != null) params['category'] = category!;
    return params.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
  }

  MaintenanceRequestQuery copyWith({
    int? page,
    int? pageSize,
    String? status,
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
      status: clearStatus ? null : (status ?? this.status),
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
      status == other.status &&
      search == other.search &&
      sort == other.sort &&
      priority == other.priority &&
      category == other.category;

  @override
  int get hashCode =>
      Object.hash(page, pageSize, status, search, sort, priority, category);
}

class MaintenanceApi extends AbstractApi {
  MaintenanceApi({required super.tokenManager});

  Future<({List<MaintenanceRequestModel> rows, bool hasNextPage})>
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
    return (rows: rows, hasNextPage: hasNextPage);
  }

  Future<MaintenanceRequestModel> getMaintenanceRequest(
    String leaseId,
    String id,
  ) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/leases/$leaseId/maintenance-requests/$id?populate=ActivityLogs,Expenses',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return MaintenanceRequestModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
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
