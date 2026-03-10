import 'package:rentloop_go/src/api/notification.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/api_state.dart';

part 'register_fcm_token_notifier.g.dart';

class RegisterFcmTokenState extends ApiState {
  RegisterFcmTokenState({super.status, super.errorMessage});
}

@riverpod
class RegisterFcmTokenNotifier extends _$RegisterFcmTokenNotifier {
  @override
  RegisterFcmTokenState build() => RegisterFcmTokenState();

  Future<void> register({
    required String token,
    required String platform,
  }) async {
    state = RegisterFcmTokenState(status: ApiStatus.pending);
    try {
      await ref
          .read(notificationApiProvider)
          .registerFcmToken(token: token, platform: platform);
      state = RegisterFcmTokenState(status: ApiStatus.success);
    } catch (_) {
      // Fire-and-forget: don't surface FCM registration errors to the user.
      state = RegisterFcmTokenState(status: ApiStatus.failed);
    }
  }
}
