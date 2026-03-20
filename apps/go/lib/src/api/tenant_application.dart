import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/tenant_application_model.dart';

part 'tenant_application.g.dart';

class TenantApplicationApi extends AbstractApi {
  TenantApplicationApi({required super.tokenManager});

  Future<TenantApplicationModel> getTenantApplication(String id) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/tenant-applications/$id',
      authRequired: false,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return TenantApplicationModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }
}

@riverpod
TenantApplicationApi tenantApplicationApi(TenantApplicationApiRef ref) {
  return TenantApplicationApi(tokenManager: ref.watch(tokenManagerProvider));
}
