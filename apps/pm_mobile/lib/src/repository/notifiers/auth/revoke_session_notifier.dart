import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/session_api.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'revoke_session_notifier.g.dart';

class RevokeSessionState extends ApiState {
  RevokeSessionState({super.status, super.errorMessage, this.revokedCount = 0});

  /// How many sessions the backend actually ended. Only meaningful after
  /// [RevokeSessionNotifier.revokeOthers] — the server counts, we don't guess.
  final int revokedCount;
}

@riverpod
class RevokeSessionNotifier extends _$RevokeSessionNotifier {
  @override
  RevokeSessionState build() => RevokeSessionState();

  /// Ends one session. Revoking the current one is allowed and is equivalent
  /// to logging out, so callers must handle being signed out afterwards.
  Future<void> revoke(String sessionId) async {
    state = RevokeSessionState(status: ApiStatus.pending);
    try {
      await ref.read(sessionApiProvider).revokeSession(sessionId);
      state = RevokeSessionState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = RevokeSessionState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = RevokeSessionState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  Future<void> revokeOthers() async {
    state = RevokeSessionState(status: ApiStatus.pending);
    try {
      final count = await ref.read(sessionApiProvider).revokeOtherSessions();
      state = RevokeSessionState(
        status: ApiStatus.success,
        revokedCount: count,
      );
    } on ApiException catch (e) {
      state = RevokeSessionState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = RevokeSessionState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }
}
