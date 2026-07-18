import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/signing_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'resend_signing_token_notifier.g.dart';

class ResendSigningTokenState extends ApiState {
  ResendSigningTokenState({super.status, super.errorMessage});
}

@riverpod
class ResendSigningTokenNotifier extends _$ResendSigningTokenNotifier {
  @override
  ResendSigningTokenState build() => ResendSigningTokenState();

  Future<void> submit({
    required String propertyId,
    required String tokenId,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = ResendSigningTokenState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = ResendSigningTokenState(status: ApiStatus.pending);
    try {
      await ref
          .read(signingApiProvider)
          .resendToken(
            clientId: clientId,
            propertyId: propertyId,
            tokenId: tokenId,
          );
      state = ResendSigningTokenState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = ResendSigningTokenState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = ResendSigningTokenState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = ResendSigningTokenState();
}
