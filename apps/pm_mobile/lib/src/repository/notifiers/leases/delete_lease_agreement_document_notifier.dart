import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_agreement_document_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'delete_lease_agreement_document_notifier.g.dart';

class DeleteLeaseAgreementDocumentState extends ApiState {
  DeleteLeaseAgreementDocumentState({super.status, super.errorMessage});
}

@riverpod
class DeleteLeaseAgreementDocumentNotifier
    extends _$DeleteLeaseAgreementDocumentNotifier {
  @override
  DeleteLeaseAgreementDocumentState build() =>
      DeleteLeaseAgreementDocumentState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = DeleteLeaseAgreementDocumentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = DeleteLeaseAgreementDocumentState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseAgreementDocumentApiProvider)
          .deleteDocument(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
          );
      state = DeleteLeaseAgreementDocumentState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = DeleteLeaseAgreementDocumentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = DeleteLeaseAgreementDocumentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = DeleteLeaseAgreementDocumentState();
}
