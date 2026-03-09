import 'package:rentloop_go/src/api/auth.dart';
import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/api_error_messages.dart';
import 'package:rentloop_go/src/repository/api_state.dart';

part 'send_otp_notifier.g.dart';

class SendOtpState extends ApiState {
  SendOtpState({super.status, super.errorMessage});
}

@riverpod
class SendOtpNotifier extends _$SendOtpNotifier {
  @override
  SendOtpState build() => SendOtpState();

  Future<bool> sendOtp(String phone) async {
    state = SendOtpState(status: ApiStatus.pending);

    try {
      await ref.read(authApiProvider).sendOtp(phone);
      state = SendOtpState(status: ApiStatus.success);
      return true;
    } on ApiException catch (e) {
      state = SendOtpState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
      return false;
    } catch (_) {
      state = SendOtpState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return false;
    }
  }
}
