import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';

part 'property_block_api.g.dart';

class PropertyBlocksPage {
  PropertyBlocksPage({required this.rows, required this.meta});

  final List<PropertyBlockModel> rows;
  final PaginationMetaModel meta;
}

class PropertyBlockApi extends AbstractApi {
  PropertyBlockApi({required super.tokenManager});

  /// [pageSize] defaults large (100) since callers use this for full
  /// picker lists (add-unit block select) and a cheap total (Manage grid
  /// tile) alike — property block counts are small, unlike units/properties.
  Future<PropertyBlocksPage> getBlocks({
    required String clientId,
    required String propertyId,
    int page = 1,
    int pageSize = 100,
    String? status,
    String? search,
  }) async {
    final query = <String, String>{'page': '$page', 'page_size': '$pageSize'};
    if (status != null) query['status'] = status;
    if (search != null && search.isNotEmpty) {
      query['query'] = search;
      query['search_fields'] = 'name';
    }

    final queryString = Uri(queryParameters: query).query;

    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/blocks?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return PropertyBlocksPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => PropertyBlockModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }

  Future<PropertyBlockModel> getBlock({
    required String clientId,
    required String propertyId,
    required String blockId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/blocks/$blockId',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return PropertyBlockModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<PropertyBlockModel> createBlock({
    required String clientId,
    required String propertyId,
    required String name,
    String? description,
    List<String>? images,
    required String status,
  }) async {
    final body = <String, dynamic>{
      'name': name,
      if (description != null && description.isNotEmpty)
        'description': description,
      if (images != null && images.isNotEmpty) 'images': images,
      'status': status,
    };

    final response = await execute(
      method: 'POST',
      path: '/api/v1/admin/clients/$clientId/properties/$propertyId/blocks',
      body: body,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return PropertyBlockModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  /// Every field optional and only sent when non-null (mirrors
  /// UnitApi.updateUnit()'s partial-PATCH shape).
  Future<PropertyBlockModel> updateBlock({
    required String clientId,
    required String propertyId,
    required String blockId,
    String? name,
    String? description,
    List<String>? images,
    String? status,
  }) async {
    final body = <String, dynamic>{
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (images != null) 'images': images,
      if (status != null) 'status': status,
    };

    final response = await execute(
      method: 'PATCH',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/blocks/$blockId',
      body: body,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return PropertyBlockModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<void> deleteBlock({
    required String clientId,
    required String propertyId,
    required String blockId,
  }) async {
    await execute(
      method: 'DELETE',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/blocks/$blockId',
    );
  }
}

@riverpod
PropertyBlockApi propertyBlockApi(PropertyBlockApiRef ref) =>
    PropertyBlockApi(tokenManager: ref.watch(tokenManagerProvider));
