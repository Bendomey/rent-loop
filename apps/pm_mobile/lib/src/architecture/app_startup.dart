import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppStartupStatus { loading, unauthenticated, ready, error }

class AppStartupState {
  const AppStartupState({required this.status, this.errorMessage});
  final AppStartupStatus status;
  final String? errorMessage;
}

class AppStartupNotifier extends Notifier<AppStartupState> {
  @override
  AppStartupState build() =>
      const AppStartupState(status: AppStartupStatus.loading);

  Future<void> init() async {
    state = const AppStartupState(status: AppStartupStatus.loading);
    // TODO: check stored JWT via flutter_secure_storage, fetch /me
    await Future.delayed(const Duration(milliseconds: 600));
    state = const AppStartupState(status: AppStartupStatus.unauthenticated);
  }

  Future<void> login({required String email, required String password}) async {
    // Loading is tracked locally in the screen — don't touch state here so the
    // router doesn't redirect to /splash mid-attempt.
    // TODO: replace with real API call — POST /api/v1/client-user/auth/login
    await Future.delayed(const Duration(milliseconds: 900));
    if (email != 'akosua@owusuestates.com' || password != 'rentloop2026') {
      throw Exception('Incorrect email or password.');
    }
    state = const AppStartupState(status: AppStartupStatus.ready);
  }

  Future<void> logout() async {
    // TODO: clear JWT from secure storage
    state = const AppStartupState(status: AppStartupStatus.unauthenticated);
  }
}

final appStartupProvider =
    NotifierProvider<AppStartupNotifier, AppStartupState>(
      AppStartupNotifier.new,
    );
