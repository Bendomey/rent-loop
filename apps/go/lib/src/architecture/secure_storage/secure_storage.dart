import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/secure_storage.dart';

part "secure_storage.g.dart";

@riverpod
SecureStorage secureStorage(SecureStorageRef ref) {
  return SecureStorage();
}
