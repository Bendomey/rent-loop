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
  }) async {
    final queryString = Uri(
      queryParameters: {'page': '$page', 'page_size': '$pageSize'},
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
}

@riverpod
UnitApi unitApi(UnitApiRef ref) =>
    UnitApi(tokenManager: ref.watch(tokenManagerProvider));
