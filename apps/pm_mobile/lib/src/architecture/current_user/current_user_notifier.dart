import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/repository/models/user_model.dart';

part 'current_user_notifier.g.dart';

@Riverpod(keepAlive: true)
class CurrentUserNotifier extends _$CurrentUserNotifier {
  @override
  UserModel? build() => null;

  void setUser(UserModel user) => state = user;

  void clear() => state = null;
}
