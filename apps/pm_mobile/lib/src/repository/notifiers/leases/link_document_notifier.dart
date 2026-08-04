import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'link_document_notifier.g.dart';

class LinkDocumentState extends ApiState {
  LinkDocumentState({super.status, super.errorMessage});
}

/// Backs the Documents tab's MANUAL-mode "Done" step — copies the uploaded
/// file's URL onto the lease record so `lease.lease_agreement_document_url`
/// is set, mirroring the web `LeaseAgreementDocumentSetup`'s own "Done"
/// button (a plain `useUpdateLease()` call, no signing involved for MANUAL
/// mode at all).
@riverpod
class LinkDocumentNotifier extends _$LinkDocumentNotifier {
  @override
  LinkDocumentState build() => LinkDocumentState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
    required String documentUrl,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = LinkDocumentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = LinkDocumentState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseApiProvider)
          .updateLease(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
            leaseAgreementDocumentUrl: documentUrl,
          );
      state = LinkDocumentState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = LinkDocumentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = LinkDocumentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = LinkDocumentState();
}
