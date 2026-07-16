import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/user_api.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/architecture/workspace_id_manager/workspace_id_manager.dart';
import 'package:rentloop_manager/src/lib/workspace_resolution.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/user_model.dart';

part 'app_startup_notifier.g.dart';

enum AppStartupStatus {
  loading,
  unauthenticated,
  workspaceSelect,
  ready,
  error,
}

class AppStartupState {
  const AppStartupState({required this.status, this.errorMessage});
  final AppStartupStatus status;
  final String? errorMessage;
}

@Riverpod(keepAlive: true)
class AppStartupNotifier extends _$AppStartupNotifier {
  @override
  AppStartupState build() =>
      const AppStartupState(status: AppStartupStatus.loading);

  /// Called from the splash screen on cold start or app resume.
  Future<void> init() async {
    state = const AppStartupState(status: AppStartupStatus.loading);

    try {
      final connectivity = await Connectivity().checkConnectivity();
      if (connectivity.contains(ConnectivityResult.none)) {
        state = const AppStartupState(
          status: AppStartupStatus.error,
          errorMessage:
              'No internet connection. Please check your connection and try again.',
        );
        return;
      }

      final token = await ref.read(tokenManagerProvider).get();
      if (token == null) {
        state = const AppStartupState(status: AppStartupStatus.unauthenticated);
        return;
      }

      final user = await ref.read(userApiProvider).getMe();
      await _enterSession(user);
    } on ApiException {
      // A dead or expired token drops the user back to login silently —
      // it is not the same as a connectivity/unexpected failure, so it
      // does not use AppStartupStatus.error.
      state = const AppStartupState(status: AppStartupStatus.unauthenticated);
    } catch (_) {
      state = const AppStartupState(
        status: AppStartupStatus.error,
        errorMessage: 'Something went wrong. Kindly retry or come back later.',
      );
    }
  }

  /// Called after successful login. The JWT is already persisted by the
  /// caller (LoginNotifier) before this runs.
  Future<void> completeLogin(UserModel user) async {
    state = const AppStartupState(status: AppStartupStatus.loading);
    await _enterSession(user);
  }

  /// Called when the user taps a workspace on the picker screen.
  Future<void> selectWorkspace(ClientUserModel clientUser) async {
    await ref
        .read(currentWorkspaceNotifierProvider.notifier)
        .select(clientUser);
    state = const AppStartupState(status: AppStartupStatus.ready);
  }

  /// Called on logout — clears all local state. GoRouter's redirect
  /// listener handles navigation back to /auth/welcome.
  Future<void> logout() async {
    await ref.read(tokenManagerProvider).remove();
    await ref.read(workspaceIdManagerProvider).remove();
    ref.read(currentUserNotifierProvider.notifier).clear();
    ref.read(currentWorkspaceNotifierProvider.notifier).clear();
    state = const AppStartupState(status: AppStartupStatus.unauthenticated);
  }

  Future<void> _enterSession(UserModel user) async {
    ref.read(currentUserNotifierProvider.notifier).setUser(user);

    final storedClientId = await ref.read(workspaceIdManagerProvider).get();
    final resolved = resolveWorkspace(
      user.clientUsers,
      storedClientId: storedClientId,
    );

    if (resolved != null) {
      await ref
          .read(currentWorkspaceNotifierProvider.notifier)
          .select(resolved);
      state = const AppStartupState(status: AppStartupStatus.ready);
    } else {
      state = const AppStartupState(status: AppStartupStatus.workspaceSelect);
    }
  }
}
