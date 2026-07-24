import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/r2_upload_service.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/signing_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'sign_as_manager_notifier.g.dart';

class SignAsManagerState extends ApiState {
  SignAsManagerState({super.status, super.errorMessage});
}

/// Backs `SignatureCaptureScreen` — uploads the drawn signature PNG (via the
/// same R2 proxy `UImagePicker` uses) then submits it as the property
/// manager's own signature, in one call so the screen only has one loading
/// state to show.
@riverpod
class SignAsManagerNotifier extends _$SignAsManagerNotifier {
  @override
  SignAsManagerState build() => SignAsManagerState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
    required String documentId,
    required List<int> signaturePngBytes,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = SignAsManagerState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = SignAsManagerState(status: ApiStatus.pending);
    try {
      final signatureUrl = await ref
          .read(r2UploadServiceProvider)
          .uploadBytes(signaturePngBytes, objectKeyPrefix: 'signatures');
      await ref
          .read(signingApiProvider)
          .signAsManager(
            clientId: clientId,
            propertyId: propertyId,
            documentId: documentId,
            signatureUrl: signatureUrl,
            leaseId: leaseId,
          );
      state = SignAsManagerState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = SignAsManagerState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = SignAsManagerState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = SignAsManagerState();
}
