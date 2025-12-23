import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/token_manager.dart';

part "token_manager.g.dart";

@riverpod
TokenManager tokenManager(TokenManagerRef ref) {
  final storage = ref.watch(secureStorageProvider);
  return TokenManager(storage);
}
