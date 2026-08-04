import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_agreement_document_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/lease_agreement_document_model.dart';

part 'lease_agreement_document_provider.g.dart';

/// `null` means the lease has no document pipeline started yet — a normal,
/// expected state (not an error), see `LeaseAgreementDocumentApi.getDocument()`.
@riverpod
Future<LeaseAgreementDocumentModel?> leaseAgreementDocument(
  LeaseAgreementDocumentRef ref,
  String propertyId,
  String leaseId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  return ref
      .read(leaseAgreementDocumentApiProvider)
      .getDocument(
        clientId: clientId,
        propertyId: propertyId,
        leaseId: leaseId,
      );
}
