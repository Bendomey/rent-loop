import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'unit_api.g.dart';

class UnitsPage {
  UnitsPage({required this.rows, required this.meta});

  final List<UnitModel> rows;
  final PaginationMetaModel meta;
}

class UnitApi extends AbstractApi {
  UnitApi({required super.tokenManager});

  Future<UnitsPage> getUnits({
    required String clientId,
    required String propertyId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? blockId,
  }) async {
    final query = <String, String>{'page': '$page', 'page_size': '$pageSize'};
    if (status != null) query['status'] = status;
    if (search != null && search.isNotEmpty) {
      query['query'] = search;
      query['search_fields'] = 'name';
    }

    final queryString = Uri(
      queryParameters: {
        ...query,
        if (blockId != null) 'block_ids': [blockId],
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/units?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return UnitsPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => UnitModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }

  Future<UnitModel> getUnit({
    required String clientId,
    required String propertyId,
    required String unitId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/units/$unitId'
          '?populate=Property,PropertyBlock',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return UnitModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<UnitModel> createUnit({
    required String clientId,
    required String propertyId,
    required String blockId,
    required String name,
    String? description,
    List<String>? images,
    required String type,
    required String status,
    required int rentFee,
    required String rentFeeCurrency,
    required String paymentFrequency,
    required int maxOccupantsAllowed,
  }) async {
    final body = <String, dynamic>{
      'name': name,
      if (description != null && description.isNotEmpty)
        'description': description,
      if (images != null && images.isNotEmpty) 'images': images,
      'type': type,
      'status': status,
      'rent_fee': rentFee,
      'rent_fee_currency': rentFeeCurrency,
      'payment_frequency': paymentFrequency,
      'max_occupants_allowed': maxOccupantsAllowed,
    };

    final response = await execute(
      method: 'POST',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/blocks/$blockId/units',
      body: body,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return UnitModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  /// Every field is optional and only sent when non-null — lets callers
  /// omit fields they didn't show an editor for (e.g. rental info stays
  /// untouched when the unit is occupied) without a separate PATCH shape.
  Future<UnitModel> updateUnit({
    required String clientId,
    required String propertyId,
    required String unitId,
    String? name,
    String? description,
    List<String>? images,
    String? type,
    double? area,
    int? rentFee,
    String? rentFeeCurrency,
    String? paymentFrequency,
    int? maxOccupantsAllowed,
  }) async {
    final body = <String, dynamic>{
      if (name != null) 'name': name,
      if (description != null) 'description': description,
      if (images != null) 'images': images,
      if (type != null) 'type': type,
      if (area != null) 'area': area,
      if (rentFee != null) 'rent_fee': rentFee,
      if (rentFeeCurrency != null) 'rent_fee_currency': rentFeeCurrency,
      if (paymentFrequency != null) 'payment_frequency': paymentFrequency,
      if (maxOccupantsAllowed != null)
        'max_occupants_allowed': maxOccupantsAllowed,
    };

    final response = await execute(
      method: 'PATCH',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/units/$unitId',
      body: body,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return UnitModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<void> deleteUnit({
    required String clientId,
    required String propertyId,
    required String unitId,
  }) async {
    await execute(
      method: 'DELETE',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/units/$unitId',
    );
  }
}

@riverpod
UnitApi unitApi(UnitApiRef ref) =>
    UnitApi(tokenManager: ref.watch(tokenManagerProvider));
