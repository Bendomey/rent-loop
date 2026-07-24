import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_deletion_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';

part 'property_api.g.dart';

class PropertiesPage {
  PropertiesPage({required this.rows, required this.meta});

  final List<PropertyModel> rows;
  final PaginationMetaModel meta;
}

class PropertyApi extends AbstractApi {
  PropertyApi({required super.tokenManager});

  /// [page]/[pageSize] default to a normal listing page size — pass
  /// `page: 1, pageSize: 1` to cheaply read just [PropertiesPage.meta.total]
  /// without fetching real rows (this is how the onboarding checklist uses
  /// it; a future properties-list screen calls this same method with real
  /// pagination and consumes [PropertiesPage.rows]).
  Future<PropertiesPage> getProperties({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    List<String>? ids,
    String? order,
    String? orderBy,
    String? status,
    String? search,
    // Separate from [status] — the backend filters archived (soft-deleted)
    // properties via a dedicated `archived` bool param, not `status`.
    bool? archived,
  }) async {
    final query = <String, String>{'page': '$page', 'page_size': '$pageSize'};
    if (order != null) query['order'] = order;
    if (orderBy != null) query['order_by'] = orderBy;
    if (status != null) query['status'] = status;
    if (search != null && search.isNotEmpty) {
      query['query'] = search;
      query['search_fields'] = 'name';
    }
    if (archived != null) query['archived'] = '$archived';
    if (archived == true) query['populate'] = 'DeletedBy.User';

    final queryString = Uri(
      queryParameters: {
        ...query,
        if (ids != null && ids.isNotEmpty) 'ids': ids,
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/properties?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return PropertiesPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => PropertyModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }

  Future<PropertyModel> getProperty({
    required String clientId,
    required String propertyId,
  }) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/properties/$propertyId',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return PropertyModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<PropertyDeletionPreviewModel> getPropertyDeletionPreview({
    required String clientId,
    required String propertyId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/deletion:preview',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return PropertyDeletionPreviewModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }

  Future<void> deleteProperty({
    required String clientId,
    required String propertyId,
  }) async {
    await execute(
      method: 'DELETE',
      path: '/api/v1/admin/clients/$clientId/properties/$propertyId',
    );
  }

  Future<PropertyRestorePreviewModel> getPropertyRestorePreview({
    required String clientId,
    required String propertyId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/restore:preview',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return PropertyRestorePreviewModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }

  Future<void> restoreProperty({
    required String clientId,
    required String propertyId,
  }) async {
    await execute(
      method: 'POST',
      path: '/api/v1/admin/clients/$clientId/properties/$propertyId:restore',
    );
  }
}

@riverpod
PropertyApi propertyApi(PropertyApiRef ref) =>
    PropertyApi(tokenManager: ref.watch(tokenManagerProvider));
