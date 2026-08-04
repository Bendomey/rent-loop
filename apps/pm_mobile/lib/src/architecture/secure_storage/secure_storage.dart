import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/lib/secure_storage.dart';

part 'secure_storage.g.dart';

@riverpod
SecureStorage secureStorage(SecureStorageRef ref) {
  return SecureStorage();
}
