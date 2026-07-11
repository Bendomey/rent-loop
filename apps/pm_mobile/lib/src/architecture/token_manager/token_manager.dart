import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/architecture/secure_storage/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

part 'token_manager.g.dart';

@riverpod
TokenManager tokenManager(TokenManagerRef ref) {
  final storage = ref.watch(secureStorageProvider);
  return TokenManager(storage);
}
