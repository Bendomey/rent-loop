import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

part 'auth.g.dart';

class AuthApi extends AbstractApi {
  AuthApi({required super.tokenManager});

  Future<void> sendOtp(String phone) async {
    await execute(
      method: 'POST',
      path: '/api/v1/tenant-accounts/auth/codes',
      body: {'phone': phone},
      authRequired: false,
    );
  }

  Future<String> verifyOtp({
    required String phone,
    required String code,
  }) async {
    final response = await execute(
      method: 'POST',
      path: '/api/v1/tenant-accounts/auth/codes/verify',
      body: {'phone': phone, 'code': code},
      authRequired: false,
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return json['token'] as String;
  }
}

@riverpod
AuthApi authApi(AuthApiRef ref) {
  return AuthApi(tokenManager: ref.watch(tokenManagerProvider));
}
