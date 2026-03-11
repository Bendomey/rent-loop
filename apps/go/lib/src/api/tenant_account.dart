import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/tenant_account_model.dart';

part 'tenant_account.g.dart';

class TenantAccountApi extends AbstractApi {
  TenantAccountApi({required super.tokenManager});

  Future<TenantAccountModel> getMe() async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/tenant-accounts/me',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return TenantAccountModel.fromJson(json['data'] as Map<String, dynamic>);
  }
}

@riverpod
TenantAccountApi tenantAccountApi(TenantAccountApiRef ref) {
  return TenantAccountApi(tokenManager: ref.watch(tokenManagerProvider));
}
