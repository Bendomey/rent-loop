import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/signing_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'generate_signing_token_notifier.g.dart';

class GenerateSigningTokenState extends ApiState {
  GenerateSigningTokenState({super.status, super.errorMessage});
}

/// Backs both "Request Signature" (no existing token) and "Resend" (token
/// exists but unsigned) — resend is a separate notifier
/// (`resend_signing_token_notifier.dart`) since it hits a different
/// endpoint, not a variant of this one.
@riverpod
class GenerateSigningTokenNotifier extends _$GenerateSigningTokenNotifier {
  @override
  GenerateSigningTokenState build() => GenerateSigningTokenState();

  Future<void> submit({
    required String propertyId,
    required String documentId,
    required String leaseId,
    required String role,
    String? signerName,
    String? signerEmail,
    String? signerPhone,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = GenerateSigningTokenState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = GenerateSigningTokenState(status: ApiStatus.pending);
    try {
      await ref
          .read(signingApiProvider)
          .generateToken(
            clientId: clientId,
            propertyId: propertyId,
            documentId: documentId,
            role: role,
            leaseId: leaseId,
            signerName: signerName,
            signerEmail: signerEmail,
            signerPhone: signerPhone,
          );
      state = GenerateSigningTokenState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = GenerateSigningTokenState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = GenerateSigningTokenState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = GenerateSigningTokenState();
}
