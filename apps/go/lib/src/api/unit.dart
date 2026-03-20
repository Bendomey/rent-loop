import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/unit_model.dart';

part 'unit.g.dart';

class UnitApi extends AbstractApi {
  UnitApi({required super.tokenManager});

  Future<UnitModel> getUnit(String unitId) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/units/$unitId',
      authRequired: false,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return UnitModel.fromJson(json['data'] as Map<String, dynamic>);
  }
}

@riverpod
UnitApi unitApi(UnitApiRef ref) {
  return UnitApi(tokenManager: ref.watch(tokenManagerProvider));
}
