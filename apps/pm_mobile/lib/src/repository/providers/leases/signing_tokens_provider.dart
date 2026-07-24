import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/signing_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/signing_token_model.dart';

part 'signing_tokens_provider.g.dart';

@riverpod
Future<List<SigningTokenModel>> signingTokens(
  SigningTokensRef ref,
  String propertyId,
  String documentId,
  String leaseId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  return ref
      .read(signingApiProvider)
      .listTokens(
        clientId: clientId,
        propertyId: propertyId,
        documentId: documentId,
        leaseId: leaseId,
      );
}
