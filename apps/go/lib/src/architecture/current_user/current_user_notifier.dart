import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/tenant_account_model.dart';

part 'current_user_notifier.g.dart';

@Riverpod(keepAlive: true)
class CurrentUserNotifier extends _$CurrentUserNotifier {
  @override
  TenantAccountModel? build() => null;

  void setUser(TenantAccountModel user) {
    state = user;
  }

  void clear() {
    state = null;
  }
}
