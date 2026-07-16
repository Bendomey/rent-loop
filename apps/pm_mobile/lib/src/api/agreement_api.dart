import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/agreement_model.dart';

part 'agreement_api.g.dart';

class AgreementApi extends AbstractApi {
  AgreementApi({required super.tokenManager});

  Future<List<AgreementModel>> getAgreements({
    required String clientId,
  }) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/agreements',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return (json['data'] as List<dynamic>)
        .map((e) => AgreementModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

@riverpod
AgreementApi agreementApi(AgreementApiRef ref) =>
    AgreementApi(tokenManager: ref.watch(tokenManagerProvider));
