import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/user_api.dart';
import 'package:rentloop_manager/src/architecture/app_startup/app_startup_notifier.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'login_notifier.g.dart';

class LoginState extends ApiState {
  LoginState({super.status, super.errorMessage});
}

@riverpod
class LoginNotifier extends _$LoginNotifier {
  @override
  LoginState build() => LoginState();

  Future<void> submit({required String email, required String password}) async {
    state = LoginState(status: ApiStatus.pending);

    try {
      final result = await ref
          .read(userApiProvider)
          .login(email: email, password: password);
      await ref.read(tokenManagerProvider).save(result.token);
      await ref
          .read(appStartupNotifierProvider.notifier)
          .completeLogin(result.user);
      state = LoginState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = LoginState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = LoginState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// Clears a previous API-sourced failure — called when the user dismisses
  /// the error banner, so the dismiss button actually dismisses it instead
  /// of leaving stale error state around until the next submit.
  void reset() => state = LoginState();
}
