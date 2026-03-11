import 'package:rentloop_go/src/api/auth.dart';
import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/api/tenant_account.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/api_error_messages.dart';
import 'package:rentloop_go/src/repository/api_state.dart';

part 'verify_otp_notifier.g.dart';

class VerifyOtpState extends ApiState {
  VerifyOtpState({super.status, super.errorMessage});
}

@riverpod
class VerifyOtpNotifier extends _$VerifyOtpNotifier {
  @override
  VerifyOtpState build() => VerifyOtpState();

  Future<bool> verifyOtp({required String phone, required String code}) async {
    state = VerifyOtpState(status: ApiStatus.pending);

    try {
      final token = await ref
          .read(authApiProvider)
          .verifyOtp(phone: phone, code: code);
      await ref.read(tokenManagerProvider).save(token);
      final tenantAccount = await ref.read(tenantAccountApiProvider).getMe();
      ref.read(currentUserNotifierProvider.notifier).setUser(tenantAccount);
      state = VerifyOtpState(status: ApiStatus.success);
      return true;
    } on ApiException catch (e) {
      state = VerifyOtpState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
      return false;
    } catch (_) {
      state = VerifyOtpState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return false;
    }
  }
}
