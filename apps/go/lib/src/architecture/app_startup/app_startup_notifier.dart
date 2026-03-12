import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:rentloop_go/src/api/lease.dart';
import 'package:rentloop_go/src/api/notification.dart';
import 'package:rentloop_go/src/api/tenant_account.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/tenant_account_model.dart';

part 'app_startup_notifier.g.dart';

enum AppStartupStatus { loading, unauthenticated, ready, error }

class AppStartupState {
  final AppStartupStatus status;
  final String? errorMessage;
  const AppStartupState({required this.status, this.errorMessage});
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

      final tenantAccount = await ref.read(tenantAccountApiProvider).getMe();
      ref.read(currentUserNotifierProvider.notifier).setUser(tenantAccount);
      await _fetchLeases();

      state = const AppStartupState(status: AppStartupStatus.ready);
    } catch (_) {
      state = const AppStartupState(
        status: AppStartupStatus.error,
        errorMessage: 'Something went wrong. Kindly retry or come back later.',
      );
    }
  }

  /// Called after successful OTP verification. Account is already known.
  Future<void> completeLogin(TenantAccountModel account) async {
    state = const AppStartupState(status: AppStartupStatus.loading);
    ref.read(currentUserNotifierProvider.notifier).setUser(account);
    await _fetchLeases();
    state = const AppStartupState(status: AppStartupStatus.ready);
  }

  /// Called on logout — clears all state. GoRouter guard handles navigation.
  Future<void> logout() async {
    // Fire-and-forget: delete this device's FCM token from the server so
    // the user stops receiving notifications after logout.
    try {
      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken != null) {
        await ref
            .read(notificationApiProvider)
            .deleteFcmToken(token: fcmToken);
      }
    } catch (_) {}

    await ref.read(tokenManagerProvider).remove();
    await ref.read(leaseIdManagerProvider).remove();
    ref.read(currentUserNotifierProvider.notifier).clear();
    ref.read(currentLeaseNotifierProvider.notifier).clear();
    state = const AppStartupState(status: AppStartupStatus.unauthenticated);
  }

  Future<void> _fetchLeases() async {
    final leases = await ref.read(leaseApiProvider).getLeases();
    await ref
        .read(currentLeaseNotifierProvider.notifier)
        .loadFromLeases(leases);
  }
}
