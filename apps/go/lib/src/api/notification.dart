import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

part 'notification.g.dart';

class NotificationApi extends AbstractApi {
  NotificationApi({required super.tokenManager});

  Future<void> registerFcmToken({
    required String token,
    required String platform,
  }) async {
    await execute(
      method: 'POST',
      path: '/api/v1/tenant-accounts/fcm-token',
      body: {'token': token, 'platform': platform},
    );
  }

  Future<void> deleteFcmToken({required String token}) async {
    await execute(
      method: 'DELETE',
      path: '/api/v1/tenant-accounts/fcm-token',
      body: {'token': token},
    );
  }
}

@riverpod
NotificationApi notificationApi(NotificationApiRef ref) {
  return NotificationApi(tokenManager: ref.watch(tokenManagerProvider));
}
