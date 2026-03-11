import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';

part 'lease.g.dart';

class LeaseApi extends AbstractApi {
  LeaseApi({required super.tokenManager});

  Future<List<LeaseModel>> getLeases() async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/leases?populate=Unit,TenantApplication',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final rows = (json['data']['rows'] as List<dynamic>);
    return rows
        .map((e) => LeaseModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

@riverpod
LeaseApi leaseApi(LeaseApiRef ref) {
  return LeaseApi(tokenManager: ref.watch(tokenManagerProvider));
}
